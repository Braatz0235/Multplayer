import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateDb } from "@/lib/db";
import { getSession } from "@/lib/session";
import {
  hashPassword,
  verifyPassword,
  signSession,
  SESSION_COOKIE,
  SESSION_COOKIE_MAX_AGE,
} from "@/lib/auth";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(200).optional().or(z.literal("")),
});

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

  const { name, email, currentPassword, newPassword } = parsed.data;

  const result = await updateDb(async (db) => {
    if (!db.admin || db.admin.email !== session.email) {
      return { error: "Não autorizado.", status: 401 } as const;
    }

    const valid = await verifyPassword(currentPassword, db.admin.passwordHash);
    if (!valid) {
      return { error: "Senha atual incorreta.", status: 401 } as const;
    }

    db.admin.name = name;
    db.admin.email = email;
    if (newPassword) {
      db.admin.passwordHash = await hashPassword(newPassword);
    }

    return { ok: true, emailChanged: email !== session.email } as const;
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const response = NextResponse.json({ ok: true });

  if (result.emailChanged) {
    const token = signSession({ email });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_COOKIE_MAX_AGE,
    });
  }

  return response;
}
