import type { Address, Client, DB, HistoryEntry, Product, Stage, User, Visit, VisitType } from "./types";

export const DEFAULT_PRODUCTS: Product[] = [
  { id: "p-detergente-5l", sku: "CL-001", name: "Detergente neutro concentrado 5L", category: "Limpeza geral", unit: "galão", price: 38.9, active: true },
  { id: "p-desinf-5l", sku: "CL-002", name: "Desinfetante lavanda 5L", category: "Desinfetantes", unit: "galão", price: 29.9, active: true },
  { id: "p-alcool-70", sku: "CL-003", name: "Álcool 70% 5L", category: "Desinfetantes", unit: "galão", price: 54.5, active: true },
  { id: "p-cloro-5l", sku: "CL-004", name: "Água sanitária / cloro 5L", category: "Desinfetantes", unit: "galão", price: 19.9, active: true },
  { id: "p-multiuso", sku: "CL-005", name: "Limpador multiuso 5L", category: "Limpeza geral", unit: "galão", price: 34.0, active: true },
  { id: "p-limpa-vidros", sku: "CL-006", name: "Limpa-vidros 5L", category: "Limpeza geral", unit: "galão", price: 36.5, active: true },
  { id: "p-papel-toalha", sku: "CL-010", name: "Papel toalha interfolhado (cx 1000 fls)", category: "Papelaria / Descartáveis", unit: "caixa", price: 27.9, active: true },
  { id: "p-papel-hig", sku: "CL-011", name: "Papel higiênico rolão 300m (fardo 8)", category: "Papelaria / Descartáveis", unit: "fardo", price: 89.9, active: true },
  { id: "p-saco-lixo", sku: "CL-012", name: "Saco de lixo 100L reforçado (pct 100)", category: "Papelaria / Descartáveis", unit: "pacote", price: 49.9, active: true },
  { id: "p-sabonete", sku: "CL-020", name: "Sabonete líquido erva-doce 5L", category: "Higiene pessoal", unit: "galão", price: 32.9, active: true },
  { id: "p-dispenser", sku: "CL-021", name: "Dispenser para sabonete/álcool gel", category: "Equipamentos", unit: "unidade", price: 45.0, active: true },
  { id: "p-mop", sku: "CL-030", name: "Mop giratório profissional", category: "Utensílios", unit: "unidade", price: 119.0, active: true },
  { id: "p-carrinho", sku: "CL-031", name: "Carrinho funcional de limpeza", category: "Equipamentos", unit: "unidade", price: 689.0, active: true },
  { id: "p-pano-micro", sku: "CL-032", name: "Pano de microfibra (pct 10)", category: "Utensílios", unit: "pacote", price: 39.9, active: true },
  { id: "p-desengr", sku: "CL-040", name: "Desengordurante cozinha industrial 5L", category: "Cozinha", unit: "galão", price: 58.0, active: true },
  { id: "p-amaciante", sku: "CL-050", name: "Amaciante concentrado 5L", category: "Lavanderia", unit: "galão", price: 41.0, active: true },
];

// ---------------------------------------------------------------------------
// Dados de demonstração (opcionais, carregados na configuração inicial)
// ---------------------------------------------------------------------------

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const addr = (street: string, number: string, district: string, cep: string): Address => ({
  cep,
  street,
  number,
  complement: "",
  district,
  city: "São Paulo",
  state: "SP",
  reference: "",
});

