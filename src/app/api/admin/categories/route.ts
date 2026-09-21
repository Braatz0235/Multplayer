import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { readDb, updateDb } from "@/lib/db";
import { getSession } from "@/lib/session";

const schema = z.object({
  name: z.string().trim().min(1).max(60),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const db = await readDb();
  return NextResponse.json(
    [...db.categories].sort((a, b) => a.order - b.order)
  );
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const category = await updateDb((db) => {
    const order = db.categories.length;
    const newCategory = { id: `cat-${nanoid(8)}`, name: parsed.data.name, order };
    db.categories.push(newCategory);
    return newCategory;
  });

  return NextResponse.json(category, { status: 201 });
}
