import type { CSSProperties } from 'react';
import { FRAME_OVERVIEW, type Segment } from './bitsData';

interface SegmentDetailsProps {
  segment: Segment | null;
  pinned: boolean;
}

/**
 * The details card that explains the currently active field, or a friendly
 * overview when nothing is selected.
 */
export default function SegmentDetails({ segment, pinned }: SegmentDetailsProps) {
  const color = segment?.color ?? '#62d7ff';
  const kicker = segment ? (pinned ? 'Pinned field' : 'Current field') : FRAME_OVERVIEW.kicker;
  const title = segment?.name ?? FRAME_OVERVIEW.title;
  const description = segment?.description ?? FRAME_OVERVIEW.description;
  const question = segment?.question ?? FRAME_OVERVIEW.question;
  const takeaway = segment?.takeaway ?? FRAME_OVERVIEW.takeaway;

  return (
    <article
      className="relative overflow-hidden border border-forge-border bg-forge-panel/90 p-6 shadow-2xl"
      style={{ '--detail': color } as CSSProperties}
    >
      <div
        className="flex items-center gap-2.5 font-mono text-[0.73rem] font-black uppercase tracking-[0.16em]"
        style={{ color }}
      >
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: color, boxShadow: `0 0 16px ${color}` }}
        />
        {kicker}
      </div>

      <h3
        className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl"
        aria-live="polite"
      >
        {title}
      </h3>
      <p className="mt-2.5 max-w-2xl leading-relaxed text-forge-muted">{description}</p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="border border-white/10 bg-black/40 p-3.5">
          <span className="font-mono text-[0.68rem] uppercase tracking-[0.1em] text-forge-muted">
            Receiver question
          </span>
          <strong className="mt-1.5 block text-sm font-medium leading-snug text-forge-text">
            {question}
          </strong>
        </div>
        <div className="border border-white/10 bg-black/40 p-3.5">
          <span className="font-mono text-[0.68rem] uppercase tracking-[0.1em] text-forge-muted">
            Key idea
          </span>
          <strong className="mt-1.5 block text-sm font-medium leading-snug text-forge-text">
            {takeaway}
          </strong>
        </div>
      </div>
    </article>
  );
}
