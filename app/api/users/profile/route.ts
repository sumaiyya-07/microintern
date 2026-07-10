import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import User from "@/lib/models/User";
import { getSession } from "@/lib/auth/jwt";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();

    const updateFields: any = {};
    if (body.name !== undefined) {
      if (body.name.trim().length < 2) {
        return NextResponse.json({ success: false, error: "Name must be at least 2 characters" }, { status: 400 });
      }
      updateFields.name = body.name.trim();
    }

    if (session.role === "candidate") {
      if (body.bio !== undefined) updateFields.bio = body.bio.trim();
      if (body.skills !== undefined) {
        updateFields.skills = typeof body.skills === "string"
          ? body.skills.split(",").map((s: string) => s.trim()).filter(Boolean)
          : body.skills;
      }
    } else if (session.role === "company") {
      if (body.companyName !== undefined) {
        if (body.companyName.trim().length < 1) {
          return NextResponse.json({ success: false, error: "Company name is required" }, { status: 400 });
        }
        updateFields.companyName = body.companyName.trim();
      }
      if (body.companyDescription !== undefined) {
        updateFields.companyDescription = body.companyDescription.trim();
      }
    }

    const user = await User.findByIdAndUpdate(session.id, updateFields, { new: true }).select("-password");
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
