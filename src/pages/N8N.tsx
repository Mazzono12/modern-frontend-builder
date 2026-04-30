import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Workflow, Play, Pause, RefreshCw, Plug, ListChecks, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  tags?: { name: string }[];
  updatedAt?: string;
}

interface N8nExecution {
  id: string;
  finished: boolean;
  mode: string;
  status?: string;
  workflowId?: string;
  startedAt?: string;
  stoppedAt?: string;
}

export default function N8N() {
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [hasSettings, setHasSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [testing, setTesting] = useState(false);

  const [workflows, setWorkflows] = useState<N8nWorkflow[]>([]);
  const [loadingWorkflows, setLoadingWorkflows] = useState(false);
  const [executions, setExecutions] = useState<N8nExecution[]>([]);
  const [loadingExecutions, setLoadingExecutions] = useState(false);

  const [executePath, setExecutePath] = useState("");
  const [executePayload, setExecutePayload] = useState('{\n  "hello": "world"\n}');
  const [executing, setExecuting] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    const { data, error } = await supabase.from("n8n_settings").select("base_url, api_key").maybeSingle();
    if (error) { console.error(error); return; }
    if (data) {
      setBaseUrl(data.base_url);
      setApiKey(data.api_key);
      setHasSettings(true);
      loadWorkflows();
      loadExecutions();
    }
  }

  async function callProxy(action: string, extra: Record<string, unknown> = {}) {
    const { data, error } = await supabase.functions.invoke("n8n-proxy", {
      body: { action, ...extra },
    });
    if (error) throw new Error(error.message);
    if ((data as any)?.error) throw new Error((data as any).error);
    return (data as any)?.data;
  }

  async function testConnection() {
    if (!baseUrl || !apiKey) { toast.error("Preencha URL e API key"); return; }
    setTesting(true);
    try {
      await callProxy("test_connection", { base_url: baseUrl, api_key: apiKey, limit: 1 });
      toast.success("Conexão com n8n bem-sucedida");
    } catch (e) {
      toast.error("Falha ao testar conexão", { description: (e as Error).message });
    } finally { setTesting(false); }
  }

  async function saveSettings() {
    if (!baseUrl || !apiKey) { toast.error("Preencha URL e API key"); return; }
    setSavingSettings(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase.from("n8n_settings").upsert({
        user_id: user.id,
        base_url: baseUrl.replace(/\/+$/, ""),
        api_key: apiKey,
      }, { onConflict: "user_id" });
      if (error) throw error;

      setHasSettings(true);
      toast.success("Configurações salvas");
      await loadWorkflows();
      await loadExecutions();
    } catch (e) {
      toast.error("Erro ao salvar", { description: (e as Error).message });
    } finally { setSavingSettings(false); }
  }

  async function loadWorkflows() {
    setLoadingWorkflows(true);
    try {
      const data = await callProxy("list_workflows", { limit: 100 });
      const items = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setWorkflows(items);
    } catch (e) {
      toast.error("Erro ao listar workflows", { description: (e as Error).message });
    } finally { setLoadingWorkflows(false); }
  }

  async function loadExecutions() {
    setLoadingExecutions(true);
    try {
      const data = await callProxy("list_executions", { limit: 50 });
      const items = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setExecutions(items);
    } catch (e) {
      toast.error("Erro ao listar execuções", { description: (e as Error).message });
    } finally { setLoadingExecutions(false); }
  }

  async function toggleActive(wf: N8nWorkflow) {
    try {
      await callProxy(wf.active ? "deactivate_workflow" : "activate_workflow", { workflow_id: wf.id });
      toast.success(`Workflow ${wf.active ? "desativado" : "ativado"}`);
      loadWorkflows();
    } catch (e) {
      toast.error("Falha", { description: (e as Error).message });
    }
  }

  async function executeWebhook() {
    if (!executePath.trim()) { toast.error("Informe o path do webhook"); return; }
    let payload: Record<string, unknown> = {};
    try { payload = JSON.parse(executePayload || "{}"); } catch { toast.error("JSON inválido"); return; }
    setExecuting(true);
    try {
      const data = await callProxy("execute_workflow", { workflow_id: executePath.trim(), payload });
      toast.success("Webhook disparado", { description: typeof data === "string" ? data : "OK" });
    } catch (e) {
      toast.error("Falha ao disparar webhook", { description: (e as Error).message });
    } finally { setExecuting(false); }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-lg bg-primary/10 border border-primary/20 grid place-items-center">
          <Workflow className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">n8n · Agentes & Automação</h1>
          <p className="text-sm text-muted-foreground">Conecte sua instância n8n e controle workflows direto daqui.</p>
        </div>
      </div>

      <Tabs defaultValue={hasSettings ? "workflows" : "settings"} className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings"><Plug className="size-3.5 mr-1.5" />Conexão</TabsTrigger>
          <TabsTrigger value="workflows" disabled={!hasSettings}><Workflow className="size-3.5 mr-1.5" />Workflows</TabsTrigger>
          <TabsTrigger value="executions" disabled={!hasSettings}><ListChecks className="size-3.5 mr-1.5" />Execuções</TabsTrigger>
          <TabsTrigger value="execute" disabled={!hasSettings}><Sparkles className="size-3.5 mr-1.5" />Disparar</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Credenciais do n8n</CardTitle>
              <CardDescription>
                Pegue uma API key em <strong>Settings → n8n API</strong> da sua instância. URL pode ser n8n Cloud, self-hosted ou Docker.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="n8n-url">URL base</Label>
                <Input id="n8n-url" placeholder="https://meu-n8n.app.n8n.cloud" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="n8n-key">API Key</Label>
                <Input id="n8n-key" type="password" placeholder="n8n_api_..." value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={testConnection} disabled={testing}>
                  {testing ? <Loader2 className="size-4 animate-spin mr-2" /> : <Plug className="size-4 mr-2" />}
                  Testar conexão
                </Button>
                <Button onClick={saveSettings} disabled={savingSettings}>
                  {savingSettings && <Loader2 className="size-4 animate-spin mr-2" />}
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Workflows ({workflows.length})</CardTitle>
                <CardDescription>Ative, desative ou abra na sua instância n8n.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={loadWorkflows} disabled={loadingWorkflows}>
                <RefreshCw className={`size-3.5 mr-2 ${loadingWorkflows ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
            </CardHeader>
            <CardContent>
              {workflows.length === 0 && !loadingWorkflows && (
                <p className="text-sm text-muted-foreground py-8 text-center">Nenhum workflow encontrado.</p>
              )}
              <div className="divide-y divide-border">
                {workflows.map((wf) => (
                  <div key={wf.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{wf.name}</span>
                        <Badge variant={wf.active ? "default" : "secondary"}>{wf.active ? "ativo" : "inativo"}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">id: <span className="font-mono">{wf.id}</span></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => toggleActive(wf)}>
                        {wf.active ? <Pause className="size-3.5 mr-1.5" /> : <Play className="size-3.5 mr-1.5" />}
                        {wf.active ? "Desativar" : "Ativar"}
                      </Button>
                      <Button size="sm" variant="ghost" asChild>
                        <a href={`${baseUrl.replace(/\/+$/, "")}/workflow/${wf.id}`} target="_blank" rel="noreferrer">Abrir ↗</a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="executions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Execuções recentes</CardTitle>
                <CardDescription>Últimas 50 execuções da sua instância.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={loadExecutions} disabled={loadingExecutions}>
                <RefreshCw className={`size-3.5 mr-2 ${loadingExecutions ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
            </CardHeader>
            <CardContent>
              {executions.length === 0 && !loadingExecutions && (
                <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma execução ainda.</p>
              )}
              <div className="divide-y divide-border">
                {executions.map((ex) => (
                  <div key={ex.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{ex.id}</span>
                        <Badge variant={ex.status === "success" || ex.finished ? "default" : "destructive"}>
                          {ex.status ?? (ex.finished ? "finished" : "running")}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{ex.mode}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        wf: <span className="font-mono">{ex.workflowId}</span> · {ex.startedAt}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="execute">
          <Card>
            <CardHeader>
              <CardTitle>Disparar via Webhook</CardTitle>
              <CardDescription>
                Para workflows com nó <strong>Webhook</strong>, informe o path (sem <code>/webhook/</code>) e o payload JSON.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="wb-path">Path do webhook</Label>
                <Input id="wb-path" placeholder="meu-agente-ia" value={executePath} onChange={(e) => setExecutePath(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wb-payload">Payload (JSON)</Label>
                <Textarea id="wb-payload" rows={8} className="font-mono text-xs" value={executePayload} onChange={(e) => setExecutePayload(e.target.value)} />
              </div>
              <Button onClick={executeWebhook} disabled={executing}>
                {executing ? <Loader2 className="size-4 animate-spin mr-2" /> : <Play className="size-4 mr-2" />}
                Disparar
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
