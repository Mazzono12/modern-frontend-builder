import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  MessagesSquare,
  Megaphone,
  Bot,
  PhoneCall,
  BarChart3,
  Users,
  FileText,
  Settings,
  KanbanSquare,
  Plug,
  Workflow,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import pegasusLogo from "@/assets/pegasus-logo.png";

const main = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard, end: true },
  { title: "Inbox", url: "/app/inbox", icon: MessagesSquare, badge: "12" },
  { title: "Pipeline", url: "/app/pipeline", icon: KanbanSquare },
  { title: "Campanhas", url: "/app/campaigns", icon: Megaphone },
  { title: "Chatbot", url: "/app/chatbot", icon: Bot },
  { title: "Calling & IVR", url: "/app/calling", icon: PhoneCall },
  { title: "Analytics", url: "/app/analytics", icon: BarChart3 },
];

const secondary = [
  { title: "Contatos", url: "/app/contacts", icon: Users },
  { title: "Templates", url: "/app/templates", icon: FileText },
  { title: "Integrações", url: "/app/integrations", icon: Plug },
  { title: "n8n · Agentes", url: "/app/n8n", icon: Workflow },
  { title: "Configurações", url: "/app/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  const linkBase =
    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all w-full hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
  const active =
    "bg-gradient-to-r from-primary/15 to-transparent text-foreground font-medium relative before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-primary before:rounded-r-full before:shadow-glow";

  const avatarUrl = typeof window !== "undefined" ? localStorage.getItem("wm-avatar") : null;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-2.5">
          <img src={pegasusLogo} alt="CIFHER" width={32} height={32} className="size-8 drop-shadow-[0_0_10px_hsl(var(--primary)/0.5)]" />
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-display font-semibold tracking-tight">CIFHER</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Workspace · Acme</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
              Operação
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {main.map((item) => {
                const isActive = item.end ? pathname === item.url : pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <RouterNavLink
                        to={item.url}
                        end={item.end}
                        className={`${linkBase} ${isActive ? active : "text-sidebar-foreground"}`}
                      >
                        <item.icon className="size-4 shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="flex-1">{item.title}</span>
                            {item.badge && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/15 text-primary font-medium text-mono">
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </RouterNavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-2">
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
              Recursos
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {secondary.map((item) => {
                const isActive = pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <RouterNavLink
                        to={item.url}
                        className={`${linkBase} ${isActive ? active : "text-sidebar-foreground"}`}
                      >
                        <item.icon className="size-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </RouterNavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2.5">
          <Avatar className="size-8 ring-1 ring-border">
            {avatarUrl && <AvatarImage src={avatarUrl} alt="Sara" />}
            <AvatarFallback className="bg-secondary text-xs">SR</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-xs font-medium truncate">Sara Ramos</span>
              <span className="text-[10px] text-muted-foreground truncate">sara@acme.com</span>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
