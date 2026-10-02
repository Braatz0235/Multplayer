import Shell from "@/components/Shell";
import { readDb } from "@/lib/db";
import { requireUser } from "@/lib/session";

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const db = await readDb();
  return (
    <Shell user={user} company={db.company.name}>
      {children}
    </Shell>
  );
}
