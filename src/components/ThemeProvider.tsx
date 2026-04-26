import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Accent = "violet" | "blue" | "green" | "orange" | "pink" | "turquoise";
export type Mode = "dark" | "light";

export const ACCENTS: { id: Accent; label: string; hsl: string }[] = [
  { id: "violet", label: "Violeta", hsl: "265 90% 66%" },
  { id: "blue", label: "Azul", hsl: "217 92% 62%" },
  { id: "green", label: "Verde", hsl: "152 72% 48%" },
  { id: "orange", label: "Laranja", hsl: "22 95% 58%" },
  { id: "pink", label: "Rosa", hsl: "330 90% 65%" },
  { id: "turquoise", label: "Turquesa", hsl: "175 80% 48%" },
];

type Ctx = {
  accent: Accent;
  setAccent: (a: Accent) => void;
  mode: Mode;
  setMode: (m: Mode) => void;
  toggleMode: () => void;
};

const ThemeCtx = createContext<Ctx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [accent, setAccentState] = useState<Accent>(() => {
    if (typeof window === "undefined") return "violet";
    return (localStorage.getItem("wm-accent") as Accent) || "violet";
  });
  const [mode, setModeState] = useState<Mode>(() => {
    if (typeof window === "undefined") return "dark";
    return (localStorage.getItem("wm-mode") as Mode) || "dark";
  });

  useEffect(() => {
    document.documentElement.dataset.accent = accent;
    localStorage.setItem("wm-accent", accent);
  }, [accent]);

  useEffect(() => {
    document.documentElement.classList.toggle("light", mode === "light");
    localStorage.setItem("wm-mode", mode);
  }, [mode]);

  return (
    <ThemeCtx.Provider
      value={{
        accent,
        setAccent: setAccentState,
        mode,
        setMode: setModeState,
        toggleMode: () => setModeState((m) => (m === "dark" ? "light" : "dark")),
      }}
    >
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
