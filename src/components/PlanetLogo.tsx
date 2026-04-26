import { cn } from "@/lib/utils";

/** Animated rotating planet logo — uses current accent color via CSS vars. */
export function PlanetLogo({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
      aria-label="Whatomate"
    >
      {/* outer orbit ring */}
      <div
        className="absolute inset-0 rounded-full animate-spin-slow"
        style={{
          background: "var(--gradient-orbital)",
          mask: "radial-gradient(circle, transparent 58%, #000 60%, #000 70%, transparent 72%)",
          WebkitMask: "radial-gradient(circle, transparent 58%, #000 60%, #000 70%, transparent 72%)",
        }}
      />
      {/* tilted ring */}
      <div
        className="absolute inset-[10%] rounded-full border border-primary/40 animate-spin-reverse"
        style={{ transform: "rotateX(70deg)" }}
      />
      {/* planet body */}
      <div
        className="absolute inset-[22%] rounded-full shadow-glow"
        style={{
          background: "radial-gradient(circle at 30% 30%, hsl(var(--primary-glow)), hsl(var(--primary)) 60%, hsl(232 24% 8%) 100%)",
        }}
      />
      {/* highlight */}
      <div className="absolute inset-[28%] rounded-full bg-white/20 blur-[2px]" style={{ width: "20%", height: "20%" }} />
    </div>
  );
}
