import { redirect } from "next/navigation";
import { readDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import LoginForm from "./LoginForm";

export const metadata = { title: "Entrar" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  const db = await readDb();
  if (db.users.length === 0) redirect("/setup");
  return <LoginForm />;
}
