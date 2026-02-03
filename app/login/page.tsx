"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";
import { useAuth } from "../state/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { setToken } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await api.login(username.trim(), password);
      setToken(res.token);
      if (res.user.role === "admin") router.push("/admin/users");
      else router.push("/app");
    } catch (ex: any) {
      setErr(ex?.message || "Erro no login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app authPage">
      <div className="center">
        <div className="authSplit">
          <div className="authLeft">
            <div className="panel" style={{ width: "min(560px, 100%)", padding: 14 }}>
              <div style={{ fontWeight: 900, fontSize: 18 }}>Acesso ao Sistema</div>
              <div className="line" />
              <form onSubmit={onSubmit}>
                <div className="grid2">
                  <div>
                    <label>Usuário</label>
                    <input
                      className="input"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                    />
                  </div>
                  <div>
                    <label>Senha</label>
                    <input
                      className="input"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <div className="row" style={{ marginTop: 10, justifyContent: "space-between" }}>
                  <button type="button" className="btn" onClick={() => router.push("/register")}>
                    CADASTRE-SE
                  </button>

                  <button type="submit" className="btn primary" disabled={loading}>
                    {loading ? "Entrando..." : "Entrar"}
                  </button>
                </div>

                {err ? (
                  <div className="small" style={{ marginTop: 10, color: "#b00020", fontWeight: 800 }}>
                    {err}
                  </div>
                ) : null}
              </form>
            </div>
          </div>

          <div className="authRight">
            <img src="/padrao-fifa-logo.png" alt="Padrão FIFA" className="authLogo" />
          </div>
        </div>
      </div>
    </div>
  );
}
