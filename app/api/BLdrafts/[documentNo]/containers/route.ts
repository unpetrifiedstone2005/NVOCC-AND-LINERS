import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { documentNo: string } }
) {
  // params.documentNo will be "BL-12345" for the above URL
  const containers = await prismaClient.bLDraftContainer.findMany({
    where: { bLDraftId: params.documentNo },
    orderBy: { containerNumber: "asc" },
  });

  return NextResponse.json(containers);
}