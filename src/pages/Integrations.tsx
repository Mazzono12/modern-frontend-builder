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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Settings = {
  id: string;
  server_url: string;
  api_key: string;
  webhook_secret: string;
};

type Instance = {
  id: string;
  name: string;
  instance_key: string | null;
  phone_number: string | null;
  status: "disconnected" | "connecting" | "qr" | "connected" | "error";
  qr_code: string | null;
  last_sync: string | null;
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
  const [creating, setCreating] = useState(false);
  const [createStep, setCreateStep] = useState<"idle" | "saving" | "calling" | "qr" | "error">("idle");
  const [createError, setCreateError] = useState<string | null>(null);

  const [qrInstance, setQrInstance] = useState<Instance | null>(null);

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
    if (!settingsValid) {
      setCreateError("Salve as configurações do servidor antes de criar uma instância.");
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

    const { data: inst, error: insErr } = await supabase
      .from("evo_instances")
      .insert({ user_id: uid, name: newName.trim(), status: "connecting" })
      .select()
      .maybeSingle();
    if (insErr || !inst) {
      setCreating(false);
      setCreateStep("error");
      setCreateError(insErr?.message ?? "Erro ao criar registro local.");
      return;
    }

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
      // rollback local row
      await supabase.from("evo_instances").update({ status: "error" }).eq("id", inst.id);
      setCreating(false);
      setCreateStep("error");
      setCreateError(
        proxyErr?.message ??
          "A Evolution API rejeitou a criação. Verifique URL, API Key e se o servidor está acessível.",
      );
      await loadInstances();
      return;
    }

    setCreateStep("qr");
    await loadInstances();
    const updated = (await supabase.from("evo_instances").select("*").eq("id", inst.id).maybeSingle()).data as Instance | null;

    setCreating(false);
    setCreateOpen(false);
    setNewName("");
    setCreateStep("idle");
    toast.success("Instância criada — escaneie o QR Code");
    if (updated) setQrInstance(updated);
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
    if (error) toast.error(error.message);
    else toast.success("QR atualizado");
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
    if (error) toast.error(error.message);
    else toast.success("Status atualizado");
  }

  async function deleteInstance(inst: Instance) {
    if (!confirm(`Remover instância "${inst.name}"?`)) return;
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
          if (!o) { setCreateError(null); setCreateStep("idle"); setNewName(""); }
        }}
      >
        <DialogContent className="glass-strong max-w-md">
          <DialogHeader>
            <DialogTitle>Nova instância WhatsApp</DialogTitle>
            <DialogDescription>
              Um nome único para identificar esta conexão (ex: <span className="text-mono">vendas-sp</span>).
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

            {creating && (
              <div className="space-y-2 surface-card p-3 border border-primary/20 bg-primary/5">
                <div className="flex items-center gap-2 text-xs text-primary">
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>
                    {createStep === "saving" && "Registrando instância…"}
                    {createStep === "calling" && "Conectando à Evolution API…"}
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
              disabled={creating || !newName || !nameValid || nameTaken}
              className="bg-gradient-primary text-primary-foreground gap-2"
            >
              {creating && <Loader2 className="size-3.5 animate-spin" />}
              {creating ? "Criando…" : "Criar e gerar QR"}
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
    </div>
  );
}
