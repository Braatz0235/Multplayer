import fs from "fs";
import path from "path";
import type { DB } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

const DEFAULT_DB: DB = {
  settings: {
    siteName: "Barbearia Of The Kings",
    handle: "@barbearia.of.the.kings",
    tagline: "Of The Kings",
    bio: "Cortes que refletem poder e estilo 👑\nBarbeiro de clientes seletos",
    since: "2015",
    address: "R. C-190, c/ C34 - Jardim América, Goiânia - GO, 74255-080",
    mapQuery: "Barbearia Of The Kings, R. C-190, Jardim América, Goiânia - GO",
    phone: "(62) 99225-8031",
    whatsapp: "5562992258031",
    instagram: "https://instagram.com/barbearia.of.the.kings",
    rating: 5.0,
    reviewsCount: 6,
    followers: 2286,
    following: 1801,
    profileImage: "/uploads/default-profile.svg",
    coverImage: "/uploads/default-cover.svg",
    logoImage: "/uploads/default-profile.svg",
    primaryColor: "#0a0a0a",
    accentColor: "#d4af37",
  },
  categories: [
    { id: "cat-cabelo", name: "Cabelo", order: 0 },
    { id: "cat-barba", name: "Barba", order: 1 },
    { id: "cat-combos", name: "Combos", order: 2 },
    { id: "cat-outros", name: "Outros", order: 3 },
  ],
  services: [
    {
      id: "srv-corte",
      categoryId: "cat-cabelo",
      name: "Corte Masculino",
      description: "Corte clássico ou moderno, finalizado com produtos premium.",
      price: 50,
      durationMinutes: 40,
      image: null,
      active: true,
      order: 0,
    },
    {
      id: "srv-coloracao",
      categoryId: "cat-cabelo",
      name: "Coloração de Cabelo",
      description: "Coloração completa com produtos profissionais.",
      price: 80,
      durationMinutes: 60,
      image: null,
      active: true,
      order: 1,
    },
    {
      id: "srv-alisamento",
      categoryId: "cat-cabelo",
      name: "Alisamento de Cabelo",
      description: "Alisamento progressivo para um visual alinhado.",
      price: 120,
      durationMinutes: 90,
      image: null,
      active: true,
      order: 2,
    },
    {
      id: "srv-barba",
      categoryId: "cat-barba",
      name: "Barba",
      description: "Modelagem e acabamento de barba com toalha quente.",
      price: 35,
      durationMinutes: 25,
      image: null,
      active: true,
      order: 0,
    },
    {
      id: "srv-barba-navalha",
      categoryId: "cat-barba",
      name: "Barba com Navalha",
      description: "Acabamento na navalha para um contorno perfeito.",
      price: 45,
      durationMinutes: 30,
      image: null,
      active: true,
      order: 1,
    },
    {
      id: "srv-corte-barba",
      categoryId: "cat-combos",
      name: "Corte + Barba",
      description: "O combo completo: corte e barba com acabamento premium.",
      price: 75,
      durationMinutes: 60,
      image: null,
      active: true,
      order: 0,
    },
    {
      id: "srv-sobrancelha",
      categoryId: "cat-outros",
      name: "Sobrancelha",
      description: "Design de sobrancelha na navalha ou pinça.",
      price: 20,
      durationMinutes: 15,
      image: null,
      active: true,
      order: 0,
    },
    {
      id: "srv-pezinho",
      categoryId: "cat-outros",
      name: "Pézinho",
      description: "Acabamento de nuca e contorno entre cortes.",
      price: 15,
      durationMinutes: 15,
      image: null,
      active: true,
      order: 1,
    },
  ],
  hours: [
    { day: 0, closed: true, open: "09:00", close: "19:00" },
    { day: 1, closed: false, open: "09:00", close: "19:00" },
    { day: 2, closed: false, open: "09:00", close: "19:00" },
    { day: 3, closed: false, open: "09:00", close: "19:00" },
    { day: 4, closed: false, open: "09:00", close: "19:00" },
    { day: 5, closed: false, open: "09:00", close: "19:00" },
    { day: 6, closed: false, open: "09:00", close: "17:00" },
  ],
  bookings: [],
  admin: null,
};

function ensureDb(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2), "utf-8");
  }
}

function readDbRaw(): DB {
  ensureDb();
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw) as DB;
}

function writeDbRaw(db: DB): void {
  ensureDb();
  const tmpPath = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), "utf-8");
  fs.renameSync(tmpPath, DB_PATH);
}

// Serialize all writes/read-modify-write cycles through a single promise
// chain so concurrent booking requests can't race past the slot check.
let mutex: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => T | Promise<T>): Promise<T> {
  const result = mutex.then(() => fn());
  mutex = result.catch(() => undefined);
  return result;
}

export async function readDb(): Promise<DB> {
  return withLock(() => readDbRaw());
}

export async function updateDb<T>(
  mutator: (db: DB) => T | Promise<T>
): Promise<T> {
  return withLock(async () => {
    const db = readDbRaw();
    const result = await mutator(db);
    writeDbRaw(db);
    return result;
  });
}
