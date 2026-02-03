"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await api.register(name.trim(), username.trim(), password);
      setDone(true);
    } catch (ex: any) {
      setErr(ex?.message || "Erro");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app authPage">
      <div className="center">
        <div className="panel" style={{ width: 520, maxWidth: "100%", padding: 16 }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>Cadastro</div>
          <div className="small" style={{ marginTop: 8 }}>
            Crie seu usuário. O teste grátis é liberado <b>somente</b> pelo admin.
          </div>
          <div className="hr" />

          {done ? (
            <>
              <div className="panel" style={{ padding: 14 }}>
                <div style={{ fontWeight: 900 }}>Cadastro recebido ✅</div>
                <div className="small" style={{ marginTop: 8, lineHeight: 1.5 }}>
                  O ADMINISTRAADOR RECEBEU SEU CADASTRO, E TE AVISARA AO LIBERAR O TESTE
                </div>
              </div>
              <div className="row" style={{ justifyContent: "flex-end", marginTop: 12 }}>
                <button className="btn primary" onClick={() => router.push("/login")}>Ir para login</button>
              </div>
            </>
          ) : (
            <form onSubmit={submit} className="grid2">
              <div className="field">
                <label>Nome</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="field">
                <label>Usuário (login)</label>
                <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Senha (mín. 6)</label>
                <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>

              <div className="row" style={{ gridColumn: "1 / -1", justifyContent: "space-between" }}>
                <button type="button" className="btn" onClick={() => router.push("/login")}>Já tenho login</button>
                <button className="btn primary" disabled={busy}>
                  {busy ? "Enviando..." : "Cadastrar"}
                </button>
              </div>

              {err ? <div className="small" style={{ gridColumn: "1 / -1", color: "var(--red)" }}>{err}</div> : null}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
