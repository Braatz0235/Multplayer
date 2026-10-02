import "server-only";
import fs from "fs";
import path from "path";
import postgres from "postgres";
import type { DB } from "./types";
import { DEFAULT_PRODUCTS } from "./seed";

/**
 * Armazenamento do CRM.
 *
 * - Com DATABASE_URL (ou POSTGRES_URL) definida — obrigatório na Vercel —
 *   os dados ficam em PostgreSQL (Neon, Supabase, Vercel Postgres...).
 * - Sem ela, usa o arquivo data/crm.json (desenvolvimento, Docker, VPS).
 *
 * O CRM é guardado como um documento JSON. Toda alteração é feita dentro de
 * uma transação com bloqueio de linha (SELECT ... FOR UPDATE), então várias
 * instâncias serverless podem gravar ao mesmo tempo sem perder dados.
 */

const DATABASE_URL =
  process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || "";

const DATA_DIR = process.env.CRM_DATA_DIR || path.join(/* turbopackIgnore: true */ process.cwd(), "data");

function emptyDb(): DB {
  return {
    company: {
      name: "Clean Limpeza",
      phone: "",
      email: "",
      address: { cep: "", street: "", number: "", complement: "", district: "", city: "", state: "", reference: "" },
    },
    users: [],
    clients: [],
    products: DEFAULT_PRODUCTS.map((p) => ({ ...p })),
    visits: [],
    counters: { visit: 0 },
  };
}

export class StorageNotConfiguredError extends Error {
  constructor() {
    super(
      "Banco de dados não configurado. Na Vercel, adicione um banco Postgres (Storage → Neon) " +
        "ou defina a variável DATABASE_URL e faça um novo deploy.",
    );
  }
}

// ---------------------------------------------------------------------------
// PostgreSQL
// ---------------------------------------------------------------------------

type Sql = ReturnType<typeof postgres>;
const globalForSql = globalThis as unknown as { __crmSql?: Sql; __crmReady?: Promise<void> };

function sql(): Sql {
  if (!globalForSql.__crmSql) {
    globalForSql.__crmSql = postgres(DATABASE_URL, {
      max: 3,
      idle_timeout: 20,
      connect_timeout: 15,
      prepare: false, // compatível com poolers (PgBouncer / Neon pooled)
      onnotice: () => {},
    });
  }
  return globalForSql.__crmSql;
}

function ensureTable(): Promise<void> {
  globalForSql.__crmReady ??= (async () => {
    await sql()`create table if not exists crm_store (
      id text primary key,
      data jsonb not null,
      updated_at timestamptz not null default now()
    )`;
  })().catch((err) => {
    globalForSql.__crmReady = undefined;
    throw err;
  });
  return globalForSql.__crmReady;
}

async function pgRead<T>(key: string): Promise<T | null> {
  await ensureTable();
  const rows = await sql()`select data from crm_store where id = ${key}`;
  return rows.length ? (rows[0]!.data as T) : null;
}

async function pgUpdate<T, R>(key: string, initial: () => T, mutator: (doc: T) => R | Promise<R>): Promise<R> {
  await ensureTable();
  await sql()`insert into crm_store (id, data) values (${key}, ${sql().json(initial() as never)}) on conflict (id) do nothing`;
  return sql().begin(async (tx) => {
    const rows = await tx`select data from crm_store where id = ${key} for update`;
    const doc = rows[0]!.data as T;
    const result = await mutator(doc);
    await tx`update crm_store set data = ${tx.json(doc as never)}, updated_at = now() where id = ${key}`;
    return result;
  }) as Promise<R>;
}

// ---------------------------------------------------------------------------
// Arquivo local
// ---------------------------------------------------------------------------

function filePath(key: string) {
  return path.join(/* turbopackIgnore: true */ DATA_DIR, key === "crm" ? "crm.json" : `${key}.json`);
}

function fileRead<T>(key: string): T | null {
  const p = filePath(key);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf-8")) as T;
}

function fileWrite<T>(key: string, doc: T) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const p = filePath(key);
  fs.writeFileSync(`${p}.tmp`, JSON.stringify(doc, null, 2), "utf-8");
  fs.renameSync(`${p}.tmp`, p);
}

// Fila única para leituras/escritas no modo arquivo (processo único).
let mutex: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => T | Promise<T>): Promise<T> {
  const result = mutex.then(() => fn());
  mutex = result.catch(() => undefined);
  return result;
}

// ---------------------------------------------------------------------------
// API genérica de documentos
// ---------------------------------------------------------------------------

function checkConfigured() {
  // Na Vercel o disco é somente leitura: sem banco, não há onde gravar.
  if (!DATABASE_URL && process.env.VERCEL) throw new StorageNotConfiguredError();
}

export const usingPostgres = () => Boolean(DATABASE_URL);

export async function readDoc<T>(key: string): Promise<T | null> {
  checkConfigured();
  if (DATABASE_URL) return pgRead<T>(key);
  return withLock(() => fileRead<T>(key));
}

export async function updateDoc<T, R>(key: string, initial: () => T, mutator: (doc: T) => R | Promise<R>): Promise<R> {
  checkConfigured();
  if (DATABASE_URL) return pgUpdate(key, initial, mutator);
  return withLock(async () => {
    const doc = fileRead<T>(key) ?? initial();
    const result = await mutator(doc);
    fileWrite(key, doc);
    return result;
  });
}

// ---------------------------------------------------------------------------
// Banco do CRM
// ---------------------------------------------------------------------------

export async function readDb(): Promise<DB> {
  return (await readDoc<DB>("crm")) ?? emptyDb();
}

export function updateDb<T>(mutator: (db: DB) => T | Promise<T>): Promise<T> {
  return updateDoc("crm", emptyDb, mutator);
}
