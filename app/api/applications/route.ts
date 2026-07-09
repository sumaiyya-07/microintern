import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Task from "@/lib/models/Task";
import Application from "@/lib/models/Application";
import Submission from "@/lib/models/Submission";
import Review from "@/lib/models/Review";
import { getSession } from "@/lib/auth/jwt";
import { ApplicationCreateSchema } from "@/lib/validation/schemas";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "candidate") {
      return NextResponse.json({ success: false, error: "Only candidates can apply to tasks" }, { status: 403 });
    }

    await dbConnect();
    const body = await req.json();

    const parseResult = ApplicationCreateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Task ID is required" },
        { status: 400 }
      );
    }

    const { taskId } = parseResult.data;

    // Check if task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    // Check if task is open and active
    if (task.status !== "open" || !task.isActive) {
      return NextResponse.json({ success: false, error: "Task is closed or unavailable" }, { status: 400 });
    }

    // Check if deadline has passed
    if (new Date(task.deadline) < new Date()) {
      return NextResponse.json({ success: false, error: "The deadline for this task has passed" }, { status: 400 });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      taskId,
      candidateId: session.id,
    });
    if (existingApplication) {
      return NextResponse.json(
        { success: false, error: "You have already applied to this task" },
        { status: 409 }
      );
    }

    const newApplication = await Application.create({
      taskId,
      candidateId: session.id,
      status: "Applied",
      appliedAt: new Date(),
    });

    return NextResponse.json({ success: true, data: newApplication }, { status: 201 });
  } catch (error: any) {
    console.error("Apply to task error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "candidate") {
      return NextResponse.json({ success: false, error: "Forbidden: Candidates only" }, { status: 403 });
    }

    await dbConnect();

    // Fetch applications
    const applications = await Application.find({ candidateId: session.id })
      .populate({
        path: "taskId",
        populate: {
          path: "companyId",
          select: "name companyName companyDescription",
        },
      })
      .sort({ updatedAt: -1 });

    const appIds = applications.map((app) => app._id);

    // Fetch submissions for these applications
    const submissions = await Submission.find({ applicationId: { $in: appIds } });
    const submissionIds = submissions.map((sub) => sub._id);

    // Fetch reviews for these submissions
    const reviews = await Review.find({ submissionId: { $in: submissionIds } });

    // Join them
    const data = applications.map((app) => {
      const submission = submissions.find(
        (sub) => sub.applicationId.toString() === app._id.toString()
      );
      
      let submissionObj = null;
      if (submission) {
        const review = reviews.find(
          (rev) => rev.submissionId.toString() === submission._id.toString() && !rev.isAiGenerated
        );
        const aiReview = reviews.find(
          (rev) => rev.submissionId.toString() === submission._id.toString() && rev.isAiGenerated
        );
        submissionObj = {
          ...submission.toObject(),
          review: review ? review.toObject() : null,
          aiReview: aiReview ? aiReview.toObject() : null,
        };
      }

      return {
        ...app.toObject(),
        submission: submissionObj,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("GET candidate applications error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
