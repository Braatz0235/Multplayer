import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { getGroupedServices } from "@/lib/queries";

export async function GET() {
  const db = await readDb();
  return NextResponse.json({ categories: getGroupedServices(db) });
}
