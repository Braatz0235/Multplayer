import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateDb } from "@/lib/db";
import { getSession } from "@/lib/session";

const schema = z.object({
  categoryId: z.string().min(1).optional(),
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(300).optional(),
  price: z.number().min(0).max(100000).optional(),
  durationMinutes: z.number().int().min(5).max(600).optional(),
  image: z.string().nullable().optional(),
  active: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await updateDb((db) => {
    const service = db.services.find((s) => s.id === id);
    if (!service) return null;
    Object.assign(service, parsed.data);
    return service;
  });

  if (!result) {
    return NextResponse.json(
      { error: "Serviço não encontrado." },
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
    const idx = db.services.findIndex((s) => s.id === id);
    if (idx === -1) return false;
    db.services.splice(idx, 1);
    return true;
  });

  if (!result) {
    return NextResponse.json(
      { error: "Serviço não encontrado." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
