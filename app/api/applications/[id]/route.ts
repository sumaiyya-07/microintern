import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Task from "@/lib/models/Task";
import Application from "@/lib/models/Application";
import User from "@/lib/models/User";
import { getSession } from "@/lib/auth/jwt";
import { sendEmail } from "@/lib/email/send";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "company") {
      return NextResponse.json({ success: false, error: "Forbidden: Companies only" }, { status: 403 });
    }

    await dbConnect();
    const resolvedParams = await params;
    const application = await Application.findById(resolvedParams.id)
      .populate("taskId")
      .populate("candidateId", "name email");

    if (!application) {
      return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
    }

    const task = application.taskId as any;
    if (!task) {
      return NextResponse.json({ success: false, error: "Associated task not found" }, { status: 404 });
    }

    // Verify company owns the task
    if (task.companyId.toString() !== session.id) {
      return NextResponse.json({ success: false, error: "Forbidden: You do not own this task" }, { status: 403 });
    }

    const body = await req.json();
    const { status } = body;

    const validStatuses = ["Applied", "Reviewed", "Shortlisted", "Interview", "Offered", "Rejected"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status value" }, { status: 400 });
    }

    application.status = status;
    await application.save();

    // Notify candidate of status change
    const candidate = application.candidateId as any;
    if (candidate && candidate.email) {
      try {
        await sendEmail({
          to: candidate.email,
          subject: `Application Status Updated: ${task.title}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
              <h2 style="color: #1a1a1a;">Application Update</h2>
              <p>Hello ${candidate.name || "Intern"},</p>
              <p>The company has reviewed your submission for the task <strong>"${task.title}"</strong> and updated your status.</p>
              
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; color: #666; font-size: 14px;">New Status:</p>
                <h3 style="margin: 5px 0 0; color: #333; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;">${status}</h3>
              </div>
              
              <p>Click below to view your task details and read any review comments:</p>
              <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/candidate/tasks/${task._id}" 
                 style="display: inline-block; background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px;">
                Go to Task Details
              </a>
              
              <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 30px 0;" />
              <p style="font-size: 11px; color: #999;">You received this email because you applied to this task on MicroIntern.</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("Failed to send status update email:", emailErr);
      }
    }

    return NextResponse.json({ success: true, data: application });
  } catch (error: any) {
    console.error("PATCH application status error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
