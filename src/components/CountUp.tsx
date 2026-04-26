import { useEffect, useState } from "react";

/** Animated number counter, eases to target value. */
export function CountUp({
  value,
  duration = 1100,
  decimals = 0,
  prefix = "",
  suffix = "",
  separator = ".",
  decimalSeparator = ",",
}: {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  separator?: string;
  decimalSeparator?: string;
}) {
  const [n, setN] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const to = value;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(from + (to - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  const fixed = n.toFixed(decimals);
  const [intPart, decPart] = fixed.split(".");
  const intFmt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  return (
    <span className="text-mono tabular-nums">
      {prefix}
      {intFmt}
      {decPart ? `${decimalSeparator}${decPart}` : ""}
      {suffix}
    </span>
  );
}
