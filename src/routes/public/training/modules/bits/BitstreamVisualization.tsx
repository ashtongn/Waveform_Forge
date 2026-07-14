import type { CSSProperties } from 'react';
import type { Segment } from './bitsData';

interface BitstreamVisualizationProps {
  segments: Segment[];
  activeId: string | null;
  pinnedId: string | null;
  isPlaying: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}

interface FlatBit {
  segment: Segment;
  value: string;
  localIndex: number;
  key: string;
}

interface Bracket {
  segment: Segment;
  start: number;
  span: number;
}

function flatten(segments: Segment[]): { bits: FlatBit[]; brackets: Bracket[] } {
  const bits: FlatBit[] = [];
  const brackets: Bracket[] = [];
  let column = 1;

  segments.forEach((segment) => {
    brackets.push({ segment, start: column, span: segment.bits.length });
    segment.bits.split('').forEach((value, localIndex) => {
      bits.push({ segment, value, localIndex, key: `${segment.id}-${localIndex}` });
      column += 1;
    });
  });

  return { bits, brackets };
}

/**
 * The interactive bitstream grid + labelled bracket row. Hovering a bit
 * previews its field; clicking pins (or unpins) it. Purely presentational —
 * all selection state is owned by the parent module.
 */
export default function BitstreamVisualization({
  segments,
  activeId,
  pinnedId,
  isPlaying,
  onHover,
  onSelect,
}: BitstreamVisualizationProps) {
  const { bits, brackets } = flatten(segments);
  const columns = bits.length;
  const gridStyle: CSSProperties = {
    gridTemplateColumns: `repeat(${columns}, minmax(13px, 1fr))`,
  };

  return (
    <div className="relative mx-auto w-full max-w-[1040px]">
      {isPlaying && (
        <span
          aria-hidden="true"
          className="bits-scan-line pointer-events-none absolute bottom-[18px] top-[18px] z-[5] w-[3px] bg-gradient-to-b from-transparent via-white to-transparent shadow-[0_0_24px_#62d7ff]"
        />
      )}

      <div
        role="group"
        aria-label="Interactive example bitstream"
        onMouseLeave={() => onHover(null)}
        className="grid items-stretch gap-[3px] overflow-x-auto border border-white/10 bg-[#040c18]/95 p-[18px]"
        style={gridStyle}
      >
        {bits.map(({ segment, value, localIndex, key }) => {
          const active = segment.id === activeId;
          const pinned = segment.id === pinnedId;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={pinned}
              aria-label={`${segment.name}, bit ${localIndex + 1} of ${segment.bits.length}, value ${value}`}
              onMouseEnter={() => onHover(segment.id)}
              onFocus={() => onHover(segment.id)}
              onClick={() => onSelect(segment.id)}
              className={[
                'relative grid min-h-[64px] min-w-[15px] cursor-pointer place-items-center px-px pb-2 pt-1 font-mono text-[clamp(1.7rem,2.45vw,2.7rem)] font-black leading-none outline-none transition',
                active
                  ? '-translate-y-1 text-[color:var(--seg)]'
                  : 'text-[#dfe8f7] hover:-translate-y-1 focus-visible:-translate-y-1',
              ].join(' ')}
              style={
                {
                  '--seg': segment.color,
                  ...(active
                    ? {
                        textShadow: `0 0 8px ${segment.color}, 0 0 20px ${segment.color}88`,
                      }
                    : {}),
                } as CSSProperties
              }
            >
              {value}
              <span
                aria-hidden="true"
                className="absolute inset-x-[18%] bottom-0.5 h-[3px] rounded-sm transition"
                style={
                  active
                    ? {
                        background: segment.color,
                        boxShadow: `0 0 12px ${segment.color}aa`,
                      }
                    : undefined
                }
              />
            </button>
          );
        })}
      </div>

      <div
        aria-hidden="true"
        className="mt-2.5 grid gap-[3px] overflow-hidden px-[18px]"
        style={gridStyle}
      >
        {brackets.map(({ segment, start, span }) => (
          <div
            key={segment.id}
            className="whitespace-nowrap border-t-2 pt-1.5 text-center font-mono text-[0.64rem] font-extrabold uppercase tracking-[0.09em] opacity-80"
            style={{
              gridColumn: `${start} / span ${span}`,
              borderColor: segment.color,
              color: segment.color,
            }}
          >
            {segment.short}
          </div>
        ))}
      </div>
    </div>
  );
}
