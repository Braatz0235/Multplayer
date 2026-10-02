import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { updateDoc } from "./db";

export const SESSION_COOKIE = "cl_crm_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

let cachedSecret: string | null = null;

/**
 * Chave que assina as sessões. Usa JWT_SECRET quando definida; senão gera
 * uma chave aleatória na primeira execução e a guarda no próprio banco
 * (Postgres ou arquivo), para funcionar com segurança sem configuração extra.
 */
async function secret(): Promise<string> {
  if (cachedSecret) return cachedSecret;
  const env = process.env.JWT_SECRET;
  if (env && env.length >= 16) return (cachedSecret = env);
  cachedSecret = await updateDoc<{ value: string }, string>(
    "session-secret",
    () => ({ value: crypto.randomBytes(48).toString("hex") }),
    (doc) => doc.value,
  );
  return cachedSecret;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signSession(userId: string): Promise<string> {
  return jwt.sign({ uid: userId }, await secret(), { expiresIn: SESSION_TTL_SECONDS });
}

export async function verifySession(token: string): Promise<string | null> {
  const key = await secret();
  try {
    const decoded = jwt.verify(token, key);
    if (typeof decoded === "object" && decoded && typeof decoded.uid === "string") return decoded.uid;
    return null;
  } catch {
    return null;
  }
}
