import Image from "next/image";
import PageHeader from "@/components/PageHeader";
import { AccountForm, CompanyForm } from "@/components/SettingsForms";
import { requireUser } from "@/lib/session";
import { readDb } from "@/lib/db";

export const metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const me = await requireUser();
  const db = await readDb();
  return (
    <>
      <PageHeader title="Configurações" />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <AccountForm me={me} />
          {me.role === "admin" && <CompanyForm company={db.company} />}
        </div>
        <aside className="card flex flex-col items-center p-6 text-center">
          <Image src="/logo.png" alt={db.company.name} width={260} height={110} className="h-auto w-56" />
          <p className="mt-4 text-sm text-slate-500">
            CRM de visitas comerciais da {db.company.name}. Integração com Google Maps (mapa e GPS) e Waze, check-in por geolocalização e acompanhamento de
            desempenho da equipe.
          </p>
        </aside>
      </div>
    </>
  );
}
