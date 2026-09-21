import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readDb } from "@/lib/db";
import { getAvailableSlots, isPastDate } from "@/lib/availability";

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  serviceId: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = schema.safeParse({
    date: searchParams.get("date"),
    serviceId: searchParams.get("serviceId"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parâmetros inválidos." },
      { status: 400 }
    );
  }

  const { date, serviceId } = parsed.data;

  if (isPastDate(date)) {
    return NextResponse.json({ slots: [] });
  }

  const db = await readDb();
  const service = db.services.find((s) => s.id === serviceId && s.active);
  if (!service) {
    return NextResponse.json(
      { error: "Serviço não encontrado." },
      { status: 404 }
    );
  }

  const slots = getAvailableSlots(db, service, date);
  return NextResponse.json({ slots });
}
