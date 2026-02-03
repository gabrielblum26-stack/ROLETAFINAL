import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { ensureDbInit, q } from "../_lib/db";
import { requireAuthDb } from "../_lib/auth";
import { bad, ok } from "../_lib/responses";

export async function GET(req: NextRequest) {
  try {
    await ensureDbInit();
    const { user } = await requireAuthDb(req);

    return ok({ user });
  } catch (e: any) {
    const msg = e?.message || "Erro";
    const status = msg.includes("autenticado") ? 401 : msg.includes("bloqueado") ? 403 : 500;
    return bad(msg, status);
  }
}

export async function PUT(req: NextRequest) {
  try {
    await ensureDbInit();
    const { user: authUser } = await requireAuthDb(req);
    const body = await req.json().catch(() => ({}));
    const name = typeof body?.name === "string" ? body.name.trim() : null;
    const password = typeof body?.password === "string" ? body.password : null;

    const updates: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (name && name.length >= 2) {
      updates.push(`name=$${idx++}`);
      params.push(name);
    }
    if (password && password.length >= 6) {
      const hash = bcrypt.hashSync(password, 10);
      updates.push(`password_hash=$${idx++}`);
      params.push(hash);
    }
    if (updates.length === 0) return bad("Nada para atualizar", 400);

    params.push(authUser.id);
    await q(`UPDATE users SET ${updates.join(", ")}, updated_at=now() WHERE id=$${idx}`, params);

    const r = await q("SELECT id, name, username, role, status FROM users WHERE id=$1", [authUser.id]);
    return ok({ user: r.rows[0] });
  } catch (e: any) {
    const msg = e?.message || "Erro";
    const status = msg.includes("autenticado") ? 401 : msg.includes("bloqueado") ? 403 : 500;
    return bad(msg, status);
  }
}
