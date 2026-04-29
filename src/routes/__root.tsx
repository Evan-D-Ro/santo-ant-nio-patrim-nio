import { useEffect } from "react";
import type { ReactNode } from "react";
import { Outlet, Link, createRootRoute, HeadContent, Scripts, useNavigate, useRouterState } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { StoreProvider, useStore } from "@/lib/store";
import { Toaster } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { Loader2, LogOut, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AccessControlProvider, useAccessControl } from "@/hooks/use-access-control";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-display font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Patrimônio • Paróquia Santo Antônio – Rancharia/SP" },
      {
        name: "description",
        content:
          "Sistema de gestão de patrimônio e equipamentos da Paróquia Santo Antônio de Rancharia/SP.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AccessControlProvider>
      <RootFrame />
    </AccessControlProvider>
  );
}

function RootFrame() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const { session, loading } = useAccessControl();
  const isAuthRoute = pathname === "/auth";
  const needsRedirect = !loading && ((!session && !isAuthRoute) || (session && isAuthRoute));

  useEffect(() => {
    if (loading) return;
    if (!session && !isAuthRoute) {
      void navigate({ to: "/auth", replace: true });
      return;
    }
    if (session && isAuthRoute) {
      void navigate({ to: "/", replace: true });
    }
  }, [loading, session, isAuthRoute, navigate]);

  if (loading || needsRedirect) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    return (
      <>
        <Outlet />
        <Toaster richColors position="top-right" />
      </>
    );
  }

  return (
    <StoreProvider>
      <InventoryShell />
    </StoreProvider>
  );
}

function InventoryShell() {
  const { loading } = useStore();
  const { canManageInventory } = useAccessControl();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-14 flex items-center gap-3 border-b bg-card px-4 sticky top-0 z-10">
              <SidebarTrigger />
              <div className="font-display font-semibold text-lg">Sistema de Patrimônio</div>
              <div className="ml-auto flex items-center gap-3">
                {!canManageInventory && (
                  <Badge variant="secondary" className="gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Consulta
                  </Badge>
                )}
                <div className="text-xs text-muted-foreground hidden sm:block">
                  Paróquia Santo Antônio • Rancharia / SP
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    await navigate({ to: "/auth", replace: true });
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </Button>
              </div>
            </header>
            <main className="flex-1 p-6">
              <Outlet />
            </main>
          </div>
        </div>
        <Toaster richColors position="top-right" />
      </SidebarProvider>
    </>
  );
}
