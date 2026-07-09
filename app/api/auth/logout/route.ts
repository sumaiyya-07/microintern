import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/jwt";

export async function POST() {
  try {
    await clearSessionCookie();
    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (error: any) {
    console.error("Logout Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to logout" },
      { status: 500 }
    );
  }
}
