import Image from "next/image";

/** Exibida na Vercel quando o banco de dados ainda não foi conectado. */
export default function StorageMissing() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="card w-full max-w-xl p-8">
        <Image src="/logo.png" alt="Clean Limpeza" width={220} height={92} className="mx-auto mb-6 h-auto w-48" priority />
        <h1 className="text-xl font-bold text-slate-900">Falta conectar o banco de dados</h1>
        <p className="mt-2 text-sm text-slate-600">
          Na Vercel os arquivos do servidor são somente leitura, então o CRM guarda os dados em um banco PostgreSQL.
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-700">
          <li>
            No painel do projeto na Vercel, abra a aba <strong>Storage</strong>.
          </li>
          <li>
            Clique em <strong>Create Database → Neon (Serverless Postgres)</strong>, escolha a região{" "}
            <strong>São Paulo (sa-east-1)</strong> e conecte ao projeto.
          </li>
          <li>
            Vá em <strong>Deployments</strong>, clique nos três pontos do último deploy e em <strong>Redeploy</strong>.
          </li>
        </ol>
        <p className="mt-4 text-xs text-slate-500">
          Também funciona com qualquer PostgreSQL (Supabase, Railway...): basta criar a variável de ambiente{" "}
          <code className="rounded bg-slate-100 px-1">DATABASE_URL</code> com a string de conexão.
        </p>
      </div>
    </div>
  );
}
