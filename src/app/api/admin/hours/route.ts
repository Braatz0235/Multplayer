import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateDb } from "@/lib/db";
import { getSession } from "@/lib/session";

const schema = z.array(
  z.object({
    day: z.number().int().min(0).max(6),
    closed: z.boolean(),
    open: z.string().regex(/^\d{2}:\d{2}$/),
    close: z.string().regex(/^\d{2}:\d{2}$/),
  })
).length(7);

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const hours = await updateDb((db) => {
    db.hours = parsed.data as typeof db.hours;
    return db.hours;
  });

  return NextResponse.json(hours);
}
