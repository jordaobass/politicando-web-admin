import * as React from "react";
import { Navigate, useLocation } from "react-router-dom";

import { login as apiLogin, ApiError, TOKEN_KEY } from "@/lib/api";
import type { UsuarioSessao } from "@/lib/types";

const USUARIO_KEY = "politicando:admin:usuario";

interface AuthContextValor {
  usuario: UsuarioSessao | null;
  autenticado: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => void;
}

const AuthContext = React.createContext<AuthContextValor | null>(null);

function lerUsuario(): UsuarioSessao | null {
  try {
    const bruto = localStorage.getItem(USUARIO_KEY);
    return bruto ? (JSON.parse(bruto) as UsuarioSessao) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = React.useState<UsuarioSessao | null>(lerUsuario);

  const entrar = React.useCallback(async (email: string, senha: string) => {
    const resp = await apiLogin({ email, senha });
    if (resp.usuario.papel !== "Admin") {
      throw new ApiError(403, "Acesso restrito a administradores.");
    }
    localStorage.setItem(TOKEN_KEY, resp.token);
    localStorage.setItem(USUARIO_KEY, JSON.stringify(resp.usuario));
    setUsuario(resp.usuario);
  }, []);

  const sair = React.useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
    setUsuario(null);
  }, []);

  // Desloga em outras abas quando o token some (ex.: logout em paralelo).
  React.useEffect(() => {
    const aoMudar = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY && !e.newValue) setUsuario(null);
    };
    window.addEventListener("storage", aoMudar);
    return () => window.removeEventListener("storage", aoMudar);
  }, []);

  const valor = React.useMemo<AuthContextValor>(
    () => ({ usuario, autenticado: !!usuario, entrar, sair }),
    [usuario, entrar, sair],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValor {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}

/** Protege rotas: redireciona para /login se não autenticado. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { autenticado } = useAuth();
  const local = useLocation();
  if (!autenticado) return <Navigate to="/login" state={{ de: local.pathname }} replace />;
  return <>{children}</>;
}
