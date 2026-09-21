import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readDb, updateDb } from "@/lib/db";
import { getSession } from "@/lib/session";

const schema = z.object({
  siteName: z.string().trim().min(1).max(100),
  handle: z.string().trim().max(60),
  tagline: z.string().trim().max(100),
  bio: z.string().trim().max(500),
  since: z.string().trim().max(10),
  address: z.string().trim().max(200),
  mapQuery: z.string().trim().max(200),
  phone: z.string().trim().max(30),
  whatsapp: z
    .string()
    .trim()
    .regex(/^\d{10,15}$/, "Use apenas números com DDI e DDD, ex: 5562999999999"),
  instagram: z.string().trim().max(200),
  rating: z.number().min(0).max(5),
  reviewsCount: z.number().int().min(0),
  followers: z.number().int().min(0),
  following: z.number().int().min(0),
  profileImage: z.string().trim().min(1),
  coverImage: z.string().trim().min(1),
  logoImage: z.string().trim().min(1),
  primaryColor: z.string().trim().max(20),
  accentColor: z.string().trim().max(20),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const db = await readDb();
  return NextResponse.json(db.settings);
}

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

  const settings = await updateDb((db) => {
    db.settings = { ...db.settings, ...parsed.data };
    return db.settings;
  });

  return NextResponse.json(settings);
}
