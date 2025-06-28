import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";
import { z, ZodError } from "zod";

// Zod schema for validation
const BankAccountSchema = z.object({
  accountName:   z.string(),
  bankName:      z.string(),
  accountNumber: z.string(),
  branchName:    z.string(),
  iban:          z.string().optional().nullable(),
  swift:         z.string().optional().nullable(),
  bankAddress:   z.string().optional().nullable(),
  currency:      z.string(),
  isActive:      z.boolean().optional().default(true),
});

type BankAccountInput = z.infer<typeof BankAccountSchema>;

export async function POST(req: NextRequest) {
  try {
    const data: BankAccountInput = BankAccountSchema.parse(await req.json());

    // Optionally: Ensure only one active account per currency
    if (data.isActive) {
      await prismaClient.bankAccount.updateMany({
        where: { currency: data.currency, isActive: true },
        data: { isActive: false }
      });
    }

    const bankAccount = await prismaClient.bankAccount.create({ data });

    return NextResponse.json(
      { message: "Bank account created", bankAccount },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("Bank account creation error:", err);
    return NextResponse.json(
      { error: "Server Error", details: (err as Error).message },
      { status: 500 }
    );
  }
}
