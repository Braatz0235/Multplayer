"use server";

import { nanoid } from "nanoid";
import { redirect } from "next/navigation";
import { refresh, revalidatePath } from "next/cache";
import { z } from "zod";
import { hashPassword, verifyPassword } from "./auth";
import { readDb, updateDb } from "./db";
import { buildDemoData } from "./seed";
import { ActionError, authorize, endSession, startSession } from "./session";
import { canAccessVisit } from "./queries";
import { todayLocal } from "./format";
import { STAGE_META, USER_COLORS } from "./constants";
import type { DB, GeoStamp, HistoryEntry, PublicUser, Stage, User, Visit } from "./types";

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

async function run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    revalidatePath("/", "layout");
    refresh();
    return { ok: true, data };
  } catch (err) {
    if (err instanceof ActionError) return { ok: false, error: err.message };
    if (err instanceof z.ZodError) {
      return { ok: false, error: err.issues[0]?.message ?? "Dados inválidos." };
    }
    console.error(err);
    return { ok: false, error: "Erro inesperado. Tente novamente." };
  }
}

const str = (max = 500) => z.string().trim().max(max).default("");
const email = z.string().trim().toLowerCase().email("Informe um e-mail válido.");

const addressSchema = z.object({
  cep: str(10),
  street: str(200),
  number: str(20),
  complement: str(120),
  district: str(120),
  city: str(120),
  state: str(2),
  reference: str(200),
});

function log(visit: Visit, userId: string, kind: HistoryEntry["kind"], text: string) {
  visit.history.push({ id: nanoid(10), at: new Date().toISOString(), userId, kind, text });
  visit.updatedAt = new Date().toISOString();
}

function findVisit(db: DB, user: PublicUser, id: string): Visit {
  const visit = db.visits.find((v) => v.id === id);
  if (!visit || !canAccessVisit(user, visit)) throw new ActionError("Visita não encontrada.");
  return visit;
}

// ---------------------------------------------------------------------------
// Autenticação
// ---------------------------------------------------------------------------

const setupSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome."),
  email,
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
  company: z.string().trim().min(2).default("Clean Limpeza"),
  demo: z.boolean().default(false),
});

export async function setupAction(input: z.input<typeof setupSchema>): Promise<ActionResult> {
  const result = await run(async () => {
    const data = setupSchema.parse(input);
    const passwordHash = await hashPassword(data.password);
    const admin = await updateDb((db) => {
      if (db.users.length > 0) throw new ActionError("O sistema já foi configurado. Faça login.");
      const admin: User = {
        id: nanoid(12), name: data.name, email: data.email, phone: "", role: "admin", passwordHash,
        active: true, region: "", monthlyGoal: 0, managerId: null, color: USER_COLORS[0]!,
        createdAt: new Date().toISOString(),
      };
      db.users.push(admin);
      db.company.name = data.company;
      if (data.demo) buildDemoData(db, admin, passwordHash, todayLocal(), () => nanoid(12));
      return admin;
    });
    await startSession(admin.id);
  });
  if (result.ok) redirect("/");
  return result;
}

const loginSchema = z.object({ email, password: z.string().min(1, "Informe a senha.") });

export async function loginAction(input: z.input<typeof loginSchema>): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Informe e-mail e senha." };
  const db = await readDb();
  if (db.users.length === 0) redirect("/setup");
  const user = db.users.find((u) => u.email === parsed.data.email);
  const valid = user ? await verifyPassword(parsed.data.password, user.passwordHash) : false;
  if (!user || !valid) return { ok: false, error: "E-mail ou senha incorretos." };
  if (!user.active) return { ok: false, error: "Usuário desativado. Fale com o administrador." };
  await startSession(user.id);
  redirect(user.role === "funcionario" ? "/minhas-visitas" : "/");
}

export async function logoutAction() {
  await endSession();
  redirect("/login");
}

// ---------------------------------------------------------------------------
// Equipe (gerenciadores e funcionários)
// ---------------------------------------------------------------------------

const userSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Informe o nome."),
  email,
  phone: str(30),
  role: z.enum(["admin", "gerente", "funcionario"]),
  region: str(120),
  monthlyGoal: z.coerce.number().min(0).default(0),
  managerId: z.string().nullable().default(null),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default(USER_COLORS[0]!),
  active: z.boolean().default(true),
  password: z.string().default(""),
});

