import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Submission from "@/lib/models/Submission";
import Application from "@/lib/models/Application";
import Task from "@/lib/models/Task";
import Review from "@/lib/models/Review";
import User from "@/lib/models/User";
import { getSession } from "@/lib/auth/jwt";
import { ReviewCreateSchema } from "@/lib/validation/schemas";
import { sendEmail } from "@/lib/email/send";

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

    const parseResult = ReviewCreateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { submissionId, comment, rating } = parseResult.data;

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

    // Upsert human review
    let review = await Review.findOne({ submissionId, isAiGenerated: false });
    if (review) {
      review.comment = comment;
      review.rating = rating;
      await review.save();
    } else {
      review = await Review.create({
        submissionId,
        comment,
        rating,
        isAiGenerated: false,
      });
    }

    // Automatically update the application status to "Reviewed" if it was "Applied"
    if (application.status === "Applied") {
      await Application.findByIdAndUpdate(application._id, { status: "Reviewed" });
    }

    // Notify candidate of evaluation
    try {
      const populatedApp = await Application.findById(application._id).populate("candidateId", "name email");
      const candidate = populatedApp?.candidateId as any;
      
      if (candidate && candidate.email) {
        await sendEmail({
          to: candidate.email,
          subject: `Your Proof-of-Work Has Been Evaluated: ${task.title}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
              <h2 style="color: #1a1a1a;">Submission Evaluated!</h2>
              <p>Hello ${candidate.name || "Intern"},</p>
              <p>The company has reviewed and scored your proof-of-work submission for the task <strong>"${task.title}"</strong>.</p>
              
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;"><strong>Score:</strong> ${rating} / 5 Stars</p>
                <p style="margin: 0; color: #666; font-size: 14px;"><strong>Feedback Comments:</strong></p>
                <blockquote style="margin: 5px 0 0 0; padding-left: 10px; border-left: 3px solid #ccc; font-style: italic; color: #333;">
                  "${comment}"
                </blockquote>
              </div>
              
              <p>Click below to view your task details and pipeline status:</p>
              <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/candidate/tasks/${task._id}" 
                 style="display: inline-block; background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px;">
                Go to Task Details
              </a>
              
              <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 30px 0;" />
              <p style="font-size: 11px; color: #999;">You received this email because you submitted work to this task on MicroIntern.</p>
            </div>
          `,
        });
      }
    } catch (emailErr) {
      console.error("Failed to send evaluation notification email:", emailErr);
    }

    return NextResponse.json({ success: true, data: review });
  } catch (error: any) {
    console.error("Manual review POST error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
