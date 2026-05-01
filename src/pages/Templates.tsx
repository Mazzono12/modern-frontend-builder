import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { FileText, Loader2, Plus, RefreshCw, Trash2, Search, CheckCircle2, XCircle, Clock } from "lucide-react";

interface MetaInstance {
  id: string;
  name: string;
  meta_phone_number_id: string | null;
  meta_waba_id: string | null;
  meta_display_phone_number: string | null;
}

interface MetaTemplate {
  id: string;
  name: string;
  status: string; // APPROVED | PENDING | REJECTED | PAUSED | DISABLED
  category: string; // MARKETING | UTILITY | AUTHENTICATION
  language: string;
  components?: any[];
  rejected_reason?: string | null;
  quality_score?: { score?: string };
}

const LANGS = [
  { code: "pt_BR", label: "Português (Brasil)" },
  { code: "en_US", label: "English (US)" },
  { code: "es_ES", label: "Español" },
  { code: "es_MX", label: "Español (MX)" },
  { code: "en", label: "English" },
];

const CATEGORIES = [
  { code: "MARKETING", label: "Marketing" },
  { code: "UTILITY", label: "Utility" },
  { code: "AUTHENTICATION", label: "Authentication" },
];

export default function Templates() {
  const [instances, setInstances] = useState<MetaInstance[]>([]);
  const [instanceId, setInstanceId] = useState<string>("");
  const [templates, setTemplates] = useState<MetaTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Create dialog
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("UTILITY");
  const [language, setLanguage] = useState("pt_BR");
  const [headerText, setHeaderText] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [buttonsRaw, setButtonsRaw] = useState(""); // one button label per line, prefix QR: or URL:https://...

  // Detail dialog
  const [detail, setDetail] = useState<MetaTemplate | null>(null);

  useEffect(() => { loadInstances(); }, []);
  useEffect(() => { if (instanceId) loadTemplates(); }, [instanceId]);

  async function loadInstances() {
    const { data, error } = await supabase
      .from("evo_instances")
      .select("id,name,meta_phone_number_id,meta_waba_id,meta_display_phone_number,provider")
      .eq("provider", "meta_cloud");
    if (error) { toast.error("Falha ao carregar instâncias"); return; }
    const list = (data ?? []) as any as MetaInstance[];
    setInstances(list);
    if (list.length && !instanceId) setInstanceId(list[0].id);
  }

  async function loadTemplates() {
    if (!instanceId) return;
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("meta-proxy", {
      body: { instance_id: instanceId, action: "list_templates", payload: { limit: 200 } },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    if ((data as any)?.error) { toast.error((data as any).error); return; }
    const list = (data as any)?.data?.data ?? [];
    setTemplates(list);
  }

  function buildComponents() {
    const components: any[] = [];

    // ---- Placeholder helpers (Meta requires {{1}}, {{2}}… sequential, starting at 1, no gaps/duplicates) ----
    const extractPlaceholders = (text: string): number[] => {
      const matches = [...text.matchAll(/\{\{\s*(\d+)\s*\}\}/g)].map((m) => Number(m[1]));
      return matches;
    };
    const validateSequential = (nums: number[], where: string) => {
      if (nums.length === 0) return;
      const unique = [...new Set(nums)].sort((a, b) => a - b);
      if (unique[0] !== 1) {
        throw new Error(`${where}: placeholders devem começar em {{1}} (encontrado {{${unique[0]}}})`);
      }
      for (let i = 0; i < unique.length; i++) {
        if (unique[i] !== i + 1) {
          throw new Error(`${where}: placeholders devem ser sequenciais sem pular números (faltando {{${i + 1}}})`);
        }
      }
    };
    const rejectInvalidBraces = (text: string, where: string) => {
      // Detect malformed placeholders like {1}, {{a}}, {{ 1 }}garbage, {{1}, {{}}
      const stripped = text.replace(/\{\{\s*\d+\s*\}\}/g, "");
      if (/\{\{|\}\}/.test(stripped)) {
        throw new Error(`${where}: placeholder mal formatado. Use exatamente {{1}}, {{2}}…`);
      }
    };

    // ---- HEADER (max 1 placeholder for TEXT format per Meta spec) ----
    let headerPh: number[] = [];
    if (headerText.trim()) {
      const text = headerText.trim();
      if (text.length > 60) throw new Error("Header: máximo 60 caracteres");
      rejectInvalidBraces(text, "Header");
      headerPh = extractPlaceholders(text);
      if (headerPh.length > 1) throw new Error("Header de texto aceita no máximo 1 placeholder ({{1}})");
      if (headerPh.length === 1 && headerPh[0] !== 1) {
        throw new Error("Header: o único placeholder deve ser {{1}}");
      }
      components.push({ type: "HEADER", format: "TEXT", text });
    }

    // ---- BODY (required, sequential placeholders, max 1024 chars) ----
    if (!bodyText.trim()) throw new Error("Body é obrigatório");
    const body = bodyText.trim();
    if (body.length > 1024) throw new Error("Body: máximo 1024 caracteres");
    rejectInvalidBraces(body, "Body");
    const bodyPh = extractPlaceholders(body);
    validateSequential(bodyPh, "Body");
    // Meta hard cap on body variables
    const bodyMax = bodyPh.length ? Math.max(...bodyPh) : 0;
    if (bodyMax > 100) throw new Error("Body: no máximo 100 placeholders");
    components.push({ type: "BODY", text: body });

    // ---- FOOTER (no placeholders allowed, max 60) ----
    if (footerText.trim()) {
      const footer = footerText.trim();
      if (footer.length > 60) throw new Error("Footer: máximo 60 caracteres");
      if (/\{\{/.test(footer)) throw new Error("Footer não pode conter placeholders");
      components.push({ type: "FOOTER", text: footer });
    }

    // ---- BUTTONS ----
    const lines = buttonsRaw.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length > 3) throw new Error("Máximo de 3 botões por template");

    let urlButtonsWithVar = 0;
    const buttonTypes: string[] = [];

    if (lines.length) {
      const buttons = lines.map((line, idx) => {
        const where = `Botão ${idx + 1}`;

        if (line.toUpperCase().startsWith("URL:")) {
          const rest = line.slice(4);
          const [text, ...urlParts] = rest.split("|");
          const url = urlParts.join("|").trim();
          const label = (text ?? "").trim();
          if (!label || !url) throw new Error(`${where}: use URL:texto|https://...`);
          if (label.length > 25) throw new Error(`${where}: texto do botão máx 25 caracteres`);
          if (!/^https?:\/\//i.test(url)) throw new Error(`${where}: URL deve começar com http:// ou https://`);
          if (/\{\{/.test(label)) throw new Error(`${where}: o texto do botão não aceita placeholder`);

          // URL pode conter no máximo 1 placeholder e ele DEVE ser o último, contínuo após body
          const urlPh = extractPlaceholders(url);
          rejectInvalidBraces(url, `${where} URL`);
          if (urlPh.length > 1) throw new Error(`${where}: URL aceita no máximo 1 placeholder`);
          if (urlPh.length === 1) {
            urlButtonsWithVar++;
            // Meta exige que o placeholder seja o próximo após o último do body
            const expected = bodyMax + 1;
            if (urlPh[0] !== expected) {
              throw new Error(
                `${where}: o placeholder da URL deve ser {{${expected}}} (próximo após o último do body)`,
              );
            }
            // Placeholder deve estar no final da URL
            if (!/\{\{\s*\d+\s*\}\}\s*$/.test(url)) {
              throw new Error(`${where}: o placeholder {{${urlPh[0]}}} deve ficar no FINAL da URL`);
            }
          }
          buttonTypes.push("URL");
          return { type: "URL", text: label, url };
        }

        if (line.toUpperCase().startsWith("PHONE:")) {
          const rest = line.slice(6);
          const [text, ...phoneParts] = rest.split("|");
          const phone = phoneParts.join("|").trim();
          const label = (text ?? "").trim();
          if (!label || !phone) throw new Error(`${where}: use PHONE:texto|+5511999999999`);
          if (label.length > 25) throw new Error(`${where}: texto do botão máx 25 caracteres`);
          if (!/^\+?[1-9]\d{6,14}$/.test(phone.replace(/\D/g, "").replace(/^/, phone.startsWith("+") ? "+" : ""))) {
            // simpler check below
          }
          if (!/^\+?\d{8,15}$/.test(phone)) {
            throw new Error(`${where}: telefone inválido (use formato E.164, ex.: +5511999999999)`);
          }
          if (/\{\{/.test(label) || /\{\{/.test(phone)) {
            throw new Error(`${where}: PHONE não aceita placeholders`);
          }
          buttonTypes.push("PHONE_NUMBER");
          return { type: "PHONE_NUMBER", text: label, phone_number: phone };
        }

        // default: quick reply
        const label = line.replace(/^QR:/i, "").trim();
        if (!label) throw new Error(`${where}: texto vazio`);
        if (label.length > 25) throw new Error(`${where}: texto do botão máx 25 caracteres`);
        if (/\{\{/.test(label)) throw new Error(`${where}: QUICK_REPLY não aceita placeholders`);
        buttonTypes.push("QUICK_REPLY");
        return { type: "QUICK_REPLY", text: label };
      });

      // Meta não permite misturar QUICK_REPLY com URL/PHONE_NUMBER no mesmo template
      const hasQR = buttonTypes.includes("QUICK_REPLY");
      const hasCTA = buttonTypes.includes("URL") || buttonTypes.includes("PHONE_NUMBER");
      if (hasQR && hasCTA) {
        throw new Error("Não é permitido misturar botões QUICK_REPLY com URL/PHONE no mesmo template");
      }
      // Apenas 1 botão URL com variável e 1 botão PHONE no total
      if (urlButtonsWithVar > 1) throw new Error("Apenas 1 botão URL pode conter placeholder");
      const phoneCount = buttonTypes.filter((t) => t === "PHONE_NUMBER").length;
      if (phoneCount > 1) throw new Error("Apenas 1 botão PHONE_NUMBER é permitido");

      components.push({ type: "BUTTONS", buttons });
    }

    // ---- AUTHENTICATION category requires only OTP-style body, no header/footer/CTA URL ----
    if (category === "AUTHENTICATION") {
      if (headerText.trim() || footerText.trim()) {
        throw new Error("Categoria AUTHENTICATION não aceita header/footer livres — use Marketing/Utility");
      }
    }

    return components;
  }

  async function createTemplate() {
    if (!instanceId) { toast.error("Selecione uma instância Meta"); return; }
    if (!/^[a-z0-9_]{1,512}$/.test(name)) {
      toast.error("Nome inválido: use apenas a-z, 0-9 e _ (sem maiúsculas/espaços)");
      return;
    }
    let components: any[];
    try { components = buildComponents(); } catch (e: any) { toast.error(e.message); return; }
    setCreating(true);
    const { data, error } = await supabase.functions.invoke("meta-proxy", {
      body: {
        instance_id: instanceId,
        action: "create_template",
        payload: { name, category, language, components },
      },
    });
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    if ((data as any)?.error) {
      const det = (data as any).details?.error?.message ?? (data as any).error;
      toast.error(`Falha ao criar: ${det}`);
      return;
    }
    toast.success("Template enviado para aprovação da Meta");
    setOpen(false);
    setName(""); setHeaderText(""); setBodyText(""); setFooterText(""); setButtonsRaw("");
    loadTemplates();
  }

  async function deleteTemplate(t: MetaTemplate) {
    if (!confirm(`Excluir template "${t.name}"? Esta ação não pode ser desfeita.`)) return;
    const { data, error } = await supabase.functions.invoke("meta-proxy", {
      body: {
        instance_id: instanceId,
        action: "delete_template",
        payload: { name: t.name, template_id: t.id },
      },
    });
    if (error) { toast.error(error.message); return; }
    if ((data as any)?.error) {
      toast.error((data as any).details?.error?.message ?? (data as any).error);
      return;
    }
    toast.success(`Template "${t.name}" excluído`);
    loadTemplates();
  }

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [templates, search, statusFilter]);

  const stats = useMemo(() => {
    const s = { APPROVED: 0, PENDING: 0, REJECTED: 0, OTHER: 0 } as Record<string, number>;
    templates.forEach((t) => {
      if (t.status === "APPROVED") s.APPROVED++;
      else if (t.status === "PENDING") s.PENDING++;
      else if (t.status === "REJECTED") s.REJECTED++;
      else s.OTHER++;
    });
    return s;
  }, [templates]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-semibold tracking-tight flex items-center gap-2">
            <FileText className="size-6 text-primary" /> Templates Meta
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie templates da WhatsApp Cloud API (v23.0) — criar, listar e excluir.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={instanceId} onValueChange={setInstanceId}>
            <SelectTrigger className="w-[260px]"><SelectValue placeholder="Selecione uma instância Meta" /></SelectTrigger>
            <SelectContent>
              {instances.length === 0 && <SelectItem value="none" disabled>Nenhuma instância Meta</SelectItem>}
              {instances.map((i) => (
                <SelectItem key={i.id} value={i.id}>
                  {i.name} {i.meta_display_phone_number ? `· ${i.meta_display_phone_number}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={loadTemplates} disabled={!instanceId || loading}>
            {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          </Button>
          <Button onClick={() => setOpen(true)} disabled={!instanceId}>
            <Plus /> Novo template
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Aprovados" value={stats.APPROVED} icon={<CheckCircle2 className="text-emerald-500" />} />
        <StatCard label="Pendentes" value={stats.PENDING} icon={<Clock className="text-amber-500" />} />
        <StatCard label="Rejeitados" value={stats.REJECTED} icon={<XCircle className="text-rose-500" />} />
        <StatCard label="Outros" value={stats.OTHER} icon={<FileText className="text-muted-foreground" />} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome…" className="pl-9" />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="APPROVED">Aprovados</TabsTrigger>
            <TabsTrigger value="PENDING">Pendentes</TabsTrigger>
            <TabsTrigger value="REJECTED">Rejeitados</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">
              <Loader2 className="size-6 animate-spin mx-auto mb-2" /> Carregando templates…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              {instances.length === 0
                ? "Cadastre uma instância Meta Cloud em Integrações para começar."
                : "Nenhum template encontrado."}
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((t) => (
                <div key={`${t.id}-${t.language}`} className="flex items-center justify-between p-4 hover:bg-accent/30">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        className="font-medium text-sm hover:underline text-left"
                        onClick={() => setDetail(t)}
                      >
                        {t.name}
                      </button>
                      <StatusBadge status={t.status} />
                      <Badge variant="outline" className="text-[10px]">{t.category}</Badge>
                      <Badge variant="secondary" className="text-[10px]">{t.language}</Badge>
                    </div>
                    {t.rejected_reason && t.status === "REJECTED" && (
                      <p className="text-xs text-rose-500 mt-1">Motivo: {t.rejected_reason}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteTemplate(t)} title="Excluir">
                    <Trash2 className="text-rose-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo template</DialogTitle>
            <DialogDescription>
              Após enviar, a Meta avalia o template (geralmente em minutos). Use placeholders {`{{1}}, {{2}}…`} no body.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nome (a-z, 0-9, _)</Label>
                <Input value={name} onChange={(e) => setName(e.target.value.toLowerCase())} placeholder="boas_vindas_v1" />
              </div>
              <div>
                <Label>Idioma</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LANGS.map((l) => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Header (texto, opcional · máx 60 chars)</Label>
              <Input maxLength={60} value={headerText} onChange={(e) => setHeaderText(e.target.value)} placeholder="Olá, {{1}}!" />
            </div>
            <div>
              <Label>Body (obrigatório · máx 1024 chars)</Label>
              <Textarea
                rows={5}
                maxLength={1024}
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                placeholder={"Olá {{1}}, seu pedido {{2}} foi confirmado.\nObrigado por comprar conosco!"}
              />
            </div>
            <div>
              <Label>Footer (opcional · máx 60 chars)</Label>
              <Input maxLength={60} value={footerText} onChange={(e) => setFooterText(e.target.value)} placeholder="Equipe Acme" />
            </div>
            <div>
              <Label>Botões (1 por linha, máx 3)</Label>
              <Textarea
                rows={3}
                value={buttonsRaw}
                onChange={(e) => setButtonsRaw(e.target.value)}
                placeholder={"QR:Confirmar\nURL:Ver pedido|https://acme.com/pedido/{{1}}\nPHONE:Ligar|+5511999999999"}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Prefixos: <code>QR:</code> (resposta rápida), <code>URL:texto|https://...</code>, <code>PHONE:texto|+telefone</code>.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={creating}>Cancelar</Button>
            <Button onClick={createTemplate} disabled={creating || !name || !bodyText}>
              {creating && <Loader2 className="animate-spin" />} Enviar para aprovação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {detail?.name}
              {detail && <StatusBadge status={detail.status} />}
            </DialogTitle>
            <DialogDescription>
              {detail?.category} · {detail?.language} · ID {detail?.id}
            </DialogDescription>
          </DialogHeader>
          <pre className="text-xs bg-muted/50 p-3 rounded-md overflow-auto">
{JSON.stringify(detail?.components ?? [], null, 2)}
          </pre>
          {detail?.rejected_reason && (
            <p className="text-sm text-rose-500">Rejeitado: {detail.rejected_reason}</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-2">{icon} {label}</CardDescription>
        <CardTitle className="text-3xl font-display">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    APPROVED: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    PENDING: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    REJECTED: "bg-rose-500/15 text-rose-600 border-rose-500/30",
    PAUSED: "bg-orange-500/15 text-orange-600 border-orange-500/30",
    DISABLED: "bg-muted text-muted-foreground",
  };
  return (
    <Badge variant="outline" className={`text-[10px] ${map[status] ?? ""}`}>
      {status}
    </Badge>
  );
}
