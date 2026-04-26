import { motion } from "framer-motion";

type Stage = { label: string; value: number; color?: string };

export function FunnelChart({ stages }: { stages: Stage[] }) {
  const max = Math.max(...stages.map((s) => s.value));
  return (
    <div className="space-y-2">
      {stages.map((s, i) => {
        const pct = (s.value / max) * 100;
        const conv = i === 0 ? 100 : (s.value / stages[i - 1].value) * 100;
        return (
          <div key={s.label} className="group">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">{s.label}</span>
              <div className="flex items-center gap-3">
                <span className="text-mono">{s.value.toLocaleString("pt-BR")}</span>
                <span className="text-[10px] text-muted-foreground/70 w-14 text-right">
                  {i === 0 ? "—" : `${conv.toFixed(1)}%`}
                </span>
              </div>
            </div>
            <div className="relative h-9 rounded-lg overflow-hidden bg-secondary/40 border border-border">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-y-0 left-0 rounded-lg"
                style={{
                  background: s.color
                    ? s.color
                    : `linear-gradient(90deg, hsl(var(--primary) / 0.85), hsl(var(--primary-glow) / 0.7))`,
                  boxShadow: "inset 0 1px 0 hsl(0 0% 100% / 0.18)",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-end pr-3 text-[11px] font-medium text-foreground/90">
                {pct.toFixed(0)}%
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
