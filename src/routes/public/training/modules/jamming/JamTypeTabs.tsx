import { JAM_TYPES } from './jamTypes';

interface JamTypeTabsProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

/** Horizontal, scrollable tab bar for selecting a conceptual jamming category. */
export default function JamTypeTabs({ selectedId, onSelect }: JamTypeTabsProps) {
  return (
    <nav
      role="tablist"
      aria-label="Jamming type selector"
      className="flex gap-2 overflow-x-auto border-b border-forge-border bg-white/[0.028] p-3"
    >
      {JAM_TYPES.map((type) => {
        const active = type.id === selectedId;
        return (
          <button
            key={type.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(type.id)}
            className={[
              'whitespace-nowrap border px-3 py-2.5 font-mono text-[0.72rem] uppercase tracking-[0.065em] transition',
              active
                ? 'border-[#8af1ff] bg-gradient-to-b from-[#8af1ff] to-[#3bb5ff] text-[#081016] shadow-[0_0_28px_rgba(59,181,255,0.18)]'
                : 'border-forge-border bg-black/40 text-forge-muted hover:border-forge-accent/50 hover:bg-white/5 hover:text-forge-text',
            ].join(' ')}
          >
            {type.label}
          </button>
        );
      })}
    </nav>
  );
}
