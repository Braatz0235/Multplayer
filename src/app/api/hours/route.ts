import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";

export async function GET() {
  const db = await readDb();
  const hours = [...db.hours].sort((a, b) => a.day - b.day);
  return NextResponse.json(hours);
}
