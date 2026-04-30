import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, MessageSquare, Megaphone, Bot, PhoneCall, BarChart3, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: MessageSquare, title: "Inbox em tempo real", desc: "WebSocket nativo, atribuição automática e respostas prontas com /atalho." },
  { icon: Megaphone, title: "Campanhas em massa", desc: "Templates aprovados pela Meta com retry inteligente e segmentação avançada." },
  { icon: Bot, title: "Chatbot com IA", desc: "Construa fluxos visuais e conecte OpenAI, Anthropic ou Google em 1 clique." },
  { icon: PhoneCall, title: "Voice & IVR", desc: "Chamadas WhatsApp com menus DTMF, transferências e gravação." },
  { icon: BarChart3, title: "Analytics profundo", desc: "Funil de mensagens, CSAT por agente, intenções classificadas com IA." },
  { icon: Sparkles, title: "Multi-tenant + RBAC", desc: "Organizações isoladas e permissões granulares por recurso e ação." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Aurora */}
      <div className="absolute inset-0 bg-gradient-aurora pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-[600px] grid-pattern opacity-40 pointer-events-none" />

      {/* Nav */}
      <header className="relative z-10 max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
            <Sparkles className="size-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-semibold tracking-tight">CIFHER</span>
        </div>
        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          <a href="#recursos" className="hover:text-foreground transition-colors">Recursos</a>
          <a href="#stack" className="hover:text-foreground transition-colors">Stack</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <Link to="/login">Entrar</Link>
          </Button>
          <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1 group">
            <Link to="/app">Abrir app <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /></Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-primary/90 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 mb-6 animate-in-up">
          <span className="size-1.5 rounded-full bg-primary animate-pulse-glow" />
          Open-source · v1.0 disponível
        </div>
        <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-balance leading-[1.05] animate-in-up" style={{ animationDelay: "60ms" }}>
          A plataforma WhatsApp <br className="hidden md:block" />
          <span className="bg-gradient-primary bg-clip-text text-transparent">que sua equipe merece.</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto text-balance animate-in-up" style={{ animationDelay: "120ms" }}>
          Inbox em tempo real, campanhas em massa, chatbots com IA, IVR e analytics — num único produto open-source, rápido e elegante.
        </p>
        <div className="mt-9 flex items-center justify-center gap-3 animate-in-up" style={{ animationDelay: "180ms" }}>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground h-11 px-6 gap-2 group">
            <Link to="/app">Ver demo ao vivo <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-11 px-6 gap-2 border-border bg-secondary/40">
            <Link to="/login">Entrar</Link>
          </Button>
        </div>

        {/* Metric strip */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto animate-in-up" style={{ animationDelay: "240ms" }}>
          {[
            { v: "12,4k+", l: "instalações" },
            { v: "99,98%", l: "uptime" },
            { v: "<50ms", l: "latência média" },
            { v: "Apache 2.0", l: "open-source" },
          ].map((m) => (
            <div key={m.l} className="surface-card p-4">
              <div className="text-2xl font-semibold text-mono">{m.v}</div>
              <div className="text-xs text-muted-foreground mt-1">{m.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section id="recursos" className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-balance">Tudo que sua operação precisa</h2>
          <p className="mt-3 text-muted-foreground text-balance">Da primeira mensagem ao relatório executivo. Sem patchwork de ferramentas.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="surface-card p-6 hover:border-border-strong transition-colors group">
              <div className="size-10 rounded-lg bg-secondary border border-border grid place-items-center mb-4 group-hover:bg-primary/10 group-hover:border-primary/30 transition-colors">
                <f.icon className="size-5 text-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-medium mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stack section */}
      <section id="stack" className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="surface-card p-10 md:p-14 bg-gradient-mesh">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-primary mb-3">Stack original</div>
              <h2 className="text-3xl font-semibold tracking-tight text-balance">Backend Go + Postgres. Binário único.</h2>
              <p className="mt-3 text-muted-foreground">
                Compilado em um único binário com frontend embarcado. Roda em qualquer VM, container ou Kubernetes — sem dependências mágicas.
              </p>
              <ul className="mt-6 space-y-2.5 text-sm">
                {["WhatsApp Cloud API (Meta) nativo", "WebRTC para chamadas de voz", "Redis para fila de mensagens", "OpenAI · Anthropic · Google AI"].map((i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <span className="size-4 rounded-full bg-primary/15 grid place-items-center"><Check className="size-2.5 text-primary" strokeWidth={3} /></span>
                    {i}
                  </li>
                ))}
              </ul>
            </div>
            <div className="surface-card p-4 font-mono text-xs leading-relaxed bg-background-elev/80">
              <div className="text-muted-foreground"># Subir em 30 segundos</div>
              <div className="mt-2"><span className="text-primary">$</span> docker compose up -d</div>
              <div className="text-muted-foreground mt-3"># Acesse</div>
              <div><span className="text-primary">→</span> http://localhost:8080</div>
              <div className="text-muted-foreground mt-3"># Login padrão</div>
              <div className="text-foreground/80">admin@admin.com / admin</div>
              <div className="mt-4 pt-4 border-t border-border text-muted-foreground">
                ✓ multi-tenant<br />✓ RBAC granular<br />✓ frontend embarcado
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-24 text-center">
        <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-balance">Pronta para ver de perto?</h2>
        <p className="mt-4 text-muted-foreground text-balance">Explore o redesign navegável em segundos. Sem cadastro, sem fricção.</p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground h-11 px-6 gap-2 group">
            <Link to="/app">Abrir CIFHER <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></Link>
          </Button>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border mt-12">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>© 2025 CIFHER · Apache 2.0 License</div>
          <span>Construído com ♥ para times de CX</span>
        </div>
      </footer>
    </div>
  );
}
