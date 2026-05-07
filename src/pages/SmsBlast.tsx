import { useEffect, useMemo, useState } from "react";
import { Send, Upload, Plus, History, Loader2, CheckCircle2, XCircle, Clock, Trash2, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Instance = { id: string; name: string; instance_key: string | null; status: string };
type Campaign = {
  id: string;
  name: string;
  message: string;
  instance_name: string | null;
  scheduled_at: string | null;
  status: string;
  total_count: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
};
type Recipient = {
  id: string;
  phone: string;
  status: string;
  error: string | null;
  rendered_message: string | null;
  sent_at: string | null;
};

type ParsedRow = { phone: string; variables: Record<string, string> };

function parseCsv(text: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };
  const split = (l: string) => l.split(/[,;\t]/).map((c) => c.trim().replace(/^"|"$/g, ""));
  const headers = split(lines[0]).map((h) => h.toLowerCase());
  const phoneIdx = headers.findIndex((h) => ["phone", "telefone", "celular", "numero", "número", "tel"].includes(h));
  if (phoneIdx === -1) throw new Error("CSV deve conter coluna 'phone' (ou telefone, celular, numero)");
  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = split(lines[i]);
    const phone = (cols[phoneIdx] ?? "").replace(/\D/g, "");
    if (!phone) continue;
    const variables: Record<string, string> = {};
    headers.forEach((h, idx) => { if (idx !== phoneIdx) variables[h] = cols[idx] ?? ""; });
    rows.push({ phone, variables });
  }
  return { headers, rows };
}

