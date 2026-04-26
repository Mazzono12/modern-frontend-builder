import { TrendingUp, TrendingDown, MessageSquare, Users, Send, Clock, ArrowUpRight } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const volumeData = Array.from({ length: 14 }, (_, i) => ({
  day: `${i + 1}`,
  enviadas: 1200 + Math.round(Math.sin(i / 2) * 400 + Math.random() * 300),
  recebidas: 800 + Math.round(Math.cos(i / 2) * 250 + Math.random() * 200),
}));

const channelData = [
  { name: "Suporte", value: 4200 },
  { name: "Vendas", value: 3100 },
  { name: "Onboarding", value: 1900 },
  { name: "Cobrança", value: 1450 },
  { name: "NPS", value: 880 },
];

const kpis = [
  { label: "Mensagens hoje", value: "24.812", delta: "+12,4%", up: true, icon: MessageSquare },
  { label: "Conversas ativas", value: "1.284", delta: "+3,1%", up: true, icon: Users },
  { label: "Taxa de resposta", value: "94,2%", delta: "−0,6%", up: false, icon: Send },
  { label: "Tempo médio", value: "1m 42s", delta: "−18s", up: true, icon: Clock },
];

const agents = [
  { name: "Marina Costa", initials: "MC", convos: 142, csat: 4.9, status: "online" },
  { name: "Diego Almeida", initials: "DA", convos: 128, csat: 4.8, status: "online" },
  { name: "Beatriz Lima", initials: "BL", convos: 117, csat: 4.7, status: "away" },
  { name: "Rafael Souza", initials: "RS", convos: 96, csat: 4.6, status: "online" },
  { name: "Juliana Mendes", initials: "JM", convos: 84, csat: 4.5, status: "offline" },
];

const activity = [
  { who: "Campanha Black Friday", what: "Concluída · 12.402 envios", when: "há 8 min", tone: "success" as const },
  { who: "Chatbot Suporte", what: "3 novos fluxos publicados", when: "há 1 h", tone: "info" as const },
  { who: "Template promo_outono", what: "Aprovado pela Meta", when: "há 3 h", tone: "success" as const },
  { who: "Webhook /orders", what: "Falhou 4× consecutivas", when: "há 5 h", tone: "warning" as const },
];

export default function Dashboard() {
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Bem-vinda, Sara 👋</h2>
          <p className="text-sm text-muted-foreground">Aqui está o pulso da sua operação nos últimos 14 dias.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 border-border bg-secondary/40">Últimos 14 dias</Button>
          <Button size="sm" className="h-8 bg-primary text-primary-foreground hover:bg-primary/90 gap-1">
            Nova campanha <ArrowUpRight className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="surface-card p-5 group hover:border-border-strong transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{k.label}</span>
              <div className="size-8 rounded-md bg-secondary grid place-items-center text-muted-foreground group-hover:text-primary transition-colors">
                <k.icon className="size-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight text-mono">{k.value}</span>
              <span className={`text-xs flex items-center gap-0.5 ${k.up ? "text-success" : "text-destructive"}`}>
                {k.up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {k.delta}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="surface-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium">Volume de mensagens</h3>
              <p className="text-xs text-muted-foreground">Enviadas vs recebidas</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary" />Enviadas</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-info" />Recebidas</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--info))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--info))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="enviadas" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#g1)" />
                <Area type="monotone" dataKey="recebidas" stroke="hsl(var(--info))" strokeWidth={2} fill="url(#g2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-card p-5">
          <div className="mb-4">
            <h3 className="text-sm font-medium">Por canal</h3>
            <p className="text-xs text-muted-foreground">Conversas atribuídas</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={70} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Agents + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="surface-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium">Agentes em destaque</h3>
              <p className="text-xs text-muted-foreground">Por volume de conversas hoje</p>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground">Ver todos</Button>
          </div>
          <div className="space-y-1">
            {agents.map((a, i) => (
              <div key={a.name} className="flex items-center gap-3 px-2 py-2.5 rounded-md hover:bg-secondary/50 transition-colors">
                <span className="text-xs text-muted-foreground text-mono w-5">{i + 1}</span>
                <div className="relative">
                  <Avatar className="size-8"><AvatarFallback className="bg-secondary text-xs">{a.initials}</AvatarFallback></Avatar>
                  <span className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-background ${
                    a.status === "online" ? "bg-success" : a.status === "away" ? "bg-warning" : "bg-muted-foreground"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{a.name}</div>
                  <div className="text-[11px] text-muted-foreground capitalize">{a.status}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-mono">{a.convos}</div>
                  <div className="text-[11px] text-muted-foreground">conversas</div>
                </div>
                <div className="text-right w-16">
                  <div className="text-sm text-mono text-primary">★ {a.csat}</div>
                  <div className="text-[11px] text-muted-foreground">CSAT</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card p-5">
          <div className="mb-4">
            <h3 className="text-sm font-medium">Atividade recente</h3>
            <p className="text-xs text-muted-foreground">Últimas 24 horas</p>
          </div>
          <div className="space-y-3">
            {activity.map((a) => (
              <div key={a.who} className="flex gap-3">
                <div className={`mt-1.5 size-1.5 rounded-full shrink-0 ${
                  a.tone === "success" ? "bg-success" : a.tone === "warning" ? "bg-warning" : "bg-info"
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{a.who}</div>
                  <div className="text-xs text-muted-foreground">{a.what}</div>
                  <div className="text-[11px] text-muted-foreground/70 mt-0.5">{a.when}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