const DEMO_CLIENTS: Array<[string, string, string, Address, string, string]> = [
  ["Condomínio Residencial Jardins", "Condomínio", "Marcos Almeida (síndico)", addr("Rua Augusta", "1500", "Consolação", "01304-001"), "11987654321", "Indicação"],
  ["Hospital Santa Clara", "Hospital / Clínica", "Dra. Patrícia Lima", addr("Avenida Paulista", "1000", "Bela Vista", "01310-100"), "11976543210", "Prospecção ativa"],
  ["Escola Pequenos Gênios", "Escola / Faculdade", "Renata Souza", addr("Rua Vergueiro", "2000", "Vila Mariana", "04101-000"), "11965432109", "Site / Google"],
  ["Restaurante Sabor da Casa", "Restaurante / Bar", "João Batista", addr("Rua Oscar Freire", "800", "Jardins", "01426-001"), "11954321098", "Instagram / Redes sociais"],
  ["Hotel Central Plaza", "Hotel / Pousada", "Fernanda Costa", addr("Avenida São João", "400", "República", "01035-000"), "11943210987", "Feira / Evento"],
  ["Academia Corpo em Forma", "Academia", "Ricardo Nunes", addr("Rua Teodoro Sampaio", "1200", "Pinheiros", "05406-000"), "11932109876", "WhatsApp"],
  ["Metalúrgica Aço Forte", "Indústria", "Carlos Eduardo", addr("Avenida do Estado", "5000", "Cambuci", "01516-000"), "11921098765", "Prospecção ativa"],
  ["Supermercado Bom Preço", "Supermercado / Varejo", "Luciana Martins", addr("Rua da Mooca", "2500", "Mooca", "03104-002"), "11910987654", "Indicação"],
  ["Escritório Advocacia Torres", "Escritório / Empresa", "Dr. Paulo Torres", addr("Rua Funchal", "300", "Vila Olímpia", "04551-060"), "11998765432", "Cliente antigo"],
  ["Clínica Odonto Sorriso", "Hospital / Clínica", "Dra. Camila Rocha", addr("Rua Domingos de Morais", "900", "Vila Mariana", "04010-100"), "11987651234", "Site / Google"],
  ["Condomínio Edifício Aurora", "Condomínio", "Sr. Antônio Pereira", addr("Rua Haddock Lobo", "600", "Cerqueira César", "01414-000"), "11976549876", "Indicação"],
  ["Padaria Pão Dourado", "Restaurante / Bar", "Marta Ribeiro", addr("Rua Cardeal Arcoverde", "1100", "Pinheiros", "05407-002"), "11965438765", "Prospecção ativa"],
];

