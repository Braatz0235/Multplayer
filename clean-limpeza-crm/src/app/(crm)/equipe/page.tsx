import PageHeader from "@/components/PageHeader";
import TeamManager from "@/components/TeamManager";
import { requireUser } from "@/lib/session";
import { loadScoped } from "@/lib/queries";
import { todayLocal } from "@/lib/format";

export const metadata = { title: "Equipe" };

export default async function TeamPage() {
  const me = await requireUser(["admin", "gerente"]);
  const { db, users } = await loadScoped(me);
  const today = todayLocal();
  const stats: Record<string, { open: number; today: number }> = {};
  for (const v of db.visits) {
    const s = (stats[v.assignedTo] ??= { open: 0, today: 0 });
    if (v.stage === "agendada" || v.stage === "em_andamento") s.open += 1;
    if (v.scheduledAt.startsWith(today) && v.stage !== "perdida") s.today += 1;
  }
  return (
    <>
      <PageHeader title="Equipe" subtitle="Cadastro de gerenciadores e funcionários que realizam as visitas" />
      <TeamManager users={users} me={me} stats={stats} />
    </>
  );
}
