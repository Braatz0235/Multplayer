import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const db = await readDb();
  const session = await getSession();
  return NextResponse.json({
    needsSetup: !db.admin,
    authenticated: !!session,
    email: session?.email ?? null,
  });
}
