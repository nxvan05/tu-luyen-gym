"use client";

interface Particle {
  left: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  color: string;
}

const PARTICLES: Particle[] = [
  { left: 6, size: 5, duration: 22, delay: 0, opacity: 0.55, color: "oklch(0.7 0.11 170 / 55%)" },
  { left: 13, size: 3, duration: 26, delay: 4, opacity: 0.4, color: "oklch(0.82 0.14 85 / 50%)" },
  { left: 21, size: 4, duration: 19, delay: 9, opacity: 0.5, color: "oklch(0.75 0.16 25 / 45%)" },
  { left: 28, size: 3, duration: 24, delay: 2, opacity: 0.45, color: "oklch(0.7 0.11 170 / 50%)" },
  { left: 35, size: 5, duration: 28, delay: 6, opacity: 0.5, color: "oklch(0.82 0.14 85 / 45%)" },
  { left: 42, size: 3, duration: 20, delay: 11, opacity: 0.4, color: "oklch(0.72 0.14 300 / 40%)" },
  { left: 49, size: 4, duration: 25, delay: 1, opacity: 0.5, color: "oklch(0.7 0.11 170 / 50%)" },
  { left: 56, size: 3, duration: 21, delay: 7, opacity: 0.45, color: "oklch(0.82 0.14 85 / 50%)" },
  { left: 63, size: 5, duration: 27, delay: 13, opacity: 0.55, color: "oklch(0.75 0.16 25 / 40%)" },
  { left: 70, size: 3, duration: 23, delay: 3, opacity: 0.4, color: "oklch(0.7 0.11 170 / 45%)" },
  { left: 77, size: 4, duration: 29, delay: 8, opacity: 0.5, color: "oklch(0.82 0.14 85 / 50%)" },
  { left: 84, size: 3, duration: 20, delay: 14, opacity: 0.45, color: "oklch(0.72 0.14 300 / 45%)" },
  { left: 91, size: 5, duration: 24, delay: 5, opacity: 0.5, color: "oklch(0.7 0.11 170 / 50%)" },
  { left: 96, size: 3, duration: 27, delay: 10, opacity: 0.4, color: "oklch(0.82 0.14 85 / 45%)" },
];

export function LingQiParticles() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="animate-rise absolute bottom-[-24px] rounded-full"
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              background: p.color,
              boxShadow: `0 0 12px 2px ${p.color}`,
              opacity: 0,
              "--particle-opacity": p.opacity,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
