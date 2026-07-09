import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Task from "@/lib/models/Task";
import { getSession } from "@/lib/auth/jwt";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden: Admins only" }, { status: 403 });
    }

    await dbConnect();
    const resolvedParams = await params;
    const body = await req.json();
    const { isActive } = body;

    if (isActive === undefined) {
      return NextResponse.json({ success: false, error: "isActive field is required" }, { status: 400 });
    }

    const task = await Task.findByIdAndUpdate(
      resolvedParams.id,
      { isActive },
      { new: true }
    );

    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: task });
  } catch (error: any) {
    console.error("Admin PATCH task error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
