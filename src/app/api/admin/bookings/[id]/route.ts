import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateDb } from "@/lib/db";
import { getSession } from "@/lib/session";

const schema = z.object({
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const result = await updateDb((db) => {
    const booking = db.bookings.find((b) => b.id === id);
    if (!booking) return null;
    booking.status = parsed.data.status;
    return booking;
  });

  if (!result) {
    return NextResponse.json(
      { error: "Agendamento não encontrado." },
      { status: 404 }
    );
  }

  return NextResponse.json(result);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;

  const result = await updateDb((db) => {
    const idx = db.bookings.findIndex((b) => b.id === id);
    if (idx === -1) return false;
    db.bookings.splice(idx, 1);
    return true;
  });

  if (!result) {
    return NextResponse.json(
      { error: "Agendamento não encontrado." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
