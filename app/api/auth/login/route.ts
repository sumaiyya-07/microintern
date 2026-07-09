import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import User from "@/lib/models/User";
import { LoginSchema } from "@/lib/validation/schemas";
import bcryptjs from "bcryptjs";
import { setSessionCookie } from "@/lib/auth/jwt";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    // 1. Validate credentials structure
    const parseResult = LoginSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const { email, password } = parseResult.data;

    // 2. Find user
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // 3. Verify status
    if (user.isActive === false) {
      return NextResponse.json(
        { success: false, error: "Your account has been deactivated. Please contact support." },
        { status: 403 }
      );
    }

    // 4. Verify password
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // 5. Create session
    const sessionUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    };
    
    await setSessionCookie(sessionUser);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
