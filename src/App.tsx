import { Navigate, Route, Routes } from "react-router-dom";

import { RequireAuth } from "@/lib/auth";
import { PROMPTS_IA_HABILITADO } from "@/lib/features";
import { AdminShell } from "@/components/layout/shell";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import CandidaturasPage from "@/pages/candidaturas";
import CandidaturaDetalhePage from "@/pages/candidatura-detalhe";
import PartidosPage from "@/pages/partidos";
import PerguntasPage from "@/pages/perguntas";
import PromptsPage from "@/pages/prompts";
import PromptDetalhePage from "@/pages/prompt-detalhe";
import UsuariosPage from "@/pages/usuarios";
import IntegracoesPage from "@/pages/integracoes";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AdminShell />
          </RequireAuth>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/candidaturas" element={<CandidaturasPage />} />
        <Route path="/candidaturas/:id" element={<CandidaturaDetalhePage />} />
        <Route path="/partidos" element={<PartidosPage />} />
        <Route path="/perguntas" element={<PerguntasPage />} />
        {/* Rotas de Prompts da IA só existem com a feature habilitada (ver features.ts).
            Em produção, acessar /prompts direto cai no catch-all e volta pra home. */}
        {PROMPTS_IA_HABILITADO && (
          <>
            <Route path="/prompts" element={<PromptsPage />} />
            <Route path="/prompts/:chave" element={<PromptDetalhePage />} />
          </>
        )}
        <Route path="/usuarios" element={<UsuariosPage />} />
        <Route path="/integracoes" element={<IntegracoesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
