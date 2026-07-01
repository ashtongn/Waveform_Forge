import { useEffect, useRef } from 'react';
import { buildSpectrum, type Spectrum } from './jamTypes';

// Blue = notional training signal, Red = conceptual jamming overlay. These are
// part of the app's design language for this educational page and are kept
// separate from the forge theme accent used for page chrome.
const BLUE = 'rgba(59, 181, 255, 0.96)';
const BLUE_FILL = 'rgba(59, 181, 255, 0.12)';
const BLUE_GLOW = 'rgba(59, 181, 255, 0.7)';
const RED = 'rgba(255, 68, 95, 0.95)';
const RED_FILL = 'rgba(255, 68, 95, 0.18)';
const RED_GLOW = 'rgba(255, 68, 95, 0.75)';
const BG = '#030507';

const HISTORY_ROWS = 126;

interface Area {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface HistoryCell {
  blue: number;
  red: number;
}

interface SpectrumCanvasProps {
  /** Selected conceptual jamming category id. */
  typeId: string;
  /** Whether the educational red overlay is enabled. */
  jammingActive: boolean;
}

/**
 * Animated, abstract frequency-domain visualization rendered with Canvas 2D.
 *
 * - Upper trace: instantaneous spectrum (blue training signal + optional red
 *   jamming overlay).
 * - Lower panel: a waterfall / time-history view.
 *
 * Follows the app's canvas conventions: devicePixelRatio-aware, resizes with a
 * ResizeObserver, pauses off-screen via IntersectionObserver, and renders a
 * single static frame when the user prefers reduced motion.
 */
export default function SpectrumCanvas({ typeId, jammingActive }: SpectrumCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();
  // Latest props read inside the animation loop without restarting it.
  const stateRef = useRef({ typeId, jammingActive });
  const historyRef = useRef<HistoryCell[][]>([]);

  useEffect(() => {
    stateRef.current = { typeId, jammingActive };
    // Reset the waterfall when the learner changes selection or toggle so the
    // history reflects the current view.
    historyRef.current = [];
  }, [typeId, jammingActive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
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
      canvas.width = Math.max(800, Math.round(width * dpr));
      canvas.height = Math.max(420, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      historyRef.current = [];
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

    const drawLine = (
      values: number[],
      area: Area,
      color: string,
      fillColor: string,
      glowColor: string,
      lineWidth: number
    ) => {
      const { x, y, w, h } = area;
      ctx.save();
      ctx.beginPath();
      values.forEach((value, i) => {
        const px = x + (i / (values.length - 1)) * w;
        const py = y + h - value * h;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 16;
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.restore();
    };

    const pushHistory = (spectrum: Spectrum) => {
      const bins = spectrum.blue.length;
      const row: HistoryCell[] = [];
      for (let i = 0; i < bins; i++) {
        row.push({ blue: spectrum.blue[i], red: spectrum.red[i] });
      }
      historyRef.current.unshift(row);
      if (historyRef.current.length > HISTORY_ROWS) historyRef.current.pop();
    };

    const drawWaterfall = (area: Area) => {
      const { x, y, w, h } = area;
      const rows = historyRef.current;
      const rowHeight = h / HISTORY_ROWS;
      const bins = rows[0]?.length || 220;
      const colWidth = w / bins;

      ctx.save();
      ctx.fillStyle = 'rgba(3, 5, 7, 0.98)';
      ctx.fillRect(x, y, w, h);

      for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex];
        const age = 1 - rowIndex / HISTORY_ROWS;
        for (let i = 0; i < row.length; i++) {
          const cell = row[i];
          if (cell.red > 0.05) {
            ctx.fillStyle = `rgba(255, 68, 95, ${Math.min(cell.red * 0.75 * age, 0.82)})`;
          } else {
            ctx.fillStyle = `rgba(59, 181, 255, ${Math.min(cell.blue * 0.55 * age, 0.52)})`;
          }
          ctx.fillRect(
            x + i * colWidth,
            y + rowIndex * rowHeight,
            colWidth + 0.5,
            rowHeight + 0.5
          );
        }
      }

      ctx.strokeStyle = 'rgba(135,161,187,0.22)';
      ctx.strokeRect(x, y, w, h);
      ctx.restore();
    };

    const drawGrid = (area: Area) => {
      ctx.save();
      ctx.strokeStyle = 'rgba(135,161,187,0.18)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 6; i++) {
        const y = area.y + (i / 6) * area.h;
        ctx.beginPath();
        ctx.moveTo(area.x, y);
        ctx.lineTo(area.x + area.w, y);
        ctx.stroke();
      }
      for (let i = 0; i <= 12; i++) {
        const x = area.x + (i / 12) * area.w;
        ctx.beginPath();
        ctx.moveTo(x, area.y);
        ctx.lineTo(x, area.y + area.h);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(135,161,187,0.24)';
      ctx.strokeRect(area.x, area.y, area.w, area.h);
      ctx.restore();
    };

    const drawLabels = (top: Area, bottom: Area, active: boolean) => {
      ctx.save();
      ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
      ctx.fillStyle = 'rgba(231,237,245,0.42)';
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      ctx.fillText('INSTANTANEOUS SPECTRUM', top.x + 12, top.y + 10);
      ctx.fillText('WATERFALL HISTORY', bottom.x + 12, bottom.y + 10);

      ctx.textAlign = 'right';
      ctx.fillStyle = active ? 'rgba(255,68,95,0.86)' : 'rgba(141,154,170,0.56)';
      ctx.fillText(
        active ? 'OVERLAY ACTIVE' : 'OVERLAY STANDBY',
        top.x + top.w - 12,
        top.y + 10
      );
      ctx.restore();
    };

    const drawFrame = (t: number) => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, width, height);

      const pad = 20;
      const spectrumArea: Area = { x: pad, y: 34, w: width - pad * 2, h: height * 0.47 };
      const waterfallArea: Area = {
        x: pad,
        y: spectrumArea.y + spectrumArea.h + 34,
        w: width - pad * 2,
        h: height - spectrumArea.y - spectrumArea.h - 54,
      };

      const { typeId: id, jammingActive: active } = stateRef.current;
      const spectrum = buildSpectrum(id, t, active);

      if (!prefersReducedMotion || historyRef.current.length === 0) {
        pushHistory(spectrum);
      }

      drawGrid(spectrumArea);
      drawLine(spectrum.blue, spectrumArea, BLUE, BLUE_FILL, BLUE_GLOW, 2);
      if (spectrum.active) {
        drawLine(spectrum.red, spectrumArea, RED, RED_FILL, RED_GLOW, 2.2);
      }
      drawWaterfall(waterfallArea);
      drawLabels(spectrumArea, waterfallArea, active);
    };

    const loop = () => {
      const t = (performance.now() - start) / 1000;
      drawFrame(t);
      if (onScreen && !prefersReducedMotion) {
        rafRef.current = requestAnimationFrame(loop);
      } else {
        rafRef.current = undefined;
      }
    };

    if (prefersReducedMotion) {
      drawFrame(0.1);
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
    <div className="relative border border-forge-border bg-[#030507]">
      {/* Grid overlay + educational watermark, matching the reference scope. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.042) 1px, transparent 1px)',
          backgroundSize: '48px 40px',
        }}
      />
      <span className="pointer-events-none absolute right-3.5 top-3 z-[2] font-mono text-[0.65rem] uppercase tracking-[0.12em] text-forge-text/40">
        Abstract frequency view • educational only
      </span>
      <canvas
        ref={canvasRef}
        className="relative z-0 block h-[460px] w-full sm:h-[560px] lg:h-[660px]"
        aria-label="Animated abstract frequency visualization"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-3.5 bottom-3 z-[2] flex justify-between font-mono text-[0.64rem] uppercase tracking-[0.1em] text-forge-text/40"
      >
        <span>Lower abstract bins</span>
        <span className="hidden sm:inline">Center observation area</span>
        <span>Upper abstract bins</span>
      </div>
    </div>
  );
}
