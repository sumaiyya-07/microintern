import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import User from "@/lib/models/User";
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

    // Prevent admin from deactivating themselves
    if (resolvedParams.id === session.id) {
      return NextResponse.json(
        { success: false, error: "Operation blocked: You cannot deactivate your own admin account." },
        { status: 400 }
      );
    }

    const user = await User.findByIdAndUpdate(
      resolvedParams.id,
      { isActive },
      { new: true }
    ).select("-password");

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    console.error("Admin PATCH user error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
