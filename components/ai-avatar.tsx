"use client";

import { useEffect, useRef } from "react";

const GRID = 5;
const PALETTE = [
  [234, 88, 71], // warm red
  [245, 166, 58], // orange
  [250, 210, 80], // yellow
  [120, 200, 120], // green
  [90, 140, 220], // blue
  [170, 100, 210], // purple
] as const;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpColor(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  t: number,
): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

export function AiAvatar({ size = 24 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let raf: number;
    const pixelSize = size / GRID;

    function draw(time: number) {
      if (!ctx) return;
      const t = time * 0.0005; // slow cycle

      for (let y = 0; y < GRID; y++) {
        for (let x = 0; x < GRID; x++) {
          // Each pixel picks two palette colors based on position + time
          const offset = (x + y * 0.7 + t) % PALETTE.length;
          const idx = Math.floor(offset);
          const frac = offset - idx;
          const c1 = PALETTE[idx % PALETTE.length];
          const c2 = PALETTE[(idx + 1) % PALETTE.length];
          const color = lerpColor(c1, c2, frac);

          ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
          ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
      }

      if (!prefersReduced) {
        raf = requestAnimationFrame(draw);
      }
    }

    // Draw once immediately, animate if allowed
    draw(prefersReduced ? 0 : performance.now());
    if (!prefersReduced) {
      raf = requestAnimationFrame(draw);
    }

    return () => cancelAnimationFrame(raf);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="rounded-full shrink-0"
      aria-hidden="true"
    />
  );
}
