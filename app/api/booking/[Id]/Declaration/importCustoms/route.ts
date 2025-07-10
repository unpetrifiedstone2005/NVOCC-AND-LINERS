// File: app/api/bookings/[bookingId]/import-declaration/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z, ZodError }              from "zod";
import { prismaClient }             from "@/app/lib/db";

const DeclarationSchema = z.object({
  data:    z.any(),                  // broker’s declaration payload
  filedAt: z.string().optional(),    // ISO datetime if already filed
});
type DeclarationInput = z.infer<typeof DeclarationSchema>;

export async function POST(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  const { bookingId } = params;

  // 1) Validate input
  let input: DeclarationInput;
  try {
    input = DeclarationSchema.parse(await req.json());
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { errors: err.flatten().fieldErrors },
        { status: 422 }
      );
    }
    throw err;
  }

  // 2) Ensure booking exists (and get userId)
  const booking = await prismaClient.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, userId: true }
  });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // 3) Create the ImportDeclaration
  const declaration = await prismaClient.importDeclaration.create({
    data: {
      bookingId,
      data:    input.data,
      status:  "SUBMITTED",
      filedAt: input.filedAt ? new Date(input.filedAt) : undefined,
    }
  });

  // 4) Find or create the IMPORT‐leg invoice
  let importInvoice = await prismaClient.invoice.findFirst({
    where: { bookingId, leg: "IMPORT" }
  });
  if (!importInvoice) {
    // find a default bank account
    const defaultBank = await prismaClient.bankAccount.findFirst({
      where: { isActive: true },
      select: { id: true }
    });
    importInvoice = await prismaClient.invoice.create({
      data: {
        userId:        booking.userId,
        bookingId,
        leg:           "IMPORT",
        totalAmount:   0,
        issuedDate:    new Date(),
        dueDate:       new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status:        "PENDING",
        description:   "Import invoice",
        bankAccountId: defaultBank?.id!
      }
    });
  }

  // 5) Add the Import Documentation Fee line
  const docRate = await prismaClient.surchargeRate.findFirst({
    where: { surchargeDef: { name: "Import Documentation Fee" } },
    select: { amount: true, surchargeDefId: true }
  });
  if (docRate) {
    await prismaClient.invoiceLine.create({
      data: {
        invoiceId:  importInvoice.id,
        description:"Import Documentation Fee",
        amount:     Number(docRate.amount),
        reference:  docRate.surchargeDefId,
        glCode:     "6003-DOC",
        costCenter: "Admin"
      }
    });
  }

  // 6) Re-aggregate totalAmount from import‐leg lines
  const agg = await prismaClient.invoiceLine.aggregate({
    where: { invoiceId: importInvoice.id },
    _sum:  { amount: true }
  });
  await prismaClient.invoice.update({
    where: { id: importInvoice.id },
    data:  { totalAmount: agg._sum.amount ?? 0 }
  });

  // 7) Fetch the import invoice with its lines
  const invoiceWithLines = await prismaClient.invoice.findUnique({
    where: { id: importInvoice.id },
    include: { lines: true }
  });

  // 8) Return both declaration and the import invoice
  return NextResponse.json(
    { declaration, importInvoice: invoiceWithLines },
    { status: 201 }
  );
}
