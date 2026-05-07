import { useRef, useState } from "react";
import { Camera, Save, Trash2, KeyRound, Bell, Globe, Webhook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useTheme, ACCENTS, Accent } from "@/components/ThemeProvider";
import { toast } from "sonner";
import { BotSettingsCard } from "@/components/BotSettingsCard";

export default function Settings() {
  const { accent, setAccent, mode, toggleMode } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem("wm-avatar") : null,
  );

  const handleAvatar = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx. 2 MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      setAvatar(url);
      localStorage.setItem("wm-avatar", url);
      toast.success("Avatar atualizado");
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setAvatar(null);
    localStorage.removeItem("wm-avatar");
    toast.success("Avatar removido");
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1100px] mx-auto">
      <div className="space-y-1">
        <h2 className="text-2xl lg:text-3xl font-display font-semibold tracking-tight">Configurações</h2>
        <p className="text-sm text-muted-foreground">Workspace, perfil, aparência e integrações</p>
      </div>

      {/* Profile */}
      <section className="glass rounded-xl p-6 space-y-5">
        <div>
          <h3 className="text-sm font-medium">Perfil</h3>
          <p className="text-xs text-muted-foreground">Como você aparece para sua equipe</p>
        </div>
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar className="size-20 ring-2 ring-primary/30">
              {avatar && <AvatarImage src={avatar} alt="Avatar" />}
              <AvatarFallback className="bg-secondary text-lg">SR</AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 size-7 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center shadow-glow hover:scale-110 transition"
              aria-label="Trocar avatar"
            >
              <Camera className="size-3.5" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleAvatar(e.target.files[0])}
            />
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Camera className="size-3.5" /> Carregar imagem
              </Button>
              {avatar && (
                <Button variant="ghost" size="sm" onClick={removeAvatar} className="text-destructive">
                  <Trash2 className="size-3.5" /> Remover
                </Button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">PNG, JPG ou GIF até 2 MB.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs">Nome completo</Label>
            <Input id="name" defaultValue="Sara Ramos" className="bg-secondary/40 border-border h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs">Email</Label>
            <Input id="email" type="email" defaultValue="sara@acme.com" className="bg-secondary/40 border-border h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role" className="text-xs">Cargo</Label>
            <Input id="role" defaultValue="Head of CX" className="bg-secondary/40 border-border h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs">Telefone</Label>
            <Input id="phone" defaultValue="+55 11 99999-0000" className="bg-secondary/40 border-border h-9 text-sm" />
          </div>
        </div>
        <div className="flex justify-end">
          <Button size="sm" className="h-9 bg-gradient-primary text-primary-foreground hover:opacity-90 gap-1 shadow-glow" onClick={() => toast.success("Perfil salvo")}>
            <Save className="size-4" /> Salvar alterações
          </Button>
        </div>
      </section>

      {/* Appearance */}
      <section className="glass rounded-xl p-6 space-y-5">
        <div>
          <h3 className="text-sm font-medium">Aparência</h3>
          <p className="text-xs text-muted-foreground">Personalize cores e modo de exibição</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">Cor de destaque</div>
            <div className="flex flex-wrap gap-2">
              {ACCENTS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAccent(a.id as Accent)}
                  className={`size-10 rounded-xl border-2 transition-all hover:scale-110 ${
                    accent === a.id ? "border-foreground ring-2 ring-primary/40" : "border-border"
                  }`}
                  style={{ background: `hsl(${a.hsl})` }}
                  aria-label={a.label}
                  title={a.label}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">Modo</div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/30">
              <div className="text-sm">
                Modo {mode === "dark" ? "escuro" : "claro"}
                <div className="text-[11px] text-muted-foreground">Alterna a paleta da interface</div>
              </div>
              <Switch checked={mode === "dark"} onCheckedChange={toggleMode} />
            </div>
            <div className="mt-3 text-[11px] text-muted-foreground">
              Use o atalho da paleta no topo para acessar rápido: <ThemeSwitcher />
            </div>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="glass rounded-xl p-6 space-y-4">
        <div>
          <h3 className="text-sm font-medium">Notificações</h3>
          <p className="text-xs text-muted-foreground">Como você quer ser avisado</p>
        </div>
        {[
          { icon: Bell, label: "Push no navegador", desc: "Avisos quando uma conversa for atribuída a você" },
          { icon: Globe, label: "Email de resumo diário", desc: "Receba um resumo às 8h" },
          { icon: Webhook, label: "Webhooks", desc: "Notifique sistemas externos via HTTP" },
        ].map((it, i) => (
          <div key={it.label} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/30">
            <div className="size-9 rounded-lg bg-primary/15 text-primary grid place-items-center">
              <it.icon className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{it.label}</div>
              <div className="text-[11px] text-muted-foreground">{it.desc}</div>
            </div>
            <Switch defaultChecked={i !== 2} />
          </div>
        ))}
      </section>

      {/* API Keys */}
      <section className="glass rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">Chaves de API</h3>
            <p className="text-xs text-muted-foreground">Conecte sua aplicação ao CIFHER</p>
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <KeyRound className="size-3.5" /> Gerar chave
          </Button>
        </div>
        <div className="rounded-lg border border-border bg-secondary/30 px-4 py-3 flex items-center gap-3">
          <KeyRound className="size-4 text-primary" />
          <code className="text-xs text-mono flex-1 truncate text-muted-foreground">
            wm_live_••••••••••••••••••••••••••••a93f
          </code>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-success/15 text-success border border-success/30">Ativa</span>
        </div>
      </section>
    </div>
  );
}