export async function saveUser(input: z.input<typeof userSchema>) {
  return run(async () => {
    const me = await authorize(["admin", "gerente"]);
    const data = userSchema.parse(input);
    if (me.role === "gerente" && data.role !== "funcionario") {
      throw new ActionError("Gerenciadores só podem cadastrar funcionários.");
    }
    if (!data.id && data.password.length < 8) throw new ActionError("A senha deve ter pelo menos 8 caracteres.");
    if (data.password && data.password.length < 8) throw new ActionError("A senha deve ter pelo menos 8 caracteres.");
    const passwordHash = data.password ? await hashPassword(data.password) : null;

    await updateDb((db) => {
      if (db.users.some((u) => u.email === data.email && u.id !== data.id)) {
        throw new ActionError("Já existe um usuário com este e-mail.");
      }
      const fields = {
        name: data.name, email: data.email, phone: data.phone, role: data.role, region: data.region,
        monthlyGoal: data.role === "funcionario" ? data.monthlyGoal : 0,
        managerId: data.role === "funcionario" ? data.managerId : null, color: data.color, active: data.active,
      };
      if (data.id) {
        const user = db.users.find((u) => u.id === data.id);
        if (!user) throw new ActionError("Usuário não encontrado.");
        if (me.role === "gerente" && user.role !== "funcionario") throw new ActionError("Sem permissão.");
        if (user.id === me.id && (!data.active || data.role !== me.role)) {
          throw new ActionError("Você não pode desativar ou mudar o próprio perfil de acesso.");
        }
        Object.assign(user, fields);
        if (passwordHash) user.passwordHash = passwordHash;
      } else {
        db.users.push({ id: nanoid(12), ...fields, passwordHash: passwordHash!, createdAt: new Date().toISOString() });
      }
    });
  });
}

const accountSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome."),
  phone: str(30),
  currentPassword: z.string().default(""),
  newPassword: z.string().default(""),
});

export async function updateAccount(input: z.input<typeof accountSchema>) {
  return run(async () => {
    const me = await authorize();
    const data = accountSchema.parse(input);
    let newHash: string | null = null;
    if (data.newPassword) {
      if (data.newPassword.length < 8) throw new ActionError("A nova senha deve ter pelo menos 8 caracteres.");
      const db = await readDb();
      const user = db.users.find((u) => u.id === me.id)!;
      if (!(await verifyPassword(data.currentPassword, user.passwordHash))) {
        throw new ActionError("Senha atual incorreta.");
      }
      newHash = await hashPassword(data.newPassword);
    }
    await updateDb((db) => {
      const user = db.users.find((u) => u.id === me.id)!;
      user.name = data.name;
      user.phone = data.phone;
      if (newHash) user.passwordHash = newHash;
    });
  });
}

const companySchema = z.object({
  name: z.string().trim().min(2),
  phone: str(30),
  email: z.string().trim().max(200).default(""),
  address: addressSchema,
});

export async function saveCompany(input: z.input<typeof companySchema>) {
  return run(async () => {
    await authorize(["admin"]);
    const data = companySchema.parse(input);
    await updateDb((db) => {
      db.company = data;
    });
  });
}

// ---------------------------------------------------------------------------
// Clientes
// ---------------------------------------------------------------------------

const clientSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["PJ", "PF"]),
  name: z.string().trim().min(2, "Informe o nome / razão social."),
  tradeName: str(200),
  document: str(30),
  contactName: str(120),
  contactRole: str(120),
  phone: str(30),
  whatsapp: str(30),
  email: z.string().trim().max(200).default(""),
  segment: str(80),
  source: str(80),
  status: z.enum(["lead", "ativo", "inativo"]),
  address: addressSchema,
  notes: str(4000),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  ownerId: z.string().nullable().default(null),
});

