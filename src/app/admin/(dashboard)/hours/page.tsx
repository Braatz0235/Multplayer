import { readDb } from "@/lib/db";
import HoursEditor from "@/components/admin/HoursEditor";

export const dynamic = "force-dynamic";

export default async function HoursPage() {
  const db = await readDb();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-parchment sm:text-3xl">
          Horários de funcionamento
        </h1>
        <p className="mt-1 text-sm text-parchment/50">
          Defina os dias e horários em que a barbearia atende.
        </p>
      </div>
      <HoursEditor initialHours={[...db.hours].sort((a, b) => a.day - b.day)} />
    </div>
  );
}
