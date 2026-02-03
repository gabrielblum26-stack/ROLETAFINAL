import { NextRequest } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { ensureDbInit, q } from "../../_lib/db";
import { signToken } from "../../_lib/auth";
import { bad, ok } from "../../_lib/responses";

export async function POST(req: NextRequest) {
  try {
    await ensureDbInit();
    const body = await req.json().catch(() => ({}));
    const username = String(body?.username || "").trim();
    const password = String(body?.password || "");

    if (!username || !password) return bad("username e password são obrigatórios", 400);

    const userRes = await q(
      "SELECT id, name, username, password_hash, role, status, access_until FROM users WHERE username=$1",
      [username]
    );
    const user = userRes.rows[0] as any;
    if (!user) return bad("Credenciais inválidas", 401);
    if (user.status === "blocked") return bad("Usuário bloqueado", 403);

    if (user.role === "user" && user.access_until) {
      const until = new Date(user.access_until);
      if (Number.isFinite(until.getTime()) && new Date() > until) {
        await q("UPDATE users SET status='blocked', updated_at=now() WHERE id=$1", [user.id]);
        return bad("Acesso expirado", 403);
      }
    }

    const okPwd = bcrypt.compareSync(password, user.password_hash);
    if (!okPwd) return bad("Credenciais inválidas", 401);

    await q("UPDATE users SET last_login_at=now(), updated_at=now() WHERE id=$1", [user.id]);

    
const sessionId = crypto.randomBytes(16).toString("hex");
await q("UPDATE users SET current_session_id=$1, current_session_issued_at=now(), last_login_at=now(), updated_at=now() WHERE id=$2", [sessionId, user.id]);

const token = signToken({ userId: user.id, role: user.role, status: user.status, sessionId });
    return ok({ token, user: { id: user.id, name: user.name, username: user.username, role: user.role, status: user.status } });
  } catch (e: any) {
    return bad(e?.message || "Erro no login", 500);
  }
}