export async function saveClient(input: z.input<typeof clientSchema>) {
  return run(async () => {
    const me = await authorize();
    const data = clientSchema.parse(input);
    return updateDb((db) => {
      const now = new Date().toISOString();
      if (data.id) {
        const client = db.clients.find((c) => c.id === data.id);
        if (!client) throw new ActionError("Cliente não encontrado.");
        Object.assign(client, data, { updatedAt: now });
        return client.id;
      }
      const id = nanoid(12);
      db.clients.push({
        ...data,
        id,
        ownerId: data.ownerId ?? (me.role === "funcionario" ? me.id : null),
        createdAt: now,
        updatedAt: now,
      });
      return id;
    });
  });
}

export async function deleteClient(id: string) {
  return run(async () => {
    await authorize(["admin", "gerente"]);
    await updateDb((db) => {
      if (db.visits.some((v) => v.clientId === id)) {
        throw new ActionError("Este cliente possui visitas registradas. Marque-o como inativo em vez de excluir.");
      }
      db.clients = db.clients.filter((c) => c.id !== id);
    });
  });
}

// ---------------------------------------------------------------------------
// Produtos
// ---------------------------------------------------------------------------

const productSchema = z.object({
  id: z.string().optional(),
  sku: str(40),
  name: z.string().trim().min(2, "Informe o nome do produto."),
  category: str(80),
  unit: z.string().trim().min(1).max(30).default("unidade"),
  price: z.coerce.number().min(0, "Preço inválido."),
  active: z.boolean().default(true),
});

