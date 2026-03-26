export type CustomerThemePalette = {
  primary: string;
  primaryHover: string;
  primarySoft: string;
  primaryBorder: string;
  primaryText: string;
  onPrimary: string;
};

const FALLBACK_GREEN = '#2E7D32';

type HueFamily = 'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'blue' | 'purple' | 'magenta';

function clamp(value: number, min = 0, max = 255) {
  return Math.max(min, Math.min(max, value));
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');
  const safe = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized.padStart(6, '0').slice(0, 6);
  const int = parseInt(safe, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((value) => clamp(Math.round(value)).toString(16).padStart(2, '0')).join('')}`;
}

function mix(hex: string, other: string, ratio: number) {
  const base = hexToRgb(hex);
  const target = hexToRgb(other);
  return rgbToHex(
    base.r + (target.r - base.r) * ratio,
    base.g + (target.g - base.g) * ratio,
    base.b + (target.b - base.b) * ratio,
  );
}

function rgbToHsl(r: number, g: number, b: number) {
  const rs = r / 255;
  const gs = g / 255;
  const bs = b / 255;
  const max = Math.max(rs, gs, bs);
  const min = Math.min(rs, gs, bs);
  const lightness = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: lightness };
  }

  const delta = max - min;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue = 0;

  switch (max) {
    case rs:
      hue = (gs - bs) / delta + (gs < bs ? 6 : 0);
      break;
    case gs:
      hue = (bs - rs) / delta + 2;
      break;
    default:
      hue = (rs - gs) / delta + 4;
      break;
  }

  return { h: hue * 60, s: saturation, l: lightness };
}

function hslToRgb(h: number, s: number, l: number) {
  const hue = ((h % 360) + 360) % 360 / 360;

  if (s === 0) {
    const gray = Math.round(l * 255);
    return { r: gray, g: gray, b: gray };
  }

  const hueToChannel = (p: number, q: number, t: number) => {
    let value = t;
    if (value < 0) value += 1;
    if (value > 1) value -= 1;
    if (value < 1 / 6) return p + (q - p) * 6 * value;
    if (value < 1 / 2) return q;
    if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hueToChannel(p, q, hue + 1 / 3) * 255),
    g: Math.round(hueToChannel(p, q, hue) * 255),
    b: Math.round(hueToChannel(p, q, hue - 1 / 3) * 255),
  };
}

function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const [rs, gs, bs] = [r, g, b].map((value) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function classifyHueFamily(h: number): HueFamily {
  const hue = ((h % 360) + 360) % 360;
  if (hue < 20 || hue >= 340) return 'red';
  if (hue < 45) return 'orange';
  if (hue < 70) return 'yellow';
  if (hue < 165) return 'green';
  if (hue < 200) return 'cyan';
  if (hue < 255) return 'blue';
  if (hue < 290) return 'purple';
  return 'magenta';
}

function normalizeThemePrimary(hex: string) {
  let candidate = hex;
  const { r, g, b } = hexToRgb(candidate);
  const { h, s, l } = rgbToHsl(r, g, b);
  const family = classifyHueFamily(h);

  const saturationFloor = family === 'red'
    ? 0.8
    : family === 'orange'
      ? 0.76
      : 0.7;

  const minLightness = family === 'red'
    ? 0.46
    : family === 'orange'
      ? 0.44
      : 0.38;

  const maxLightness = family === 'red'
    ? 0.54
    : family === 'orange'
      ? 0.56
      : 0.52;

  const normalized = hslToRgb(
    h,
    Math.max(s, saturationFloor),
    Math.min(maxLightness, Math.max(minLightness, l)),
  );
  candidate = rgbToHex(normalized.r, normalized.g, normalized.b);

  const tone = luminance(candidate);
  if (tone > 0.78) {
    candidate = mix(candidate, '#000000', 0.08);
  }
  if (tone < 0.16) {
    candidate = mix(candidate, '#ffffff', 0.16);
  }

  return candidate;
}

export function createThemePalette(primary = FALLBACK_GREEN): CustomerThemePalette {
  const safePrimary = normalizeThemePrimary(primary);
  const onPrimary = luminance(safePrimary) > 0.55 ? '#0f172a' : '#ffffff';
  return {
    primary: safePrimary,
    primaryHover: mix(safePrimary, '#000000', 0.12),
    primarySoft: mix(safePrimary, '#ffffff', 0.88),
    primaryBorder: mix(safePrimary, '#ffffff', 0.68),
    primaryText: mix(safePrimary, '#0f172a', 0.1),
    onPrimary,
  };
}

export async function extractLogoPrimaryColor(src?: string | null): Promise<string> {
  if (!src || typeof window === 'undefined') return FALLBACK_GREEN;

  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 64;
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) {
          resolve(FALLBACK_GREEN);
          return;
        }
        context.drawImage(image, 0, 0, size, size);
        const { data } = context.getImageData(0, 0, size, size);

        const buckets = new Map<number, Array<{ r: number; g: number; b: number; weight: number; s: number; l: number; h: number }>>();
        const familyWeights = new Map<HueFamily, number>();

        for (let index = 0; index < data.length; index += 4) {
          const alpha = data[index + 3] / 255;
          if (alpha < 0.1) continue;
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];
          const brightness = (r + g + b) / 3;
          if (brightness > 248 || brightness < 12) continue;

          const { h, s, l } = rgbToHsl(r, g, b);
          if (s < 0.24 || l < 0.1 || l > 0.9) continue;

          const bucketKey =
            (Math.round(h / 10) * 10) * 1000000 +
            Math.round(r / 16) * 10000 +
            Math.round(g / 16) * 100 +
            Math.round(b / 16);
          const family = classifyHueFamily(h);
          const weight = alpha * (0.45 + s * 1.75 + (1 - Math.abs(l - 0.5)) * 0.25);
          const bucket = buckets.get(bucketKey) ?? [];
          bucket.push({ r, g, b, weight, s, l, h });
          buckets.set(bucketKey, bucket);
          familyWeights.set(family, (familyWeights.get(family) ?? 0) + weight);
        }

        if (!buckets.size || !familyWeights.size) {
          resolve(FALLBACK_GREEN);
          return;
        }

        let dominantFamily: HueFamily | null = null;
        let dominantFamilyWeight = 0;
        for (const [family, weight] of familyWeights.entries()) {
          if (weight > dominantFamilyWeight) {
            dominantFamily = family;
            dominantFamilyWeight = weight;
          }
        }

        if (!dominantFamily) {
          resolve(FALLBACK_GREEN);
          return;
        }

        const dominantBuckets = Array.from(buckets.values())
          .map((samples) => {
            let rSum = 0;
            let gSum = 0;
            let bSum = 0;
            let lSum = 0;
            let sSum = 0;
            let weightSum = 0;
            let h = samples[0]?.h ?? 0;

            for (const sample of samples) {
              rSum += sample.r * sample.weight;
              gSum += sample.g * sample.weight;
              bSum += sample.b * sample.weight;
              lSum += sample.l * sample.weight;
              sSum += sample.s * sample.weight;
              weightSum += sample.weight;
              h = sample.h;
            }

            return {
              r: rSum / weightSum,
              g: gSum / weightSum,
              b: bSum / weightSum,
              l: lSum / weightSum,
              s: sSum / weightSum,
              weight: weightSum,
              h,
            };
          })
          .filter((bucket) => classifyHueFamily(bucket.h) === dominantFamily);

        if (!dominantBuckets.length) {
          resolve(FALLBACK_GREEN);
          return;
        }

        // Rule:
        // 1. Find the dominant hue family after removing black/white/gray.
        // 2. Inside that family, prefer colors that are both common and dark.
        // 3. Exclude tiny edge/antialias pixels by requiring meaningful bucket weight.
        const maxBucketWeight = Math.max(...dominantBuckets.map((bucket) => bucket.weight));
        const eligibleBuckets = dominantBuckets.filter((bucket) => bucket.weight >= maxBucketWeight * 0.22);
        const candidates = eligibleBuckets.length ? eligibleBuckets : dominantBuckets;

        candidates.sort((left, right) => {
          if (Math.abs(left.l - right.l) > 0.015) return left.l - right.l;
          if (Math.abs(left.weight - right.weight) > 0.001) return right.weight - left.weight;
          return right.s - left.s;
        });

        const strongest = candidates.slice(0, Math.min(3, candidates.length));

        let rSum = 0;
        let gSum = 0;
        let bSum = 0;
        let weightSum = 0;
        for (const bucket of strongest) {
          const darknessBoost = 1 + (1 - bucket.l) * 0.6;
          const colorBoost = 1 + bucket.s * 0.8;
          const weight = bucket.weight * darknessBoost * colorBoost;
          rSum += bucket.r * weight;
          gSum += bucket.g * weight;
          bSum += bucket.b * weight;
          weightSum += weight;
        }

        resolve(normalizeThemePrimary(rgbToHex(rSum / weightSum, gSum / weightSum, bSum / weightSum)));
      } catch {
        resolve(FALLBACK_GREEN);
      }
    };
    image.onerror = () => resolve(FALLBACK_GREEN);
    image.src = src;
  });
}

export const DEFAULT_CUSTOMER_THEME = createThemePalette(FALLBACK_GREEN);
