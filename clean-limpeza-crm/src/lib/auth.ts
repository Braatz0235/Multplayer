import crypto from "crypto";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const SESSION_COOKIE = "cl_crm_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

let cachedSecret: string | null = null;

/**
 * Chave que assina as sessões. Usa JWT_SECRET quando definida; senão gera
 * uma chave aleatória na primeira execução e a guarda junto do banco, para
 * que o sistema já funcione com segurança sem configuração extra.
 */
function secret(): string {
  if (cachedSecret) return cachedSecret;
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 16) {
    cachedSecret = process.env.JWT_SECRET;
    return cachedSecret;
  }
  const dir = process.env.CRM_DATA_DIR || path.join(process.cwd(), "data");
  const file = path.join(dir, ".session-secret");
  try {
    cachedSecret = fs.readFileSync(file, "utf-8").trim();
  } catch {
    fs.mkdirSync(dir, { recursive: true });
    cachedSecret = crypto.randomBytes(48).toString("hex");
    fs.writeFileSync(file, cachedSecret, { mode: 0o600 });
  }
  return cachedSecret;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signSession(userId: string): string {
  return jwt.sign({ uid: userId }, secret(), { expiresIn: SESSION_TTL_SECONDS });
}

export function verifySession(token: string): string | null {
  try {
    const decoded = jwt.verify(token, secret());
    if (typeof decoded === "object" && decoded && typeof decoded.uid === "string") return decoded.uid;
    return null;
  } catch {
    return null;
  }
}
