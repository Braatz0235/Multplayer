import { readDb } from "@/lib/db";
import BookingsManager from "@/components/admin/BookingsManager";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const db = await readDb();
  const bookings = [...db.bookings].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return a.time.localeCompare(b.time);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-parchment sm:text-3xl">
          Agendamentos
        </h1>
        <p className="mt-1 text-sm text-parchment/50">
          Acompanhe, confirme e gerencie os horários reservados pelos clientes.
        </p>
      </div>
      <BookingsManager initialBookings={bookings} whatsapp={db.settings.whatsapp} />
    </div>
  );
}
