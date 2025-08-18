// File: app/api/auth/register/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prismaClient } from "@/app/lib/db";
import type { Prisma } from "@prisma/client";

//
// 1) Zod schema: make postalCode truly optional, and coerce
//    empty strings into undefined so we can omit them.
//
const RegisterSchema = z.object({
  firstName:   z.string().min(1, "First name is required"),
  lastName:    z.string().min(1, "Last name is required"),
  email:       z.string().email("Invalid email address"),
  password:    z.string().min(8, "Password must be at least 8 characters"),
  countryCode: z.string().regex(/^\+?\d{1,4}$/, "Use phone code like +971"),
  phoneNumber: z.string().min(1, "Phone number is required"),

  companyName: z.string().min(1, "Company name is required"),
  // if your Prisma model field is `vatNumber`
  vatNumber:   z
    .string()
    .optional()
    .nullable(),

  streetAddress: z.string().min(1, "Street address is required"),
  city:          z.string().min(1, "City is required"),

  postalCode: z.preprocess(
    (val) => {
      // turn "" into undefined
      if (typeof val === "string" && val.trim() === "") return undefined;
      return val;
    },
    z.string().optional()
  ),

  country: z.string().min(1, "Country is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      // flatten Zod errors into { field: [msgs] }
      const errors = parsed.error.flatten().fieldErrors;
      return NextResponse.json({ errors }, { status: 400 });
    }

    const {
      firstName,
      lastName,
      email,
      password,
      countryCode,
      phoneNumber,
      companyName,
      vatNumber,
      streetAddress,
      city,
      postalCode,
      country,
    } = parsed.data;

    const hashedPassword = await bcrypt.hash(password, 10);

    //
    // 2) Build your Prisma create input, only spreading
    //    optional values if they’re actually defined.
    //
    const createData: Prisma.UserCreateInput = {
      firstName,
      lastName,
      email,
      hashedPassword,
      countryCode,
      phoneNumber,
      companyName,
      streetAddress,
      city,
      country,
      ...(vatNumber   ? { vatNumber }   : {}),
      ...(postalCode  ? { postalCode }  : {}),
    };

    const user = await prismaClient.user.create({
      data: createData,
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error: any) {
    // Unique constraint
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A user with that email already exists.", detail: error.meta },
        { status: 409 }
      );
    }
    // Value too long
    if (error.code === "P2000") {
      return NextResponse.json(
        {
          error: "Value too long for a column",
          message: error.message,   // raw DB error text
          meta:    error.meta,      // might contain the offending column
        },
        { status: 400 }
      );
    }
    // Fallback
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred.", detail: error.message },
      { status: 500 }
    );
  }
}
