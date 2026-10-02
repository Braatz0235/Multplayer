import { redirect } from "next/navigation";
import { readDb } from "@/lib/db";
import SetupForm from "./SetupForm";

export const metadata = { title: "Configuração inicial" };
export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const db = await readDb();
  if (db.users.length > 0) redirect("/login");
  return <SetupForm />;
}
