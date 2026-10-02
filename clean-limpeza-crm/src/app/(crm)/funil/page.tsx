import Board from "@/components/Board";
import NewVisitButton from "@/components/NewVisitButton";
import PageHeader from "@/components/PageHeader";
import { requireUser } from "@/lib/session";
import { loadScoped } from "@/lib/queries";

export const metadata = { title: "Funil de atendimento" };

export default async function FunnelPage() {
  const me = await requireUser();
  const { db, visits, users } = await loadScoped(me);
  return (
    <>
      <PageHeader
        title="Funil de atendimento"
        subtitle="Visitas agendadas → em andamento → concluídas → venda finalizada → pós-venda"
        actions={<NewVisitButton clients={db.clients} users={users} me={me} />}
      />
      <Board visits={visits} clients={db.clients} users={users} products={db.products} me={me} />
    </>
  );
}
