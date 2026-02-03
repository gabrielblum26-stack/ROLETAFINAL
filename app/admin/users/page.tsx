"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Topbar from "../../components/Topbar";
import { useAuth } from "../../state/AuthProvider";
import { api } from "../../lib/api";
import type { User } from "../../lib/auth";

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="modalOverlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <div style={{ fontWeight: 900 }}>{title}</div>
          <button className="btn" onClick={onClose}>Fechar</button>
        </div>
        {children}
      </div>
    </div>
  );
}


function fmtDate(v?: any) {
  if (!v) return "-";
  const d = new Date(v);
  if (!Number.isFinite(d.getTime())) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

function fmtDateTime(v?: any) {
  if (!v) return "-";
  const d = new Date(v);
  if (!Number.isFinite(d.getTime())) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yy} ${hh}:${mi}`;
}

export default function AdminUsersPage() {
  const { token, user, loading } = useAuth();
  const router = useRouter();

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<User[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [resetUser, setResetUser] = useState<User | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user && user.role !== "admin") router.replace("/app");
  }, [loading, user, router]);

  async function load() {
    if (!token) return;
    setBusy(true);
    setErr("");
    try {
      const data = await api.adminListUsers(token, { q, page, limit });
      setItems(data.items);
      setTotal(data.total);
    } catch (ex: any) {
      setErr(ex?.message || "Erro");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { load(); }, [q, page, token]);

  const maxPage = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total]);

  if (loading) {
    return (
      <div className="app">
        <div className="panel" style={{ padding: 14 }}>Carregando...</div>
      </div>
    );
  }
  if (!user || user.role !== "admin") return null;

  return (
    <div className="app">
      <Topbar />

      <div className="tableWrap">
        <div className="panel" style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="row">
            <input
              className="input"
              style={{ width: 280 }}
              placeholder="Buscar por nome ou @user"
              value={q}
              onChange={(e) => { setPage(1); setQ(e.target.value); }}
            />
            <span className="pill">{total} usuários</span>
            {busy ? <span className="pill">Carregando...</span> : null}
          </div>

          <button className="btn primary" onClick={() => setShowCreate(true)}>+ Novo usuário</button>
        </div>

        <div className="panel tableCard">
          <table className="adminTable">
            <colgroup>
              <col className="id" />
              <col className="name" />
              <col className="user" />
              <col className="role" />
              <col className="status" />
              <col className="created" />
              <col className="access" />
              <col className="actions" />
            </colgroup>
            <thead>
              <tr>
                <th style={{ width: 60 }}>ID</th>
                <th style={{ width: 240 }}>Nome</th>
                <th style={{ width: 200 }}>Usuário</th>
                <th style={{ width: 120 }}>Role</th>
                <th style={{ width: 130 }}>Status</th>
                <th style={{ width: 140 }}>Cadastro</th>
                <th style={{ width: 170 }}>Acesso até</th>
                <th style={{ width: 360 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td title={u.name}>{u.name}</td>
                  <td title={u.username}>@{u.username}</td>
                  <td><span className="badge">{u.role}</span></td>
                  <td><span className={"badge" + (u.status === "blocked" ? " blocked" : "")}>{u.status}</span></td>
                  <td className="small">{fmtDate(u.created_at)}</td>
                  <td className="small">{u.access_until ? fmtDateTime(u.access_until) : "-"}</td>
                  <td className="actionsCell">
                    <div className="adminActions">
                      <button className="btn" onClick={() => setEditUser(u)}>Editar</button>
                      <button className="btn" onClick={() => setResetUser(u)}>Senha</button>
                      <button
                        className="btn"
                        onClick={async () => {
                          if (!token) return;
                          try {
                            await api.adminGrantTrial(token, u.id);
                            await load();
                          } catch (ex: any) {
                            setErr(ex?.message || "Erro");
                          }
                        }}
                      >
                        Teste 2d
                      </button>
                      <button
                        className="btn"
                        onClick={async () => {
                          if (!token) return;
                          try {
                            await api.adminGrantMonth(token, u.id);
                            await load();
                          } catch (ex: any) {
                            setErr(ex?.message || "Erro");
                          }
                        }}
                      >
                        +1 mês
                      </button>
                      
<button
  className="btn"
  onClick={async () => {
    if (!token) return;
    try {
      await api.adminGrantLifetime(token, u.id);
      await load();
    } catch (ex: any) {
      setErr(ex?.message || "Erro");
    }
  }}
>
  Vitalício
</button>

<button
                        className={"btn" + (u.status === "active" ? " danger" : "")}
                        onClick={async () => {
                          if (!token) return;
                          try {
                            await api.adminToggleBlock(token, u.id);
                            await load();
                          } catch (ex: any) {
                            setErr(ex?.message || "Erro");
                          }
                        }}
                      >
                        {u.status === "active" ? "Bloquear" : "Ativar"}
                      </button>
                    
<button
  className="btn danger"
  onClick={async () => {
    if (!token) return;
    const ok = confirm(`Excluir @${u.username}? Essa ação é irreversível.`);
    if (!ok) return;
    try {
      await api.adminDeleteUser(token, u.id);
      await load();
    } catch (ex: any) {
      setErr(ex?.message || "Erro");
    }
  }}
>
  Excluir
</button>

</div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && !busy ? (
                <tr>
                  <td colSpan={8} className="small" style={{ padding: 14 }}>
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>

          <div className="panel" style={{ border: "none", borderTop: "1px solid rgba(0,0,0,.18)", borderRadius: 0, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="small">
              Página <b>{page}</b> de <b>{maxPage}</b>
            </div>
            <div className="row">
              <button className="btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Anterior</button>
              <button className="btn" disabled={page >= maxPage} onClick={() => setPage((p) => Math.min(maxPage, p + 1))}>Próxima</button>
            </div>
          </div>

          {err ? <div className="small" style={{ padding: 12, color: "var(--red)" }}>{err}</div> : null}
        </div>
      </div>

      {showCreate ? (
        <CreateUserModal
          token={token!}
          onClose={() => setShowCreate(false)}
          onCreated={async () => { setShowCreate(false); await load(); }}
        />
      ) : null}

      {editUser ? (
        <EditUserModal
          token={token!}
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={async () => { setEditUser(null); await load(); }}
        />
      ) : null}

      {resetUser ? (
        <ResetPasswordModal token={token!} user={resetUser} onClose={() => setResetUser(null)} />
      ) : null}
    </div>
  );
}

function CreateUserModal({ token, onClose, onCreated }: { token: string; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setBusy(true);
    setErr("");
    try {
      await api.adminCreateUser(token, { name, username, password, role });
      onCreated();
    } catch (ex: any) {
      setErr(ex?.message || "Erro");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Criar usuário" onClose={onClose}>
      <div className="grid2">
        <div className="field">
          <label>Nome</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>Usuário (login)</label>
          <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className="field">
          <label>Senha (mín. 6)</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="field">
          <label>Role</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value as any)}>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
        </div>

        <div className="row" style={{ gridColumn: "1 / -1", justifyContent: "flex-end" }}>
          <button className="btn primary" onClick={submit} disabled={busy}>
            {busy ? "Criando..." : "Criar"}
          </button>
        </div>

        {err ? <div className="small" style={{ gridColumn: "1 / -1", color: "var(--red)" }}>{err}</div> : null}
      </div>
    </Modal>
  );
}

function EditUserModal({ token, user, onClose, onSaved }: { token: string; user: User; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [role, setRole] = useState<"admin" | "user">(user.role);
  const [status, setStatus] = useState<"active" | "blocked">(user.status);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setBusy(true);
    setErr("");
    try {
      await api.adminUpdateUser(token, user.id, { name, username, role, status } as any);
      onSaved();
    } catch (ex: any) {
      setErr(ex?.message || "Erro");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`Editar usuário #${user.id}`} onClose={onClose}>
      <div className="grid2">
        <div className="field">
          <label>Nome</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>Usuário (login)</label>
          <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className="field">
          <label>Role</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value as any)}>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
        </div>
        <div className="field">
          <label>Status</label>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value as any)}>
            <option value="active">active</option>
            <option value="blocked">blocked</option>
          </select>
        </div>

        <div className="row" style={{ gridColumn: "1 / -1", justifyContent: "flex-end" }}>
          <button className="btn primary" onClick={submit} disabled={busy}>
            {busy ? "Salvando..." : "Salvar"}
          </button>
        </div>

        {err ? <div className="small" style={{ gridColumn: "1 / -1", color: "var(--red)" }}>{err}</div> : null}
      </div>
    </Modal>
  );
}

function ResetPasswordModal({ token, user, onClose }: { token: string; user: User; onClose: () => void }) {
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function submit() {
    setBusy(true);
    setMsg("");
    setErr("");
    try {
      await api.adminResetPassword(token, user.id, pwd);
      setPwd("");
      setMsg("Senha resetada com sucesso.");
    } catch (ex: any) {
      setErr(ex?.message || "Erro");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`Resetar senha • @${user.username}`} onClose={onClose}>
      <div className="field">
        <label>Nova senha (mín. 6)</label>
        <input className="input" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} />
      </div>
      <div className="row" style={{ justifyContent: "flex-end", marginTop: 12 }}>
        <button className="btn primary" onClick={submit} disabled={busy}>
          {busy ? "Aplicando..." : "Aplicar"}
        </button>
      </div>
      {msg ? <div className="small" style={{ marginTop: 10, color: "var(--green)" }}>{msg}</div> : null}
      {err ? <div className="small" style={{ marginTop: 10, color: "var(--red)" }}>{err}</div> : null}
      <div className="hr" />
      <div className="small">Depois de resetar, você passa a nova senha pro usuário.</div>
    </Modal>
  );
}
