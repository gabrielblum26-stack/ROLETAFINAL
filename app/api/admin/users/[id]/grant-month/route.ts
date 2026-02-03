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

    const r = await q<{ role: string; access_until: string | null }>(
      "SELECT role, access_until FROM users WHERE id=$1",
      [id]
    );
    const u = r.rows[0];
    if (!u) return bad("Usuário não encontrado", 404);
    if (u.role !== "user") return bad("Apenas usuários comuns podem receber assinatura", 400);

    // estende a partir do maior entre agora e access_until atual
    const upd = await q(
      `UPDATE users
       SET access_until = (CASE
          WHEN access_until IS NULL THEN now()
          WHEN access_until < now() THEN now()
          ELSE access_until
        END) + interval '30 days',
        access_type = 'sub',
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
