/**
 * Decorative glowing gold bokeh. Positions come from a seeded generator so the
 * server and browser render identical markup.
 */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Props = {
  count?: number;
  seed?: number;
  /** Bias dots toward an area: "right", "left", "edges", "bottom" or "all". */
  focus?: "right" | "left" | "edges" | "bottom" | "all";
  maxSize?: number;
  className?: string;
};

export function Bokeh({ count = 40, seed = 1, focus = "all", maxSize = 56, className = "" }: Props) {
  const rand = mulberry32(seed);

  const dots = Array.from({ length: count }, () => {
    let x = rand() * 100;
    let y = rand() * 100;
    if (focus === "right") x = 45 + Math.pow(rand(), 0.7) * 55;
    if (focus === "left") x = Math.pow(rand(), 1.4) * 45;
    if (focus === "edges") x = rand() < 0.5 ? rand() * 18 : 82 + rand() * 18;
    if (focus === "bottom") y = 55 + rand() * 45;

    const size = 4 + Math.pow(rand(), 2.2) * maxSize;
    const opacity = 0.25 + rand() * 0.6;
    const blur = size > maxSize * 0.55 ? 2 + rand() * 4 : rand() * 1.2;
    const warm = rand() < 0.5;
    return {
      left: `${x.toFixed(2)}%`,
      top: `${y.toFixed(2)}%`,
      size: Math.round(size),
      opacity: opacity.toFixed(2),
      blur: blur.toFixed(1),
      color: warm ? "255,214,120" : "232,190,80",
      duration: `${(4 + rand() * 6).toFixed(1)}s`,
      delay: `${(-rand() * 8).toFixed(1)}s`,
    };
  });

  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {dots.map((d, i) => (
        <span
          key={i}
          className="bokeh-dot absolute rounded-full"
          style={
            {
              left: d.left,
              top: d.top,
              width: d.size,
              height: d.size,
              marginLeft: -d.size / 2,
              marginTop: -d.size / 2,
              filter: `blur(${d.blur}px)`,
              background: `radial-gradient(circle, rgba(${d.color},1) 0%, rgba(${d.color},.55) 45%, rgba(${d.color},0) 72%)`,
              "--o": d.opacity,
              "--d": d.duration,
              "--delay": d.delay,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
