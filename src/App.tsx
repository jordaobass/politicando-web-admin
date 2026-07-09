import { Navigate, Route, Routes } from "react-router-dom";

import { RequireAuth } from "@/lib/auth";
import { PROMPTS_IA_HABILITADO, INTEGRACOES_HABILITADO } from "@/lib/features";
import { AdminShell } from "@/components/layout/shell";
import LoginPage from "@/pages/login";
import DefinirSenhaPage from "@/pages/definir-senha";
import DashboardPage from "@/pages/dashboard";
import CandidaturasPage from "@/pages/candidaturas";
import CandidaturaDetalhePage from "@/pages/candidatura-detalhe";
import PartidosPage from "@/pages/partidos";
import PartidoFormPage from "@/pages/partido-form";
import PerguntasPage from "@/pages/perguntas";
import PerguntaFormPage from "@/pages/pergunta-form";
import PromptsPage from "@/pages/prompts";
import PromptDetalhePage from "@/pages/prompt-detalhe";
import UsuariosPage from "@/pages/usuarios";
import IntegracoesPage from "@/pages/integracoes";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/definir-senha" element={<DefinirSenhaPage />} />
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
        <Route path="/partidos/novo" element={<PartidoFormPage />} />
        <Route path="/partidos/:id" element={<PartidoFormPage />} />
        <Route path="/perguntas" element={<PerguntasPage />} />
        <Route path="/perguntas/novo" element={<PerguntaFormPage />} />
        <Route path="/perguntas/:id" element={<PerguntaFormPage />} />
        {/* Rotas de Prompts da IA só existem com a feature habilitada (ver features.ts).
            Em produção, acessar /prompts direto cai no catch-all e volta pra home. */}
        {PROMPTS_IA_HABILITADO && (
          <>
            <Route path="/prompts" element={<PromptsPage />} />
            <Route path="/prompts/:chave" element={<PromptDetalhePage />} />
          </>
        )}
        <Route path="/usuarios" element={<UsuariosPage />} />
        {/* Integrações só existe com a feature habilitada (ver features.ts). Em produção,
            acessar /integracoes direto cai no catch-all e volta pra home. */}
        {INTEGRACOES_HABILITADO && (
          <Route path="/integracoes" element={<IntegracoesPage />} />
        )}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
