import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
import dbConnect from "@/lib/db/connect";
import User from "@/lib/models/User";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    await dbConnect();
    const user = await User.findById(session.id).select("-password");
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: "Account deactivated" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { user },
    });
  } catch (error: any) {
    console.error("Session fetch error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
