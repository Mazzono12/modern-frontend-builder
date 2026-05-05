import { useState } from "react";
import { Plus, Search, MoreHorizontal, Calendar, Users, Send, CheckCircle2, AlertCircle, Pause, Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { exportToExcel, exportToPDF } from "@/lib/export";
import { toast } from "sonner";

type Status = "running" | "scheduled" | "completed" | "draft" | "failed" | "paused";
const statusConfig: Record<Status, { label: string; cls: string; icon: typeof Send }> = {
  running:   { label: "Em execução", cls: "bg-info/15 text-info border-info/30", icon: Send },
  scheduled: { label: "Agendada",    cls: "bg-warning/15 text-warning border-warning/30", icon: Calendar },
  completed: { label: "Concluída",   cls: "bg-success/15 text-success border-success/30", icon: CheckCircle2 },
  draft:     { label: "Rascunho",    cls: "bg-secondary text-muted-foreground border-border", icon: Pause },
  failed:    { label: "Com falhas",  cls: "bg-destructive/15 text-destructive border-destructive/30", icon: AlertCircle },
  paused:    { label: "Pausada",     cls: "bg-muted text-muted-foreground border-border", icon: Pause },
};

const campaigns = [
  { name: "Black Friday — Reativação base inativa", template: "promo_blackfriday_v3", audience: "Inativos 90d", sent: 12402, total: 12402, ctr: 38.4, status: "completed" as Status, date: "Hoje, 09:00" },
  { name: "Lançamento Coleção Outono", template: "lancamento_outono", audience: "VIPs · 4.820", sent: 3211, total: 4820, ctr: 42.1, status: "running" as Status, date: "Em andamento" },
  { name: "Cobrança — Vencidos 7 dias", template: "cobranca_lembrete", audience: "Inadimplentes", sent: 0, total: 1284, ctr: 0, status: "scheduled" as Status, date: "Amanhã, 10:00" },
  { name: "NPS pós-atendimento", template: "nps_v2", audience: "Atendidos esta semana", sent: 1820, total: 2104, ctr: 67.8, status: "running" as Status, date: "Recorrente" },
  { name: "Convite webinar produto", template: "webinar_convite", audience: "Trial ativos", sent: 412, total: 980, ctr: 12.3, status: "failed" as Status, date: "Ontem" },
  { name: "Promo Dia das Mães", template: "promo_dia_maes", audience: "Toda a base", sent: 0, total: 0, ctr: 0, status: "draft" as Status, date: "—" },
];

export default function Campaigns() {
  const [tab, setTab] = useState<"todas" | "ativas" | "agendadas" | "concluidas">("todas");

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl lg:text-3xl font-display font-semibold tracking-tight">Campanhas</h2>
          <p className="text-sm text-muted-foreground">Disparos em massa com templates aprovados pela Meta.</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <Download className="size-4" /> Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-strong">
              <DropdownMenuItem
                className="gap-2"
                onClick={() => {
                  exportToExcel(
                    campaigns.map((c) => ({
                      Campanha: c.name,
                      Template: c.template,
                      Audiência: c.audience,
                      Enviadas: c.sent,
                      Total: c.total,
                      CTR: `${c.ctr}%`,
                      Status: statusConfig[c.status].label,
                      Quando: c.date,
                    })),
                    `campanhas-${new Date().toISOString().slice(0, 10)}.xlsx`,
                    "Campanhas",
                  );
                  toast.success("Excel exportado");
                }}
              >
                <FileSpreadsheet className="size-4 text-success" /> Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2"
                onClick={() => {
                  exportToPDF(
                    campaigns.map((c) => ({
                      Campanha: c.name,
                      Audiência: c.audience,
                      Enviadas: c.sent,
                      Total: c.total,
                      CTR: `${c.ctr}%`,
                      Status: statusConfig[c.status].label,
                    })),
                    `campanhas-${new Date().toISOString().slice(0, 10)}.pdf`,
                    { title: "Campanhas · CIFHER" },
                  );
                  toast.success("PDF exportado");
                }}
              >
                <FileText className="size-4 text-destructive" /> PDF (.pdf)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button className="bg-gradient-primary hover:opacity-90 text-primary-foreground gap-2 h-9 shadow-glow">
            <Plus className="size-4" /> Nova campanha
          </Button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { l: "Em execução", v: "2", sub: "campanhas ativas" },
          { l: "Enviadas hoje", v: "15.613", sub: "+18% vs ontem" },
          { l: "Taxa de entrega", v: "98,4%", sub: "média 7d" },
          { l: "CTR médio", v: "32,1%", sub: "+4,2pp" },
        ].map((s) => (
          <div key={s.l} className="surface-card p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">{s.l}</div>
            <div className="text-2xl font-semibold text-mono mt-2">{s.v}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 surface-card p-1">
          {(["todas", "ativas", "agendadas", "concluidas"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-md text-xs capitalize transition-colors ${
                tab === t ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar campanha…" className="pl-8 h-9 bg-secondary/40 border-border text-sm" />
        </div>
      </div>

      {/* Table */}
      <div className="surface-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border bg-background-elev/40">
              <th className="text-left font-medium px-5 py-3">Campanha</th>
              <th className="text-left font-medium px-5 py-3">Audiência</th>
              <th className="text-left font-medium px-5 py-3">Progresso</th>
              <th className="text-left font-medium px-5 py-3">CTR</th>
              <th className="text-left font-medium px-5 py-3">Status</th>
              <th className="text-left font-medium px-5 py-3">Quando</th>
              <th className="w-10 px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => {
              const sc = statusConfig[c.status];
              const pct = c.total > 0 ? Math.round((c.sent / c.total) * 100) : 0;
              return (
                <tr key={c.name} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground text-mono mt-0.5">{c.template}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="size-3.5" />
                      <span className="text-xs">{c.audience}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 min-w-[180px]">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-mono">{c.sent.toLocaleString("pt-BR")} / {c.total.toLocaleString("pt-BR")}</span>
                      <span className="text-muted-foreground">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </td>
                  <td className="px-5 py-4 text-mono">{c.ctr > 0 ? `${c.ctr}%` : "—"}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-md border ${sc.cls}`}>
                      <sc.icon className="size-3" />
                      {sc.label}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-muted-foreground">{c.date}</td>
                  <td className="px-5 py-4">
                    <Button variant="ghost" size="icon" className="size-7"><MoreHorizontal className="size-4 text-muted-foreground" /></Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
