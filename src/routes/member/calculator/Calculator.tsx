import { useMemo, useState } from 'react';
import {
  groupNibbles,
  parseInput,
  toBinary,
  toDecimal,
  toHex,
  type Base,
} from './convert';

const controlClass =
  'w-full rounded-md border border-forge-border bg-forge-panel/50 px-3 py-2 text-sm text-forge-text outline-none transition focus:border-forge-accent';

const BASES: { value: Base; label: string }[] = [
  { value: 'binary', label: 'Binary' },
  { value: 'decimal', label: 'Decimal' },
  { value: 'hex', label: 'Hexadecimal' },
];

// Placeholder + example digits per input base, shown to hint the expected form.
const HINTS: Record<Base, string> = {
  binary: '1011 0000 1111 0101',
  decimal: '45301',
  hex: 'B0F5',
};

interface OutputFieldProps {
  label: string;
  value: string;
  copyLabel: string;
  copied: boolean;
  onCopy: () => void;
}

function OutputField({
  label,
  value,
  copyLabel,
  copied,
  onCopy,
}: OutputFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-forge-text">{label}</span>
        <button
          type="button"
          onClick={onCopy}
          disabled={!value}
          className="rounded px-2 py-1 text-xs font-medium text-forge-muted transition hover:text-forge-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          {copied ? 'Copied ✓' : copyLabel}
        </button>
      </div>
      <div className="min-h-[2.75rem] w-full overflow-x-auto rounded-md border border-forge-border bg-forge-bg/60 px-3 py-2.5 font-mono text-base tracking-wide text-forge-text">
        {value || <span className="text-forge-muted">—</span>}
      </div>
    </div>
  );
}

// Quick lookup for the 0–15 reference table at the bottom of the page.
const REFERENCE = Array.from({ length: 16 }, (_, n) => ({
  decimal: n,
  hex: n.toString(16).toUpperCase(),
  binary: n.toString(2).padStart(4, '0'),
}));

type CopyKey = 'binary' | 'decimal' | 'hex';

export default function Calculator() {
  const [base, setBase] = useState<Base>('binary');
  const [raw, setRaw] = useState('');
  const [copied, setCopied] = useState<CopyKey | null>(null);

  const { value, error } = useMemo(() => parseInput(raw, base), [raw, base]);

  const outputs = useMemo(() => {
    if (value === null) return { binary: '', decimal: '', hex: '' };
    return {
      binary: groupNibbles(toBinary(value)),
      decimal: toDecimal(value),
      hex: toHex(value),
    };
  }, [value]);

  async function copy(key: CopyKey) {
    const text = outputs[key].replace(/\s+/g, key === 'binary' ? ' ' : '');
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text.trim());
      setCopied(key);
      window.setTimeout(
        () => setCopied((c) => (c === key ? null : c)),
        1200,
      );
    } catch {
      // Clipboard access can be blocked; silently ignore rather than nag.
    }
  }

  function clear() {
    setRaw('');
    setCopied(null);
  }

  return (
    <section className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-2">
        <p className="font-mono text-sm uppercase tracking-widest text-forge-accent">
          Member area
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Binary / Decimal / Hex Calculator
        </h1>
        <p className="text-forge-muted">
          Fast base conversion for RF work. Pick an input format and type — every
          representation updates instantly.
        </p>
      </header>

      <div className="space-y-5 rounded-lg border border-forge-border bg-forge-panel/50 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[10rem_1fr]">
          <div className="space-y-1.5">
            <label htmlFor="calc-base" className="block text-sm font-medium text-forge-text">
              Input format
            </label>
            <select
              id="calc-base"
              value={base}
              onChange={(e) => setBase(e.target.value as Base)}
              className={controlClass}
            >
              {BASES.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="calc-input" className="block text-sm font-medium text-forge-text">
              Value
            </label>
            <input
              id="calc-input"
              autoFocus
              autoComplete="off"
              spellCheck={false}
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder={HINTS[base]}
              aria-invalid={error !== null}
              className={`${controlClass} font-mono tracking-wide ${
                error ? 'border-red-500/60 focus:border-red-500' : ''
              }`}
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}

        <div className="space-y-4 border-t border-forge-border pt-5">
          <OutputField
            label="Binary"
            value={outputs.binary}
            copyLabel="Copy Binary"
            copied={copied === 'binary'}
            onCopy={() => copy('binary')}
          />
          <OutputField
            label="Decimal"
            value={outputs.decimal}
            copyLabel="Copy Decimal"
            copied={copied === 'decimal'}
            onCopy={() => copy('decimal')}
          />
          <OutputField
            label="Hexadecimal"
            value={outputs.hex}
            copyLabel="Copy Hex"
            copied={copied === 'hex'}
            onCopy={() => copy('hex')}
          />
        </div>

        <div className="flex justify-end border-t border-forge-border pt-5">
          <button
            type="button"
            onClick={clear}
            disabled={!raw}
            className="rounded-md border border-forge-border px-4 py-2 text-sm font-medium text-forge-muted transition hover:border-forge-accent hover:text-forge-text disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-forge-muted">
          Quick reference
        </h2>
        <div className="overflow-hidden rounded-lg border border-forge-border">
          <table className="w-full font-mono text-sm">
            <thead>
              <tr className="border-b border-forge-border bg-forge-panel/60 text-xs uppercase tracking-wide text-forge-muted">
                <th className="px-3 py-2 text-right font-medium">Decimal</th>
                <th className="px-3 py-2 text-center font-medium">Hex</th>
                <th className="px-3 py-2 text-center font-medium">Binary</th>
              </tr>
            </thead>
            <tbody>
              {REFERENCE.map((row) => (
                <tr
                  key={row.decimal}
                  className="border-b border-forge-border/50 last:border-0 odd:bg-forge-panel/20"
                >
                  <td className="px-3 py-1.5 text-right tabular-nums text-forge-text">
                    {row.decimal}
                  </td>
                  <td className="px-3 py-1.5 text-center text-forge-accent">
                    {row.hex}
                  </td>
                  <td className="px-3 py-1.5 text-center tracking-widest text-forge-text">
                    {row.binary}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
