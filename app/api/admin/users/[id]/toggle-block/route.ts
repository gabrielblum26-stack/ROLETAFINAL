import { NextRequest } from "next/server";
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

    const cur = await q<{ status: "active" | "blocked" }>("SELECT status FROM users WHERE id=$1", [id]);
    if (cur.rows.length === 0) return bad("Usuário não encontrado", 404);

    const next = cur.rows[0].status === "active" ? "blocked" : "active";
    const upd = await q(
      "UPDATE users SET status=$1, updated_at=now() WHERE id=$2 RETURNING id, name, username, role, status",
      [next, id]
    );
    return ok({ user: upd.rows[0] });
  } catch (e: any) {
    const msg = e?.message || "Erro";
    const status = msg.includes("autenticado") ? 401 : msg.includes("admin") ? 403 : 500;
    return bad(msg, status);
  }
}
