import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Submission from "@/lib/models/Submission";
import Application from "@/lib/models/Application";
import Task from "@/lib/models/Task";
import Review from "@/lib/models/Review";
import { getSession } from "@/lib/auth/jwt";
import { getGrokFeedback } from "@/lib/ai/grok";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "company") {
      return NextResponse.json({ success: false, error: "Forbidden: Companies only" }, { status: 403 });
    }

    await dbConnect();
    const body = await req.json();
    const { submissionId } = body;

    if (!submissionId) {
      return NextResponse.json({ success: false, error: "Submission ID is required" }, { status: 400 });
    }

    // Find submission
    const submission = await Submission.findById(submissionId).populate({
      path: "applicationId",
      populate: { path: "taskId" },
    });

    if (!submission) {
      return NextResponse.json({ success: false, error: "Submission not found" }, { status: 404 });
    }

    const application = submission.applicationId as any;
    const task = application.taskId as any;

    if (!task) {
      return NextResponse.json({ success: false, error: "Associated task not found" }, { status: 404 });
    }

    // Verify task ownership
    if (task.companyId.toString() !== session.id) {
      return NextResponse.json({ success: false, error: "Forbidden: You do not own this task" }, { status: 403 });
    }

    // Check if an AI review already exists for this submission
    let aiReview = await Review.findOne({ submissionId, isAiGenerated: true });
    
    if (aiReview) {
      return NextResponse.json({ success: true, data: aiReview, message: "AI Review already exists" });
    }

    // Call Grok API (or mock fallback)
    const feedback = await getGrokFeedback(
      task.title,
      task.description,
      submission.textAnswer,
      submission.link || ""
    );

    // Save AI review in Review collection
    aiReview = await Review.create({
      submissionId,
      comment: feedback.comment,
      rating: feedback.rating,
      isAiGenerated: true,
    });

    // Automatically update the application status to "Reviewed" if it was just "Applied"
    if (application.status === "Applied") {
      await Application.findByIdAndUpdate(application._id, { status: "Reviewed" });
    }

    return NextResponse.json({ success: true, data: aiReview });
  } catch (error: any) {
    console.error("AI feedback generation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
