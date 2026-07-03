import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/estados";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(1, "Informe a senha"),
});

type FormLogin = z.infer<typeof schema>;

export default function LoginPage() {
  const { entrar, autenticado } = useAuth();
  const navegar = useNavigate();
  const [enviando, setEnviando] = React.useState(false);

  const { register, handleSubmit, formState } = useForm<FormLogin>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", senha: "" },
  });

  React.useEffect(() => {
    if (autenticado) navegar("/", { replace: true });
  }, [autenticado, navegar]);

  async function aoEnviar(dados: FormLogin) {
    setEnviando(true);
    try {
      await entrar(dados.email, dados.senha);
      navegar("/", { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível entrar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-1 text-3xl">🗳️</div>
          <CardTitle className="text-xl">Politicando · Admin</CardTitle>
          <CardDescription>Acesso restrito a administradores</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(aoEnviar)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                aria-invalid={!!formState.errors.email}
                {...register("email")}
              />
              {formState.errors.email && (
                <p className="text-xs text-destructive">{formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!formState.errors.senha}
                {...register("senha")}
              />
              {formState.errors.senha && (
                <p className="text-xs text-destructive">{formState.errors.senha.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={enviando}>
              {enviando && <Spinner />} Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
