import { NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";

type Params = {
  params: { id: string };
};

// GET invoice by ID
export async function GET(_: Request, { params }: Params) {
  try {
    const invoice = await prismaClient.systemInvoice.findUnique({
      where: { id: params.id },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (err) {
    console.error("GET /invoices/:id error", err);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

// PATCH update invoice status (optional)
export async function PATCH(request: Request, { params }: Params) {
  try {
    const body = await request.json();

    const updated = await prismaClient.systemInvoice.update({
      where: { id: params.id },
      data: {
        status: body.status,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /invoices/:id error", err);
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}