/**
 * THE SIGNAL — Color Utilities
 *
 * Hex → RGB conversion and interpolation for accent color transitions.
 */

export type RGB = [number, number, number]; // normalized 0–1

/**
 * Parse a hex color string (#RRGGBB) into normalized RGB [0–1].
 */
export function hexToRgb(hex: string): RGB {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return [r, g, b];
}

/**
 * Linearly interpolate between two RGB colors.
 * t = 0 → a, t = 1 → b
 */
export function lerpRgb(a: RGB, b: RGB, t: number): RGB {
  const tc = Math.max(0, Math.min(1, t));
  return [
    a[0] + (b[0] - a[0]) * tc,
    a[1] + (b[1] - a[1]) * tc,
    a[2] + (b[2] - a[2]) * tc,
  ];
}

/**
 * Convert normalized RGB to a CSS hex string.
 */
export function rgbToHex(rgb: RGB): string {
  const r = Math.round(rgb[0] * 255)
    .toString(16)
    .padStart(2, '0');
  const g = Math.round(rgb[1] * 255)
    .toString(16)
    .padStart(2, '0');
  const b = Math.round(rgb[2] * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${r}${g}${b}`;
}

/**
 * Convert normalized RGB to a CSS rgba() string.
 */
export function rgbToCss(rgb: RGB, alpha = 1.0): string {
  return `rgba(${Math.round(rgb[0] * 255)}, ${Math.round(rgb[1] * 255)}, ${Math.round(rgb[2] * 255)}, ${alpha})`;
}

/**
 * Generate a fluctuating color for the /archive dimension.
 * Cycles through hue over time.
 */
export function archiveFluctuatingColor(time: number): RGB {
  const hue = (time * 0.05) % 1.0; // slow cycle
  return hslToRgb(hue, 0.8, 0.5);
}

function hslToRgb(h: number, s: number, l: number): RGB {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;
  if (h < 1 / 6) { r = c; g = x; }
  else if (h < 2 / 6) { r = x; g = c; }
  else if (h < 3 / 6) { g = c; b = x; }
  else if (h < 4 / 6) { g = x; b = c; }
  else if (h < 5 / 6) { r = x; b = c; }
  else { r = c; b = x; }

  return [r + m, g + m, b + m];
}
