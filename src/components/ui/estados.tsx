import { Loader2, AlertCircle, Inbox } from "lucide-react";

import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-4 animate-spin", className)} />;
}

export function Carregando({ texto = "Carregando…" }: { texto?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
      <Spinner /> {texto}
    </div>
  );
}

export function ErroEstado({ mensagem }: { mensagem: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-destructive">
      <AlertCircle className="size-4" /> {mensagem}
    </div>
  );
}

export function Vazio({ texto = "Nada por aqui." }: { texto?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
      <Inbox className="size-5" /> {texto}
    </div>
  );
}
