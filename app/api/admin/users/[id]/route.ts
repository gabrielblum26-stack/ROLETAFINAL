import { NextRequest } from "next/server";
import { ensureDbInit, q } from "../../../_lib/db";
import { requireAdmin, requireAuthDb } from "../../../_lib/auth";
import { bad, ok } from "../../../_lib/responses";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await ensureDbInit();
    const { payload: auth } = await requireAuthDb(req);
    requireAdmin(auth);

    const id = Number(params.id);
    if (!id) return bad("id inválido", 400);

    const body = await req.json().catch(() => ({}));
    const name = typeof body?.name === "string" ? body.name.trim() : null;
    const username = typeof body?.username === "string" ? body.username.trim() : null;
    const role = typeof body?.role === "string" ? body.role : null;
    const status = typeof body?.status === "string" ? body.status : null;

    const updates: string[] = [];
    const paramsArr: any[] = [];
    let idx = 1;

    if (name && name.length >= 2) { updates.push(`name=$${idx++}`); paramsArr.push(name); }
    if (username && username.length >= 3) { updates.push(`username=$${idx++}`); paramsArr.push(username); }
    if (role) {
      if (!["admin","user"].includes(role)) return bad("role inválido", 400);
      updates.push(`role=$${idx++}`); paramsArr.push(role);
    }
    if (status) {
      if (!["active","blocked"].includes(status)) return bad("status inválido", 400);
      updates.push(`status=$${idx++}`); paramsArr.push(status);
    }
    if (updates.length === 0) return bad("Nada para atualizar", 400);

    paramsArr.push(id);
    try {
      const upd = await q(
        `UPDATE users SET ${updates.join(", ")}, updated_at=now()
         WHERE id=$${idx}
         RETURNING id, name, username, role, status, created_at, last_login_at, access_until, access_type, trial_used`,
        paramsArr
      );
      if (upd.rows.length === 0) return bad("Usuário não encontrado", 404);
      return ok({ user: upd.rows[0] });
    } catch (err: any) {
      if (String(err?.code)==="23505") return bad("username já existe", 409);
      return bad("erro ao atualizar usuário", 500);
    }
  } catch (e: any) {
    const msg = e?.message || "Erro";
    const status = msg.includes("autenticado") ? 401 : msg.includes("admin") ? 403 : 500;
    return bad(msg, status);
  }
}


export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await ensureDbInit();
    const { payload } = await requireAuthDb(req);
    requireAdmin(payload);

    const id = Number(params.id);
    if (!id) return bad("id inválido", 400);

    // não permitir excluir a si mesmo
    if (payload.userId === id) return bad("Você não pode excluir seu próprio usuário", 400);

    const cur = await q<{ role: string }>("SELECT role FROM users WHERE id=$1", [id]);
    if (!cur.rows[0]) return bad("Usuário não encontrado", 404);

    // não permitir apagar o último admin
    if (cur.rows[0].role === "admin") {
      const admins = await q<{ c: number }>("SELECT COUNT(*)::int AS c FROM users WHERE role='admin'", []);
      if ((admins.rows[0]?.c ?? 0) <= 1) return bad("Não é possível excluir o último admin", 400);
    }

    await q("DELETE FROM users WHERE id=$1", [id]);
    return ok({ ok: true });
  } catch (e: any) {
    const msg = e?.message || "Erro";
    const status =
      msg.includes("Não autenticado") ? 401 :
      msg.includes("admin") ? 403 :
      msg.includes("bloqueado") ? 403 :
      500;
    return bad(msg, status);
  }
}
