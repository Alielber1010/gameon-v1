// C:\gameon-v1\app\api\auth\signup\route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";

export async function POST(req: Request) {
  const { firstName, lastName, email, password } = await req.json();

  if (!firstName || !lastName || !email || !password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  await connectDB();

  // Prevent creating admin@gmail.com through signup
  if (email.toLowerCase() === "admin@gmail.com") {
    return NextResponse.json({ error: "This email cannot be used for signup" }, { status: 403 });
  }

  // Case-insensitive email check
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    return NextResponse.json({ error: "Email is already in use" }, { status: 409 });
  }

  try {
    const fullName = `${firstName} ${lastName}`;

    // Save password in plain text; Mongoose pre-save hook will hash it automatically
    const newUser = await User.create({
      firstName,
      lastName,
      name: fullName,
      email: email.toLowerCase(),
      password,
      provider: "credentials",
    });

    return NextResponse.json({
      message: "User created successfully",
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
