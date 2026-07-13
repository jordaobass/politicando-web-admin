import * as React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { login as apiLogin, ApiError, TOKEN_KEY } from "@/lib/api";
import { itemDaRota } from "@/lib/navegacao";
import type { UsuarioSessao } from "@/lib/types";

const USUARIO_KEY = "politicando:admin:usuario";

interface AuthContextValor {
  usuario: UsuarioSessao | null;
  autenticado: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => void;
  /** Aplica uma sessão já autenticada (ex.: aceite de convite — item 7.5). */
  definirSessao: (token: string, usuario: UsuarioSessao) => void;
  /** true se o usuário tem a permissão (SuperAdmin recebe todas as chaves do backend). */
  temPermissao: (chave: string) => boolean;
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
    if (resp.usuario.papel !== "Admin" && resp.usuario.papel !== "SuperAdmin") {
      throw new ApiError(403, "Acesso restrito a administradores.");
    }
    localStorage.setItem(TOKEN_KEY, resp.token);
    localStorage.setItem(USUARIO_KEY, JSON.stringify(resp.usuario));
    setUsuario(resp.usuario);
  }, []);

  const definirSessao = React.useCallback((token: string, u: UsuarioSessao) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USUARIO_KEY, JSON.stringify(u));
    setUsuario(u);
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

  const temPermissao = React.useCallback(
    // SuperAdmin sempre passa (mesmo em sessão antiga sem o array de permissões).
    (chave: string) => usuario?.papel === "SuperAdmin" || (usuario?.permissoes?.includes(chave) ?? false),
    [usuario],
  );

  const valor = React.useMemo<AuthContextValor>(
    () => ({ usuario, autenticado: !!usuario, entrar, sair, definirSessao, temPermissao }),
    [usuario, entrar, sair, definirSessao, temPermissao],
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

/**
 * Gating por rota (item 7.7): bloqueia a rota atual se o usuário não tem a permissão do
 * item de navegação correspondente. O backend já é a autoridade (403); isto evita a tela
 * quebrada de quem acessa a URL direto e dá um estado limpo de "sem acesso".
 */
export function GatePorRota() {
  const { temPermissao } = useAuth();
  const { pathname } = useLocation();
  const item = itemDaRota(pathname);
  if (item?.perm && !temPermissao(item.perm)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 text-center">
        <p className="text-lg font-semibold">Sem acesso a esta área</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Você não tem permissão para acessar esta seção. Fale com um administrador se precisar de acesso.
        </p>
      </div>
    );
  }
  return <Outlet />;
}
