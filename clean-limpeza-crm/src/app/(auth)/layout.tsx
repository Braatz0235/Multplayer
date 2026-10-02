import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-[28rem] w-[28rem] rounded-full bg-white/5" />
        <Image src="/logo-white.png" alt="Clean Limpeza" width={320} height={134} priority className="relative h-auto w-72" />
        <div className="relative max-w-md">
          <h2 className="text-3xl font-bold leading-tight">CRM de visitas comerciais</h2>
          <p className="mt-3 text-brand-100">
            Agende visitas, envie sua equipe com GPS direto para o cliente e acompanhe cada atendimento — da visita
            agendada à venda finalizada e ao pós-venda.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-brand-100">
            <li>✓ Funil de atendimento completo</li>
            <li>✓ Integração com Google Maps e Waze</li>
            <li>✓ Check-in e check-out com localização</li>
            <li>✓ Painel de desempenho por funcionário</li>
          </ul>
        </div>
        <p className="relative text-xs text-brand-200">© Clean Limpeza — Comércio de produtos que transformam ambientes</p>
      </div>
      <div className="flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <Image src="/logo.png" alt="Clean Limpeza" width={240} height={100} priority className="mx-auto mb-8 h-auto w-56 lg:hidden" />
          {children}
        </div>
      </div>
    </div>
  );
}
