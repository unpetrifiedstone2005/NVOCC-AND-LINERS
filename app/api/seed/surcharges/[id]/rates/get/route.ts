import { NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { id: string; rid: string } }
) {
  const { id: surchargeDefId, rid: rateId } = params;

  const rate = await prismaClient.surchargeRate.findUnique({
    where: { id: rateId },
  });
  if (!rate || rate.surchargeDefId !== surchargeDefId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(rate);
}
