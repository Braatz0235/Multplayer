import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateDb } from "@/lib/db";
import { getSession } from "@/lib/session";

const schema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
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
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const result = await updateDb((db) => {
    const category = db.categories.find((c) => c.id === id);
    if (!category) return null;
    Object.assign(category, parsed.data);
    return category;
  });

  if (!result) {
    return NextResponse.json(
      { error: "Categoria não encontrada." },
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

  const result = await updateDb(
    (db): { ok: true } | { error: string; status: number } => {
      const inUse = db.services.some((s) => s.categoryId === id);
      if (inUse) {
        return {
          error: "Categoria possui serviços. Mova ou exclua-os antes.",
          status: 409,
        };
      }
      const idx = db.categories.findIndex((c) => c.id === id);
      if (idx === -1) {
        return { error: "Categoria não encontrada.", status: 404 };
      }
      db.categories.splice(idx, 1);
      return { ok: true };
    }
  );

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true });
}
