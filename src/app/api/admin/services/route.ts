import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { readDb, updateDb } from "@/lib/db";
import { getSession } from "@/lib/session";

const schema = z.object({
  categoryId: z.string().min(1),
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(300).optional().default(""),
  price: z.number().min(0).max(100000),
  durationMinutes: z.number().int().min(5).max(600),
  image: z.string().nullable().optional(),
  active: z.boolean().optional().default(true),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const db = await readDb();
  return NextResponse.json([...db.services].sort((a, b) => a.order - b.order));
}

export async function POST(request: NextRequest) {
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

  const result = await updateDb((db) => {
    const categoryExists = db.categories.some(
      (c) => c.id === parsed.data.categoryId
    );
    if (!categoryExists) {
      return { error: "Categoria inválida." } as const;
    }
    const order = db.services.filter(
      (s) => s.categoryId === parsed.data.categoryId
    ).length;
    const service = {
      id: `srv-${nanoid(8)}`,
      categoryId: parsed.data.categoryId,
      name: parsed.data.name,
      description: parsed.data.description ?? "",
      price: parsed.data.price,
      durationMinutes: parsed.data.durationMinutes,
      image: parsed.data.image ?? null,
      active: parsed.data.active ?? true,
      order,
    };
    db.services.push(service);
    return { service } as const;
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result.service, { status: 201 });
}
