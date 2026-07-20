// Pure conversion + validation helpers for the number base calculator.
// Values are held as BigInt so wide RF register widths stay exact.

export type Base = 'binary' | 'decimal' | 'hex';

// Cap at a 64-bit unsigned register — the widest common engineering boundary.
export const MAX_BITS = 64;
export const MAX_VALUE = (1n << BigInt(MAX_BITS)) - 1n;

const OVERSIZE = `Number exceeds supported size (max ${MAX_BITS} bits).`;

export interface ParseResult {
  // The parsed value, or null when the field is empty or invalid.
  value: bigint | null;
  // Inline validation message, or null when the input is empty or valid.
  error: string | null;
}

// Parse a raw string in the chosen base. Whitespace is ignored so grouped
// input (e.g. "1011 0000") is accepted. Empty input is valid-but-null.
export function parseInput(raw: string, base: Base): ParseResult {
  const cleaned = raw.replace(/\s+/g, '');
  if (cleaned === '') return { value: null, error: null };

  switch (base) {
    case 'binary': {
      if (!/^[01]+$/.test(cleaned)) {
        return { value: null, error: 'Invalid binary digit — use only 0 and 1.' };
      }
      if (cleaned.length > MAX_BITS) {
        return { value: null, error: OVERSIZE };
      }
      return { value: BigInt('0b' + cleaned), error: null };
    }
    case 'hex': {
      if (!/^[0-9a-fA-F]+$/.test(cleaned)) {
        return {
          value: null,
          error: 'Invalid hexadecimal character — use 0–9 and A–F.',
        };
      }
      const value = BigInt('0x' + cleaned);
      return value > MAX_VALUE
        ? { value: null, error: OVERSIZE }
        : { value, error: null };
    }
    case 'decimal': {
      if (!/^[0-9]+$/.test(cleaned)) {
        return { value: null, error: 'Invalid decimal digit — use only 0–9.' };
      }
      const value = BigInt(cleaned);
      return value > MAX_VALUE
        ? { value: null, error: OVERSIZE }
        : { value, error: null };
    }
  }
}

export function toBinary(value: bigint): string {
  return value.toString(2);
}

export function toDecimal(value: bigint): string {
  return value.toString(10);
}

export function toHex(value: bigint): string {
  return value.toString(16).toUpperCase();
}

// Left-pad to a multiple of four and split into space-separated nibbles:
// "1011000011110101" -> "1011 0000 1111 0101".
export function groupNibbles(binary: string): string {
  const pad = (4 - (binary.length % 4)) % 4;
  const padded = '0'.repeat(pad) + binary;
  return padded.replace(/(.{4})/g, '$1 ').trim();
}
