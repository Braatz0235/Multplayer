import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <Image src="/logo.png" alt="Clean Limpeza" width={220} height={92} className="h-auto w-52" />
      <h1 className="text-2xl font-bold text-slate-900">Página não encontrada</h1>
      <p className="text-slate-500">O registro pode ter sido removido ou você não tem acesso a ele.</p>
      <Link href="/" className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white">
        Voltar ao painel
      </Link>
    </div>
  );
}
