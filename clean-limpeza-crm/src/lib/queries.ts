import "server-only";
import { readDb } from "./db";
import { toPublic } from "./session";
import type { DB, PublicUser, Visit } from "./types";

/** Visitas que o usuário pode ver: funcionário só vê as próprias. */
export function visibleVisits(db: DB, user: PublicUser): Visit[] {
  if (user.role === "funcionario") return db.visits.filter((v) => v.assignedTo === user.id);
  return db.visits;
}

export function canAccessVisit(user: PublicUser, visit: Visit): boolean {
  return user.role !== "funcionario" || visit.assignedTo === user.id;
}

export async function loadScoped(user: PublicUser) {
  const db = await readDb();
  return {
    db,
    visits: visibleVisits(db, user),
    users: db.users.map(toPublic),
    fieldUsers: db.users.filter((u) => u.role === "funcionario" && u.active).map(toPublic),
  };
}

export function byScheduled(a: Visit, b: Visit) {
  return a.scheduledAt.localeCompare(b.scheduledAt);
}
