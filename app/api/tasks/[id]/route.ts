import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Task from "@/lib/models/Task";
import { getSession } from "@/lib/auth/jwt";
import { TaskCreateSchema } from "@/lib/validation/schemas";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const resolvedParams = await params;
    const task = await Task.findById(resolvedParams.id).populate(
      "companyId",
      "name companyName companyDescription"
    );

    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    // If task is inactive, only allow the owner or admin to view it
    if (!task.isActive && task.companyId._id.toString() !== session.id && session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Task is not available" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: task });
  } catch (error: any) {
    console.error("GET task detail error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
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

    const body = await req.json();
    
    // Partial validation since editing might update only status or everything
    // If updating standard fields, let's validate with a partial/full schema
    const parseResult = TaskCreateSchema.partial().safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Accept status and other updates
    if (body.status !== undefined) {
      task.status = body.status;
    }
    
    Object.assign(task, parseResult.data);
    await task.save();

    return NextResponse.json({ success: true, data: task });
  } catch (error: any) {
    console.error("PATCH task error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const resolvedParams = await params;
    const task = await Task.findById(resolvedParams.id);

    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    if (task.companyId.toString() !== session.id) {
      return NextResponse.json({ success: false, error: "Forbidden: You do not own this task" }, { status: 403 });
    }

    await Task.findByIdAndDelete(resolvedParams.id);

    return NextResponse.json({ success: true, message: "Task deleted successfully" });
  } catch (error: any) {
    console.error("DELETE task error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
