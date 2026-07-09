import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Task from "@/lib/models/Task";
import Application from "@/lib/models/Application";
import Submission from "@/lib/models/Submission";
import Review from "@/lib/models/Review";
import { getSession } from "@/lib/auth/jwt";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "company") {
      return NextResponse.json({ success: false, error: "Forbidden: Only companies can view applicants" }, { status: 403 });
    }

    await dbConnect();
    const resolvedParams = await params;
    const task = await Task.findById(resolvedParams.id);

    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    // Verify ownership
    if (task.companyId.toString() !== session.id) {
      return NextResponse.json({ success: false, error: "Forbidden: You do not own this task" }, { status: 403 });
    }

    // Find applications
    const applications = await Application.find({ taskId: resolvedParams.id })
      .populate("candidateId", "name email bio skills")
      .sort({ appliedAt: -1 });

    const appIds = applications.map((app) => app._id);

    // Find submissions for these applications
    const submissions = await Submission.find({ applicationId: { $in: appIds } });
    const submissionIds = submissions.map((sub) => sub._id);

    // Find reviews for these submissions
    const reviews = await Review.find({ submissionId: { $in: submissionIds } });

    // Build the joint objects
    const data = applications.map((app) => {
      const submission = submissions.find(
        (sub) => sub.applicationId.toString() === app._id.toString()
      );
      
      let review = null;
      let aiReview = null;
      
      if (submission) {
        review = reviews.find(
          (rev) => rev.submissionId.toString() === submission._id.toString() && !rev.isAiGenerated
        ) || null;
        aiReview = reviews.find(
          (rev) => rev.submissionId.toString() === submission._id.toString() && rev.isAiGenerated
        ) || null;
      }

      return {
        ...app.toObject(),
        submission: submission
          ? {
              ...submission.toObject(),
              review,
              aiReview,
            }
          : null,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("GET task applications error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
