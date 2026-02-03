"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../state/AuthProvider";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const u = await login(username.trim(), password);
      router.replace(u.role === "admin" ? "/admin/users" : "/app");
    } catch (ex: any) {
      setErr(ex?.message || "Erro no login");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <div className="panel" style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 900 }}>Login (Admin & User)</div>
        <span className="pill">MESMA TELA</span>
      </div>

      <div className="panel" style={{ flex: 1, minHeight: 0, padding: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="panel" style={{ width: "min(560px, 100%)", padding: 14 }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>Acesso ao Sistema</div>
          
          <div className="hr" />

          <form onSubmit={onSubmit} className="grid2">
            <div className="field">
              <label>Usuário</label>
              <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="field">
              <label>Senha</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <div className="row" style={{ gridColumn: "1 / -1", justifyContent: "space-between" }}>
              <button type="button" className="btn" onClick={() => router.push("/register")}>CADASTRE-SE</button>
              <button className="btn primary" disabled={busy}>
                {busy ? "Entrando..." : "Entrar"}
              </button>
            </div>

            {err ? (
              <div className="small" style={{ gridColumn: "1 / -1", color: "var(--red)" }}>
                {err}
              </div>
            ) : null}
          </form>
        </div>
      </div>
    </div>
  );
}
