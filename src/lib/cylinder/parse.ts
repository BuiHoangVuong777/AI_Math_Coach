/**
 * Parsing of learner-typed answers. Input format is TBD in the spec
 * (§14.4 #2); this accepts the common ways a grade-9 learner writes an exact
 * π multiple ("16π", "16pi", "16 * π", "π·16") or a plain number ("4", "4,5",
 * "gấp 4 lần").
 */

export type ParsedAnswer =
  | { kind: 'pi'; coef: number }
  | { kind: 'number'; value: number }
  | { kind: 'invalid' };

const NUMBER = String.raw`\d+(?:\.\d+)?`;
const TIMES = String.raw`[*·×x.]?`;
const PI_AFTER = new RegExp(`^(${NUMBER})?${TIMES}π$`);
const PI_BEFORE = new RegExp(`^π${TIMES}(${NUMBER})$`);
const PLAIN = new RegExp(`^-?${NUMBER}$`);

export function normalizeAnswer(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFC')
    .replace(/\s+/g, '')
    .replace(/,/g, '.')
    .replace(/pi/g, 'π')
    // Units and filler words learners often type around the number.
    .replace(/cm\^?[23²³]|cm/g, '')
    .replace(/gấp|lần|khoảng|=/g, '');
}

export function parseAnswer(raw: string): ParsedAnswer {
  const s = normalizeAnswer(raw);
  if (!s) return { kind: 'invalid' };

  const after = PI_AFTER.exec(s);
  if (after) return { kind: 'pi', coef: after[1] === undefined ? 1 : parseFloat(after[1]) };

  const before = PI_BEFORE.exec(s);
  if (before) return { kind: 'pi', coef: parseFloat(before[1]) };

  if (PLAIN.test(s)) return { kind: 'number', value: parseFloat(s) };

  return { kind: 'invalid' };
}

const EPS = 1e-9;
export const nearlyEqual = (a: number, b: number, tol = EPS) => Math.abs(a - b) <= tol;

/** Removes Vietnamese diacritics so keyword rules match "bình phương" and "binh phuong". */
export function foldVietnamese(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd');
}
