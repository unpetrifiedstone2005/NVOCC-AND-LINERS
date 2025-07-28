// app/api/seed/serviceschedules/[scheduleId]/patch/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prismaClient } from "@/app/lib/db";

// validate incoming body
const ScheduleUpdate = z.object({
  code:        z.string().min(1),
  description: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: { scheduleId: string } }  // <-- make sure this matches your folder name exactly!
) {
  const { scheduleId } = await context.params;

  // sanity‑check the UUID
  if (!/^[0-9a-fA-F\-]{36}$/.test(scheduleId)) {
    return NextResponse.json({ error: "Invalid scheduleId" }, { status: 400 });
  }

  // parse & validate
  let body: z.infer<typeof ScheduleUpdate>;
  try {
    body = ScheduleUpdate.parse(await request.json());
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ errors: err.flatten().fieldErrors }, { status: 422 });
    }
    throw err;
  }

  // try the update
  try {
    const updated = await prismaClient.serviceSchedule.update({
      where: { id: scheduleId },
      data: {
        code:        body.code,
        description: body.description ?? null,
      },
    });
    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    console.error("[PATCH /serviceschedules]", err);
    // handle not-found vs. other errors
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update schedule" }, { status: 500 });
  }
}
