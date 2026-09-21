import { redirect } from "next/navigation";
import Link from "next/link";
import { readDb } from "@/lib/db";
import { getSession } from "@/lib/session";
import LoginForm from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const db = await readDb();
  if (!db.admin) {
    redirect("/admin/setup");
  }

  const session = await getSession();
  if (session) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img
            src="/uploads/default-profile.svg"
            alt=""
            className="mx-auto h-16 w-16 rounded-full border border-gold/40"
          />
          <h1 className="mt-4 font-display text-2xl font-bold text-gold-gradient">
            Área administrativa
          </h1>
          <p className="mt-2 text-sm text-parchment/60">
            Entre com seu e-mail e senha para gerenciar a barbearia.
          </p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-sm">
          <Link href="/" className="text-parchment/50 hover:text-gold">
            ← Voltar para o site
          </Link>
        </p>
      </div>
    </div>
  );
}
