"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import type { StoredAuth, User } from "../lib/auth";
import { getStoredAuth, setStoredAuth } from "../lib/auth";

type AuthCtx = {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const stored = getStoredAuth();
    if (!stored?.token) {
      setToken(null);
      setUser(null);
      setLoading(false);
      return;
    }
    setToken(stored.token);
    setUser(stored.user);
    try {
      const me = await api.me(stored.token);
      setUser(me.user);
      setStoredAuth({ token: stored.token, user: me.user });
    } catch {
      setStoredAuth(null);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const value = useMemo<AuthCtx>(() => ({
    token,
    user,
    loading,
    login: async (username: string, password: string) => {
      const data = await api.login(username, password);
      const auth: StoredAuth = { token: data.token, user: data.user };
      setStoredAuth(auth);
      setToken(auth.token);
      setUser(auth.user);
      return auth.user;
    },
    logout: () => {
      setStoredAuth(null);
      setToken(null);
      setUser(null);
    },
    refresh,
  }), [token, user, loading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider />");
  return ctx;
}
