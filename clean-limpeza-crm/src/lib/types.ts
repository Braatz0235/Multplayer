export type Role = "admin" | "gerente" | "funcionario";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  passwordHash: string;
  active: boolean;
  /** Região/rota atendida (ex.: "Zona Sul", "Centro"). */
  region: string;
  /** Meta mensal de vendas em R$ (usada no painel de desempenho). */
  monthlyGoal: number;
  /** Gerente responsável (apenas para funcionários). */
  managerId: string | null;
  color: string;
  createdAt: string;
}

export type PublicUser = Omit<User, "passwordHash">;

export interface Address {
  cep: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  reference: string;
}

export type ClientType = "PJ" | "PF";
export type ClientStatus = "lead" | "ativo" | "inativo";

export interface Client {
  id: string;
  type: ClientType;
  name: string;
  tradeName: string;
  document: string;
  contactName: string;
  contactRole: string;
  phone: string;
  whatsapp: string;
  email: string;
  segment: string;
  source: string;
  status: ClientStatus;
  address: Address;
  notes: string;
  tags: string[];
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  active: boolean;
}

export type Stage =
  | "agendada"
  | "em_andamento"
  | "concluida"
  | "venda_finalizada"
  | "pos_venda"
  | "perdida";

export type VisitType =
  | "prospeccao"
  | "demonstracao"
  | "negociacao"
  | "entrega"
  | "pos_venda"
  | "manutencao";

export type Priority = "baixa" | "media" | "alta";

export interface GeoStamp {
  at: string;
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
}

export interface SaleItem {
  productId: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Sale {
  items: SaleItem[];
  discount: number;
  total: number;
  paymentMethod: string;
  paymentTerms: string;
  invoiceNumber: string;
  closedAt: string;
  deliveryDate: string | null;
}

export interface PostSale {
  satisfaction: number | null;
  nps: number | null;
  feedback: string;
  followUpDate: string | null;
  nextAction: string;
  completedAt: string | null;
}

export interface HistoryEntry {
  id: string;
  at: string;
  userId: string | null;
  kind: "criada" | "etapa" | "edicao" | "checkin" | "checkout" | "venda" | "pos_venda" | "comentario" | "reagendada" | "perdida";
  text: string;
}

export interface Visit {
  id: string;
  code: string;
  clientId: string;
  assignedTo: string;
  createdBy: string;
  type: VisitType;
  priority: Priority;
  scheduledAt: string;
  durationMinutes: number;
  objective: string;
  /** Endereço específico da visita (quando diferente do cadastro do cliente). */
  address: Address;
  stage: Stage;
  estimatedValue: number;
  checkIn: GeoStamp | null;
  checkOut: GeoStamp | null;
  report: string;
  outcome: string;
  nextSteps: string;
  sale: Sale | null;
  postSale: PostSale | null;
  lostReason: string;
  history: HistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  name: string;
  phone: string;
  email: string;
  address: Address;
}

export interface DB {
  company: Company;
  users: User[];
  clients: Client[];
  products: Product[];
  visits: Visit[];
  counters: { visit: number };
}
