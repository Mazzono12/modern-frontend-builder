import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Filter,
  Phone,
  Video,
  MoreHorizontal,
  Paperclip,
  Smile,
  Send,
  Star,
  Tag,
  CheckCheck,
  Inbox as InboxIcon,
  Instagram,
  MessageCircle,
  Mail,
  Facebook,
  Loader2,
  Smartphone,
  X,
  FileImage,
  FileVideo,
  FileAudio,
  File as FileIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Channel = "whatsapp" | "instagram" | "messenger" | "email";

const channelMeta: Record<
  Channel,
  { label: string; icon: typeof MessageCircle; color: string; bg: string }
> = {
  whatsapp: { label: "WhatsApp", icon: MessageCircle, color: "text-success", bg: "bg-success/15 border-success/30" },
  instagram: { label: "Instagram", icon: Instagram, color: "text-pink-400", bg: "bg-pink-500/15 border-pink-500/30" },
  messenger: { label: "Messenger", icon: Facebook, color: "text-info", bg: "bg-info/15 border-info/30" },
  email: { label: "Email", icon: Mail, color: "text-muted-foreground", bg: "bg-secondary border-border" },
};

type Conv = {
  id: string;
  name: string;
  initials: string;
  preview: string;
  time: string;
  unread?: number;
  tag?: string;
  status: "online" | "offline";
  pinned?: boolean;
  channel: Channel;
  /** Optional default JID for WhatsApp send. Leave undefined to require manual input. */
  jid?: string;
};

const conversations: Conv[] = [
  { id: "1", name: "Camila Ferreira", initials: "CF", preview: "Perfeito, vou conferir e te retorno até o fim do dia.", time: "14:42", unread: 2, tag: "Vendas", status: "online", pinned: true, channel: "whatsapp" },
  { id: "2", name: "Pedro Henrique", initials: "PH", preview: "Comprovante anexado ✅", time: "14:30", tag: "Cobrança", status: "online", channel: "whatsapp" },
  { id: "3", name: "@larissa.souza", initials: "LS", preview: "Vi o post de vocês — esse vestido ainda tem?", time: "14:12", unread: 1, tag: "Vendas", status: "offline", channel: "instagram" },
  { id: "4", name: "Marcos Vieira", initials: "MV", preview: "Vocês têm o catálogo atualizado?", time: "13:58", tag: "Vendas", status: "online", channel: "messenger" },
  { id: "5", name: "renata@studior.com", initials: "RA", preview: "Obrigada pela proposta, vou avaliar internamente.", time: "13:22", tag: "Enterprise", status: "offline", channel: "email" },
  { id: "6", name: "Felipe Cardoso", initials: "FC", preview: "Gostaria de cancelar o plano premium.", time: "12:48", tag: "Retenção", status: "offline", channel: "whatsapp" },
  { id: "7", name: "@ana.beatriz", initials: "AB", preview: "Adorei o atendimento de vocês 💜", time: "11:30", tag: "NPS", status: "offline", channel: "instagram" },
];

type ChatMessage = {
  id: string;
  from: "me" | "them";
  text?: string;
  time: string;
  media?: { kind: "image" | "video" | "audio" | "document"; name: string; preview?: string };
  status?: "sending" | "sent" | "error";
};

const initialMessages: ChatMessage[] = [
  { id: "m1", from: "them", text: "Oi Sara! Vi que vocês têm aquele plano anual com 20% off ainda?", time: "14:38" },
  { id: "m2", from: "me", text: "Olá Camila! Sim, a promoção segue até sexta. Quer que eu te envie o link de checkout?", time: "14:39", status: "sent" },
  { id: "m3", from: "them", text: "Por favor! E se possível também a comparação dos planos.", time: "14:40" },
  { id: "m4", from: "me", text: "Claro, segue 👇", time: "14:40", status: "sent" },
  { id: "m5", from: "me", text: "🔗 https://acme.com/checkout/anual-20\n📊 https://acme.com/planos", time: "14:40", status: "sent" },
  { id: "m6", from: "them", text: "Perfeito, vou conferir e te retorno até o fim do dia.", time: "14:42" },
];

type EvoInstance = {
  id: string;
  name: string;
  status: string;
  phone_number: string | null;
  provider: "evolution" | "meta_cloud";
};

