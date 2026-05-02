import { useMemo, useState } from "react";
import { Search, Plus, Download, FileSpreadsheet, FileText, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { exportToExcel, exportToPDF } from "@/lib/export";
import { toast } from "sonner";

type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  tag: string;
  channel: "WhatsApp" | "Instagram" | "Email";
  lastSeen: string;
  totalValue: number;
};

const seed: Contact[] = [
  { id: "1", name: "Camila Ferreira", email: "camila@acme.com", phone: "+55 11 98765-4321", company: "Acme Moda", tag: "VIP", channel: "WhatsApp", lastSeen: "hoje", totalValue: 12400 },
  { id: "2", name: "Pedro Henrique", email: "pedro@techcorp.com", phone: "+55 21 99876-5432", company: "TechCorp", tag: "Lead", channel: "Instagram", lastSeen: "ontem", totalValue: 4800 },
  { id: "3", name: "Larissa Souza", email: "lari@beauty.com", phone: "+55 31 91234-5678", company: "BeautyHub", tag: "Cliente", channel: "WhatsApp", lastSeen: "2 dias", totalValue: 7200 },
  { id: "4", name: "Marcos Vieira", email: "marcos@logmv.com", phone: "+55 11 92345-6789", company: "Logística MV", tag: "Enterprise", channel: "Email", lastSeen: "hoje", totalValue: 18900 },
  { id: "5", name: "Renata Alves", email: "renata@studior.com", phone: "+55 47 93456-7890", company: "Studio R", tag: "Lead", channel: "WhatsApp", lastSeen: "5 dias", totalValue: 3200 },
  { id: "6", name: "Felipe Cardoso", email: "felipe@cardoso.co", phone: "+55 81 94567-8901", company: "Cardoso Co.", tag: "Cliente", channel: "WhatsApp", lastSeen: "hoje", totalValue: 24500 },
  { id: "7", name: "Ana Beatriz", email: "ana@abdigital.com", phone: "+55 11 95678-9012", company: "AB Digital", tag: "VIP", channel: "Email", lastSeen: "hoje", totalValue: 38000 },
  { id: "8", name: "Bruno Lopes", email: "bruno@lopes.com", phone: "+55 19 96789-0123", company: "Lopes Ltda", tag: "Lead", channel: "WhatsApp", lastSeen: "amanhã", totalValue: 9800 },
  { id: "9", name: "Juliana Mendes", email: "ju@mendes.com", phone: "+55 11 97890-1234", company: "Mendes Inc", tag: "Cliente", channel: "WhatsApp", lastSeen: "—", totalValue: 52000 },
];

const tagStyles: Record<string, string> = {
  VIP: "bg-primary/15 text-primary border-primary/30",
  Cliente: "bg-success/15 text-success border-success/30",
  Lead: "bg-info/15 text-info border-info/30",
  Enterprise: "bg-warning/15 text-warning border-warning/30",
};

export default function Contacts() {
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () => seed.filter((c) => `${c.name} ${c.email} ${c.company}`.toLowerCase().includes(q.toLowerCase())),
    [q],
  );

  const handleExportExcel = () => {
    exportToExcel(
      filtered.map((c) => ({
        Nome: c.name,
        Email: c.email,
        Telefone: c.phone,
        Empresa: c.company,
        Tag: c.tag,
        Canal: c.channel,
        "Visto por último": c.lastSeen,
        "Valor total (R$)": c.totalValue,
      })),
      `contatos-${new Date().toISOString().slice(0, 10)}.xlsx`,
      "Contatos",
    );
    toast.success("Planilha Excel exportada");
  };

  const handleExportPDF = () => {
    exportToPDF(
      filtered.map((c) => ({
        Nome: c.name,
        Empresa: c.company,
        Telefone: c.phone,
        Tag: c.tag,
        Canal: c.channel,
        "Valor total": `R$ ${c.totalValue.toLocaleString("pt-BR")}`,
      })),
      `contatos-${new Date().toISOString().slice(0, 10)}.pdf`,
      { title: "Contatos · PEGASUS" },
    );
    toast.success("PDF exportado");
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl lg:text-3xl font-display font-semibold tracking-tight">Contatos</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} contatos · CRM unificado</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <Download className="size-4" /> Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-strong">
              <DropdownMenuItem onClick={handleExportExcel} className="gap-2">
                <FileSpreadsheet className="size-4 text-success" /> Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF} className="gap-2">
                <FileText className="size-4 text-destructive" /> PDF (.pdf)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" className="h-9 bg-gradient-primary text-primary-foreground hover:opacity-90 gap-1 shadow-glow">
            <Plus className="size-4" /> Novo contato
          </Button>
        </div>
      </div>

      <div className="glass rounded-xl">
        <div className="p-3 border-b border-border flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nome, email ou empresa…"
              className="pl-8 h-9 bg-secondary/40 border-border text-sm"
            />
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="text-left font-medium px-4 py-3">Nome</th>
                <th className="text-left font-medium px-4 py-3">Empresa</th>
                <th className="text-left font-medium px-4 py-3">Canal</th>
                <th className="text-left font-medium px-4 py-3">Tag</th>
                <th className="text-left font-medium px-4 py-3">Visto</th>
                <th className="text-right font-medium px-4 py-3">Valor</th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-secondary text-xs">
                          {c.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-[11px] text-muted-foreground">{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.company}</td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-secondary border border-border text-muted-foreground">
                      {c.channel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded-md border ${tagStyles[c.tag] ?? "bg-secondary text-muted-foreground border-border"}`}>
                      {c.tag}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{c.lastSeen}</td>
                  <td className="px-4 py-3 text-right text-mono">R$ {c.totalValue.toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="icon" className="size-7 text-muted-foreground">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
