"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../state/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { login, user, loading: authLoading } = useAuth();

  // Se já estiver logado, redireciona para o app
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === "admin") router.replace("/admin/users");
      else router.replace("/app");
    }
  }, [user, authLoading, router]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const user = await login(username.trim(), password);
      if (user.role === "admin") router.push("/admin/users");
      else router.push("/app");
    } catch (ex: any) {
      setErr(ex?.message || "Erro no login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="loginContainer">
      <div className="loginContent">
        <div className="loginHeader">
          <h1 className="loginTitle">ROLETA PADRÃO FIFA 2026</h1>
        </div>

        <div className="loginPanel">
          <form onSubmit={onSubmit} className="loginForm">
            <div className="formGroup">
              <label htmlFor="username" className="formLabel">Usuário</label>
              <input
                id="username"
                className="formInput"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite seu usuário"
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div className="formGroup">
              <label htmlFor="password" className="formLabel">Senha</label>
              <input
                id="password"
                className="formInput"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            {err && (
              <div className="errorMessage">
                {err}
              </div>
            )}

            <div className="formActions">
              <button 
                type="button" 
                className="btn btnSecondary" 
                onClick={() => router.push("/register")}
                disabled={loading}
              >
                CADASTRE-SE
              </button>

              <button 
                type="submit" 
                className="btn btnPrimary" 
                disabled={loading}
              >
                {loading ? "Entrando..." : "ENTRAR"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
