import type { ClientStatus, Priority, Role, Stage, VisitType } from "./types";

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrador",
  gerente: "Gerenciador",
  funcionario: "Funcionário de campo",
};

/** Etapas do funil na ordem em que aparecem no CRM. */
export const PIPELINE: Stage[] = [
  "agendada",
  "em_andamento",
  "concluida",
  "venda_finalizada",
  "pos_venda",
];

export const STAGE_META: Record<
  Stage,
  { label: string; short: string; color: string; bg: string; dot: string; description: string }
> = {
  agendada: {
    label: "Visitas agendadas",
    short: "Agendada",
    color: "text-sky-700",
    bg: "bg-sky-50 ring-sky-200",
    dot: "bg-sky-500",
    description: "Visitas marcadas aguardando o funcionário",
  },
  em_andamento: {
    label: "Visitas em andamento",
    short: "Em andamento",
    color: "text-amber-700",
    bg: "bg-amber-50 ring-amber-200",
    dot: "bg-amber-500",
    description: "Funcionário fez check-in no cliente",
  },
  concluida: {
    label: "Visitas concluídas",
    short: "Concluída",
    color: "text-violet-700",
    bg: "bg-violet-50 ring-violet-200",
    dot: "bg-violet-500",
    description: "Visita realizada, negociação em aberto",
  },
  venda_finalizada: {
    label: "Venda finalizada",
    short: "Venda finalizada",
    color: "text-emerald-700",
    bg: "bg-emerald-50 ring-emerald-200",
    dot: "bg-emerald-500",
    description: "Pedido fechado com o cliente",
  },
  pos_venda: {
    label: "Pós-venda",
    short: "Pós-venda",
    color: "text-brand-700",
    bg: "bg-brand-50 ring-brand-200",
    dot: "bg-brand-600",
    description: "Acompanhamento de satisfação e recompra",
  },
  perdida: {
    label: "Perdidas / canceladas",
    short: "Perdida",
    color: "text-rose-700",
    bg: "bg-rose-50 ring-rose-200",
    dot: "bg-rose-500",
    description: "Visita cancelada ou negócio perdido",
  },
};

export const VISIT_TYPE_LABEL: Record<VisitType, string> = {
  prospeccao: "Prospecção",
  demonstracao: "Demonstração de produtos",
  negociacao: "Negociação / proposta",
  entrega: "Entrega técnica",
  pos_venda: "Pós-venda",
  manutencao: "Visita de manutenção",
};

export const PRIORITY_META: Record<Priority, { label: string; cls: string }> = {
  baixa: { label: "Baixa", cls: "bg-slate-100 text-slate-600" },
  media: { label: "Média", cls: "bg-amber-100 text-amber-700" },
  alta: { label: "Alta", cls: "bg-rose-100 text-rose-700" },
};

export const CLIENT_STATUS_META: Record<ClientStatus, { label: string; cls: string }> = {
  lead: { label: "Lead", cls: "bg-sky-100 text-sky-700" },
  ativo: { label: "Cliente ativo", cls: "bg-emerald-100 text-emerald-700" },
  inativo: { label: "Inativo", cls: "bg-slate-100 text-slate-600" },
};

export const SEGMENTS = [
  "Condomínio",
  "Escritório / Empresa",
  "Hospital / Clínica",
  "Escola / Faculdade",
  "Restaurante / Bar",
  "Hotel / Pousada",
  "Indústria",
  "Supermercado / Varejo",
  "Academia",
  "Órgão público",
  "Residencial",
  "Outro",
];

export const SOURCES = [
  "Indicação",
  "Prospecção ativa",
  "Site / Google",
  "Instagram / Redes sociais",
  "WhatsApp",
  "Feira / Evento",
  "Cliente antigo",
  "Outro",
];

export const PAYMENT_METHODS = [
  "PIX",
  "Boleto",
  "Cartão de crédito",
  "Cartão de débito",
  "Dinheiro",
  "Transferência",
  "Faturado",
];

export const LOST_REASONS = [
  "Preço acima do esperado",
  "Fechou com concorrente",
  "Sem orçamento no momento",
  "Cliente não estava no local",
  "Cancelada pelo cliente",
  "Sem interesse",
  "Outro",
];

export const PRODUCT_CATEGORIES = [
  "Limpeza geral",
  "Desinfetantes",
  "Papelaria / Descartáveis",
  "Higiene pessoal",
  "Equipamentos",
  "Utensílios",
  "Lavanderia",
  "Cozinha",
];

export const USER_COLORS = [
  "#335ea2",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
  "#ec4899",
];

export const UF = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR",
  "PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];
