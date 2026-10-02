import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession, verifySession } from "./auth";
import { readDb } from "./db";
import type { PublicUser, Role, User } from "./types";

export function toPublic(user: User): PublicUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...rest } = user;
  return rest;
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const uid = await verifySession(token);
  if (!uid) return null;
  const db = await readDb();
  const user = db.users.find((u) => u.id === uid && u.active);
  return user ? toPublic(user) : null;
}

/** Para páginas: redireciona ao login se não houver sessão válida. */
export async function requireUser(roles?: Role[]): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) redirect("/");
  return user;
}

export class ActionError extends Error {}

/** Para server actions: lança erro (mostrado ao usuário) se não autorizado. */
export async function authorize(roles?: Role[]): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) throw new ActionError("Sua sessão expirou. Entre novamente.");
  if (roles && !roles.includes(user.role)) throw new ActionError("Você não tem permissão para esta ação.");
  return user;
}

export async function startSession(userId: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, await signSession(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function endSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export const isManager = (u: Pick<PublicUser, "role">) => u.role === "admin" || u.role === "gerente";
