import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { ensureDbInit, q } from "../../../../_lib/db";
import { requireAdmin, requireAuthDb } from "../../../../_lib/auth";
import { bad, ok } from "../../../../_lib/responses";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await ensureDbInit();
    const { payload: auth } = await requireAuthDb(req);
    requireAdmin(auth);

    const id = Number(params.id);
    if (!id) return bad("id inválido", 400);

    const body = await req.json().catch(() => ({}));
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
    if (newPassword.length < 6) return bad("newPassword (min 6) obrigatório", 400);

    const hash = bcrypt.hashSync(newPassword, 10);
    const r = await q("UPDATE users SET password_hash=$1, updated_at=now() WHERE id=$2 RETURNING id", [hash, id]);
    if (r.rows.length === 0) return bad("Usuário não encontrado", 404);

    return ok({ ok: true });
  } catch (e: any) {
    const msg = e?.message || "Erro";
    const status = msg.includes("autenticado") ? 401 : msg.includes("admin") ? 403 : 500;
    return bad(msg, status);
  }
}
