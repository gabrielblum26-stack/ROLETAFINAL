import { NextRequest } from "next/server";
import { ensureDbInit, q } from "../../../../_lib/db";
import { requireAdmin, requireAuthDb } from "../../../../_lib/auth";
import { bad, ok } from "../../../../_lib/responses";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await ensureDbInit();
    const { payload } = await requireAuthDb(req);
    requireAdmin(payload);

    const id = Number(params.id);
    if (!id) return bad("id inválido", 400);

    const r = await q<{ role: string; trial_used: boolean; status: string }>(
      "SELECT role, trial_used, status FROM users WHERE id=$1",
      [id]
    );
    const u = r.rows[0];
    if (!u) return bad("Usuário não encontrado", 404);
    if (u.role !== "user") return bad("Apenas usuários comuns podem receber teste", 400);
    if (u.trial_used) return bad("Teste já foi usado", 400);

    const upd = await q(
      `UPDATE users
       SET access_until = now() + interval '2 days',
           access_type = 'trial',
           trial_used = TRUE,
           status = 'active',
           updated_at = now()
       WHERE id=$1
       RETURNING id, name, username, role, status, created_at, last_login_at, access_until, access_type, trial_used`,
      [id]
    );

    return ok({ user: upd.rows[0] });
  } catch (e: any) {
    const msg = e?.message || "Erro";
    const status = msg.includes("autenticado") ? 401 : msg.includes("admin") ? 403 : msg.includes("bloqueado") ? 403 : 500;
    return bad(msg, status);
  }
}
