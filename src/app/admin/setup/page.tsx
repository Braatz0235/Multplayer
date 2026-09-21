import { redirect } from "next/navigation";
import { readDb } from "@/lib/db";
import SetupForm from "@/components/admin/SetupForm";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const db = await readDb();
  if (db.admin) {
    redirect("/admin/login");
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
            Criar conta administrativa
          </h1>
          <p className="mt-2 text-sm text-parchment/60">
            Esta é a primeira vez configurando o painel. Crie suas credenciais
            de acesso.
          </p>
        </div>
        <SetupForm />
      </div>
    </div>
  );
}
