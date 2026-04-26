import { cn } from "@/lib/utils";

/**
 * CFHER planet logo — rotating Earth with continent reliefs.
 * Continents and atmosphere tint themselves to the active accent color via CSS vars.
 *
 * Implementation: a horizontal strip with 2× the world map is animated with a
 * continuous translateX from 0 → -50%, creating a seamless rotation loop. The
 * strip is masked into a sphere, with shading and atmosphere on top.
 */
export function PlanetLogo({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <div
      className={cn("relative shrink-0 overflow-visible", className)}
      style={{ width: size, height: size }}
      aria-label="CFHER"
      role="img"
    >
      {/* Outer glow / atmosphere */}
      <div
        className="absolute -inset-[15%] rounded-full opacity-80 animate-pulse-glow pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--primary) / 0.35) 0%, hsl(var(--primary) / 0.15) 40%, transparent 70%)",
          filter: "blur(2px)",
        }}
      />

      {/* Sphere container */}
      <div
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, hsl(220 60% 18%), hsl(232 50% 8%) 70%, hsl(232 60% 4%) 100%)",
          boxShadow:
            "inset -4px -4px 10px hsl(232 60% 2% / 0.9), inset 3px 3px 8px hsl(var(--primary) / 0.25)",
        }}
      >
        {/* Rotating strip — 2× the world map for seamless loop */}
        <div className="absolute inset-y-0 left-0 flex animate-globe-rotate" style={{ width: "200%", height: "100%" }}>
          <ContinentMap />
          <ContinentMap />
        </div>

        {/* Shading overlay — gives sphere lighting */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, hsl(0 0% 100% / 0.18) 0%, transparent 35%), radial-gradient(circle at 75% 75%, hsl(232 60% 2% / 0.65) 0%, transparent 50%)",
          }}
        />

        {/* Specular highlight */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            top: "12%",
            left: "20%",
            width: "22%",
            height: "18%",
            background: "radial-gradient(ellipse, hsl(0 0% 100% / 0.55), transparent 70%)",
            filter: "blur(1px)",
          }}
        />

        {/* Subtle equator line */}
        <div
          className="absolute inset-x-0 top-1/2 h-px pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.3), transparent)" }}
        />
      </div>

      {/* Tilted orbital ring */}
      <div
        className="absolute inset-[-8%] rounded-full pointer-events-none"
        style={{
          border: "1px solid hsl(var(--primary) / 0.35)",
          transform: "rotateX(72deg) rotateZ(-15deg)",
          boxShadow: "0 0 8px hsl(var(--primary) / 0.4)",
        }}
      />
    </div>
  );
}

/**
 * Stylized world map with continents in relief.
 * Filled with the current accent color via `currentColor`.
 * viewBox is 1000x500 (2:1 equirectangular projection).
 */
function ContinentMap() {
  return (
    <svg
      viewBox="0 0 1000 500"
      preserveAspectRatio="none"
      className="w-1/2 h-full text-primary"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id="land-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.95" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.65" />
        </linearGradient>
        <filter id="relief" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1" />
        </filter>
      </defs>

      <g fill="url(#land-grad)" filter="url(#relief)">
        {/* North America */}
        <path d="M 80 90 Q 120 70 180 80 L 230 100 L 260 130 L 280 170 L 250 200 L 220 220 L 180 230 L 140 220 L 100 200 L 70 170 L 60 130 Z" />
        {/* Greenland */}
        <path d="M 290 60 Q 320 55 340 70 L 345 95 L 325 110 L 300 100 Z" />
        {/* Central America */}
        <path d="M 200 240 L 230 250 L 240 280 L 225 290 L 210 275 Z" />
        {/* South America */}
        <path d="M 250 290 Q 280 285 300 305 L 315 350 L 305 400 L 285 440 L 260 460 L 245 430 L 240 380 L 245 330 Z" />
        {/* Europe */}
        <path d="M 470 100 L 510 95 L 540 110 L 555 130 L 540 150 L 510 155 L 480 145 L 465 125 Z" />
        {/* Africa */}
        <path d="M 490 170 Q 530 165 555 185 L 575 230 L 580 280 L 565 330 L 540 360 L 510 365 L 485 345 L 475 305 L 478 250 L 482 205 Z" />
        {/* Middle East / Arabia */}
        <path d="M 580 195 L 605 200 L 615 225 L 600 245 L 580 240 Z" />
        {/* Asia */}
        <path d="M 560 90 L 620 85 L 700 95 L 780 110 L 830 130 L 850 160 L 830 185 L 790 195 L 740 200 L 690 195 L 640 185 L 600 170 L 575 145 L 565 115 Z" />
        {/* India */}
        <path d="M 680 200 L 715 205 L 720 240 L 700 260 L 680 245 Z" />
        {/* Southeast Asia / Indonesia */}
        <path d="M 780 230 L 815 235 L 845 250 L 850 270 L 820 275 L 790 265 L 775 250 Z" />
        <path d="M 855 260 L 875 268 L 870 280 L 855 275 Z" />
        {/* Australia */}
        <path d="M 820 320 Q 860 315 890 330 L 905 355 L 890 380 L 855 385 L 820 375 L 805 350 Z" />
        {/* Japan */}
        <path d="M 860 145 L 875 150 L 880 170 L 868 178 L 858 165 Z" />
        {/* Antarctica strip */}
        <path d="M 50 460 L 200 470 L 400 472 L 600 470 L 800 468 L 950 460 L 950 495 L 50 495 Z" opacity="0.7" />
        {/* British Isles */}
        <path d="M 455 110 L 467 115 L 465 130 L 453 128 Z" />
        {/* Madagascar */}
        <path d="M 595 320 L 605 325 L 608 348 L 598 352 Z" />
        {/* New Zealand */}
        <path d="M 920 380 L 932 385 L 928 405 L 918 400 Z" />
      </g>

      {/* Subtle highlight on continent tops for relief */}
      <g fill="hsl(0 0% 100%)" opacity="0.12">
        <path d="M 80 90 Q 120 70 180 80 L 230 100 L 220 110 L 170 95 L 120 90 L 90 100 Z" />
        <path d="M 250 290 Q 280 285 300 305 L 290 315 L 270 305 L 255 305 Z" />
        <path d="M 490 170 Q 530 165 555 185 L 545 195 L 510 180 L 490 185 Z" />
        <path d="M 560 90 L 620 85 L 700 95 L 780 110 L 770 120 L 690 105 L 600 100 L 565 100 Z" />
        <path d="M 820 320 Q 860 315 890 330 L 880 340 L 850 330 L 820 332 Z" />
      </g>
    </svg>
  );
}
