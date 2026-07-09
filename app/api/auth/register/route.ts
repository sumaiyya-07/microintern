import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import User from "@/lib/models/User";
import { RegisterSchema } from "@/lib/validation/schemas";
import bcryptjs from "bcryptjs";
import { setSessionCookie } from "@/lib/auth/jwt";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    // 1. Validate request body
    const parseResult = RegisterSchema.safeParse(body);
    if (!parseResult.success) {
      const errors = parseResult.error.flatten().fieldErrors;
      return NextResponse.json(
        { success: false, error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    const { name, email, password, role, bio, skills, companyName, companyDescription } = parseResult.data;

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Email is already registered" },
        { status: 409 }
      );
    }

    // 3. Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // 4. Parse skills if provided (comma separated string)
    const skillsArray = skills
      ? skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    // 5. Create user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      bio: role === "candidate" ? bio : undefined,
      skills: role === "candidate" ? skillsArray : undefined,
      companyName: role === "company" ? companyName : undefined,
      companyDescription: role === "company" ? companyDescription : undefined,
      isActive: true,
    });

    // 6. Automatically sign-in and set cookie
    const sessionUser = {
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      isActive: newUser.isActive,
    };
    
    await setSessionCookie(sessionUser);

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: newUser._id.toString(),
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
          },
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
