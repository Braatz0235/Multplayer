import { readDb } from "@/lib/db";
import AccountForm from "@/components/admin/AccountForm";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const db = await readDb();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-parchment sm:text-3xl">
          Minha conta
        </h1>
        <p className="mt-1 text-sm text-parchment/50">
          Atualize seus dados de acesso à área administrativa.
        </p>
      </div>
      <AccountForm
        initialName={db.admin?.name ?? ""}
        initialEmail={db.admin?.email ?? ""}
      />
    </div>
  );
}
