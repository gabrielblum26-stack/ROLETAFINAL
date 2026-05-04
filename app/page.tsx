"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./state/AuthProvider";

export default function RootPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Se estiver logado, vai para o app
        router.replace("/app");
      } else {
        // Se não estiver logado, vai para o login
        router.replace("/login");
      }
    }
  }, [user, loading, router]);

  return (
    <div style={{ 
      background: "#121212", 
      height: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      color: "#ffd000", 
      fontWeight: "bold",
      fontFamily: "sans-serif"
    }}>
      CARREGANDO...
    </div>
  );
}
