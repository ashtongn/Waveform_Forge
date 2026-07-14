import type { CSSProperties } from 'react';
import type { Segment } from './bitsData';

interface FieldLegendProps {
  segments: Segment[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

/**
 * The field guide — selecting an item pins its explanation and highlights every
 * bit that belongs to that field.
 */
export default function FieldLegend({ segments, activeId, onSelect }: FieldLegendProps) {
  return (
    <section
      aria-label="Frame field guide"
      className="border border-forge-border bg-forge-panel/90 p-6 shadow-2xl"
    >
      <h3 className="text-base font-semibold tracking-tight">Frame field guide</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-forge-muted">
        Select a field to highlight every bit that belongs to it.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {segments.map((segment) => {
          const active = segment.id === activeId;
          return (
            <button
              key={segment.id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(segment.id)}
              style={{ '--item': segment.color } as CSSProperties}
              className={[
                'border bg-[#061222]/70 p-3.5 text-left transition hover:-translate-y-0.5 focus:outline-none focus-visible:-translate-y-0.5',
                active
                  ? 'border-[color:var(--item)]/60'
                  : 'border-white/10 hover:border-[color:var(--item)]/50',
              ].join(' ')}
            >
              <span
                className="mb-2.5 block h-[5px] w-[30px] rounded-sm"
                style={{
                  background: segment.color,
                  boxShadow: `0 0 14px ${segment.color}88`,
                }}
              />
              <strong className="block text-[0.86rem] font-semibold">{segment.name}</strong>
              <p className="mt-1 text-[0.76rem] leading-snug text-forge-muted">
                {segment.legend}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
