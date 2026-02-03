import * as jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { ensureDbInit, q } from "./db";

export type AuthPayload = { userId: number; role: "admin" | "user"; status: "active" | "blocked"; sessionId: string };

export function signToken(payload: AuthPayload) {
  const secret = process.env.JWT_SECRET || "dev-secret";
  return jwt.sign(payload, secret, { expiresIn: "12h" });
}

export function verifyToken(token: string): AuthPayload {
  const secret = process.env.JWT_SECRET || "dev-secret";
  return jwt.verify(token, secret) as AuthPayload;
}

export function getBearer(req: NextRequest) {
  const hdr = req.headers.get("authorization") || "";
  if (!hdr.startsWith("Bearer ")) return null;
  return hdr.slice(7);
}

export function requireAuth(req: NextRequest): AuthPayload {
  const token = getBearer(req);
  if (!token) throw new Error("Não autenticado");
  const payload = verifyToken(token);
      if (!(payload as any).sessionId) throw new Error("Token sem sessão: faça login novamente");
  if (payload.status === "blocked") throw new Error("Usuário bloqueado");
  return payload;
}

export function requireAdmin(payload: AuthPayload) {
  if (payload.role !== "admin") throw new Error("Acesso negado (admin)");
}



export type AccessType = "trial" | "sub" | null;
export type DbUser = {
  id: number;
  name: string;
  username: string;
  role: "admin" | "user";
  status: "active" | "blocked";
  created_at?: string;
  last_login_at?: string | null;
  access_until?: string | null;
  access_type?: AccessType;
  trial_used?: boolean;
  current_session_id?: string | null;
  current_session_issued_at?: string | null;
};

async function loadUser(userId: number): Promise<DbUser | null> {
  await ensureDbInit();
  const r = await q<DbUser>(
    "SELECT id, name, username, role, status, created_at, last_login_at, access_until, access_type, trial_used, current_session_id, current_session_issued_at FROM users WHERE id=$1",
    [userId]
  );
  return (r.rows[0] as any) || null;
}

async function enforceAccess(user: DbUser): Promise<DbUser> {
  if (user.role === "admin") return user;
  if (user.status === "blocked") throw new Error("Usuário bloqueado");

  if (user.access_until) {
    const until = new Date(user.access_until as any);
    if (Number.isFinite(until.getTime()) && new Date() > until) {
      // expirada: bloqueia no banco
      await q("UPDATE users SET status='blocked', updated_at=now() WHERE id=$1", [user.id]);
      throw new Error("Acesso expirado");
    }
  }
  return user;
}

export async function requireAuthDb(req: NextRequest): Promise<{ payload: AuthPayload; user: DbUser }> {
  const token = getBearer(req);
  if (!token) throw new Error("Não autenticado");
  const payload = verifyToken(token);
      if (!(payload as any).sessionId) throw new Error("Token sem sessão: faça login novamente");
  const user = await loadUser(payload.userId);
  if (!user) throw new Error("Usuário não encontrado");
  await enforceAccess(user);

// valida sessão única
if (user.current_session_id && payload.sessionId !== user.current_session_id) {
  throw new Error("Sessão inválida: sua conta foi acessada em outro dispositivo");
}
  // Se o banco marcou como blocked, também atualiza a leitura (mas token pode ficar desatualizado)
  return { payload, user };
}
