"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredAuth } from "./lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const auth = getStoredAuth();
    if (!auth?.token || !auth?.user) {
      router.replace("/login");
      return;
    }
    if (auth.user.role === "admin") router.replace("/admin/users");
    else router.replace("/app");
  }, [router]);

  return (
    <div className="app">
      <div className="panel" style={{ padding: 14 }}>
        Carregando...
      </div>
    </div>
  );
}
