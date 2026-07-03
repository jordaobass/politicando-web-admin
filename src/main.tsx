import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import App from "@/App";
import { AuthProvider } from "@/lib/auth";
import { ApiError, TOKEN_KEY } from "@/lib/api";
import "@/index.css";

// Token expirado/ inválido em qualquer query -> limpa sessão e volta ao login.
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (erro) => {
      if (erro instanceof ApiError && erro.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        if (location.pathname !== "/login") location.assign("/login");
      }
    },
  }),
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
