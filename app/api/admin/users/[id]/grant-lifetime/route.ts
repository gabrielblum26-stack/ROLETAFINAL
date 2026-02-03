import { NextRequest } from "next/server";
import { ensureDbInit, q } from "../../../../_lib/db";
import { requireAuthDb, requireAdmin } from "../../../../_lib/auth";
import { bad, ok } from "../../../../_lib/responses";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await ensureDbInit();
    const { payload } = await requireAuthDb(req);
    requireAdmin(payload);

    const id = Number(params.id);
    if (!id) return bad("id inválido", 400);

    // Vitalício: usar uma data bem no futuro
    await q(
      "UPDATE users SET access_until = now() + interval '100 years', access_type='sub', status='active', updated_at=now() WHERE id=$1",
      [id]
    );

    const { rows } = await q<any>(
      "SELECT id, name, username, role, status, created_at, access_until, access_type, trial_used FROM users WHERE id=$1",
      [id]
    );

    return ok({ user: rows[0] });
  } catch (e: any) {
    const msg = e?.message || "Erro";
    const status =
      msg.includes("Não autenticado") ? 401 :
      msg.includes("admin") ? 403 :
      500;
    return bad(msg, status);
  }
}
