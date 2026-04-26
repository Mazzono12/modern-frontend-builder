import { useState } from "react";
import { Search, Filter, Phone, Video, MoreHorizontal, Paperclip, Smile, Send, Star, Tag, User2, CheckCheck } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Conv = { id: string; name: string; initials: string; preview: string; time: string; unread?: number; tag?: string; status: "online" | "offline"; pinned?: boolean };
const conversations: Conv[] = [
  { id: "1", name: "Camila Ferreira", initials: "CF", preview: "Perfeito, vou conferir e te retorno até o fim do dia.", time: "14:42", unread: 2, tag: "Vendas", status: "online", pinned: true },
  { id: "2", name: "Pedro Henrique", initials: "PH", preview: "Comprovante anexado ✅", time: "14:30", tag: "Cobrança", status: "online" },
  { id: "3", name: "Larissa Souza", initials: "LS", preview: "Bot: Sua solicitação foi encaminhada…", time: "14:12", unread: 1, tag: "Suporte", status: "offline" },
  { id: "4", name: "Marcos Vieira", initials: "MV", preview: "Vocês têm o catálogo atualizado?", time: "13:58", tag: "Vendas", status: "online" },
  { id: "5", name: "Renata Alves", initials: "RA", preview: "Obrigada pelo atendimento 💚", time: "13:22", tag: "NPS", status: "offline" },
  { id: "6", name: "Felipe Cardoso", initials: "FC", preview: "Gostaria de cancelar o plano premium.", time: "12:48", tag: "Retenção", status: "offline" },
  { id: "7", name: "Ana Beatriz", initials: "AB", preview: "Obrigada, podem enviar a NF.", time: "11:30", tag: "Suporte", status: "offline" },
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

  return (
    <div className="grid grid-cols-[320px_1fr_320px] h-[calc(100vh-3.5rem)] bg-background">
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
            <Button variant="ghost" size="icon" className="size-7 ml-auto"><Filter className="size-3.5" /></Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={`w-full flex gap-3 px-3 py-3 border-l-2 transition-colors text-left ${
                active === c.id
                  ? "bg-secondary/60 border-primary"
                  : "border-transparent hover:bg-secondary/30"
              }`}
            >
              <div className="relative shrink-0">
                <Avatar className="size-9"><AvatarFallback className="bg-secondary text-xs">{c.initials}</AvatarFallback></Avatar>
                {c.status === "online" && <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-success ring-2 ring-background-elev" />}
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
          ))}
        </div>
      </aside>

      {/* Thread */}
      <section className="flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center px-5 gap-3">
          <Avatar className="size-8"><AvatarFallback className="bg-secondary text-xs">CF</AvatarFallback></Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">Camila Ferreira</div>
            <div className="text-[11px] text-success flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-success" />online agora</div>
          </div>
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground"><Phone className="size-4" /></Button>
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground"><Video className="size-4" /></Button>
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground"><MoreHorizontal className="size-4" /></Button>
        </header>

        <div className="flex-1 overflow-auto p-6 space-y-4 dot-pattern">
          <div className="text-center">
            <span className="text-[11px] text-muted-foreground bg-background-elev px-2.5 py-1 rounded-full border border-border">hoje · 14:38</span>
          </div>
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[68%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-line shadow-card ${
                m.from === "me"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-card text-card-foreground border border-border rounded-bl-sm"
              }`}>
                {m.text}
                <div className={`flex items-center gap-1 mt-1 text-[10px] ${m.from === "me" ? "text-primary-foreground/60 justify-end" : "text-muted-foreground"}`}>
                  {m.time}
                  {m.from === "me" && <CheckCheck className="size-3" />}
                </div>
              </div>
            </div>
          ))}
        </div>

        <footer className="p-4 border-t border-border bg-background-elev/40">
          <div className="surface-card p-2 flex items-end gap-2">
            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground shrink-0"><Paperclip className="size-4" /></Button>
            <textarea
              rows={1}
              placeholder="Mensagem para Camila…  (use / para respostas prontas)"
              className="flex-1 bg-transparent outline-none text-sm py-2 resize-none placeholder:text-muted-foreground"
            />
            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground shrink-0"><Smile className="size-4" /></Button>
            <Button size="icon" className="size-8 bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"><Send className="size-4" /></Button>
          </div>
        </footer>
      </section>

      {/* Contact panel */}
      <aside className="border-l border-border bg-background-elev/40 flex flex-col">
        <div className="p-5 border-b border-border text-center">
          <Avatar className="size-16 mx-auto mb-3 ring-2 ring-primary/20"><AvatarFallback className="bg-secondary">CF</AvatarFallback></Avatar>
          <div className="text-sm font-semibold">Camila Ferreira</div>
          <div className="text-xs text-muted-foreground">+55 11 98765-4321</div>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5">VIP</Badge>
            <Badge variant="outline" className="text-[10px] border-border">Vendas</Badge>
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
                <span key={t} className="text-[11px] px-2 py-0.5 rounded-md bg-secondary text-muted-foreground border border-border flex items-center gap-1">
                  <Tag className="size-2.5" />{t}
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
            <div className="surface-card p-3 text-xs text-muted-foreground">
              Cliente prefere contato por WhatsApp em horário comercial. Trabalha com e-commerce de moda — interesse no plano enterprise.
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