export default function SmsBlast() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);

  // form
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [instanceId, setInstanceId] = useState<string>("");
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [throttle, setThrottle] = useState(1000);
  const [csvText, setCsvText] = useState("");
  const parsed = useMemo(() => {
    if (!csvText.trim()) return { headers: [], rows: [] as ParsedRow[] };
    try { return parseCsv(csvText); } catch { return { headers: [], rows: [] as ParsedRow[] }; }
  }, [csvText]);

  // detail
  const [openCampaign, setOpenCampaign] = useState<Campaign | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);

  async function load() {
    const [{ data: inst }, { data: camps }] = await Promise.all([
      supabase.from("evo_instances").select("id, name, instance_key, status").order("created_at"),
      supabase.from("sms_campaigns").select("*").order("created_at", { ascending: false }),
    ]);
    setInstances((inst as Instance[]) ?? []);
    setCampaigns((camps as Campaign[]) ?? []);
  }
  useEffect(() => { load(); }, []);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    setCsvText(text);
    toast.success(`${f.name} carregado`);
  }

  async function createCampaign(sendNow: boolean) {
    if (!name.trim()) return toast.error("Informe o nome da campanha");
    if (!message.trim()) return toast.error("Escreva a mensagem");
    const inst = instances.find((i) => i.id === instanceId);
    if (!inst) return toast.error("Selecione uma instância");
    if (parsed.rows.length === 0) return toast.error("Faça upload de CSV com destinatários");

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const status = sendNow ? "draft" : (scheduledAt ? "scheduled" : "draft");
      const { data: campaign, error } = await supabase.from("sms_campaigns").insert({
        user_id: user.id,
        name: name.trim(),
        message: message.trim(),
        instance_id: inst.id,
        instance_name: inst.instance_key ?? inst.name,
        scheduled_at: scheduledAt || null,
        throttle_ms: throttle,
        total_count: parsed.rows.length,
        status,
      }).select().single();
      if (error) throw error;

      const chunks: any[][] = [];
      const all = parsed.rows.map((r) => ({
        campaign_id: campaign.id,
        user_id: user.id,
        phone: r.phone,
        variables: r.variables,
      }));
      for (let i = 0; i < all.length; i += 500) chunks.push(all.slice(i, i + 500));
      for (const c of chunks) {
        const { error: rerr } = await supabase.from("sms_recipients").insert(c);
        if (rerr) throw rerr;
      }

      if (sendNow) {
        const { error: fnErr } = await supabase.functions.invoke("sms-blast", {
          body: { campaign_id: campaign.id },
        });
        if (fnErr) throw fnErr;
        toast.success("Disparo iniciado");
      } else {
        toast.success(scheduledAt ? "Campanha agendada" : "Campanha salva como rascunho");
      }

      setName(""); setMessage(""); setCsvText(""); setScheduledAt("");
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao criar campanha");
    } finally {
      setLoading(false);
    }
  }

  async function runNow(c: Campaign) {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("sms-blast", { body: { campaign_id: c.id } });
      if (error) throw error;
      toast.success("Disparo iniciado");
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Falha");
    } finally {
      setLoading(false);
    }
  }

  async function removeCampaign(id: string) {
    if (!confirm("Excluir campanha e seus destinatários?")) return;
    await supabase.from("sms_campaigns").delete().eq("id", id);
    toast.success("Excluída");
    load();
  }

  async function openDetail(c: Campaign) {
    setOpenCampaign(c);
    const { data } = await supabase.from("sms_recipients").select("*").eq("campaign_id", c.id).order("created_at");
    setRecipients((data as Recipient[]) ?? []);
  }

  const variableHints = parsed.headers.filter((h) => !["phone","telefone","celular","numero","número","tel"].includes(h));

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl lg:text-3xl font-display font-semibold tracking-tight">Disparo de SMS em massa</h2>
          <p className="text-sm text-muted-foreground">Envie SMS para milhares de contatos via Evolution API</p>
        </div>
      </div>

      <Tabs defaultValue="new" className="space-y-4">
        <TabsList className="glass">
          <TabsTrigger value="new" className="gap-2"><Plus className="size-4" /> Nova campanha</TabsTrigger>
          <TabsTrigger value="history" className="gap-2"><History className="size-4" /> Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="glass rounded-xl p-5 space-y-4">
              <div className="space-y-2">
                <Label>Nome da campanha</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Promo Outubro" />
              </div>
              <div className="space-y-2">
                <Label>Instância (Evolution)</Label>
                <Select value={instanceId} onValueChange={setInstanceId}>
                  <SelectTrigger><SelectValue placeholder="Selecione uma instância" /></SelectTrigger>
                  <SelectContent>
                    {instances.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.name} <span className="text-muted-foreground text-xs ml-2">{i.status}</span>
                      </SelectItem>
                    ))}
                    {instances.length === 0 && <div className="px-3 py-2 text-xs text-muted-foreground">Nenhuma instância. Configure em Integrações.</div>}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Agendar (opcional)</Label>
                  <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Intervalo entre envios (ms)</Label>
                  <Input type="number" min={0} value={throttle} onChange={(e) => setThrottle(Number(e.target.value) || 0)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mensagem</Label>
                <Textarea
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Olá {{nome}}, sua oferta está pronta!"
                />
                <p className="text-[11px] text-muted-foreground">
                  Use <code>{"{{coluna}}"}</code> para personalizar.
                  {variableHints.length > 0 && (
                    <> Disponíveis: {variableHints.map((v) => <code key={v} className="ml-1 px-1 rounded bg-secondary">{`{{${v}}}`}</code>)}</>
                  )}
                </p>
              </div>
            </div>

            <div className="glass rounded-xl p-5 space-y-4">
              <div className="space-y-2">
                <Label>Upload CSV de destinatários</Label>
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" size="sm" className="gap-2">
                    <label>
                      <Upload className="size-4" /> Selecionar arquivo
                      <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
                    </label>
                  </Button>
                  {parsed.rows.length > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      <FileSpreadsheet className="size-3" /> {parsed.rows.length} contatos
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  CSV com cabeçalho. Coluna obrigatória: <code>phone</code> (ou telefone). Demais colunas viram variáveis.
                </p>
              </div>

              {parsed.rows.length > 0 && (
                <div className="border border-border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-secondary/50 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2">Telefone</th>
                        {variableHints.map((h) => <th key={h} className="text-left px-3 py-2">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.rows.slice(0, 50).map((r, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="px-3 py-1.5 font-mono">{r.phone}</td>
                          {variableHints.map((h) => <td key={h} className="px-3 py-1.5 text-muted-foreground">{r.variables[h]}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsed.rows.length > 50 && (
                    <div className="text-[11px] text-muted-foreground px-3 py-2 border-t border-border">+{parsed.rows.length - 50} linhas…</div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <Button onClick={() => createCampaign(true)} disabled={loading} className="gap-2 bg-gradient-primary text-primary-foreground shadow-glow">
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  Disparar agora
                </Button>
                <Button onClick={() => createCampaign(false)} disabled={loading} variant="outline" className="gap-2">
                  <Clock className="size-4" /> {scheduledAt ? "Agendar" : "Salvar rascunho"}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="glass rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">Campanha</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Total</th>
                  <th className="text-right px-4 py-3">Enviados</th>
                  <th className="text-right px-4 py-3">Falhas</th>
                  <th className="text-left px-4 py-3">Quando</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <button onClick={() => openDetail(c)} className="text-left">
                        <div className="font-medium">{c.name}</div>
                        <div className="text-[11px] text-muted-foreground line-clamp-1">{c.message}</div>
                      </button>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-right text-mono">{c.total_count}</td>
                    <td className="px-4 py-3 text-right text-mono text-success">{c.sent_count}</td>
                    <td className="px-4 py-3 text-right text-mono text-destructive">{c.failed_count}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {c.scheduled_at ? `Agendada: ${new Date(c.scheduled_at).toLocaleString("pt-BR")}` : new Date(c.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 flex gap-1 justify-end">
                      {(c.status === "draft" || c.status === "scheduled" || c.status === "failed") && (
                        <Button size="sm" variant="ghost" onClick={() => runNow(c)} className="h-7 gap-1 text-xs">
                          <Send className="size-3" /> Disparar
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => removeCampaign(c.id)} className="size-7 text-destructive">
                        <Trash2 className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {campaigns.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">Nenhuma campanha ainda.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!openCampaign} onOpenChange={(o) => !o && setOpenCampaign(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{openCampaign?.name}</DialogTitle></DialogHeader>
          <div className="text-sm text-muted-foreground border border-border rounded-md p-3 bg-secondary/30">
            {openCampaign?.message}
          </div>
          <div className="max-h-[60vh] overflow-y-auto border border-border rounded-md">
            <table className="w-full text-xs">
              <thead className="bg-secondary/50 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2">Telefone</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-left px-3 py-2">Detalhe</th>
                  <th className="text-left px-3 py-2">Enviado</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-3 py-2 font-mono">{r.phone}</td>
                    <td className="px-3 py-2"><RecipientStatus s={r.status} /></td>
                    <td className="px-3 py-2 text-muted-foreground line-clamp-1 max-w-md">{r.error ?? r.rendered_message}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.sent_at ? new Date(r.sent_at).toLocaleString("pt-BR") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    draft: { label: "Rascunho", cls: "bg-secondary text-muted-foreground" },
    scheduled: { label: "Agendada", cls: "bg-info/15 text-info" },
    sending: { label: "Enviando", cls: "bg-warning/15 text-warning" },
    completed: { label: "Concluída", cls: "bg-success/15 text-success" },
    failed: { label: "Falhou", cls: "bg-destructive/15 text-destructive" },
    canceled: { label: "Cancelada", cls: "bg-secondary text-muted-foreground" },
  };
  const x = map[status] ?? map.draft;
  return <span className={`text-[11px] px-2 py-0.5 rounded-md border border-border ${x.cls}`}>{x.label}</span>;
}

function RecipientStatus({ s }: { s: string }) {
  if (s === "sent") return <span className="inline-flex items-center gap-1 text-success"><CheckCircle2 className="size-3" /> Enviado</span>;
  if (s === "failed") return <span className="inline-flex items-center gap-1 text-destructive"><XCircle className="size-3" /> Falhou</span>;
  return <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="size-3" /> Pendente</span>;
}
