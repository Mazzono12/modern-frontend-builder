import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Sparkles, ArrowRight, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => navigate("/app"), 600);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_1.1fr] bg-background">
      {/* Left visual panel */}
      <aside className="relative hidden lg:flex flex-col justify-between p-10 border-r border-border overflow-hidden bg-background-elev">
        <div className="absolute inset-0 bg-gradient-mesh opacity-80" />
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="relative flex items-center gap-2.5">
          <div className="size-9 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
            <Sparkles className="size-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-semibold tracking-tight">CIFHER</span>
        </div>
        <div className="relative space-y-6 max-w-md">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-primary/80 px-2.5 py-1 rounded-full border border-primary/20 bg-primary/5">
            <span className="size-1.5 rounded-full bg-primary animate-pulse-glow" />
            Open-source · Self-hosted
          </div>
          <h2 className="text-4xl font-semibold tracking-tight text-balance leading-[1.1]">
            A plataforma definitiva para sua operação de WhatsApp Business.
          </h2>
          <p className="text-muted-foreground text-balance">
            Chat ao vivo, campanhas em massa, chatbots com IA, IVR e analytics — num produto único, rápido e elegante.
          </p>
          <div className="flex items-center gap-6 pt-4 text-xs text-muted-foreground">
            <div><div className="text-mono text-foreground text-lg">12.4k</div>contas ativas</div>
            <div className="h-8 w-px bg-border" />
            <div><div className="text-mono text-foreground text-lg">99.98%</div>uptime</div>
            <div className="h-8 w-px bg-border" />
            <div><div className="text-mono text-foreground text-lg">∞</div>open-source</div>
          </div>
        </div>
        <div className="relative text-xs text-muted-foreground/70">
          © 2025 CIFHER · Apache 2.0 License
        </div>
      </aside>

      {/* Right form */}
      <section className="flex items-center justify-center p-6 lg:p-10 relative">
        <div className="w-full max-w-sm space-y-8 animate-in-up">
          <div className="lg:hidden flex items-center gap-2.5">
            <div className="size-9 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
              <Sparkles className="size-4 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-semibold tracking-tight">CIFHER</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Entrar na sua conta</h1>
            <p className="text-sm text-muted-foreground">Use suas credenciais corporativas para continuar.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-muted-foreground">E-mail</Label>
              <Input id="email" type="email" defaultValue="admin@admin.com" autoComplete="email" className="h-10 bg-secondary/40 border-border" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs text-muted-foreground">Senha</Label>
                <Link to="#" className="text-[11px] text-muted-foreground hover:text-foreground">Esqueceu?</Link>
              </div>
              <Input id="password" type="password" defaultValue="admin" autoComplete="current-password" className="h-10 bg-secondary/40 border-border" />
            </div>

            <Button type="submit" disabled={loading} className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium gap-2 group">
              {loading ? "Entrando…" : <>Entrar <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></>}
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full h-px bg-border" /></div>
              <div className="relative flex justify-center"><span className="px-2 bg-background text-[11px] uppercase tracking-wider text-muted-foreground">ou</span></div>
            </div>

            <Button type="button" variant="outline" className="w-full h-10 gap-2 border-border bg-secondary/30 hover:bg-secondary">
              <Github className="size-4" /> Continuar com SSO
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground">
            Não tem conta? <Link to="#" className="text-foreground hover:text-primary">Solicitar acesso</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
