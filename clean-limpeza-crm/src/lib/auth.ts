import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const SESSION_COOKIE = "cl_crm_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

const JWT_SECRET = process.env.JWT_SECRET || "dev-only-insecure-secret-change-me";

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signSession(userId: string): string {
  return jwt.sign({ uid: userId }, JWT_SECRET, { expiresIn: SESSION_TTL_SECONDS });
}

export function verifySession(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === "object" && decoded && typeof decoded.uid === "string") return decoded.uid;
    return null;
  } catch {
    return null;
  }
}
