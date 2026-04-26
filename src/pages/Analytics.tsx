import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, TrendingDown, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const messages = Array.from({ length: 30 }, (_, i) => ({
  d: `${i + 1}`,
  enviadas: 800 + Math.round(Math.sin(i / 3) * 300 + Math.random() * 200),
  entregues: 780 + Math.round(Math.sin(i / 3) * 290 + Math.random() * 180),
  lidas:    580 + Math.round(Math.sin(i / 3) * 240 + Math.random() * 160),
}));

const responseTime = Array.from({ length: 24 }, (_, i) => ({
  h: `${String(i).padStart(2, "0")}h`,
  s: 30 + Math.round(Math.abs(Math.cos(i / 3)) * 80 + Math.random() * 30),
}));

const intents = [
  { name: "Suporte técnico", value: 38, color: "hsl(var(--primary))" },
  { name: "Vendas", value: 24, color: "hsl(var(--info))" },
  { name: "Cobrança", value: 18, color: "hsl(var(--warning))" },
  { name: "Outros", value: 20, color: "hsl(var(--muted-foreground))" },
];

const agentPerf = [
  { a: "Marina C.", conv: 142, csat: 4.9 },
  { a: "Diego A.", conv: 128, csat: 4.8 },
  { a: "Beatriz L.", conv: 117, csat: 4.7 },
  { a: "Rafael S.", conv: 96, csat: 4.6 },
  { a: "Juliana M.", conv: 84, csat: 4.5 },
  { a: "Otávio P.", conv: 72, csat: 4.4 },
];

export default function Analytics() {
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Analytics</h2>
          <p className="text-sm text-muted-foreground">Insights da operação · período: <span className="text-foreground">últimos 30 dias</span></p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex surface-card p-1">
            {["7d", "30d", "90d", "1y"].map((p, i) => (
              <button key={p} className={`px-3 py-1 text-xs rounded-md ${i === 1 ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{p}</button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 border-border bg-secondary/40"><Download className="size-3.5" />Exportar</Button>
        </div>
      </div>

      {/* Headline numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { l: "Total mensagens", v: "428.241", d: "+18,2%", up: true },
          { l: "Conversas únicas", v: "32.118", d: "+9,4%", up: true },
          { l: "Taxa de leitura", v: "82,4%", d: "+1,1pp", up: true },
          { l: "TMR (resposta)", v: "1m 38s", d: "−22s", up: true },
        ].map((k) => (
          <div key={k.l} className="surface-card p-5">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">{k.l}</div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-mono">{k.v}</span>
              <span className={`text-xs flex items-center gap-0.5 ${k.up ? "text-success" : "text-destructive"}`}>
                {k.up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}{k.d}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Big chart */}
      <div className="surface-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium">Funil de mensagens</h3>
            <p className="text-xs text-muted-foreground">Enviadas → Entregues → Lidas (diário)</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary" />Enviadas</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-info" />Entregues</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-warning" />Lidas</span>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={messages} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="d" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="enviadas" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="entregues" stroke="hsl(var(--info))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="lidas" stroke="hsl(var(--warning))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="surface-card p-5">
          <div className="mb-4">
            <h3 className="text-sm font-medium">Tempo médio de resposta por hora</h3>
            <p className="text-xs text-muted-foreground">Em segundos · média da última semana</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={responseTime} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="h" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} interval={2} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="s" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-card p-5">
          <div className="mb-4">
            <h3 className="text-sm font-medium">Distribuição por intenção</h3>
            <p className="text-xs text-muted-foreground">Classificação automática (IA)</p>
          </div>
          <div className="h-64 flex items-center">
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie data={intents} dataKey="value" innerRadius={50} outerRadius={90} strokeWidth={2} stroke="hsl(var(--background))">
                  {intents.map((e) => <Cell key={e.name} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {intents.map((i) => (
                <div key={i.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: i.color }} />{i.name}</span>
                  <span className="text-mono">{i.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Agent performance */}
      <div className="surface-card p-5">
        <div className="mb-4">
          <h3 className="text-sm font-medium">Desempenho dos agentes</h3>
          <p className="text-xs text-muted-foreground">Conversas atendidas e satisfação (CSAT)</p>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={agentPerf} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="a" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="conv" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
