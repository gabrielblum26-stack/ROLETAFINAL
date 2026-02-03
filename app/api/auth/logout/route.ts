import { NextRequest } from "next/server";
import { ensureDbInit, q } from "../../_lib/db";
import { requireAuthDb } from "../../_lib/auth";
import { bad, ok } from "../../_lib/responses";

export async function POST(req: NextRequest) {
  try {
    await ensureDbInit();
    const { user } = await requireAuthDb(req);

    // limpa sessão atual
    await q("UPDATE users SET current_session_id=NULL, current_session_issued_at=NULL, updated_at=now() WHERE id=$1", [user.id]);

    return ok({ ok: true });
  } catch (e: any) {
    return bad(e?.message || "Erro", 401);
  }
}
