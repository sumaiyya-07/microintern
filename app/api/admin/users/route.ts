import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import User from "@/lib/models/User";
import { getSession } from "@/lib/auth/jwt";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden: Admins only" }, { status: 403 });
    }

    await dbConnect();
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    console.error("Admin GET users error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
