import "server-only";
import fs from "fs";
import path from "path";
import type { DB } from "./types";
import { DEFAULT_PRODUCTS } from "./seed";

const DATA_DIR = process.env.CRM_DATA_DIR || path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "crm.json");

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

function readDbRaw(): DB {
  if (!fs.existsSync(DB_PATH)) return emptyDb();
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8")) as DB;
}

function writeDbRaw(db: DB): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf-8");
  fs.renameSync(tmp, DB_PATH);
}

// Todas as leituras/escritas passam por uma fila única para que duas
// alterações simultâneas (ex.: dois funcionários fazendo check-in) não
// sobrescrevam uma à outra.
let mutex: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => T | Promise<T>): Promise<T> {
  const result = mutex.then(() => fn());
  mutex = result.catch(() => undefined);
  return result;
}

export function readDb(): Promise<DB> {
  return withLock(() => readDbRaw());
}

export function updateDb<T>(mutator: (db: DB) => T | Promise<T>): Promise<T> {
  return withLock(async () => {
    const db = readDbRaw();
    const result = await mutator(db);
    writeDbRaw(db);
    return result;
  });
}
