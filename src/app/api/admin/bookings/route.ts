import { NextRequest, NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const status = searchParams.get("status");

  const db = await readDb();
  let bookings = [...db.bookings];

  if (date) bookings = bookings.filter((b) => b.date === date);
  if (status) bookings = bookings.filter((b) => b.status === status);

  bookings.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });

  return NextResponse.json(bookings);
}