export async function saveProduct(input: z.input<typeof productSchema>) {
  return run(async () => {
    await authorize(["admin", "gerente"]);
    const data = productSchema.parse(input);
    await updateDb((db) => {
      if (data.id) {
        const p = db.products.find((x) => x.id === data.id);
        if (!p) throw new ActionError("Produto não encontrado.");
        Object.assign(p, data);
      } else {
        db.products.push({ ...data, id: nanoid(12) });
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Visitas
// ---------------------------------------------------------------------------

const localDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Informe data e horário.");

const visitSchema = z.object({
  id: z.string().optional(),
  clientId: z.string().min(1, "Selecione o cliente."),
  assignedTo: z.string().min(1, "Selecione o funcionário."),
  type: z.enum(["prospeccao", "demonstracao", "negociacao", "entrega", "pos_venda", "manutencao"]),
  priority: z.enum(["baixa", "media", "alta"]),
  scheduledAt: localDateTime,
  durationMinutes: z.coerce.number().int().min(10).max(600),
  objective: str(2000),
  estimatedValue: z.coerce.number().min(0).default(0),
  address: addressSchema,
});

export async function saveVisit(input: z.input<typeof visitSchema>) {
  return run(async () => {
    const me = await authorize();
    const data = visitSchema.parse(input);
    if (me.role === "funcionario" && data.assignedTo !== me.id) {
      throw new ActionError("Você só pode agendar visitas para você mesmo.");
    }
    return updateDb((db) => {
      if (!db.clients.some((c) => c.id === data.clientId)) throw new ActionError("Cliente não encontrado.");
      const assignee = db.users.find((u) => u.id === data.assignedTo && u.active);
      if (!assignee) throw new ActionError("Funcionário inválido.");
      const now = new Date().toISOString();

      if (data.id) {
        const visit = findVisit(db, me, data.id);
        const changes: string[] = [];
        if (visit.scheduledAt !== data.scheduledAt) changes.push("reagendada");
        if (visit.assignedTo !== data.assignedTo) changes.push(`transferida para ${assignee.name}`);
        const rescheduled = visit.scheduledAt !== data.scheduledAt;
        const { id: _id, ...rest } = data;
        void _id;
        Object.assign(visit, rest);
        log(visit, me.id, rescheduled ? "reagendada" : "edicao", changes.length ? `Visita ${changes.join(" e ")}` : "Dados da visita atualizados");
        return visit.id;
      }

      db.counters.visit += 1;
      const visit: Visit = {
        ...data,
        id: nanoid(12),
        code: `VIS-${String(db.counters.visit).padStart(4, "0")}`,
        createdBy: me.id,
        stage: "agendada",
        checkIn: null,
        checkOut: null,
        report: "",
        outcome: "",
        nextSteps: "",
        sale: null,
        postSale: null,
        lostReason: "",
        history: [],
        createdAt: now,
        updatedAt: now,
      };
      log(visit, me.id, "criada", `Visita agendada para ${assignee.name}`);
      db.visits.push(visit);
      const client = db.clients.find((c) => c.id === data.clientId)!;
      if (!client.ownerId) client.ownerId = assignee.id;
      return visit.id;
    });
  });
}

export async function deleteVisit(id: string) {
  return run(async () => {
    await authorize(["admin", "gerente"]);
    await updateDb((db) => {
      db.visits = db.visits.filter((v) => v.id !== id);
    });
  });
}

const geoSchema = z
  .object({ lat: z.number().nullable(), lng: z.number().nullable(), accuracy: z.number().nullable() })
  .nullable()
  .default(null);

function stamp(geo: z.infer<typeof geoSchema>): GeoStamp {
  return { at: new Date().toISOString(), lat: geo?.lat ?? null, lng: geo?.lng ?? null, accuracy: geo?.accuracy ?? null };
}

export async function checkInVisit(id: string, geo: z.input<typeof geoSchema>) {
  return run(async () => {
    const me = await authorize();
    const g = geoSchema.parse(geo);
    await updateDb((db) => {
      const visit = findVisit(db, me, id);
      if (visit.stage !== "agendada") throw new ActionError("Esta visita já foi iniciada.");
      visit.stage = "em_andamento";
      visit.checkIn = stamp(g);
      log(visit, me.id, "checkin", g?.lat != null ? "Check-in realizado com localização GPS" : "Check-in realizado (sem localização)");
    });
  });
}

const checkOutSchema = z.object({
  report: z.string().trim().min(5, "Descreva brevemente como foi a visita."),
  outcome: str(200),
  nextSteps: str(1000),
  geo: geoSchema,
});

export async function checkOutVisit(id: string, input: z.input<typeof checkOutSchema>) {
  return run(async () => {
    const me = await authorize();
    const data = checkOutSchema.parse(input);
    await updateDb((db) => {
      const visit = findVisit(db, me, id);
      if (visit.stage !== "em_andamento" && visit.stage !== "agendada") {
        throw new ActionError("Esta visita já foi concluída.");
      }
      if (!visit.checkIn) visit.checkIn = stamp(null);
      visit.checkOut = stamp(data.geo);
      visit.report = data.report;
      visit.outcome = data.outcome;
      visit.nextSteps = data.nextSteps;
      visit.stage = "concluida";
      log(visit, me.id, "checkout", `Visita concluída${data.outcome ? `: ${data.outcome}` : ""}`);
    });
  });
}

const saleSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().nullable(),
        name: z.string().trim().min(1, "Produto sem nome."),
        quantity: z.coerce.number().positive("Quantidade inválida."),
        unitPrice: z.coerce.number().min(0),
      }),
    )
    .min(1, "Adicione ao menos um produto à venda."),
  discount: z.coerce.number().min(0).default(0),
  paymentMethod: z.string().trim().min(1, "Informe a forma de pagamento."),
  paymentTerms: str(120),
  invoiceNumber: str(60),
  deliveryDate: z.string().nullable().default(null),
});

export async function registerSale(id: string, input: z.input<typeof saleSchema>) {
  return run(async () => {
    const me = await authorize();
    const data = saleSchema.parse(input);
    const gross = data.items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
    if (data.discount > gross) throw new ActionError("O desconto não pode ser maior que o total.");
    await updateDb((db) => {
      const visit = findVisit(db, me, id);
      const editing = visit.sale !== null;
      if (!visit.checkOut) {
        if (!visit.checkIn) visit.checkIn = stamp(null);
        visit.checkOut = stamp(null);
      }
      visit.sale = {
        ...data,
        deliveryDate: data.deliveryDate || null,
        total: Math.round((gross - data.discount) * 100) / 100,
        closedAt: visit.sale?.closedAt ?? new Date().toISOString(),
      };
      if (visit.stage !== "pos_venda") visit.stage = "venda_finalizada";
      const client = db.clients.find((c) => c.id === visit.clientId);
      if (client && client.status !== "ativo") client.status = "ativo";
      log(visit, me.id, "venda", `${editing ? "Venda atualizada" : "Venda finalizada"}: ${visit.sale.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`);
    });
  });
}

const postSaleSchema = z.object({
  satisfaction: z.coerce.number().int().min(1).max(5).nullable().default(null),
  nps: z.coerce.number().int().min(0).max(10).nullable().default(null),
  feedback: str(2000),
  followUpDate: z.string().nullable().default(null),
  nextAction: str(500),
  completed: z.boolean().default(false),
});

export async function savePostSale(id: string, input: z.input<typeof postSaleSchema>) {
  return run(async () => {
    const me = await authorize();
    const data = postSaleSchema.parse(input);
    await updateDb((db) => {
      const visit = findVisit(db, me, id);
      if (!visit.sale) throw new ActionError("Registre a venda antes do pós-venda.");
      const wasCompleted = visit.postSale?.completedAt ?? null;
      visit.postSale = {
        satisfaction: data.satisfaction,
        nps: data.nps,
        feedback: data.feedback,
        followUpDate: data.followUpDate || null,
        nextAction: data.nextAction,
        completedAt: data.completed ? wasCompleted ?? new Date().toISOString() : null,
      };
      const entered = visit.stage !== "pos_venda";
      visit.stage = "pos_venda";
      log(
        visit,
        me.id,
        "pos_venda",
        entered
          ? "Movida para pós-venda"
          : data.completed && !wasCompleted
            ? "Pós-venda encerrado"
            : "Pós-venda atualizado",
      );
    });
  });
}

export async function markLost(id: string, reason: string) {
  return run(async () => {
    const me = await authorize();
    const text = z.string().trim().min(3, "Informe o motivo.").max(500).parse(reason);
    await updateDb((db) => {
      const visit = findVisit(db, me, id);
      visit.stage = "perdida";
      visit.lostReason = text;
      log(visit, me.id, "perdida", `Marcada como perdida/cancelada: ${text}`);
    });
  });
}

/**
 * Movimentação direta pelo quadro (kanban). Etapas que exigem dados
 * (concluir, venda, pós-venda, perda) são tratadas pelos formulários
 * específicos; aqui só voltamos etapas ou reabrimos.
 */
export async function moveStage(id: string, stage: Stage) {
  return run(async () => {
    const me = await authorize();
    await updateDb((db) => {
      const visit = findVisit(db, me, id);
      if (visit.stage === stage) return;
      const from = visit.stage;
      if (stage === "agendada") {
        visit.checkIn = null;
        visit.checkOut = null;
      } else if (stage === "em_andamento") {
        if (!visit.checkIn) visit.checkIn = stamp(null);
        visit.checkOut = null;
      } else if (stage === "concluida") {
        if (!visit.checkIn) visit.checkIn = stamp(null);
        if (!visit.checkOut) visit.checkOut = stamp(null);
      } else if (stage === "venda_finalizada") {
        if (!visit.sale) throw new ActionError("Registre os dados da venda para finalizar.");
      } else if (stage === "pos_venda") {
        if (!visit.sale) throw new ActionError("Registre a venda antes do pós-venda.");
        visit.postSale ??= { satisfaction: null, nps: null, feedback: "", followUpDate: null, nextAction: "", completedAt: null };
      } else if (stage === "perdida") {
        throw new ActionError("Informe o motivo da perda.");
      }
      if (from === "perdida") visit.lostReason = "";
      visit.stage = stage;
      log(visit, me.id, "etapa", `${STAGE_META[from].short} → ${STAGE_META[stage].short}`);
    });
  });
}

export async function addComment(id: string, text: string) {
  return run(async () => {
    const me = await authorize();
    const body = z.string().trim().min(1, "Escreva um comentário.").max(2000).parse(text);
    await updateDb((db) => {
      const visit = findVisit(db, me, id);
      log(visit, me.id, "comentario", body);
    });
  });
}

export async function updateReport(id: string, input: { report: string; outcome: string; nextSteps: string }) {
  return run(async () => {
    const me = await authorize();
    const data = z.object({ report: str(4000), outcome: str(200), nextSteps: str(1000) }).parse(input);
    await updateDb((db) => {
      const visit = findVisit(db, me, id);
      Object.assign(visit, data);
      log(visit, me.id, "edicao", "Relatório da visita atualizado");
    });
  });
}
