/**
 * Minimal YAML front-matter parser.
 *
 * Only the tiny subset used by Waveform Forge documents is supported:
 * top-level `key: value` pairs with optional quotes. Keeping this in-house
 * avoids pulling a Node-oriented dependency (gray-matter) into the browser
 * bundle for ~30 lines of work.
 */

export type FrontMatter = Record<string, string>;

const FRONT_MATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function parseFrontMatter(source: string): {
  data: FrontMatter;
  content: string;
} {
  const match = FRONT_MATTER_PATTERN.exec(source);
  if (!match) return { data: {}, content: source };

  const data: FrontMatter = {};
  for (const line of match[1].split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separator = trimmed.indexOf(':');
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    if (!key) continue;

    data[key] = rawValue.replace(/^["']|["']$/g, '');
  }

  return { data, content: source.slice(match[0].length) };
}
