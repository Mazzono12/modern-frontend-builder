import { useMemo, useState } from "react";
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
  AtSign,
  Instagram,
  MessageCircle,
  Mail,
  Facebook,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

const messages = [
  { id: "m1", from: "them", text: "Oi Sara! Vi que vocês têm aquele plano anual com 20% off ainda?", time: "14:38" },
  { id: "m2", from: "me", text: "Olá Camila! Sim, a promoção segue até sexta. Quer que eu te envie o link de checkout?", time: "14:39" },
  { id: "m3", from: "them", text: "Por favor! E se possível também a comparação dos planos.", time: "14:40" },
  { id: "m4", from: "me", text: "Claro, segue 👇", time: "14:40" },
  { id: "m5", from: "me", text: "🔗 https://acme.com/checkout/anual-20\n📊 https://acme.com/planos", time: "14:40" },
  { id: "m6", from: "them", text: "Perfeito, vou conferir e te retorno até o fim do dia.", time: "14:42" },
];

export default function Inbox() {
  const [active, setActive] = useState("1");
  const [filter, setFilter] = useState<"todas" | "minhas" | "fechadas">("todas");
  const [channel, setChannel] = useState<Channel | "all">("all");

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

        <div className="flex-1 overflow-auto p-6 space-y-4 dot-pattern">
          <div className="text-center">
            <span className="text-[11px] text-muted-foreground bg-background-elev px-2.5 py-1 rounded-full border border-border">
              hoje · 14:38
            </span>
          </div>
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[68%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-line shadow-card ${
                  m.from === "me"
                    ? "bg-gradient-to-br from-primary to-primary-glow text-primary-foreground rounded-br-sm"
                    : "bg-card text-card-foreground border border-border rounded-bl-sm"
                }`}
              >
                {m.text}
                <div className={`flex items-center gap-1 mt-1 text-[10px] ${m.from === "me" ? "text-primary-foreground/70 justify-end" : "text-muted-foreground"}`}>
                  {m.time}
                  {m.from === "me" && <CheckCheck className="size-3" />}
                </div>
              </div>
            </div>
          ))}
        </div>

        <footer className="p-4 border-t border-border bg-background-elev/40">
          <div className="glass rounded-xl p-2 flex items-end gap-2">
            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground shrink-0"><Paperclip className="size-4" /></Button>
            <textarea
              rows={1}
              placeholder={`Mensagem para ${activeConv.name}…  (use / para respostas prontas)`}
              className="flex-1 bg-transparent outline-none text-sm py-2 resize-none placeholder:text-muted-foreground"
            />
            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground shrink-0"><Smile className="size-4" /></Button>
            <Button size="icon" className="size-8 bg-gradient-primary hover:opacity-90 text-primary-foreground shrink-0">
              <Send className="size-4" />
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
