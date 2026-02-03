"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Topbar from "../components/Topbar";
import { useAuth } from "../state/AuthProvider";
import { api } from "../lib/api";

export default function ProfilePage() {
  const { token, user, loading, refresh } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (user) setName(user.name || "");
  }, [loading, user, router]);

  async function save() {
    if (!token) return;
    setMsg("");
    setErr("");
    setBusy(true);
    try {
      const payload: any = {};
      if (name.trim() && name.trim() !== user?.name) payload.name = name.trim();
      if (password) payload.password = password;
      await api.updateMe(token, payload);
      setPassword("");
      await refresh();
      setMsg("Perfil atualizado.");
    } catch (ex: any) {
      setErr(ex?.message || "Erro ao atualizar");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="app">
        <div className="panel" style={{ padding: 14 }}>Carregando...</div>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="app">
      <Topbar />

      <div style={{ flex: 1, minHeight: 0, display: "flex", gap: 10 }}>
        <div className="panel" style={{ flex: 1, padding: 14 }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>Meu Perfil</div>
          <div className="hr" />

          <div className="grid2">
            <div className="field">
              <label>Usuário</label>
              <input className="input" value={user.username} disabled />
            </div>
            <div className="field">
              <label>Role</label>
              <input className="input" value={user.role} disabled />
            </div>

            <div className="field">
              <label>Nome</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field">
              <label>Nova senha (mín. 6)</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <div className="row" style={{ gridColumn: "1 / -1", justifyContent: "flex-end" }}>
              <button className="btn primary" onClick={save} disabled={busy}>
                {busy ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>

          {msg ? <div className="small" style={{ marginTop: 10, color: "var(--green)" }}>{msg}</div> : null}
          {err ? <div className="small" style={{ marginTop: 10, color: "var(--red)" }}>{err}</div> : null}
        </div>

        <div className="panel" style={{ width: 360, padding: 14 }}>
          <div style={{ fontWeight: 900 }}>Permissões</div>
          <div className="small" style={{ marginTop: 8, lineHeight: 1.5 }}>
            <b>Admin</b>: CRUD de usuários em <code>/admin/users</code>.
            <br />
            <b>User</b>: apenas o sistema em <code>/app</code> e seu próprio perfil.
          </div>
        </div>
      </div>
    </div>
  );
}
