import type { CSSProperties } from 'react';
import { RECEIVE_FLOW } from './bitsData';

interface ReceiveFlowProps {
  activeFlow: number | null;
  isPlaying: boolean;
  onPlayToggle: () => void;
  onReset: () => void;
}

/**
 * A simplified view of what the receiver is doing internally, plus the
 * play/reset controls for the guided scan.
 */
export default function ReceiveFlow({
  activeFlow,
  isPlaying,
  onPlayToggle,
  onReset,
}: ReceiveFlowProps) {
  return (
    <aside className="border border-forge-border bg-forge-panel/90 p-5 shadow-2xl">
      <h3 className="text-base font-semibold tracking-tight">Receive flow</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-forge-muted">
        A simplified view of what the receiver is doing internally.
      </p>

      <ol className="mt-5 grid gap-2.5">
        {RECEIVE_FLOW.map((step, index) => {
          const active = index === activeFlow;
          return (
            <li
              key={step.title}
              style={{ '--step': step.color } as CSSProperties}
              className={[
                'grid grid-cols-[34px_1fr] items-start gap-3 border p-3 transition',
                active
                  ? 'translate-x-1 border-[color:var(--step)]/50 bg-[color:var(--step)]/[0.08]'
                  : 'border-white/10 bg-[#08182b]/70',
              ].join(' ')}
            >
              <span
                className="grid h-[34px] w-[34px] place-items-center border text-[0.82rem] font-black"
                style={{
                  color: step.color,
                  borderColor: `${step.color}66`,
                  background: `${step.color}14`,
                }}
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <strong className="block text-sm font-semibold">{step.title}</strong>
                <p className="mt-1 text-[0.79rem] leading-snug text-forge-muted">
                  {step.body}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-5 flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={onPlayToggle}
          className="border border-transparent bg-forge-accent px-3.5 py-2.5 text-sm font-black uppercase tracking-[0.02em] text-forge-bg transition hover:-translate-y-px"
        >
          {isPlaying ? 'Scanning…' : 'Play receive scan'}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="border border-white/10 bg-[#122742]/90 px-3.5 py-2.5 text-sm uppercase tracking-[0.02em] text-forge-text transition hover:-translate-y-px hover:border-forge-accent/50"
        >
          Reset lesson
        </button>
      </div>
    </aside>
  );
}
