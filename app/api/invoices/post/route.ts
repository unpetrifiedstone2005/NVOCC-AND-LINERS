import { NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.invoiceNumber) {
      return NextResponse.json(
        { error: "invoiceNumber is required" },
        { status: 400 }
      );
    }

    const invoice = await prismaClient.systemInvoice.create({
      data: {
        invoiceNumber: body.invoiceNumber,
        status: body.status || "PENDING",
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (err) {
    console.error("POST /invoices error", err);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}