export function buildDemoData(
  db: DB,
  admin: User,
  passwordHash: string,
  today: string,
  makeId: () => string,
): void {
  const random = rng(42);
  const pick = <T,>(list: T[]) => list[Math.floor(random() * list.length)]!;
  const nowIso = new Date().toISOString();

  const manager: User = {
    id: makeId(), name: "Juliana Mendes", email: "gerente@cleanlimpeza.com.br", phone: "11990001111",
    role: "gerente", passwordHash, active: true, region: "São Paulo - Capital", monthlyGoal: 0,
    managerId: null, color: "#8b5cf6", createdAt: nowIso,
  };
  const field: User[] = [
    ["Rafael Oliveira", "rafael@cleanlimpeza.com.br", "Zona Oeste", 18000, "#0ea5e9"],
    ["Bianca Santos", "bianca@cleanlimpeza.com.br", "Zona Sul", 15000, "#10b981"],
    ["Diego Ferreira", "diego@cleanlimpeza.com.br", "Centro / Leste", 15000, "#f59e0b"],
  ].map(([name, email, region, goal, color], i) => ({
    id: makeId(), name: name as string, email: email as string, phone: `1199000222${i}`,
    role: "funcionario" as const, passwordHash, active: true, region: region as string,
    monthlyGoal: goal as number, managerId: manager.id, color: color as string, createdAt: nowIso,
  }));
  db.users.push(manager, ...field);

  const clients: Client[] = DEMO_CLIENTS.map(([name, segment, contact, address, phone, source], i) => ({
    id: makeId(), type: "PJ", name, tradeName: name, document: "", contactName: contact,
    contactRole: "", phone, whatsapp: phone, email: "", segment, source,
    status: i < 9 ? "ativo" : "lead", address, notes: "", tags: [],
    ownerId: field[i % field.length]!.id, createdAt: nowIso, updatedAt: nowIso,
  }));
  db.clients.push(...clients);

  const types: VisitType[] = ["prospeccao", "demonstracao", "negociacao", "entrega", "pos_venda"];
  const hours = ["08:30", "09:30", "10:30", "11:00", "13:30", "14:30", "15:30", "16:30"];
  const products = db.products.filter((p) => p.active);

  // ~60 visitas nos últimos 75 dias + próximas 10 dias.
  for (let i = 0; i < 64; i++) {
    const offset = i < 52 ? -Math.floor(random() * 75) - 1 : Math.floor(random() * 10);
    const day = shiftDay(today, offset);
    const scheduledAt = `${day}T${pick(hours)}`;
    const client = pick(clients);
    const owner = random() < 0.6 ? db.users.find((u) => u.id === client.ownerId)! : pick(field);
    const isPast = offset < 0;

    let stage: Stage = "agendada";
    if (isPast) {
      const r = random();
      stage = r < 0.3 ? "concluida" : r < 0.62 ? "venda_finalizada" : r < 0.85 ? "pos_venda" : "perdida";
    } else if (offset === 0 && random() < 0.5) {
      stage = "em_andamento";
    }

    db.counters.visit += 1;
    const history: HistoryEntry[] = [
      { id: makeId(), at: [localToIso(addMinutes(scheduledAt, -60 * 24 * 3)), nowIso].sort()[0]!, userId: manager.id, kind: "criada", text: `Visita agendada para ${owner.name}` },
    ];
    const visit: Visit = {
      id: makeId(),
      code: `VIS-${String(db.counters.visit).padStart(4, "0")}`,
      clientId: client.id,
      assignedTo: owner.id,
      createdBy: random() < 0.5 ? manager.id : admin.id,
      type: pick(types),
      priority: pick(["baixa", "media", "media", "alta"] as const),
      scheduledAt,
      durationMinutes: pick([30, 45, 60, 90]),
      objective: pick([
        "Apresentar linha de desinfetantes hospitalares",
        "Levantar consumo mensal de descartáveis",
        "Demonstrar mop e carrinho funcional",
        "Negociar contrato de fornecimento mensal",
        "Entregar pedido e treinar equipe de limpeza",
      ]),
      address: { ...client.address },
      stage,
      estimatedValue: Math.round(800 + random() * 6000),
      checkIn: null,
      checkOut: null,
      report: "",
      outcome: "",
      nextSteps: "",
      sale: null,
      postSale: null,
      lostReason: "",
      history,
      createdAt: history[0]!.at,
      updatedAt: history[0]!.at,
    };

    if (stage !== "agendada") {
      const late = Math.floor(random() * 25) - 8;
      const checkInLocal = addMinutes(scheduledAt, late);
      visit.checkIn = { at: localToIso(checkInLocal), lat: null, lng: null, accuracy: null };
      history.push({ id: makeId(), at: visit.checkIn.at, userId: owner.id, kind: "checkin", text: "Check-in realizado no cliente" });
    }
    if (["concluida", "venda_finalizada", "pos_venda", "perdida"].includes(stage)) {
      const outLocal = addMinutes(scheduledAt, visit.durationMinutes + Math.floor(random() * 30));
      visit.checkOut = { at: localToIso(outLocal), lat: null, lng: null, accuracy: null };
      visit.report = "Cliente recebeu bem a apresentação. Levantamos as necessidades de reposição mensal.";
      history.push({ id: makeId(), at: visit.checkOut.at, userId: owner.id, kind: "checkout", text: "Visita concluída" });
    }
    if (stage === "venda_finalizada" || stage === "pos_venda") {
      const n = 1 + Math.floor(random() * 4);
      const items = Array.from({ length: n }, () => {
        const p = pick(products);
        return { productId: p.id, name: p.name, quantity: 2 + Math.floor(random() * 20), unitPrice: p.price };
      });
      const gross = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
      const discount = random() < 0.3 ? Math.round(gross * 0.05) : 0;
      visit.sale = {
        items, discount, total: round2(gross - discount), paymentMethod: pick(["PIX", "Boleto", "Faturado"]),
        paymentTerms: pick(["À vista", "28 dias", "30/60 dias"]), invoiceNumber: "",
        closedAt: visit.checkOut!.at, deliveryDate: shiftDay(day, 3),
      };
      history.push({ id: makeId(), at: visit.checkOut!.at, userId: owner.id, kind: "venda", text: "Venda finalizada" });
    }
    if (stage === "pos_venda") {
      const sat = random() < 0.75 ? 5 : 4 - Math.floor(random() * 2);
      visit.postSale = {
        satisfaction: sat, nps: sat >= 5 ? 10 : sat === 4 ? 8 : 6,
        feedback: sat >= 5 ? "Produtos excelentes, entrega no prazo." : "Gostou, mas pediu prazo maior de pagamento.",
        followUpDate: shiftDay(day, 30), nextAction: "Ligar para repor estoque", completedAt: null,
      };
    }
    if (stage === "perdida") {
      visit.lostReason = pick(["Preço acima do esperado", "Fechou com concorrente", "Sem orçamento no momento"]);
      history.push({ id: makeId(), at: visit.checkOut!.at, userId: owner.id, kind: "perdida", text: `Marcada como perdida: ${visit.lostReason}` });
    }
    visit.updatedAt = history[history.length - 1]!.at;
    db.visits.push(visit);
  }
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function shiftDay(day: string, amount: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + amount);
  return d.toISOString().slice(0, 10);
}

function addMinutes(local: string, minutes: number): string {
  return new Date(Date.parse(`${local}:00Z`) + minutes * 60000).toISOString().slice(0, 16);
}

// Converte horário local de São Paulo (UTC-3, sem horário de verão) em ISO UTC.
function localToIso(local: string): string {
  return new Date(Date.parse(`${local}:00-03:00`)).toISOString();
}
