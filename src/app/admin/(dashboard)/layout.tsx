import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { readDb } from "@/lib/db";
import AdminShell from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }

  const db = await readDb();

  return (
    <AdminShell
      adminName={db.admin?.name ?? "Administrador"}
      siteName={db.settings.siteName}
      logoImage={db.settings.logoImage}
    >
      {children}
    </AdminShell>
  );
}
