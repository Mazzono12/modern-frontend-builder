import { TrendingUp, TrendingDown, MessageSquare, Users, Send, Clock, ArrowUpRight, Sparkles, Activity } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, BarChart, Bar, Line, LineChart } from "recharts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/CountUp";
import { FunnelChart } from "@/components/FunnelChart";
import { motion } from "framer-motion";

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

const spark = (seed: number) =>
  Array.from({ length: 12 }, (_, i) => ({ v: 50 + Math.round(Math.sin((i + seed) / 1.6) * 18 + Math.random() * 12) }));

type Kpi = { label: string; value: number; suffix?: string; prefix?: string; decimals?: number; delta: string; up: boolean; icon: any; data: { v: number }[] };

const kpis: Kpi[] = [
  { label: "Mensagens hoje", value: 24812, delta: "+12,4%", up: true, icon: MessageSquare, data: spark(1) },
  { label: "Conversas ativas", value: 1284, delta: "+3,1%", up: true, icon: Users, data: spark(3) },
  { label: "Taxa de resposta", value: 94.2, suffix: "%", decimals: 1, delta: "−0,6%", up: false, icon: Send, data: spark(5) },
  { label: "Tempo médio (s)", value: 102, suffix: "s", delta: "−18s", up: true, icon: Clock, data: spark(7) },
];

const funnelStages = [
  { label: "Visitantes do site", value: 48200 },
  { label: "Iniciaram conversa", value: 18420 },
  { label: "Qualificados", value: 9180 },
  { label: "Propostas enviadas", value: 3260 },
  { label: "Negócios fechados", value: 1148 },
];

const agents = [
  { name: "Marina Costa", initials: "MC", convos: 142, csat: 4.9, status: "online" },
  { name: "Diego Almeida", initials: "DA", convos: 128, csat: 4.8, status: "online" },
  { name: "Beatriz Lima", initials: "BL", convos: 117, csat: 4.7, status: "away" },
  { name: "Rafael Souza", initials: "RS", convos: 96, csat: 4.6, status: "online" },
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
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div className="space-y-2">
          <span className="chip">
            <span className="size-1.5 rounded-full bg-success animate-pulse-glow" />
            Operação ao vivo
          </span>
          <h2 className="text-2xl lg:text-3xl font-display font-semibold tracking-tight text-balance">
            Bem-vinda, <span className="text-gradient">Sara</span> 👋
          </h2>
          <p className="text-sm text-muted-foreground">Aqui está o pulso da sua operação nos últimos 14 dias.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 border-border bg-secondary/40 backdrop-blur hover:border-primary/40">
            Últimos 14 dias
          </Button>
          <Button size="sm" className="h-9 bg-gradient-primary text-primary-foreground hover:opacity-90 gap-1 shadow-glow">
            <Sparkles className="size-3.5" />
            Nova campanha <ArrowUpRight className="size-3.5" />
          </Button>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, idx) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.06 }}
            className="surface-card card-hover p-5 group relative overflow-hidden"
          >
            <div
              className="absolute -top-16 -right-16 size-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl"
              style={{ background: "hsl(var(--primary) / 0.3)" }}
            />
            <div className="flex items-center justify-between relative">
              <span className="text-[10px] text-muted-foreground uppercase tracking-[0.14em] font-medium">{k.label}</span>
              <div className="size-9 rounded-lg bg-gradient-to-br from-primary/25 to-primary/5 grid place-items-center text-primary border border-primary/20 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.08)]">
                <k.icon className="size-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2 relative">
              <span className="text-[28px] lg:text-3xl font-display font-semibold tracking-tight tabular-nums">
                <CountUp value={k.value} decimals={k.decimals ?? 0} prefix={k.prefix ?? ""} suffix={k.suffix ?? ""} />
              </span>
              <span className={`text-[11px] flex items-center gap-0.5 font-medium ${k.up ? "text-success" : "text-destructive"}`}>
                {k.up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {k.delta}
              </span>
            </div>
            <div className="mt-3 h-10 -mx-1 relative">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={k.data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke={k.up ? "hsl(var(--primary))" : "hsl(var(--destructive))"}
                    strokeWidth={1.75}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Funnel + Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="surface-card card-hover p-5 lg:col-span-2">
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
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--info))" stopOpacity={0.4} />
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

        <div className="surface-card card-hover p-5">
          <div className="mb-4">
            <h3 className="text-sm font-medium">Funil de conversão</h3>
            <p className="text-xs text-muted-foreground">Visitante → Cliente</p>
          </div>
          <FunnelChart stages={funnelStages} />
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Conversão total</span>
            <span className="text-mono text-primary font-medium">2,38%</span>
          </div>
        </div>
      </div>

      {/* Agents + Activity + Channel bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="surface-card card-hover p-5">
          <div className="mb-4">
            <h3 className="text-sm font-medium">Por canal</h3>
            <p className="text-xs text-muted-foreground">Conversas atribuídas</p>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="bg1" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(var(--primary-glow))" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={70} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" fill="url(#bg1)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-card card-hover p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium">Agentes em destaque</h3>
              <p className="text-xs text-muted-foreground">Volume hoje</p>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground">Ver todos</Button>
          </div>
          <div className="space-y-1">
            {agents.map((a, i) => (
              <div key={a.name} className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-secondary/50 transition-colors">
                <span className="text-xs text-muted-foreground text-mono w-4">{i + 1}</span>
                <div className="relative">
                  <Avatar className="size-8"><AvatarFallback className="bg-secondary text-xs">{a.initials}</AvatarFallback></Avatar>
                  <span className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-background ${
                    a.status === "online" ? "bg-success" : a.status === "away" ? "bg-warning" : "bg-muted-foreground"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{a.name}</div>
                  <div className="text-[11px] text-muted-foreground">{a.convos} conv · ★ {a.csat}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card card-hover p-5">
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
