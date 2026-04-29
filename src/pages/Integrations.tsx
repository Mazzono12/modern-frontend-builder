import { useEffect, useState } from "react";
import {
  Plus,
  RefreshCw,
  Trash2,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Webhook,
  Server,
  KeyRound,
  Smartphone,
  ScrollText,
  Info,
  CheckCheck,
  AlertTriangle,
  XCircle,
  Download,
  FileJson,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Settings = {
  id: string;
  server_url: string;
  api_key: string;
  webhook_secret: string;
};

type Provider = "evolution" | "meta_cloud";
type Instance = {
  id: string;
  name: string;
  provider: Provider;
  instance_key: string | null;
  phone_number: string | null;
  status: "disconnected" | "connecting" | "qr" | "connected" | "error";
  qr_code: string | null;
  last_sync: string | null;
  meta_phone_number_id?: string | null;
  meta_verify_token?: string | null;
  meta_display_phone_number?: string | null;
};

type EventLevel = "info" | "success" | "warning" | "error";
type InstanceEvent = {
  id: string;
  instance_id: string | null;
  event_type: string;
  level: EventLevel;
  message: string | null;
  details: any;
  created_at: string;
};

const statusMeta: Record<Instance["status"], { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  connected:    { label: "Conectado",     cls: "bg-success/15 text-success border-success/30",   Icon: CheckCircle2 },
  qr:           { label: "Aguardando QR", cls: "bg-warning/15 text-warning border-warning/30",   Icon: QrCode },
  connecting:   { label: "Conectando…",   cls: "bg-info/15 text-info border-info/30",            Icon: Loader2 },
  disconnected: { label: "Desconectado",  cls: "bg-secondary text-muted-foreground border-border", Icon: AlertCircle },
  error:        { label: "Erro",          cls: "bg-destructive/15 text-destructive border-destructive/30", Icon: AlertCircle },
};

export default function Integrations() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [serverUrl, setServerUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  const [instances, setInstances] = useState<Instance[]>([]);
  const [loadingInstances, setLoadingInstances] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newProvider, setNewProvider] = useState<"evolution" | "meta_cloud">("evolution");
  const [metaPhoneId, setMetaPhoneId] = useState("");
  const [metaWabaId, setMetaWabaId] = useState("");
  const [metaToken, setMetaToken] = useState("");
  const [metaAppSecret, setMetaAppSecret] = useState("");
  const [metaAppId, setMetaAppId] = useState("");
  const [metaApiVersion, setMetaApiVersion] = useState("v21.0");
  const [creating, setCreating] = useState(false);
  const [createStep, setCreateStep] = useState<"idle" | "saving" | "calling" | "qr" | "error">("idle");
  const [createError, setCreateError] = useState<string | null>(null);

  const [qrInstance, setQrInstance] = useState<Instance | null>(null);

  const [logsInstance, setLogsInstance] = useState<Instance | null>(null);
  const [events, setEvents] = useState<InstanceEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [exportFrom, setExportFrom] = useState<string>("");
  const [exportTo, setExportTo] = useState<string>("");
  const [exportJob, setExportJob] = useState<{
    id: string;
    format: "csv" | "json";
    status: "queued" | "running" | "done" | "error" | "cancelled";
    processed: number;
    total: number | null;
    message?: string;
    startedAt: number;
    finishedAt?: number;
  } | null>(null);
  const exportCancelRef = (typeof window !== "undefined" ? (window as any) : {}) as { __evoExportCancel?: boolean };

  const settingsValid = !!settings && !!settings.server_url && !!settings.api_key;
  const dirty =
    !!settings && (serverUrl.trim() !== settings.server_url || apiKey.trim() !== settings.api_key);
  const nameTaken = instances.some(
    (i) => i.name.toLowerCase() === newName.trim().toLowerCase(),
  );
  const nameValid = /^[a-z0-9][a-z0-9-_]{1,30}$/i.test(newName.trim());

  const webhookUrl = settings
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evo-webhook?secret=${settings.webhook_secret}`
    : "";

  useEffect(() => {
    void loadAll();
    const ch = supabase
      .channel("evo-instances-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "evo_instances" },
        () => void loadInstances(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!logsInstance) return;
    const ch = supabase
      .channel(`evo-events-${logsInstance.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "evo_instance_events", filter: `instance_id=eq.${logsInstance.id}` },
        (payload) => setEvents((prev) => [payload.new as InstanceEvent, ...prev]),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [logsInstance]);

  async function loadAll() {
    await Promise.all([loadSettings(), loadInstances()]);
  }

  async function loadSettings() {
    const { data } = await supabase.from("evo_settings").select("*").maybeSingle();
    if (data) {
      setSettings(data as Settings);
      setServerUrl(data.server_url);
      setApiKey(data.api_key);
    }
  }

  async function logEvent(
    instanceId: string | null,
    instanceName: string | null,
    event_type: string,
    level: EventLevel,
    message: string,
    details?: any,
  ) {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await supabase.from("evo_instance_events").insert({
      user_id: u.user.id,
      instance_id: instanceId,
      instance_name: instanceName,
      event_type,
      level,
      message,
      details: details ?? null,
    });
  }

  async function loadEvents(instanceId: string) {
    setLoadingEvents(true);
    const { data } = await supabase
      .from("evo_instance_events")
      .select("*")
      .eq("instance_id", instanceId)
      .order("created_at", { ascending: false })
      .limit(200);
    setEvents((data ?? []) as InstanceEvent[]);
    setLoadingEvents(false);
  }

  function openLogs(inst: Instance) {
    setLogsInstance(inst);
    void loadEvents(inst.id);
  }

  function downloadBlob(content: string, filename: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function csvEscape(v: any): string {
    if (v === null || v === undefined) return "";
    const s = typeof v === "string" ? v : JSON.stringify(v);
    if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }

  const yieldToUI = () =>
    new Promise<void>((resolve) => {
      const w = window as any;
      if (typeof w.requestIdleCallback === "function") {
        w.requestIdleCallback(() => resolve(), { timeout: 50 });
      } else {
        setTimeout(resolve, 0);
      }
    });

  function cancelExport() {
    exportCancelRef.__evoExportCancel = true;
    setExportJob((j) => (j && (j.status === "queued" || j.status === "running")
      ? { ...j, status: "cancelled", finishedAt: Date.now(), message: "Cancelado pelo usuário" }
      : j));
    toast.message("Export cancelado");
  }

  async function startExportJob(format: "csv" | "json") {
    if (!logsInstance) return;
    if (exportJob && (exportJob.status === "queued" || exportJob.status === "running")) {
      toast.warning("Já existe um export em andamento");
      return;
    }
    const jobId = crypto.randomUUID();
    exportCancelRef.__evoExportCancel = false;
    setExportJob({ id: jobId, format, status: "queued", processed: 0, total: null, startedAt: Date.now() });

    const PAGE = 500;
    const HARD_CAP = 50000;

    // Build base filter
    const fromIso = exportFrom ? new Date(exportFrom).toISOString() : null;
    let toIso: string | null = null;
    if (exportTo) {
      const end = new Date(exportTo);
      end.setHours(23, 59, 59, 999);
      toIso = end.toISOString();
    }

    // Try to estimate total (best-effort, non-blocking semantics)
    try {
      let cq = supabase
        .from("evo_instance_events")
        .select("id", { count: "exact", head: true })
        .eq("instance_id", logsInstance.id);
      if (fromIso) cq = cq.gte("created_at", fromIso);
      if (toIso) cq = cq.lte("created_at", toIso);
      const { count } = await cq;
      setExportJob((j) => (j && j.id === jobId ? { ...j, total: count ?? null, status: "running" } : j));
    } catch {
      setExportJob((j) => (j && j.id === jobId ? { ...j, status: "running" } : j));
    }

    const csvHeaders = ["created_at", "event_type", "level", "message", "instance_name", "details"];
    const chunks: string[] = [];
    if (format === "csv") chunks.push(csvHeaders.join(",") + "\n");
    else chunks.push("[\n");

    let processed = 0;
    let firstJson = true;
    let offset = 0;

    try {
      while (offset < HARD_CAP) {
        if (exportCancelRef.__evoExportCancel) break;

        let q = supabase
          .from("evo_instance_events")
          .select("*")
          .eq("instance_id", logsInstance.id)
          .order("created_at", { ascending: false })
          .range(offset, offset + PAGE - 1);
        if (fromIso) q = q.gte("created_at", fromIso);
        if (toIso) q = q.lte("created_at", toIso);

        const { data, error } = await q;
        if (error) throw new Error(error.message);
        const rows = (data ?? []) as InstanceEvent[];
        if (rows.length === 0) break;

        if (format === "json") {
          for (const r of rows) {
            chunks.push((firstJson ? "" : ",\n") + JSON.stringify(r));
            firstJson = false;
          }
        } else {
          for (const r of rows) {
            chunks.push(
              [
                csvEscape(r.created_at),
                csvEscape(r.event_type),
                csvEscape(r.level),
                csvEscape(r.message),
                csvEscape((r as any).instance_name),
                csvEscape(r.details),
              ].join(",") + "\n",
            );
          }
        }

        processed += rows.length;
        offset += rows.length;
        setExportJob((j) => (j && j.id === jobId ? { ...j, processed } : j));

        // Yield so UI stays responsive on big intervals
        await yieldToUI();
        if (rows.length < PAGE) break;
      }

      if (exportCancelRef.__evoExportCancel) return;

      if (processed === 0) {
        setExportJob((j) => (j && j.id === jobId
          ? { ...j, status: "done", finishedAt: Date.now(), message: "Nenhum evento no intervalo" }
          : j));
        toast.info("Nenhum evento no intervalo selecionado");
        return;
      }

      if (format === "json") chunks.push("\n]\n");

      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      const base = `logs-${logsInstance.name}-${stamp}`;
      const mime = format === "json" ? "application/json" : "text/csv;charset=utf-8";
      const blob = new Blob(chunks, { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${base}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportJob((j) => (j && j.id === jobId
        ? { ...j, status: "done", processed, finishedAt: Date.now(), message: `Arquivo gerado` }
        : j));
      toast.success(`${processed} evento(s) exportado(s)`);
    } catch (err: any) {
      setExportJob((j) => (j && j.id === jobId
        ? { ...j, status: "error", finishedAt: Date.now(), message: err?.message ?? "Falha ao exportar" }
        : j));
      toast.error(err?.message ?? "Falha ao exportar");
    }
  }

  async function loadInstances() {
    setLoadingInstances(true);
    const { data } = await supabase
      .from("evo_instances")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setInstances(data as Instance[]);
    setLoadingInstances(false);
  }

  async function saveSettings() {
    if (!serverUrl || !apiKey) {
      toast.error("Preencha URL e API Key");
      return;
    }
    setSavingSettings(true);
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) {
      toast.error("Sessão expirada");
      setSavingSettings(false);
      return;
    }
    const { error, data } = await supabase
      .from("evo_settings")
      .upsert(
        { user_id: uid, server_url: serverUrl.trim(), api_key: apiKey.trim() },
        { onConflict: "user_id" },
      )
      .select()
      .maybeSingle();
    setSavingSettings(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) setSettings(data as Settings);
    toast.success("Configurações salvas");
  }

  async function createInstance() {
    setCreateError(null);
    if (newProvider === "evolution" && !settingsValid) {
      setCreateError("Salve as configurações do servidor Evolution antes de criar uma instância Evolution.");
      return;
    }
    if (!nameValid) {
      setCreateError("Use 2–31 caracteres: letras, números, hífen ou underscore.");
      return;
    }
    if (nameTaken) {
      setCreateError("Já existe uma instância com esse nome.");
      return;
    }
    if (newProvider === "meta_cloud") {
      if (!metaPhoneId.trim() || !metaToken.trim()) {
        setCreateError("Phone Number ID e Access Token são obrigatórios.");
        return;
      }
    }

    setCreating(true);
    setCreateStep("saving");
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) {
      setCreating(false);
      setCreateStep("error");
      setCreateError("Sessão expirada. Faça login novamente.");
      return;
    }

    const baseRow: Record<string, unknown> = {
      user_id: uid,
      name: newName.trim(),
      provider: newProvider,
      status: newProvider === "meta_cloud" ? "connected" : "connecting",
    };
    if (newProvider === "meta_cloud") {
      Object.assign(baseRow, {
        meta_phone_number_id: metaPhoneId.trim(),
        meta_waba_id: metaWabaId.trim() || null,
        meta_access_token: metaToken.trim(),
        meta_app_secret: metaAppSecret.trim() || null,
        meta_app_id: metaAppId.trim() || null,
        meta_api_version: metaApiVersion.trim() || "v21.0",
        meta_verify_token: crypto.randomUUID().replace(/-/g, ""),
      });
    }

    const { data: inst, error: insErr } = await supabase
      .from("evo_instances")
      .insert(baseRow as any)
      .select()
      .maybeSingle();
    if (insErr || !inst) {
      setCreating(false);
      setCreateStep("error");
      setCreateError(insErr?.message ?? "Erro ao criar registro local.");
      return;
    }

    await logEvent(inst.id, inst.name, "instance.created", "info",
      `Instância criada (${newProvider === "meta_cloud" ? "Meta Cloud API" : "Evolution"})`);

    // ---- Meta Cloud: nothing else to call; just verify phone info ----
    if (newProvider === "meta_cloud") {
      setCreateStep("calling");
      const { data: probe, error: probeErr } = await supabase.functions.invoke("meta-proxy", {
        body: { instance_id: inst.id, action: "get_phone_info" },
      });
      if (probeErr || (probe as any)?.error) {
        await supabase.from("evo_instances").update({ status: "error" }).eq("id", inst.id);
        const msg = probeErr?.message ?? (probe as any)?.error ?? "Falha ao validar credenciais Meta";
        await logEvent(inst.id, inst.name, "meta.validate_failed", "error", msg, probe);
        setCreating(false);
        setCreateStep("error");
        setCreateError(msg);
        await loadInstances();
        return;
      }
      const display = (probe as any)?.data?.display_phone_number ?? null;
      if (display) {
        await supabase.from("evo_instances")
          .update({ meta_display_phone_number: display, phone_number: display })
          .eq("id", inst.id);
      }
      await logEvent(inst.id, inst.name, "meta.connected", "success", "Credenciais Meta validadas", probe);

      setCreating(false);
      setCreateOpen(false);
      resetNewForm();
      toast.success("Instância Meta criada e conectada");
      await loadInstances();
      return;
    }

    // ---- Evolution: original flow ----
    setCreateStep("calling");
    const { data: proxyRes, error: proxyErr } = await supabase.functions.invoke("evo-proxy", {
      body: {
        path: "/instance/create",
        method: "POST",
        body: {
          instanceName: newName.trim(),
          qrcode: true,
          integration: "WHATSAPP-BAILEYS",
          webhook: webhookUrl,
          webhook_by_events: false,
          events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE", "QRCODE_UPDATED"],
        },
        persistInstanceId: inst.id,
        persistFields: ["qr_code", "instance_key", "status"],
      },
    });

    if (proxyErr || (proxyRes && (proxyRes as any).ok === false)) {
      await supabase.from("evo_instances").update({ status: "error" }).eq("id", inst.id);
      const errMsg = proxyErr?.message ??
          "A Evolution API rejeitou a criação. Verifique URL, API Key e se o servidor está acessível.";
      await logEvent(inst.id, inst.name, "instance.create_failed", "error", errMsg, proxyRes);
      setCreating(false);
      setCreateStep("error");
      setCreateError(errMsg);
      await loadInstances();
      return;
    }

    await logEvent(inst.id, inst.name, "instance.connecting", "success", "Solicitação enviada à Evolution API");
    setCreateStep("qr");
    await loadInstances();
    const updated = (await supabase.from("evo_instances").select("*").eq("id", inst.id).maybeSingle()).data as Instance | null;

    setCreating(false);
    setCreateOpen(false);
    resetNewForm();
    toast.success("Instância criada — escaneie o QR Code");
    if (updated) setQrInstance(updated);
  }

  function resetNewForm() {
    setNewName("");
    setCreateStep("idle");
    setMetaPhoneId(""); setMetaWabaId(""); setMetaToken("");
    setMetaAppSecret(""); setMetaAppId(""); setMetaApiVersion("v21.0");
  }

  async function refreshQr(inst: Instance) {
    const { error } = await supabase.functions.invoke("evo-proxy", {
      body: {
        path: `/instance/connect/${encodeURIComponent(inst.name)}`,
        method: "GET",
        persistInstanceId: inst.id,
        persistFields: ["qr_code", "status"],
      },
    });
    if (error) {
      toast.error(error.message);
      await logEvent(inst.id, inst.name, "qr.refresh_failed", "error", error.message);
    } else {
      toast.success("QR atualizado");
      await logEvent(inst.id, inst.name, "qr.refresh", "info", "QR Code solicitado manualmente");
    }
    await loadInstances();
    const fresh = (await supabase.from("evo_instances").select("*").eq("id", inst.id).maybeSingle()).data as Instance | null;
    if (fresh) setQrInstance(fresh);
  }

  async function checkStatus(inst: Instance) {
    const { error } = await supabase.functions.invoke("evo-proxy", {
      body: {
        path: `/instance/connectionState/${encodeURIComponent(inst.name)}`,
        method: "GET",
        persistInstanceId: inst.id,
        persistFields: ["status", "phone_number"],
      },
    });
    if (error) {
      toast.error(error.message);
      await logEvent(inst.id, inst.name, "status.check_failed", "error", error.message);
    } else {
      toast.success("Status atualizado");
      await logEvent(inst.id, inst.name, "status.check", "info", "Status verificado manualmente");
    }
  }

  async function deleteInstance(inst: Instance) {
    if (!confirm(`Remover instância "${inst.name}"?`)) return;
    await logEvent(inst.id, inst.name, "instance.deleted", "warning", "Instância removida");
    // Try to delete on Evo first (best-effort)
    await supabase.functions.invoke("evo-proxy", {
      body: { path: `/instance/delete/${encodeURIComponent(inst.name)}`, method: "DELETE" },
    });
    await supabase.from("evo_instances").delete().eq("id", inst.id);
    toast.success("Instância removida");
    await loadInstances();
  }

  function copyWebhook() {
    navigator.clipboard.writeText(webhookUrl);
    toast.success("Webhook copiado");
  }

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-[1400px] mx-auto">
      <header className="space-y-1">
        <h2 className="text-2xl lg:text-3xl font-display font-semibold tracking-tight">Integrações</h2>
        <p className="text-sm text-muted-foreground">
          Conecte seu servidor <span className="text-foreground">Evolution API</span> e gerencie instâncias de WhatsApp.
        </p>
      </header>

      {/* Settings */}
      <section className="surface-card p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Server className="size-4 text-primary" />
          <h3 className="font-medium">Servidor Evolution API</h3>
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">URL do servidor</Label>
            <Input
              placeholder="https://evolution.seudominio.com"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              className="bg-secondary/40 border-border h-10 text-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <KeyRound className="size-3" /> API Key global
            </Label>
            <Input
              type="password"
              placeholder="••••••••••••"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="bg-secondary/40 border-border h-10 text-mono"
            />
          </div>
        </div>

        {settings && (
          <div className="surface-card p-4 space-y-2 border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2 text-xs text-primary">
              <Webhook className="size-3.5" />
              <span className="uppercase tracking-wider font-medium">Webhook receiver</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Configure este URL no campo <span className="text-mono">webhook</span> da sua instância para receber mensagens em tempo real.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[11px] text-mono bg-background border border-border rounded-md px-3 py-2 truncate">
                {webhookUrl}
              </code>
              <Button variant="outline" size="sm" onClick={copyWebhook} className="h-9 gap-1.5">
                <Copy className="size-3.5" /> Copiar
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-end items-center gap-3">
          {dirty && (
            <span className="text-xs text-warning flex items-center gap-1.5">
              <AlertCircle className="size-3.5" /> Alterações não salvas
            </span>
          )}
          <Button onClick={saveSettings} disabled={savingSettings || !serverUrl || !apiKey} className="bg-gradient-primary text-primary-foreground gap-2 h-9 shadow-glow">
            {savingSettings && <Loader2 className="size-3.5 animate-spin" />}
            Salvar configurações
          </Button>
        </div>
      </section>

      {!settingsValid && (
        <Alert variant="destructive" className="border-warning/40 bg-warning/10 text-warning [&>svg]:text-warning">
          <AlertCircle className="size-4" />
          <AlertTitle>Configurações pendentes</AlertTitle>
          <AlertDescription className="text-warning/90">
            Salve a URL do servidor e a API Key para criar instâncias e receber webhooks.
          </AlertDescription>
        </Alert>
      )}

      {/* Instances */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h3 className="font-medium flex items-center gap-2">
              <Smartphone className="size-4 text-primary" /> Instâncias WhatsApp
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cada instância representa um número conectado.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadInstances} className="gap-2 h-9">
              <RefreshCw className={`size-3.5 ${loadingInstances ? "animate-spin" : ""}`} /> Atualizar
            </Button>
            <Button
              size="sm"
              onClick={() => { setCreateError(null); setCreateOpen(true); }}
              disabled={!settingsValid || dirty}
              title={!settingsValid ? "Salve as configurações primeiro" : dirty ? "Salve as alterações antes de criar" : ""}
              className="bg-gradient-primary text-primary-foreground gap-2 h-9 shadow-glow"
            >
              <Plus className="size-4" /> Nova instância
            </Button>
          </div>
        </div>

        {instances.length === 0 ? (
          <div className="surface-card p-12 text-center">
            <div className="size-12 rounded-xl bg-primary/10 grid place-items-center mx-auto mb-4">
              <Smartphone className="size-5 text-primary" />
            </div>
            <p className="font-medium">Nenhuma instância ainda</p>
            <p className="text-sm text-muted-foreground mt-1">
              {settings ? "Crie uma instância para conectar um WhatsApp." : "Salve as configurações do servidor primeiro."}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {instances.map((inst) => {
              const meta = statusMeta[inst.status];
              const Icon = meta.Icon;
              return (
                <div key={inst.id} className="surface-card p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{inst.name}</div>
                      <div className="text-xs text-muted-foreground text-mono mt-0.5">
                        {inst.phone_number ?? "—"}
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] gap-1 ${meta.cls}`}>
                      <Icon className={`size-3 ${inst.status === "connecting" ? "animate-spin" : ""}`} />
                      {meta.label}
                    </Badge>
                  </div>

                  <div className="text-[11px] text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Última sync</span>
                      <span className="text-mono">
                        {inst.last_sync ? new Date(inst.last_sync).toLocaleString("pt-BR") : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {inst.status !== "connected" && (
                      <Button variant="outline" size="sm" onClick={() => { setQrInstance(inst); void refreshQr(inst); }} className="flex-1 gap-1.5 h-8">
                        <QrCode className="size-3.5" /> QR
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => checkStatus(inst)} className="flex-1 gap-1.5 h-8">
                      <RefreshCw className="size-3.5" /> Status
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openLogs(inst)} className="size-8" title="Ver logs">
                      <ScrollText className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteInstance(inst)} className="size-8 text-destructive hover:bg-destructive/10">
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Create dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(o) => {
          if (creating) return;
          setCreateOpen(o);
          if (!o) { setCreateError(null); resetNewForm(); }
        }}
      >
        <DialogContent className="glass-strong max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova instância WhatsApp</DialogTitle>
            <DialogDescription>
              Escolha o provedor: <span className="text-mono">Evolution</span> (não-oficial via QR) ou <span className="text-mono">Meta Cloud API</span> (oficial).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nome da instância</Label>
              <Input
                autoFocus
                disabled={creating}
                value={newName}
                onChange={(e) => { setCreateError(null); setNewName(e.target.value.replace(/[^a-z0-9-_]/gi, "")); }}
                placeholder="vendas-sp"
                className="bg-secondary/40 border-border text-mono"
              />
              <div className="flex justify-between text-[11px]">
                <span className={nameTaken ? "text-destructive" : "text-muted-foreground"}>
                  {nameTaken ? "Nome já existe" : "letras, números, - e _"}
                </span>
                <span className="text-muted-foreground text-mono">{newName.length}/31</span>
              </div>
            </div>

            <Tabs value={newProvider} onValueChange={(v) => setNewProvider(v as Provider)}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="evolution" disabled={creating}>Evolution (QR)</TabsTrigger>
                <TabsTrigger value="meta_cloud" disabled={creating}>Meta Cloud API</TabsTrigger>
              </TabsList>

              <TabsContent value="evolution" className="space-y-2 pt-3">
                <p className="text-xs text-muted-foreground">
                  Usa o servidor Evolution configurado acima. Você escaneará um QR no WhatsApp.
                </p>
                {!settingsValid && (
                  <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertDescription className="text-xs">
                      Configure URL e API Key da Evolution antes de criar.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="meta_cloud" className="space-y-3 pt-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Phone Number ID *</Label>
                    <Input
                      disabled={creating}
                      value={metaPhoneId}
                      onChange={(e) => setMetaPhoneId(e.target.value.trim())}
                      placeholder="123456789012345"
                      className="bg-secondary/40 text-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">WABA ID</Label>
                    <Input
                      disabled={creating}
                      value={metaWabaId}
                      onChange={(e) => setMetaWabaId(e.target.value.trim())}
                      placeholder="opcional"
                      className="bg-secondary/40 text-mono text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Access Token (permanente) *</Label>
                  <Textarea
                    disabled={creating}
                    value={metaToken}
                    onChange={(e) => setMetaToken(e.target.value)}
                    placeholder="EAAG..."
                    rows={2}
                    className="bg-secondary/40 text-mono text-xs"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1 col-span-2">
                    <Label className="text-[11px] text-muted-foreground">App Secret (recomendado)</Label>
                    <Input
                      disabled={creating}
                      type="password"
                      value={metaAppSecret}
                      onChange={(e) => setMetaAppSecret(e.target.value)}
                      placeholder="valida assinatura do webhook"
                      className="bg-secondary/40 text-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">API</Label>
                    <Input
                      disabled={creating}
                      value={metaApiVersion}
                      onChange={(e) => setMetaApiVersion(e.target.value.trim())}
                      placeholder="v21.0"
                      className="bg-secondary/40 text-mono text-xs"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Após criar, copie a <strong>URL do webhook</strong> e o <strong>verify token</strong> que aparecerão no card e cole no Meta for Developers → WhatsApp → Configuration.
                </p>
              </TabsContent>
            </Tabs>

            {creating && (
              <div className="space-y-2 surface-card p-3 border border-primary/20 bg-primary/5">
                <div className="flex items-center gap-2 text-xs text-primary">
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>
                    {createStep === "saving" && "Registrando instância…"}
                    {createStep === "calling" && (newProvider === "meta_cloud" ? "Validando credenciais Meta…" : "Conectando à Evolution API…")}
                    {createStep === "qr" && "Gerando QR Code…"}
                  </span>
                </div>
                <Progress
                  value={createStep === "saving" ? 25 : createStep === "calling" ? 65 : createStep === "qr" ? 95 : 0}
                  className="h-1.5"
                />
              </div>
            )}

            {createError && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertTitle>Não foi possível criar</AlertTitle>
                <AlertDescription>{createError}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>Cancelar</Button>
            <Button
              onClick={createInstance}
              disabled={
                creating || !newName || !nameValid || nameTaken ||
                (newProvider === "meta_cloud" && (!metaPhoneId || !metaToken))
              }
              className="bg-gradient-primary text-primary-foreground gap-2"
            >
              {creating && <Loader2 className="size-3.5 animate-spin" />}
              {creating
                ? "Criando…"
                : newProvider === "meta_cloud" ? "Criar instância Meta" : "Criar e gerar QR"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR dialog */}
      <Dialog open={!!qrInstance} onOpenChange={(o) => !o && setQrInstance(null)}>
        <DialogContent className="glass-strong max-w-sm">
          <DialogHeader>
            <DialogTitle>Escanear QR Code</DialogTitle>
            <DialogDescription>
              Abra o WhatsApp → Aparelhos conectados → Conectar aparelho.
            </DialogDescription>
          </DialogHeader>
          <div className="grid place-items-center py-4">
            {qrInstance?.qr_code ? (
              <img
                src={qrInstance.qr_code.startsWith("data:") ? qrInstance.qr_code : `data:image/png;base64,${qrInstance.qr_code}`}
                alt="QR Code WhatsApp"
                className="size-64 rounded-lg border border-border bg-white p-3"
              />
            ) : (
              <div className="size-64 rounded-lg border border-dashed border-border grid place-items-center text-muted-foreground">
                <Loader2 className="size-6 animate-spin" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => qrInstance && refreshQr(qrInstance)} className="gap-2">
              <RefreshCw className="size-3.5" /> Atualizar QR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logs Sheet */}
      <Sheet open={!!logsInstance} onOpenChange={(o) => !o && setLogsInstance(null)}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
          <SheetHeader className="p-6 border-b border-border">
            <SheetTitle className="flex items-center gap-2">
              <ScrollText className="size-4 text-primary" />
              Logs · <span className="text-mono">{logsInstance?.name}</span>
            </SheetTitle>
            <SheetDescription>
              Histórico de eventos da instância (mais recentes primeiro). Atualizado em tempo real.
            </SheetDescription>
            <div className="pt-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">De</Label>
                  <Input
                    type="date"
                    value={exportFrom}
                    onChange={(e) => setExportFrom(e.target.value)}
                    className="h-8 text-xs bg-secondary/40"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Até</Label>
                  <Input
                    type="date"
                    value={exportTo}
                    onChange={(e) => setExportTo(e.target.value)}
                    className="h-8 text-xs bg-secondary/40"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logsInstance && loadEvents(logsInstance.id)}
                  className="gap-2 h-8"
                >
                  <RefreshCw className={`size-3.5 ${loadingEvents ? "animate-spin" : ""}`} /> Atualizar
                </Button>
                <div className="flex gap-2">
                  {(() => {
                    const running = !!exportJob && (exportJob.status === "queued" || exportJob.status === "running");
                    return (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startExportJob("csv")}
                          disabled={running}
                          className="gap-1.5 h-8"
                        >
                          {running && exportJob?.format === "csv" ? <Loader2 className="size-3.5 animate-spin" /> : <FileSpreadsheet className="size-3.5" />}
                          CSV
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startExportJob("json")}
                          disabled={running}
                          className="gap-1.5 h-8"
                        >
                          {running && exportJob?.format === "json" ? <Loader2 className="size-3.5 animate-spin" /> : <FileJson className="size-3.5" />}
                          JSON
                        </Button>
                        {running ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={cancelExport}
                            className="h-8 text-xs text-destructive hover:text-destructive"
                          >
                            Cancelar
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setExportFrom(""); setExportTo(""); }}
                            disabled={!exportFrom && !exportTo}
                            className="h-8 text-xs"
                            title="Limpar intervalo"
                          >
                            Limpar
                          </Button>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {exportJob && (
                <div className="rounded-md border border-border/60 bg-secondary/30 p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="font-medium uppercase tracking-wider">
                      Job {exportJob.format} · {exportJob.status}
                    </span>
                    <span className="text-mono">
                      {exportJob.processed}
                      {exportJob.total != null ? ` / ${exportJob.total}` : ""}
                    </span>
                  </div>
                  <Progress
                    value={
                      exportJob.status === "done"
                        ? 100
                        : exportJob.total && exportJob.total > 0
                        ? Math.min(100, Math.round((exportJob.processed / exportJob.total) * 100))
                        : exportJob.status === "running"
                        ? Math.min(95, (exportJob.processed % 1000) / 10)
                        : 0
                    }
                    className="h-1.5"
                  />
                  {exportJob.message && (
                    <p className={`text-[11px] ${exportJob.status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
                      {exportJob.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="p-6 space-y-2">
              {loadingEvents && events.length === 0 ? (
                <div className="grid place-items-center py-16 text-muted-foreground">
                  <Loader2 className="size-5 animate-spin" />
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-16 text-sm text-muted-foreground">
                  Nenhum evento registrado ainda.
                </div>
              ) : (
                events.map((ev) => {
                  const meta = levelMeta[ev.level] ?? levelMeta.info;
                  const LIcon = meta.Icon;
                  return (
                    <div
                      key={ev.id}
                      className={`surface-card p-3 border-l-2 ${meta.border} space-y-1.5`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <LIcon className={`size-3.5 shrink-0 ${meta.text}`} />
                          <span className="text-xs font-medium text-mono truncate">
                            {ev.event_type}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground text-mono shrink-0">
                          {new Date(ev.created_at).toLocaleString("pt-BR")}
                        </span>
                      </div>
                      {ev.message && (
                        <p className="text-xs text-foreground/90 leading-relaxed">{ev.message}</p>
                      )}
                      {ev.details && (
                        <details className="text-[11px] text-muted-foreground">
                          <summary className="cursor-pointer hover:text-foreground">detalhes</summary>
                          <pre className="text-mono text-[10px] mt-1 p-2 bg-background border border-border rounded overflow-x-auto">
                            {JSON.stringify(ev.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}

const levelMeta: Record<EventLevel, { text: string; border: string; Icon: typeof Info }> = {
  info:    { text: "text-info",        border: "border-l-info",        Icon: Info },
  success: { text: "text-success",     border: "border-l-success",     Icon: CheckCheck },
  warning: { text: "text-warning",     border: "border-l-warning",     Icon: AlertTriangle },
  error:   { text: "text-destructive", border: "border-l-destructive", Icon: XCircle },
};
