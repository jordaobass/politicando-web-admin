import * as React from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ModalProps {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  descricao?: string;
  children: React.ReactNode;
  className?: string;
}

/** Modal controlado simples (overlay + foco no conteúdo), sem dependências externas. */
export function Modal({ aberto, onFechar, titulo, descricao, children, className }: ModalProps) {
  React.useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberto, onFechar]);

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={onFechar}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          "max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border bg-card p-6 shadow-lg",
          className,
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">{titulo}</h2>
            {descricao && <p className="text-sm text-muted-foreground">{descricao}</p>}
          </div>
          <Button variant="ghost" size="icon" onClick={onFechar} aria-label="Fechar">
            <X />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
