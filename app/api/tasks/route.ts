import { NextRequest, NextResponse, after } from "next/server";
import dbConnect from "@/lib/db/connect";
import Task from "@/lib/models/Task";
import User from "@/lib/models/User";
import { getSession } from "@/lib/auth/jwt";
import { TaskCreateSchema } from "@/lib/validation/schemas";
import { sendEmail } from "@/lib/email/send";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);

    if (session.role === "company") {
      // Company views its own tasks
      const tasks = await Task.find({ companyId: session.id }).sort({ createdAt: -1 });
      return NextResponse.json({ success: true, data: tasks });
    } else if (session.role === "candidate") {
      // Candidate views open, active, unexpired tasks
      const search = searchParams.get("search") || "";
      const category = searchParams.get("category") || "";

      const query: any = {
        status: "open",
        isActive: true,
        deadline: { $gt: new Date() },
      };

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }

      if (category && category !== "all") {
        query.category = category;
      }

      const tasks = await Task.find(query)
        .populate("companyId", "name companyName companyDescription")
        .sort({ deadline: 1 }); // nearest deadline first

      return NextResponse.json({ success: true, data: tasks });
    }

    return NextResponse.json({ success: false, error: "Forbidden role" }, { status: 403 });
  } catch (error: any) {
    console.error("GET tasks error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "company") {
      return NextResponse.json({ success: false, error: "Only companies can post tasks" }, { status: 403 });
    }

    await dbConnect();
    const body = await req.json();

    // Validate body
    const parseResult = TaskCreateSchema.safeParse(body);
    if (!parseResult.success) {
      const errors = parseResult.error.flatten().fieldErrors;
      return NextResponse.json(
        { success: false, error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    const { title, description, category, deadline, rewardText } = parseResult.data;

    const newTask = await Task.create({
      companyId: session.id,
      title,
      description,
      category,
      deadline: new Date(deadline),
      rewardText,
      status: "open",
      isActive: true,
    });

    // Notify registered candidates about the new task asynchronously after response is sent
    after(async () => {
      try {
        const candidates = await User.find({ role: "candidate", isActive: { $ne: false } });
        for (const candidate of candidates) {
          if (!candidate.email) continue;
          await sendEmail({
            to: candidate.email,
            subject: `New Micro-Task Available: ${title}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
                <h2 style="color: #1a1a1a;">New Micro-Task Posted!</h2>
                <p>Hello ${candidate.name || "Intern"},</p>
                <p>A new micro-task has been posted on MicroIntern. Check it out and apply today to showcase your proof-of-work!</p>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #333;">${title}</h3>
                  <p style="color: #666; font-size: 14px;"><strong>Category:</strong> ${category}</p>
                  <p style="color: #666; font-size: 14px;"><strong>Reward:</strong> ${rewardText || "Experience / Recognition"}</p>
                  <p style="color: #666; font-size: 14px;"><strong>Deadline:</strong> ${new Date(deadline).toLocaleString()}</p>
                </div>
                
                <p>Click below to view the task details and submit your proof-of-work:</p>
                <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/candidate/tasks/${newTask._id}" 
                   style="display: inline-block; background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px;">
                  View and Apply
                </a>
                
                <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 30px 0;" />
                <p style="font-size: 11px; color: #999;">You received this email because you are registered as a Candidate on MicroIntern.</p>
              </div>
            `,
          });
        }
      } catch (emailErr) {
        console.error("Failed to send task notifications:", emailErr);
      }
    });

    return NextResponse.json({ success: true, data: newTask }, { status: 201 });
  } catch (error: any) {
    console.error("POST task error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
