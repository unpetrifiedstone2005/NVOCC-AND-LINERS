import { NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";

export async function GET() {
  try {
    const invoices = await prismaClient.systemInvoice.findMany({
      orderBy: { createdAt: "desc" }, // Prisma field names are camelCase
    });
    return NextResponse.json(invoices);
  } catch (err) {
    console.error("GET /invoices error", err);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}