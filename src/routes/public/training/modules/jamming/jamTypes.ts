/**
 * Educational jamming-visualization data + abstract spectrum math.
 *
 * IMPORTANT — public-safe content:
 * Everything in this file is intentionally abstract and non-operational. There
 * are no real frequencies, RF values, power levels, or signal parameters. The
 * math below only produces fictional shapes on a canvas so learners can compare
 * conceptual patterns. Do not add operational data here.
 */

export interface JamType {
  id: string;
  label: string;
  description: string;
}

/** The initial set of conceptual jamming categories learners can explore. */
export const JAM_TYPES: JamType[] = [
  {
    id: 'narrowband_noise',
    label: 'narrowband_noise',
    description:
      'Shows a compact red noise-like overlay concentrated near the blue training signal. Useful for explaining localized spectral overlap in a non-operational way.',
  },
  {
    id: 'FM_cosine',
    label: 'FM_cosine',
    description:
      'Shows a smooth red lobe that breathes side-to-side around the training signal. This is a stylized teaching visualization, not a parameterized signal model.',
  },
  {
    id: 'swept_cosine',
    label: 'swept_cosine',
    description:
      'Shows a narrow red peak moving across the observation area so learners can see the concept of a sweeping spectral feature.',
  },
  {
    id: 'swept_phasors',
    label: 'swept_phasors',
    description:
      'Shows several red points drifting as a group across the spectrum, representing discrete moving tones in a simplified visual form.',
  },
  {
    id: 'phasor_tones',
    label: 'phasor_tones',
    description:
      'Shows multiple stable red spikes at separated positions, helping learners compare discrete tone-like behavior against the blue reference signal.',
  },
  {
    id: 'cosine_tones',
    label: 'cosine_tones',
    description:
      'Shows evenly spaced red peaks with gentle amplitude motion, giving a classroom-style view of repeated tonal components.',
  },
  {
    id: 'noise_tones',
    label: 'noise_tones',
    description:
      'Shows red tone peaks mixed with a rougher noise floor so learners can identify a combined tonal-plus-noise pattern.',
  },
  {
    id: 'chunk_noise',
    label: 'chunk_noise',
    description:
      'Shows blocky red regions appearing in chunks across nearby bins, emphasizing intermittent occupied regions rather than a continuous smooth trace.',
  },
  {
    id: 'swept_noise',
    label: 'swept_noise',
    description:
      'Shows a broader red noise region moving across the observation area, useful for teaching the difference between swept narrow features and swept broad features.',
  },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function gaussian(x: number, center: number, width: number, amp: number): number {
  const d = (x - center) / width;
  return amp * Math.exp(-d * d);
}

/** Deterministic, seedable pseudo-noise — purely for canvas texture. */
function pseudoNoise(i: number, t: number, seed = 0): number {
  const n =
    Math.sin(i * 12.9898 + seed * 78.233 + Math.floor(t * 14) * 37.719) * 43758.5453;
  return n - Math.floor(n);
}

/** The notional blue training signal learners are trying to observe. */
function trainingSignal(x: number, t: number): number {
  const center = 0.5 + Math.sin(t * 0.55) * 0.015;
  const main = gaussian(x, center, 0.014, 0.62);
  const skirt = gaussian(x, center, 0.045, 0.16);
  const drift = Math.sin(x * 36 + t * 2.2) * 0.012;
  return main + skirt + drift;
}

/** Abstract red overlay value for the selected conceptual jamming pattern. */
function jammingValue(typeId: string, x: number, t: number, i: number): number {
  switch (typeId) {
    case 'narrowband_noise': {
      const c = 0.5 + Math.sin(t * 1.1) * 0.012;
      const base = gaussian(x, c, 0.024, 0.72);
      const rough = (pseudoNoise(i, t, 1) - 0.5) * 0.22;
      return clamp(base + rough * gaussian(x, c, 0.045, 1), 0, 1);
    }
    case 'FM_cosine': {
      const c = 0.5 + Math.sin(t * 1.7) * 0.09;
      return (
        gaussian(x, c, 0.04, 0.55) +
        gaussian(x, c + 0.06 * Math.sin(t * 2.2), 0.024, 0.3)
      );
    }
    case 'swept_cosine': {
      const c = 0.12 + ((t * 0.12) % 0.76);
      return gaussian(x, c, 0.018, 0.82) + gaussian(x, c, 0.055, 0.14);
    }
    case 'swept_phasors': {
      let sum = 0;
      const base = 0.14 + ((t * 0.08) % 0.68);
      for (let k = 0; k < 5; k++) {
        const c = base + (k - 2) * 0.035 + Math.sin(t * 1.4 + k) * 0.006;
        sum += gaussian(x, c, 0.008, 0.45);
      }
      return sum;
    }
    case 'phasor_tones': {
      const centers = [0.29, 0.38, 0.47, 0.58, 0.69];
      return centers.reduce((sum, c, k) => {
        const wobble = Math.sin(t * 1.1 + k * 0.8) * 0.004;
        return sum + gaussian(x, c + wobble, 0.007, 0.62);
      }, 0);
    }
    case 'cosine_tones': {
      const centers = [0.24, 0.34, 0.44, 0.54, 0.64, 0.74];
      return centers.reduce((sum, c, k) => {
        const amp = 0.42 + Math.sin(t * 2.2 + k) * 0.14;
        return sum + gaussian(x, c, 0.009, amp);
      }, 0);
    }
    case 'noise_tones': {
      const centers = [0.33, 0.5, 0.67];
      const tone = centers.reduce(
        (sum, c, k) => sum + gaussian(x, c, 0.01, 0.58 + Math.sin(t * 2 + k) * 0.08),
        0
      );
      const band = gaussian(x, 0.5, 0.22, 0.22) * (0.55 + pseudoNoise(i, t, 4) * 0.7);
      return tone + band;
    }
    case 'chunk_noise': {
      const chunks: Array<[number, number]> = [
        [0.22, 0.31],
        [0.43, 0.53],
        [0.61, 0.73],
      ];
      let sum = 0;
      chunks.forEach((chunk, k) => {
        const flicker = pseudoNoise(k, t * 0.55, 8) > 0.32 ? 1 : 0.25;
        if (x > chunk[0] && x < chunk[1]) {
          sum += (0.36 + pseudoNoise(i, t, k + 10) * 0.36) * flicker;
        }
      });
      return sum;
    }
    case 'swept_noise': {
      const c = 0.18 + ((t * 0.07) % 0.64);
      const envelope = gaussian(x, c, 0.09, 0.72);
      const rough = 0.58 + pseudoNoise(i, t, 12) * 0.75;
      return envelope * rough;
    }
    default:
      return 0;
  }
}

export interface Spectrum {
  blue: number[];
  red: number[];
  active: boolean;
}

/** Build one frame of the abstract spectrum for the given time / selection. */
export function buildSpectrum(
  typeId: string,
  t: number,
  active: boolean,
  bins = 220
): Spectrum {
  const blue: number[] = [];
  const red: number[] = [];

  for (let i = 0; i < bins; i++) {
    const x = i / (bins - 1);
    const floor = 0.055 + pseudoNoise(i, t * 0.4, 20) * 0.035;
    const b = clamp(floor + trainingSignal(x, t), 0, 1);
    const r = active ? clamp(jammingValue(typeId, x, t, i), 0, 1) : 0;
    blue.push(b);
    red.push(r);
  }

  return { blue, red, active };
}
