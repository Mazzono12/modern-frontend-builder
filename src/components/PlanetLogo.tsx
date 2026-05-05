import { cn } from "@/lib/utils";
import planet3d from "@/assets/planet-3d.png";

/**
 * CIFHER planet logo — photorealistic 3D Earth that rotates in a continuous loop
 * and dynamically tints itself to the active accent color via CSS blend modes.
 *
 * Approach:
 *  - A high-detail grayscale 3D Earth render is the base (preserves relief & shading).
 *  - A primary-colored layer is composited on top with `mix-blend-mode: color`,
 *    which transfers hue/saturation while keeping the original luminance — so
 *    the planet adopts whatever accent color the theme currently uses.
 *  - The whole sphere rotates with `animate-spin-slow` for a 360° loop.
 *  - An atmospheric glow ring sits behind it, also tinted by the accent color.
 */
export function PlanetLogo({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
      aria-label="CIFHER"
      role="img"
    >
      {/* Outer atmospheric glow */}
      <div
        className="absolute -inset-[20%] rounded-full pointer-events-none animate-pulse-glow"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--primary) / 0.45) 0%, hsl(var(--primary) / 0.18) 45%, transparent 72%)",
          filter: "blur(3px)",
        }}
      />

      {/* Rotating 3D planet */}
      <div
        className="relative w-full h-full rounded-full overflow-hidden"
        style={{
          boxShadow:
            "0 0 18px hsl(var(--primary) / 0.45), inset -3px -4px 10px rgba(0,0,0,0.6)",
        }}
      >
        {/* Base photorealistic earth (grayscale) — spinning */}
        <img
          src={planet3d}
          alt=""
          width={size}
          height={size}
          className="absolute inset-0 w-full h-full object-cover animate-spin-slow"
          style={{ filter: "contrast(1.05) brightness(1.05)" }}
          draggable={false}
        />

        {/* Color tint layer — transfers accent hue onto the grayscale planet */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "hsl(var(--primary))",
            mixBlendMode: "color",
            opacity: 0.85,
          }}
        />

        {/* Soft saturation boost layer */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 35% 30%, hsl(var(--primary) / 0.25), transparent 60%)",
            mixBlendMode: "screen",
          }}
        />

        {/* Specular highlight — gives 3D wet-sphere feel, stays white */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            top: "8%",
            left: "14%",
            width: "28%",
            height: "22%",
            background: "radial-gradient(ellipse, rgba(255,255,255,0.55), transparent 70%)",
            filter: "blur(1.5px)",
          }}
        />

        {/* Terminator shadow on the dark side for depth */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 75% 75%, rgba(0,0,0,0.55) 0%, transparent 55%)",
          }}
        />
      </div>

    </div>
  );
}
