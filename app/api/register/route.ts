import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { email, password, firstName, lastName, ...otherFields } = await req.json();
  const hashedPassword = await bcrypt.hash(password, 10);

  // Check if user exists
  const existing = await prismaClient.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "User already exists" }, { status: 400 });
  }

  // Create user
  const user = await prismaClient.user.create({
    data: {
      email,
      hashedPassword,
      firstName,
      lastName,
      countryCode: "AE",
      phoneNumber: "0000000000",
      streetAddress: "N/A",
      city: "Test",
      postalCode: "00000",
      country: "AE",
      ...otherFields,
    },
  });

  return NextResponse.json({ user: { email: user.email, id: user.id } }, { status: 200 });
}