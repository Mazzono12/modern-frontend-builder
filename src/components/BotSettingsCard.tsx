import { useEffect, useState } from "react";
import { Bot, Save, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MODELS = [
  { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash · rápido (grátis)" },
  { value: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite · ultra rápido (grátis)" },
  { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro · raciocínio avançado" },
  { value: "openai/gpt-5-mini", label: "GPT-5 Mini · equilibrado" },
  { value: "openai/gpt-5", label: "GPT-5 · máxima qualidade" },
  { value: "openai/gpt-5-nano", label: "GPT-5 Nano · barato e veloz" },
];

type BotSettings = {
  enabled: boolean;
  name: string;
  welcome_message: string;
  system_prompt: string;
  model: string;
  temperature: number;
  quick_replies: string[];
  status_text: string;
};

const DEFAULTS: BotSettings = {
  enabled: true,
  name: "CIFHER AI",
  welcome_message: "Oi! Sou o assistente CIFHER ✨ Como posso ajudar?",
  system_prompt:
    "Você é um assistente útil e profissional do CIFHER, plataforma de atendimento omnichannel. Responda de forma clara e objetiva em português.",
  model: "google/gemini-2.5-flash",
  temperature: 0.7,
  quick_replies: ["Como criar campanha?", "Ver métricas de hoje", "Treinar chatbot", "Falar com humano"],
  status_text: "Online · resposta em segundos",
};

export function BotSettingsCard() {
  const [s, setS] = useState<BotSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newReply, setNewReply] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("bot_settings").select("*").maybeSingle();
      if (data) {
        setS({
          enabled: data.enabled,
          name: data.name,
          welcome_message: data.welcome_message,
          system_prompt: data.system_prompt,
          model: data.model,
          temperature: Number(data.temperature),
          quick_replies: Array.isArray(data.quick_replies) ? (data.quick_replies as string[]) : DEFAULTS.quick_replies,
          status_text: data.status_text,
        });
      }
      setLoading(false);
    })();
  }, []);

  async function save() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Faça login para salvar");
      const { error } = await supabase
        .from("bot_settings")
        .upsert({ ...s, user_id: user.id }, { onConflict: "user_id" });
      if (error) throw error;
      toast.success("Configurações do assistente salvas");
      window.dispatchEvent(new CustomEvent("bot-settings-updated"));
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  }

  function addReply() {
    const v = newReply.trim();
    if (!v) return;
    setS({ ...s, quick_replies: [...s.quick_replies, v] });
    setNewReply("");
  }

  return (
    <section className="glass rounded-xl p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-gradient-primary text-primary-foreground grid place-items-center shadow-glow">
            <Bot className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-medium">Assistente IA (chat flutuante)</h3>
            <p className="text-xs text-muted-foreground">Personalize o comportamento, modelo e respostas</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{s.enabled ? "Ativo" : "Desativado"}</span>
          <Switch checked={s.enabled} onCheckedChange={(v) => setS({ ...s, enabled: v })} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Carregando…</div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome do assistente</Label>
              <Input value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} className="h-9 text-sm bg-secondary/40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Texto de status</Label>
              <Input value={s.status_text} onChange={(e) => setS({ ...s, status_text: e.target.value })} className="h-9 text-sm bg-secondary/40" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Mensagem de boas-vindas</Label>
            <Textarea rows={2} value={s.welcome_message} onChange={(e) => setS({ ...s, welcome_message: e.target.value })} className="text-sm bg-secondary/40" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Instruções do sistema (personalidade e regras)</Label>
            <Textarea rows={6} value={s.system_prompt} onChange={(e) => setS({ ...s, system_prompt: e.target.value })} className="text-sm bg-secondary/40" />
            <p className="text-[11px] text-muted-foreground">Diga ao bot quem ele é, tom de voz, o que pode e o que não pode responder.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Modelo de IA</Label>
              <Select value={s.model} onValueChange={(v) => setS({ ...s, model: v })}>
                <SelectTrigger className="h-9 text-sm bg-secondary/40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MODELS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center justify-between">
                <span>Criatividade (temperature)</span>
                <span className="text-mono text-muted-foreground">{s.temperature.toFixed(1)}</span>
              </Label>
              <Slider value={[s.temperature]} min={0} max={1.5} step={0.1} onValueChange={([v]) => setS({ ...s, temperature: v })} />
              <p className="text-[11px] text-muted-foreground">Baixo = mais preciso · Alto = mais criativo</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Sugestões rápidas (atalhos no chat)</Label>
            <div className="flex flex-wrap gap-1.5">
              {s.quick_replies.map((q, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-border bg-secondary/40">
                  {q}
                  <button onClick={() => setS({ ...s, quick_replies: s.quick_replies.filter((_, idx) => idx !== i) })} className="text-muted-foreground hover:text-destructive">
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newReply} onChange={(e) => setNewReply(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addReply())} placeholder="Nova sugestão…" className="h-9 text-sm bg-secondary/40" />
              <Button type="button" variant="outline" size="sm" onClick={addReply} className="h-9 gap-1"><Plus className="size-3.5" /> Adicionar</Button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={save} disabled={saving} size="sm" className="h-9 bg-gradient-primary text-primary-foreground gap-1 shadow-glow">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Salvar assistente
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
