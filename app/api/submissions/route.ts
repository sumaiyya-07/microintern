import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Task from "@/lib/models/Task";
import Application from "@/lib/models/Application";
import Submission from "@/lib/models/Submission";
import { getSession } from "@/lib/auth/jwt";
import { SubmissionCreateSchema } from "@/lib/validation/schemas";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "candidate") {
      return NextResponse.json({ success: false, error: "Forbidden: Candidates only" }, { status: 403 });
    }

    await dbConnect();
    const body = await req.json();

    const parseResult = SubmissionCreateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { applicationId, textAnswer, link, fileUrl } = parseResult.data;

    const application = await Application.findById(applicationId).populate("taskId");
    if (!application) {
      return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
    }

    if (application.candidateId.toString() !== session.id) {
      return NextResponse.json({ success: false, error: "Forbidden: You do not own this application" }, { status: 403 });
    }

    const task = application.taskId as any;
    if (!task) {
      return NextResponse.json({ success: false, error: "Associated task not found" }, { status: 404 });
    }

    // Enforce deadline check
    if (new Date(task.deadline) < new Date()) {
      return NextResponse.json(
        { success: false, error: "Submission blocked: The deadline for this task has passed." },
        { status: 400 }
      );
    }

    // Upsert submission
    let submission = await Submission.findOne({ applicationId });
    if (submission) {
      submission.textAnswer = textAnswer;
      submission.link = link;
      submission.fileUrl = fileUrl || "";
      submission.submittedAt = new Date();
      await submission.save();
    } else {
      submission = await Submission.create({
        applicationId,
        textAnswer,
        link,
        fileUrl: fileUrl || "",
        submittedAt: new Date(),
      });
    }

    return NextResponse.json({ success: true, data: submission });
  } catch (error: any) {
    console.error("Submission POST error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