/** Best-effort: turns "5511999998888" or "5511999998888@s.whatsapp.net" into a normalized JID. */
function normalizeJid(input: string): string {
  const v = input.trim();
  if (!v) return "";
  if (v.includes("@")) return v;
  const digits = v.replace(/\D/g, "");
  if (!digits) return "";
  // Group JID heuristic: long numeric ids get @g.us; otherwise individual.
  return digits.length > 15 ? `${digits}@g.us` : `${digits}@s.whatsapp.net`;
}

function fileKind(file: File): "image" | "video" | "audio" | "document" {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return "document";
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      // strip data URL prefix → keep raw base64
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function nowHHMM() {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function Inbox() {
  const [active, setActive] = useState("1");
  const [filter, setFilter] = useState<"todas" | "minhas" | "fechadas">("todas");
  const [channel, setChannel] = useState<Channel | "all">("all");

  const [instances, setInstances] = useState<EvoInstance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string>("");
  const [destJid, setDestJid] = useState("");
  const [draft, setDraft] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [thread, setThread] = useState<ChatMessage[]>(initialMessages);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () => conversations.filter((c) => channel === "all" || c.channel === channel),
    [channel],
  );

  const channels: { id: Channel | "all"; label: string; icon: typeof InboxIcon; count: number }[] = [
    { id: "all", label: "Tudo", icon: InboxIcon, count: conversations.length },
    { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, count: conversations.filter((c) => c.channel === "whatsapp").length },
    { id: "instagram", label: "Instagram", icon: Instagram, count: conversations.filter((c) => c.channel === "instagram").length },
    { id: "messenger", label: "Messenger", icon: Facebook, count: conversations.filter((c) => c.channel === "messenger").length },
    { id: "email", label: "Email", icon: Mail, count: conversations.filter((c) => c.channel === "email").length },
  ];

  const activeConv = conversations.find((c) => c.id === active) ?? conversations[0];
  const cm = channelMeta[activeConv.channel];
  const isWhatsapp = activeConv.channel === "whatsapp";

  // Load WhatsApp instances for the sender selector
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("evo_instances")
        .select("id, name, status, phone_number, provider")
        .order("created_at", { ascending: false });
      if (!mounted || !data) return;
      setInstances(data as EvoInstance[]);
      // auto-pick a connected instance as default
      const connected = (data as EvoInstance[]).find((i) => i.status === "connected");
      if (connected) setSelectedInstance(connected.name);
      else if (data[0]) setSelectedInstance((data[0] as EvoInstance).name);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Default the destination JID when switching conversations
  useEffect(() => {
    setDestJid(activeConv.jid ?? "");
  }, [active, activeConv.jid]);

  function attachFile() {
    fileInputRef.current?.click();
  }

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (f.size > 16 * 1024 * 1024) {
      toast.error("Arquivo maior que 16 MB não é suportado pelo WhatsApp.");
      return;
    }
    setPendingFile(f);
    if (f.type.startsWith("image/")) {
      setPendingPreview(URL.createObjectURL(f));
    } else {
      setPendingPreview(null);
    }
  }

  function clearAttachment() {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(null);
    setPendingPreview(null);
  }

  async function handleSend() {
    const text = draft.trim();
    if (!text && !pendingFile) return;

    if (!isWhatsapp) {
      toast.error("Envio real está disponível apenas para WhatsApp por enquanto.");
      return;
    }
    if (!selectedInstance) {
      toast.error("Selecione uma instância WhatsApp conectada.");
      return;
    }
    const jid = normalizeJid(destJid);
    if (!jid) {
      toast.error("Informe o número (JID) do destinatário.");
      return;
    }

    setSending(true);

    // Optimistic message in the thread
    const optimisticId = `tmp-${Date.now()}`;
    const optimistic: ChatMessage = pendingFile
      ? {
          id: optimisticId,
          from: "me",
          text: text || undefined,
          time: nowHHMM(),
          status: "sending",
          media: {
            kind: fileKind(pendingFile),
            name: pendingFile.name,
            preview: pendingPreview ?? undefined,
          },
        }
      : { id: optimisticId, from: "me", text, time: nowHHMM(), status: "sending" };
    setThread((t) => [...t, optimistic]);

    try {
      const inst = instances.find((i) => i.name === selectedInstance);
      if (!inst) throw new Error("Instância não encontrada");

      if (inst.provider === "meta_cloud") {
        // Meta Cloud API path
        const toDigits = jid.replace(/\D/g, "");
        let metaPayload: Record<string, unknown>;
        let action: "send_text" | "send_media";
        if (pendingFile) {
          action = "send_media";
          const base64 = await fileToBase64(pendingFile);
          // Meta requires an HTTPS link or a pre-uploaded media id; data URL is not accepted.
          // For now, surface a clear error so the user can adapt (e.g. upload to Storage first).
          if (base64.startsWith("data:")) {
            throw new Error("Meta exige link HTTPS ou media_id. Hospede o arquivo (ex.: Storage) e use a URL pública.");
          }
          metaPayload = {
            to: toDigits,
            kind: fileKind(pendingFile),
            link: base64,
            caption: text || undefined,
            filename: pendingFile.name,
          };
        } else {
          action = "send_text";
          metaPayload = { to: toDigits, body: text };
        }
        const { data, error } = await supabase.functions.invoke("meta-proxy", {
          body: { instance_id: inst.id, action, payload: metaPayload },
        });
        if (error) throw new Error(error.message);
        if ((data as any)?.error) throw new Error((data as any).error);
      } else {
        // Evolution path (original)
        let proxyBody: Record<string, unknown>;
        let path: string;
        if (pendingFile) {
          const base64 = await fileToBase64(pendingFile);
          const kind = fileKind(pendingFile);
          path = `/message/sendMedia/${encodeURIComponent(selectedInstance)}`;
          proxyBody = {
            number: jid,
            mediatype: kind,
            mimetype: pendingFile.type || "application/octet-stream",
            caption: text || undefined,
            media: base64,
            fileName: pendingFile.name,
          };
        } else {
          path = `/message/sendText/${encodeURIComponent(selectedInstance)}`;
          proxyBody = {
            number: jid,
            text,
            options: { delay: 0, presence: "composing" },
          };
        }

        const { data, error } = await supabase.functions.invoke("evo-proxy", {
          body: { path, method: "POST", body: proxyBody },
        });
        if (error) throw new Error(error.message);
        const ok = (data as { ok?: boolean })?.ok;
        if (ok === false) {
          const detail = (data as { data?: unknown })?.data;
          throw new Error(
            typeof detail === "string"
              ? detail
              : (detail as { message?: string })?.message ?? "Falha no envio",
          );
        }
      }

      setThread((t) =>
        t.map((m) => (m.id === optimisticId ? { ...m, status: "sent" } : m)),
      );
      setDraft("");
      clearAttachment();
      toast.success(pendingFile ? "Mídia enviada" : "Mensagem enviada");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar";
      setThread((t) =>
        t.map((m) => (m.id === optimisticId ? { ...m, status: "error" } : m)),
      );
      toast.error(msg);
    } finally {
      setSending(false);
    }
  }

  function onTextareaKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <div className="grid grid-cols-[64px_320px_1fr_320px] h-[calc(100vh-3.5rem)] bg-background">
      {/* Channel rail */}
      <aside className="border-r border-border flex flex-col items-center py-3 gap-1 bg-sidebar/40">
        {channels.map((c) => {
          const isActive = channel === c.id;
          const Icon = c.icon;
          return (
            <button
              key={c.id}
              onClick={() => setChannel(c.id)}
              title={c.label}
              className={`relative size-11 rounded-xl grid place-items-center transition-all ${
                isActive
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="size-4" />
              {c.count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 text-[9px] font-medium text-mono bg-primary text-primary-foreground rounded-full min-w-4 h-4 px-1 grid place-items-center">
                  {c.count}
                </span>
              )}
            </button>
          );
        })}
      </aside>

      {/* Conversations list */}
      <aside className="border-r border-border flex flex-col bg-background-elev/40">
        <div className="p-3 border-b border-border space-y-3">
          <div className="relative">
            <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar conversas…" className="pl-8 h-9 bg-secondary/40 border-border text-sm" />
          </div>
          <div className="flex items-center gap-1 text-xs">
            {(["todas", "minhas", "fechadas"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                  filter === f ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {f}
              </button>
            ))}
            <Button variant="ghost" size="icon" className="size-7 ml-auto">
              <Filter className="size-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {filtered.map((c) => {
            const m = channelMeta[c.channel];
            const Ic = m.icon;
            return (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={`w-full flex gap-3 px-3 py-3 border-l-2 transition-colors text-left ${
                  active === c.id ? "bg-secondary/60 border-primary" : "border-transparent hover:bg-secondary/30"
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-secondary text-xs">{c.initials}</AvatarFallback>
                  </Avatar>
                  <span
                    className={`absolute -bottom-1 -right-1 size-4 rounded-full grid place-items-center ring-2 ring-background-elev ${m.bg}`}
                  >
                    <Ic className={`size-2.5 ${m.color}`} />
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate flex items-center gap-1">
                      {c.pinned && <Star className="size-3 text-primary fill-primary" />}
                      {c.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground text-mono shrink-0">{c.time}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground truncate">{c.preview}</span>
                    {c.unread && (
                      <span className="text-[10px] font-medium text-mono bg-primary text-primary-foreground rounded-full size-4 grid place-items-center shrink-0">
                        {c.unread}
                      </span>
                    )}
                  </div>
                  {c.tag && (
                    <span className="inline-block mt-1.5 text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground border border-border">
                      {c.tag}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Thread */}
      <section className="flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center px-5 gap-3 glass">
          <Avatar className="size-8">
            <AvatarFallback className="bg-secondary text-xs">{activeConv.initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium flex items-center gap-2">
              {activeConv.name}
              <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md border ${cm.bg}`}>
                <cm.icon className={`size-2.5 ${cm.color}`} />
                {cm.label}
              </span>
            </div>
            <div className="text-[11px] text-success flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-success" />
              {activeConv.status === "online" ? "online agora" : "offline"}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground"><Phone className="size-4" /></Button>
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground"><Video className="size-4" /></Button>
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground"><MoreHorizontal className="size-4" /></Button>
        </header>

        {/* Send-as bar (WhatsApp only) */}
        {isWhatsapp && (
          <div className="border-b border-border bg-background-elev/60 px-5 py-2.5 flex flex-wrap items-center gap-2 text-xs">
            <Smartphone className="size-3.5 text-primary shrink-0" />
            <span className="text-muted-foreground shrink-0">Enviar de</span>
            <Select value={selectedInstance} onValueChange={setSelectedInstance}>
              <SelectTrigger className="h-8 w-[180px] bg-secondary/50 border-border text-xs">
                <SelectValue placeholder={instances.length ? "Selecione…" : "Nenhuma instância"} />
              </SelectTrigger>
              <SelectContent>
                {instances.map((i) => (
                  <SelectItem key={i.id} value={i.name} className="text-xs">
                    <span className="flex items-center gap-2">
                      <span
                        className={`size-1.5 rounded-full ${
                          i.status === "connected" ? "bg-success" : "bg-muted-foreground/50"
                        }`}
                      />
                      {i.name}
                      {i.phone_number && (
                        <span className="text-muted-foreground text-mono">· {i.phone_number}</span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground shrink-0">para</span>
            <Input
              value={destJid}
              onChange={(e) => setDestJid(e.target.value)}
              placeholder="55119999... ou 55119999@s.whatsapp.net"
              className="h-8 w-[260px] bg-secondary/50 border-border text-xs text-mono"
            />
            {!instances.some((i) => i.status === "connected") && (
              <span className="ml-auto text-[10px] text-warning">
                Nenhuma instância conectada — verifique em Integrações.
              </span>
            )}
          </div>
        )}

        <div className="flex-1 overflow-auto p-6 space-y-4 dot-pattern">
          <div className="text-center">
            <span className="text-[11px] text-muted-foreground bg-background-elev px-2.5 py-1 rounded-full border border-border">
              hoje · 14:38
            </span>
          </div>
          {thread.map((m) => (
            <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[68%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-line shadow-card ${
                  m.from === "me"
                    ? "bg-gradient-to-br from-primary to-primary-glow text-primary-foreground rounded-br-sm"
                    : "bg-card text-card-foreground border border-border rounded-bl-sm"
                } ${m.status === "error" ? "ring-1 ring-destructive/60" : ""}`}
              >
                {m.media && (
                  <div
                    className={`mb-1.5 rounded-lg overflow-hidden border ${
                      m.from === "me" ? "border-primary-foreground/20" : "border-border"
                    }`}
                  >
                    {m.media.kind === "image" && m.media.preview ? (
                      <img src={m.media.preview} alt={m.media.name} className="max-h-56 w-full object-cover" />
                    ) : (
                      <div
                        className={`flex items-center gap-2 px-3 py-2 text-xs ${
                          m.from === "me" ? "bg-primary-foreground/10" : "bg-secondary"
                        }`}
                      >
                        {m.media.kind === "video" ? (
                          <FileVideo className="size-4" />
                        ) : m.media.kind === "audio" ? (
                          <FileAudio className="size-4" />
                        ) : m.media.kind === "image" ? (
                          <FileImage className="size-4" />
                        ) : (
                          <FileIcon className="size-4" />
                        )}
                        <span className="truncate">{m.media.name}</span>
                      </div>
                    )}
                  </div>
                )}
                {m.text}
                <div
                  className={`flex items-center gap-1 mt-1 text-[10px] ${
                    m.from === "me" ? "text-primary-foreground/70 justify-end" : "text-muted-foreground"
                  }`}
                >
                  {m.time}
                  {m.from === "me" && m.status === "sending" && <Loader2 className="size-3 animate-spin" />}
                  {m.from === "me" && m.status === "sent" && <CheckCheck className="size-3" />}
                  {m.from === "me" && m.status === "error" && <span className="text-destructive">falhou</span>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <footer className="p-4 border-t border-border bg-background-elev/40">
          {pendingFile && (
            <div className="glass rounded-xl p-2.5 mb-2 flex items-center gap-3">
              {pendingPreview ? (
                <img src={pendingPreview} alt="" className="size-12 rounded-md object-cover border border-border" />
              ) : (
                <div className="size-12 rounded-md bg-secondary border border-border grid place-items-center">
                  {fileKind(pendingFile) === "video" ? (
                    <FileVideo className="size-5 text-muted-foreground" />
                  ) : fileKind(pendingFile) === "audio" ? (
                    <FileAudio className="size-5 text-muted-foreground" />
                  ) : (
                    <FileIcon className="size-5 text-muted-foreground" />
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{pendingFile.name}</div>
                <div className="text-[10px] text-muted-foreground text-mono">
                  {(pendingFile.size / 1024).toFixed(1)} KB · {fileKind(pendingFile)}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="size-7" onClick={clearAttachment}>
                <X className="size-3.5" />
              </Button>
            </div>
          )}
          <div className="glass rounded-xl p-2 flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.zip"
              onChange={onFileSelected}
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground shrink-0"
              onClick={attachFile}
              disabled={sending}
              title="Anexar mídia"
            >
              <Paperclip className="size-4" />
            </Button>
            <textarea
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onTextareaKeyDown}
              placeholder={`Mensagem para ${activeConv.name}…  (Enter envia · Shift+Enter quebra linha)`}
              className="flex-1 bg-transparent outline-none text-sm py-2 resize-none placeholder:text-muted-foreground"
              disabled={sending}
            />
            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground shrink-0" disabled={sending}>
              <Smile className="size-4" />
            </Button>
            <Button
              size="icon"
              onClick={handleSend}
              disabled={sending || (!draft.trim() && !pendingFile)}
              className="size-8 bg-gradient-primary hover:opacity-90 text-primary-foreground shrink-0"
              title="Enviar"
            >
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
        </footer>
      </section>

      {/* Contact panel */}
      <aside className="border-l border-border bg-background-elev/40 flex flex-col">
        <div className="p-5 border-b border-border text-center">
          <Avatar className="size-16 mx-auto mb-3 ring-2 ring-primary/30">
            <AvatarFallback className="bg-secondary">{activeConv.initials}</AvatarFallback>
          </Avatar>
          <div className="text-sm font-semibold">{activeConv.name}</div>
          <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
            <cm.icon className={`size-3 ${cm.color}`} />
            via {cm.label}
          </div>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5">VIP</Badge>
            {activeConv.tag && <Badge variant="outline" className="text-[10px] border-border">{activeConv.tag}</Badge>}
          </div>
        </div>
        <div className="p-5 space-y-5 overflow-auto">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Atribuído a</div>
            <div className="flex items-center gap-2 text-sm">
              <Avatar className="size-6"><AvatarFallback className="bg-secondary text-[10px]">SR</AvatarFallback></Avatar>
              Sara Ramos
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Tags</div>
            <div className="flex flex-wrap gap-1.5">
              {["promo-anual", "lead-quente", "ecommerce"].map((t) => (
                <span
                  key={t}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-secondary text-muted-foreground border border-border flex items-center gap-1"
                >
                  <Tag className="size-2.5" />
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Ciclo de vida</div>
            <div className="space-y-2 text-xs">
              {[
                { l: "Primeiro contato", v: "12 mar 2024" },
                { l: "Última conversa", v: "hoje" },
                { l: "Total de pedidos", v: "R$ 4.820" },
                { l: "NPS", v: "9 / 10" },
              ].map((r) => (
                <div key={r.l} className="flex justify-between">
                  <span className="text-muted-foreground">{r.l}</span>
                  <span className="text-mono">{r.v}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Notas</div>
            <div className="glass rounded-lg p-3 text-xs text-muted-foreground">
              Cliente prefere contato por WhatsApp em horário comercial. Trabalha com e-commerce de moda — interesse no plano enterprise.
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
