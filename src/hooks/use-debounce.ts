import * as React from "react";

/** Retorna o valor após `ms` sem mudanças (evita disparar requisição a cada tecla). */
export function useDebounce<T>(valor: T, ms = 400): T {
  const [debounced, setDebounced] = React.useState(valor);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return debounced;
}
