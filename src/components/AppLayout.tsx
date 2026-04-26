import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Search, Bell, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { FloatingChatbot } from "@/components/FloatingChatbot";

const titles: Record<string, { title: string; sub?: string }> = {
  "/app": { title: "Dashboard", sub: "Visão executiva da operação" },
  "/app/inbox": { title: "Unified Inbox", sub: "Conversas omnichannel" },
  "/app/pipeline": { title: "Pipeline", sub: "Kanban de leads" },
  "/app/campaigns": { title: "Campanhas", sub: "Disparos em massa" },
  "/app/chatbot": { title: "Chatbot", sub: "Construtor de fluxos" },
  "/app/calling": { title: "Calling & IVR", sub: "Voz e roteamento" },
  "/app/analytics": { title: "Analytics", sub: "Métricas e desempenho" },
  "/app/contacts": { title: "Contatos", sub: "CRM da sua base" },
  "/app/templates": { title: "Templates", sub: "Mensagens aprovadas" },
  "/app/settings": { title: "Configurações", sub: "Workspace e integrações" },
};

export function AppLayout() {
  const { pathname } = useLocation();
  const meta = titles[pathname] ?? { title: "CFHER" };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background relative">
        {/* Aurora background */}
        <div className="pointer-events-none fixed inset-0 -z-10" style={{ background: "var(--gradient-aurora)" }} />
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-3 px-4 border-b border-border glass sticky top-0 z-30">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="h-5 w-px bg-border" />
            <div className="flex flex-col leading-tight min-w-0">
              <h1 className="text-sm font-semibold truncate">{meta.title}</h1>
              {meta.sub && <span className="text-[11px] text-muted-foreground truncate">{meta.sub}</span>}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-foreground h-8 px-3 border border-border bg-secondary/40 rounded-md hidden md:inline-flex"
              >
                <Search className="size-3.5" />
                <span className="text-xs">Buscar…</span>
                <kbd className="ml-4 text-[10px] text-mono px-1.5 py-0.5 rounded bg-background border border-border flex items-center gap-0.5">
                  <Command className="size-2.5" />K
                </kbd>
              </Button>
              <ThemeSwitcher />
              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground relative">
                <Bell className="size-4" />
                <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary animate-pulse-glow" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
        <FloatingChatbot />
      </div>
    </SidebarProvider>
  );
}
