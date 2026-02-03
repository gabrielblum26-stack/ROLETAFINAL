import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { ensureDbInit, q } from "../../_lib/db";
import { bad, created } from "../../_lib/responses";

export async function POST(req: NextRequest) {
  try {
    await ensureDbInit();
    const body = await req.json().catch(() => ({}));
    const name = String(body?.name || "").trim();
    const username = String(body?.username || "").trim();
    const password = String(body?.password || "");

    if (!name || !username || !password) return bad("name, username, password obrigatórios", 400);
    if (password.length < 6) return bad("senha mínima 6 caracteres", 400);

    const hash = bcrypt.hashSync(password, 10);
    try {
      const ins = await q(
        `INSERT INTO users (name, username, password_hash, role, status, trial_used)
         VALUES ($1,$2,$3,'user','blocked',FALSE)
         RETURNING id, name, username, role, status, created_at`,
        [name, username, hash]
      );
      return created({ user: ins.rows[0] });
    } catch (err: any) {
      if (String(err?.code) === "23505") return bad("username já existe", 409);
      return bad("erro ao criar usuário", 500);
    }
  } catch (e: any) {
    return bad(e?.message || "Erro", 500);
  }
}
