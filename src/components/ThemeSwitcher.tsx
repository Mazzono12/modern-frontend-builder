import { useTheme, ACCENTS, Accent } from "./ThemeProvider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Palette, Moon, Sun, Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export function ThemeSwitcher() {
  const { accent, setAccent, mode, toggleMode } = useTheme();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-foreground relative"
          aria-label="Personalizar tema"
        >
          <Palette className="size-4" />
          <span
            className="absolute bottom-1 right-1 size-1.5 rounded-full ring-1 ring-background"
            style={{ background: `hsl(${ACCENTS.find((a) => a.id === accent)?.hsl})` }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 glass-strong border-border p-4 space-y-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Cor de destaque</div>
          <div className="grid grid-cols-6 gap-2">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAccent(a.id as Accent)}
                aria-label={a.label}
                className="relative size-8 rounded-lg border border-border-strong hover:scale-110 transition-transform"
                style={{ background: `hsl(${a.hsl})` }}
              >
                {accent === a.id && (
                  <Check className="size-4 text-white absolute inset-0 m-auto drop-shadow" strokeWidth={3} />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-border" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            {mode === "dark" ? <Moon className="size-4 text-muted-foreground" /> : <Sun className="size-4 text-muted-foreground" />}
            <span>Modo {mode === "dark" ? "escuro" : "claro"}</span>
          </div>
          <Switch checked={mode === "dark"} onCheckedChange={toggleMode} />
        </div>

        <div className="text-[10px] text-muted-foreground/70 leading-relaxed pt-1">
          Suas preferências são salvas neste navegador.
        </div>
      </PopoverContent>
    </Popover>
  );
}
