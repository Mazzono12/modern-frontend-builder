import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles, Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

type Msg = { id: string; role: "assistant" | "user"; content: string };

type BotConfig = {
  enabled: boolean;
  name: string;
  welcome_message: string;
  status_text: string;
  quick_replies: string[];
};

const FALLBACK: BotConfig = {
  enabled: true,
  name: "CIFHER AI",
  welcome_message: "Oi! Sou o assistente CIFHER ✨ Como posso ajudar?",
  status_text: "Online · resposta em segundos",
  quick_replies: ["Como criar campanha?", "Ver métricas de hoje", "Treinar chatbot", "Falar com humano"],
};

export function FloatingChatbot() {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<BotConfig>(FALLBACK);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scroll = useRef<HTMLDivElement>(null);

  async function loadConfig() {
    const { data } = await supabase.from("bot_settings").select("enabled,name,welcome_message,status_text,quick_replies").maybeSingle();
    if (data) {
      const cfg: BotConfig = {
        enabled: data.enabled,
        name: data.name,
        welcome_message: data.welcome_message,
        status_text: data.status_text,
        quick_replies: Array.isArray(data.quick_replies) ? (data.quick_replies as string[]) : FALLBACK.quick_replies,
      };
      setConfig(cfg);
      setMsgs([{ id: "welcome", role: "assistant", content: cfg.welcome_message }]);
    } else {
      setMsgs([{ id: "welcome", role: "assistant", content: FALLBACK.welcome_message }]);
    }
  }

  useEffect(() => {
    loadConfig();
    const onUpdate = () => loadConfig();
    window.addEventListener("bot-settings-updated", onUpdate);
    return () => window.removeEventListener("bot-settings-updated", onUpdate);
  }, []);

  useEffect(() => {
    scroll.current?.scrollTo({ top: scroll.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open, sending]);

  async function send(text: string) {
    const t = text.trim();
    if (!t || sending) return;
    const userMsg: Msg = { id: `u-${Date.now()}`, role: "user", content: t };
    const next = [...msgs, userMsg];
    setMsgs(next);
    setInput("");
    setSending(true);
    try {
      const payload = next
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));
      const { data, error } = await supabase.functions.invoke("bot-chat", { body: { messages: payload } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMsgs((m) => [...m, { id: `b-${Date.now()}`, role: "assistant", content: data?.reply || "(sem resposta)" }]);
    } catch (e: any) {
      setMsgs((m) => [...m, { id: `e-${Date.now()}`, role: "assistant", content: `⚠️ ${e?.message ?? "Erro ao consultar o assistente."}` }]);
    } finally {
      setSending(false);
    }
  }

  if (!config.enabled) return null;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-8rem)] glass-strong rounded-2xl shadow-elev flex flex-col overflow-hidden"
          >
            <header className="flex items-center gap-3 p-4 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
              <div className="size-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
                <Bot className="size-4 text-primary-foreground" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold flex items-center gap-1.5">
                  {config.name}
                  <Sparkles className="size-3 text-primary" />
                </div>
                <div className="text-[11px] text-success flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-success animate-pulse" />
                  {config.status_text}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="size-7" onClick={() => setOpen(false)}>
                <X className="size-4" />
              </Button>
            </header>

            <div ref={scroll} className="flex-1 overflow-auto p-4 space-y-3">
              {msgs.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-secondary/70 text-foreground rounded-bl-sm border border-border"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="px-3.5 py-2.5 rounded-2xl bg-secondary/70 border border-border text-muted-foreground text-sm flex items-center gap-2">
                    <Loader2 className="size-3.5 animate-spin" /> pensando…
                  </div>
                </div>
              )}
              {msgs.length <= 1 && config.quick_replies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {config.quick_replies.map((q) => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="text-xs px-2.5 py-1.5 rounded-full border border-border bg-secondary/40 hover:bg-secondary hover:border-primary/40 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="p-3 border-t border-border flex items-center gap-2 bg-background/40"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pergunte algo…"
                className="flex-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/60 transition-colors"
              />
              <Button type="submit" size="icon" disabled={sending} className="size-9 bg-primary hover:bg-primary/90 text-primary-foreground">
                {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 size-14 rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow grid place-items-center"
        aria-label="Abrir assistente"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="size-5" />
            </motion.span>
          ) : (
            <motion.span key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircle className="size-6" strokeWidth={2.2} />
            </motion.span>
          )}
        </AnimatePresence>
        {!open && <span className="absolute -top-1 -right-1 size-3 rounded-full bg-success ring-2 ring-background animate-pulse" />}
      </motion.button>
    </>
  );
}
