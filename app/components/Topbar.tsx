"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../state/AuthProvider";
import { api } from "../lib/api";

export default function Topbar() {
  const { user, logout } = useAuth();
  const path = usePathname();
  const router = useRouter();

  return (
    <div className="topbar">
      <div className="brand">
        <div className="dot" />
        <div className="title">Roleta</div>
        {user ? <span className="pill">{user.role.toUpperCase()}</span> : null}
      </div>

      <div className="actions">
        <Link className={"btn" + (path === "/app" ? " active" : "")} href="/app">Sistema</Link>
        <Link className={"btn" + (path === "/profile" ? " active" : "")} href="/profile">Perfil</Link>
        {user?.role === "admin" ? (
          <Link className={"btn" + (path === "/admin/users" ? " active" : "")} href="/admin/users">Usuários</Link>
        ) : null}
        <button
          className="btn danger"
          onClick={() => {
            logout();
            router.replace("/login");
          }}
        >
          Sair
        </button>
      </div>
    </div>
  );
}
