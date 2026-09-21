import { readDb } from "@/lib/db";
import { getGroupedServices } from "@/lib/queries";
import Header from "@/components/site/Header";
import Hero from "@/components/site/Hero";
import BookingFlow from "@/components/site/BookingFlow";
import Location from "@/components/site/Location";
import Hours from "@/components/site/Hours";
import Footer from "@/components/site/Footer";

export const dynamic = "force-dynamic";

export default async function Home() {
  const db = await readDb();
  const groupedServices = getGroupedServices(db);

  return (
    <div className="flex min-h-screen flex-col">
      <Header settings={db.settings} />
      <main className="flex-1">
        <Hero settings={db.settings} />
        <BookingFlow groupedServices={groupedServices} settings={db.settings} />
        <Location settings={db.settings} />
        <Hours hours={db.hours} settings={db.settings} />
      </main>
      <Footer settings={db.settings} />
    </div>
  );
}
