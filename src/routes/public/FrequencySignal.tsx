import { useEffect, useRef } from 'react';

/**
 * Full-width animated "frequency sink" / spectrum-analyzer signal.
 * Pure Canvas 2D — a noisy spectral floor with a few drifting peaks, drawn as
 * a filled trace that spans the entire width above the page title.
 *
 * - devicePixelRatio-aware, resizes with the container (ResizeObserver)
 * - pauses when scrolled off-screen (IntersectionObserver)
 * - prefers-reduced-motion: renders a single static frame, no animation loop
 * - decorative only (aria-hidden)
 */

// Additive harmonics that make up the jagged spectral floor. Fixed at module
// scope so the trace shape is stable across renders.
const HARMONICS = Array.from({ length: 26 }, (_, i) => {
  const freq = 2 + i * 1.7 + Math.random() * 1.5;
  return {
    freq,
    amp: 0.9 / (1 + i * 0.55),
    phase: Math.random() * Math.PI * 2,
    speed: 0.15 + Math.random() * 0.5,
  };
});

// A few spectral peaks that rise above the floor.
const PEAKS = [
  { center: 0.18, width: 0.03, height: 0.7, drift: 0.6 },
  { center: 0.37, width: 0.018, height: 1.0, drift: 0.9 },
  { center: 0.56, width: 0.025, height: 0.55, drift: 0.5 },
  { center: 0.72, width: 0.02, height: 0.85, drift: 0.8 },
  { center: 0.87, width: 0.035, height: 0.45, drift: 0.4 },
];

function signalAt(tx: number, time: number): number {
  let floor = 0;
  for (const h of HARMONICS) {
    floor += h.amp * Math.sin(h.freq * Math.PI * 2 * tx + h.phase + h.speed * time);
  }
  // Normalize the floor to a small, jagged band.
  floor = (floor / HARMONICS.length) * 2.2;

  let peaks = 0;
  for (const p of PEAKS) {
    const wobble = Math.sin(time * p.drift + p.center * 12) * 0.15;
    const h = p.height * (0.75 + 0.25 * Math.sin(time * p.drift));
    const d = (tx - p.center) / p.width;
    peaks += h * Math.exp(-d * d) * (1 + wobble);
  }

  return Math.abs(floor) * 0.5 + peaks;
}

export default function FrequencySignal() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    let onScreen = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen && !prefersReducedMotion && rafRef.current == null) {
          rafRef.current = requestAnimationFrame(loop);
        }
      },
      { threshold: 0 }
    );
    observer.observe(canvas);

    const start = performance.now();

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      const baseline = height * 0.82;
      const maxAmp = height * 0.62;
      const step = 2; // px between samples — keeps it jagged but cheap
      const points: Array<[number, number]> = [];

      for (let x = 0; x <= width; x += step) {
        const tx = x / width;
        const v = signalAt(tx, time);
        const y = baseline - Math.min(v, 1.6) * maxAmp;
        points.push([x, y]);
      }

      // Filled area under the trace.
      const grad = ctx.createLinearGradient(0, 0, 0, baseline);
      grad.addColorStop(0, 'rgba(34, 211, 238, 0.22)');
      grad.addColorStop(1, 'rgba(34, 211, 238, 0)');
      ctx.beginPath();
      ctx.moveTo(0, baseline);
      for (const [x, y] of points) ctx.lineTo(x, y);
      ctx.lineTo(width, baseline);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Trace stroke.
      ctx.beginPath();
      points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Faint baseline.
      ctx.beginPath();
      ctx.moveTo(0, baseline);
      ctx.lineTo(width, baseline);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const loop = () => {
      const time = (performance.now() - start) / 1000;
      draw(time);
      if (onScreen && !prefersReducedMotion) {
        rafRef.current = requestAnimationFrame(loop);
      } else {
        rafRef.current = undefined;
      }
    };

    if (prefersReducedMotion) {
      draw(0);
    } else {
      rafRef.current = requestAnimationFrame(loop);
    }

    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = undefined;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="block h-56 w-full sm:h-72 lg:h-80"
      aria-hidden="true"
    />
  );
}
