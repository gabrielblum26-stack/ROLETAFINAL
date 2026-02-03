export type Role = "admin" | "user";
export type Status = "active" | "blocked";

export type AccessType = "trial" | "sub" | null;

export type User = {
  id: number;
  name: string;
  username: string;
  role: Role;
  status: Status;
  created_at?: string;
  last_login_at?: string | null;
  access_until?: string | null;
  access_type?: AccessType;
  trial_used?: boolean;
};

export type StoredAuth = {
  token: string;
  user: User;
};

const KEY = "roleta_auth_v1";

export function getStoredAuth(): StoredAuth | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export function setStoredAuth(auth: StoredAuth | null) {
  if (typeof window === "undefined") return;
  if (!auth) localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, JSON.stringify(auth));
}
