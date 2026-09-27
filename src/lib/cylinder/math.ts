/**
 * Deterministic cylinder math (PRODUCT_SPEC FR-MATH-001, NFR-MATH-003).
 *
 * Areas and volumes are represented exactly as the coefficient of π
 * (e.g. 16 means 16π), so results never depend on a floating-point π or on
 * any language-model output.
 */

export interface CylinderDims {
  /** Radius in cm, must be > 0. */
  r: number;
  /** Height in cm, must be > 0. */
  h: number;
}

function assertPositive(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number, got ${value}`);
  }
}

/** Base area A = πr², returned as the coefficient of π (cm²). */
export function baseAreaPiCoef(r: number): number {
  assertPositive('r', r);
  return r * r;
}

/** Volume V = A·h = πr²h, returned as the coefficient of π (cm³). */
export function volumePiCoef({ r, h }: CylinderDims): number {
  assertPositive('h', h);
  return baseAreaPiCoef(r) * h;
}

/** Unitless factor V₂/V₁. */
export function volumeRatio(before: CylinderDims, after: CylinderDims): number {
  return volumePiCoef(after) / volumePiCoef(before);
}

/** Vietnamese number formatting: decimal comma, at most 2 decimals. */
export function formatNumberVi(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return String(rounded).replace('.', ',');
}

/** Formats a π-coefficient as an exact multiple of π, e.g. 16 → "16π". */
export function formatPi(coef: number): string {
  if (coef === 1) return 'π';
  return `${formatNumberVi(coef)}π`;
}

/** Fixed lesson data (PRODUCT_SPEC §9.1 and §9.6). */
export const MAIN_PROBLEM = { r1: 2, r2: 4, h: 5, unit: 'cm' } as const;
export const TRANSFER_PROBLEM = { r1: 3, r2: 9, h: 8, unit: 'cm' } as const;

/**
 * Comparison-radius slider. Domain/step are TBD in the spec (§14.4 #1);
 * this choice keeps r > 0 and lands exactly on 2 and 4 cm.
 */
export const RADIUS_SLIDER = { min: 1, max: 6, step: 0.5 } as const;

/** Clamps and snaps a slider value so only exact step values are ever stored. */
export function snapRadius(value: number): number {
  const { min, max, step } = RADIUS_SLIDER;
  if (!Number.isFinite(value)) return min;
  const snapped = Math.round((value - min) / step) * step + min;
  return Math.min(max, Math.max(min, Math.round(snapped * 1000) / 1000));
}
