import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

type Msg = { id: string; from: "bot" | "user"; text: string };

const seed: Msg[] = [
  { id: "s1", from: "bot", text: "Oi! Sou o assistente CFHER ✨ Posso ajudar com campanhas, fluxos ou métricas." },
];

const quickReplies = ["Como criar campanha?", "Ver métricas de hoje", "Treinar chatbot", "Falar com humano"];

export function FloatingChatbot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>(seed);
  const [input, setInput] = useState("");
  const scroll = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroll.current?.scrollTo({ top: scroll.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    const userMsg: Msg = { id: `u-${Date.now()}`, from: "user", text: t };
    setMsgs((m) => [...m, userMsg]);
    setInput("");
    setTimeout(() => {
      setMsgs((m) => [
        ...m,
        {
          id: `b-${Date.now()}`,
          from: "bot",
          text:
            "Entendi! Em uma versão real, eu consultaria sua base agora. Por enquanto, esta é uma demo do chat flutuante.",
        },
      ]);
    }, 700);
  };

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
                  CFHER AI
                  <Sparkles className="size-3 text-primary" />
                </div>
                <div className="text-[11px] text-success flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-success animate-pulse" />
                  Online · resposta em segundos
                </div>
              </div>
              <Button variant="ghost" size="icon" className="size-7" onClick={() => setOpen(false)}>
                <X className="size-4" />
              </Button>
            </header>

            <div ref={scroll} className="flex-1 overflow-auto p-4 space-y-3">
              {msgs.map((m) => (
                <div key={m.id} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm ${
                      m.from === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-secondary/70 text-foreground rounded-bl-sm border border-border"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {msgs.length <= 1 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {quickReplies.map((q) => (
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
              <Button type="submit" size="icon" className="size-9 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Send className="size-4" />
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
