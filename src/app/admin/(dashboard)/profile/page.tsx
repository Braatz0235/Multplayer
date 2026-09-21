import { readDb } from "@/lib/db";
import ProfileForm from "@/components/admin/ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const db = await readDb();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-parchment sm:text-3xl">
          Perfil & Imagens
        </h1>
        <p className="mt-1 text-sm text-parchment/50">
          Edite as informações públicas exibidas no site.
        </p>
      </div>
      <ProfileForm initialSettings={db.settings} />
    </div>
  );
}
