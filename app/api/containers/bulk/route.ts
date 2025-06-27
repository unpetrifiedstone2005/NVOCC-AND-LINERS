import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "@/app/lib/db";
import { ContainerStatus } from "@prisma/client";
import { z } from "zod";

// Zod schema for a single container
const ContainerSchema = z.object({
  containerNo: z.string(),
  type: z.string(),
  description: z.string().optional().nullable(),
  bicCode: z.string().optional().nullable(),
  ownership: z.string().optional().nullable(),
  companyOrigin: z.string().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  customsApproval: z.string().optional().nullable(),
  status: z.string().optional().default("AVAILABLE"),
  currentDepot: z.string().optional().nullable(),
});

// Schema for an array of containers
const BulkContainerSchema = z.array(ContainerSchema);

type BulkContainerInput = z.infer<typeof BulkContainerSchema>;

export async function POST(req: NextRequest) {
  try {
    const data: BulkContainerInput = BulkContainerSchema.parse(await req.json());

    // Map status string to ContainerStatus enum value
    const containersToInsert = data.map(c => ({
      ...c,
      status: ContainerStatus[c.status as keyof typeof ContainerStatus] ?? ContainerStatus.AVAILABLE,
    }));

   

    const result = await prismaClient.container.createMany({
      data: containersToInsert,
      skipDuplicates: true,
    });

    return NextResponse.json({ success: true, count: result.count }, { status: 201 });
  } catch (err: any) {
    // Zod validation error
    if (err.errors) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    // Prisma or other error
    return NextResponse.json({ error: err.message || "Server Error" }, { status: 500 });
  }
}
