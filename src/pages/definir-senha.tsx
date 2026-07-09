import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { validarConvite, aceitarConvite } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Carregando, ErroEstado } from "@/components/ui/estados";

const schema = z
  .object({
    senha: z
      .string()
      .min(8, "Mínimo de 8 caracteres")
      .regex(/[A-Z]/, "Precisa de uma letra maiúscula")
      .regex(/[0-9]/, "Precisa de um número"),
    confirmar: z.string(),
  })
  .refine((d) => d.senha === d.confirmar, { path: ["confirmar"], message: "As senhas não conferem" });

type FormSenha = z.infer<typeof schema>;

export default function DefinirSenhaPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const { definirSessao } = useAuth();
  const navegar = useNavigate();

  const [carregando, setCarregando] = React.useState(true);
  const [convite, setConvite] = React.useState<{ nome: string; email: string; papel: string } | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);
  const [enviando, setEnviando] = React.useState(false);

  const { register, handleSubmit, formState } = useForm<FormSenha>({
    resolver: zodResolver(schema),
    defaultValues: { senha: "", confirmar: "" },
  });

  React.useEffect(() => {
    if (!token) { setErro("Link de convite inválido."); setCarregando(false); return; }
    validarConvite(token)
      .then(setConvite)
      .catch((e) => setErro(e instanceof Error ? e.message : "Convite inválido ou expirado."))
      .finally(() => setCarregando(false));
  }, [token]);

  async function aoEnviar(dados: FormSenha) {
    setEnviando(true);
    try {
      const resp = await aceitarConvite({ token, senha: dados.senha });
      definirSessao(resp.token, resp.usuario);
      toast.success("Conta ativada! Bem-vindo(a).");
      navegar("/", { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível ativar a conta.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-1 text-3xl">🗳️</div>
          <CardTitle className="text-xl">Definir senha</CardTitle>
          <CardDescription>
            {convite ? `Convite para ${convite.email} (${convite.papel})` : "Ative seu acesso ao painel"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {carregando && <Carregando />}
          {!carregando && erro && <ErroEstado mensagem={erro} />}
          {!carregando && convite && (
            <form onSubmit={handleSubmit(aoEnviar)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="senha">Nova senha</Label>
                <Input id="senha" type="password" autoComplete="new-password" {...register("senha")} />
                {formState.errors.senha && (
                  <p className="text-xs text-destructive">{formState.errors.senha.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmar">Confirmar senha</Label>
                <Input id="confirmar" type="password" autoComplete="new-password" {...register("confirmar")} />
                {formState.errors.confirmar && (
                  <p className="text-xs text-destructive">{formState.errors.confirmar.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={enviando}>
                {enviando ? "Ativando…" : "Definir senha e entrar"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
