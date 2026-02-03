import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { ensureDbInit, q } from "../../_lib/db";
import { requireAdmin, requireAuthDb } from "../../_lib/auth";
import { bad, created, ok } from "../../_lib/responses";

export async function GET(req: NextRequest) {
  try {
    await ensureDbInit();
    const { payload: auth } = await requireAuthDb(req);
    requireAdmin(auth);

    const { searchParams } = new URL(req.url);
    const qStr = (searchParams.get("q") || "").trim();
    const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
    const limit = Math.min(50, Math.max(5, Number(searchParams.get("limit") || "10") || 10));
    const offset = (page - 1) * limit;
    const like = `%${qStr}%`;

    const totalRes = await q<{ c: number }>(
      "SELECT COUNT(*)::int AS c FROM users WHERE name ILIKE $1 OR username ILIKE $1",
      [like]
    );
    const total = totalRes.rows[0]?.c ?? 0;

    const itemsRes = await q(
      `SELECT id, name, username, role, status, created_at, last_login_at, access_until, access_type, trial_used
       FROM users
       WHERE name ILIKE $1 OR username ILIKE $1
       ORDER BY id DESC
       LIMIT $2 OFFSET $3`,
      [like, limit, offset]
    );

    return ok({ items: itemsRes.rows, total, page, limit });
  } catch (e: any) {
    const msg = e?.message || "Erro";
    const status = msg.includes("autenticado") ? 401 : msg.includes("admin") ? 403 : msg.includes("bloqueado") ? 403 : 500;
    return bad(msg, status);
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDbInit();
    const { payload: auth } = await requireAuthDb(req);
    requireAdmin(auth);

    const body = await req.json().catch(() => ({}));
    const name = String(body?.name || "").trim();
    const username = String(body?.username || "").trim();
    const password = String(body?.password || "");
    const role = body?.role === "admin" ? "admin" : "user";

    if (!name || !username || !password) return bad("name, username, password obrigatórios", 400);
    if (password.length < 6) return bad("senha mínima 6 caracteres", 400);

    const hash = bcrypt.hashSync(password, 10);
    try {
      const ins = await q(
        `INSERT INTO users (name, username, password_hash, role, status)
         VALUES ($1,$2,$3,$4, CASE WHEN $4='admin' THEN 'active' ELSE 'blocked' END)
         RETURNING id, name, username, role, status`,
        [name, username, hash, role]
      );
      return created({ user: ins.rows[0] });
    } catch (err: any) {
      if (String(err?.message || "").toLowerCase().includes("duplicate") || String(err?.code)==="23505") {
        return bad("username já existe", 409);
      }
      return bad("erro ao criar usuário", 500);
    }
  } catch (e: any) {
    const msg = e?.message || "Erro";
    const status = msg.includes("autenticado") ? 401 : msg.includes("admin") ? 403 : 500;
    return bad(msg, status);
  }
}
