import { readDb } from "@/lib/db";
import ServicesManager from "@/components/admin/ServicesManager";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const db = await readDb();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-parchment sm:text-3xl">
          Serviços
        </h1>
        <p className="mt-1 text-sm text-parchment/50">
          Gerencie categorias, preços, duração e disponibilidade dos serviços.
        </p>
      </div>
      <ServicesManager
        initialCategories={[...db.categories].sort((a, b) => a.order - b.order)}
        initialServices={[...db.services].sort((a, b) => a.order - b.order)}
      />
    </div>
  );
}
