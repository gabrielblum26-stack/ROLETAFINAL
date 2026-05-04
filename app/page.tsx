"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./state/AuthProvider";

export default function RootPage() {
  const router = useRouter();
  const { token, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!token) {
      // Não autenticado: redireciona para login
      router.push("/login");
    } else {
      // Autenticado: redireciona para o app
      router.push("/app");
    }
  }, [token, loading, router]);

  // Mostrar loading enquanto verifica autenticação
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      background: "#121212",
      color: "#f3f3f3",
      fontSize: "18px",
      fontWeight: 900
    }}>
      Carregando...
    </div>
  );
}
