import { NextRequest, NextResponse } from "next/server";
import { z, ZodError }              from "zod";
import { prismaClient }             from "@/app/lib/db";

const ArrivalNoticeSchema = z.object({
  method:  z.enum(["EMAIL","SMS","WEBHOOK"]),
  payload: z.any(),  // structured data to merge into your template
});
type ArrivalNoticeInput = z.infer<typeof ArrivalNoticeSchema>;

export async function POST(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  // 1) Validate body
  let input: ArrivalNoticeInput;
  try {
    input = ArrivalNoticeSchema.parse(await req.json());
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { errors: err.flatten().fieldErrors },
        { status: 422 }
      );
    }
    throw err;
  } 

  const { bookingId } = params;

  // 2) Confirm booking exists
  try {
    await prismaClient.booking.findUniqueOrThrow({
      where: { id: bookingId },
      select: { id: true },
    });
  } catch {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // 3) Create the ArrivalNotice record
  const notice = await prismaClient.arrivalNotice.create({
    data: {
      booking:  { connect: { id: bookingId } },
      method:    input.method,
      payload:   input.payload,
      status:    "PENDING",   // you can update to "SENT"/"FAILED" later
    },
  });

  // 4) (Optional) Trigger your email/SMS send here and update `status`/`error`

  return NextResponse.json({ success: true, notice }, { status: 201 });
}
