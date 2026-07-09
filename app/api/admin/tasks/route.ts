import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Task from "@/lib/models/Task";
import { getSession } from "@/lib/auth/jwt";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden: Admins only" }, { status: 403 });
    }

    await dbConnect();
    const tasks = await Task.find({})
      .populate("companyId", "name companyName email")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: tasks });
  } catch (error: any) {
    console.error("Admin GET tasks error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
