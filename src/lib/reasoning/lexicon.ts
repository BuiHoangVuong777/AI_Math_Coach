/** Vietnamese lexical helpers shared by the problem and row parsers (deterministic). */
import { exact, fromDecimal } from './exact.ts';
import type { CylIndex, ExactValue, Kind } from './types.ts';

export const NUM = String.raw`\d+(?:[.,]\d+)?`;

export function numText(raw: string): string {
  return raw.replace(',', '.');
}
export function numValue(raw: string): ExactValue {
  return fromDecimal(numText(raw));
}

export const NUMBER_WORDS: Record<string, number> = {
  đôi: 2, hai: 2, ba: 3, bốn: 4, tư: 4, năm: 5, sáu: 6, bảy: 7, tám: 8, chín: 9, mười: 10,
};

/** "một nửa" → 1/2, "một phần ba" → 1/3, "2/3" → 2/3. */
export function fractionWord(raw: string): ExactValue | null {
  const s = raw.trim().toLowerCase();
  if (/^(một\s+)?nửa$/u.test(s)) return exact(1, 2);
  const m = /^một\s+phần\s+(\S+)$/u.exec(s);
  if (m) {
    const k = NUMBER_WORDS[m[1]] ?? (/^\d+$/.test(m[1]) ? Number(m[1]) : null);
    return k ? exact(1, k) : null;
  }
  const f = /^(\d+)\s*\/\s*(\d+)$/.exec(s);
  if (f) return exact(Number(f[1]), Number(f[2]));
  return null;
}

export function factorWord(raw: string): ExactValue | null {
  const s = raw.trim().toLowerCase();
  if (NUMBER_WORDS[s]) return exact(NUMBER_WORDS[s]);
  if (/^\d+(?:[.,]\d+)?$/.test(s)) return numValue(s);
  return fractionWord(s);
}

export interface KindHit {
  k: Kind;
  start: number;
  end: number;
}

const KIND_RES: { k: Kind; re: RegExp }[] = [
  { k: 'd', re: /đường\s+kính(?:\s+đáy)?/giu },
  { k: 'r', re: /bán\s+kính(?:\s+đáy)?/giu },
  { k: 'A', re: /diện\s+tích(?:\s+mặt)?\s+đáy|diện\s+tích\s+(?=gấp|tăng|giảm|cũng)/giu },
  { k: 'V', re: /thể\s+tích/giu },
  { k: 'h', re: /chiều\s+cao|(?<!\p{L})cao(?=\s+\d)/giu },
  { k: 'r', re: /(?<!\p{L})đáy(?=\s+(?:như nhau|bằng nhau|giữ nguyên))/giu },
];

export function findKinds(text: string): KindHit[] {
  const hits: KindHit[] = [];
  for (const { k, re } of KIND_RES) {
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) hits.push({ k, start: m.index!, end: m.index! + m[0].length });
  }
  hits.sort((a, b) => a.start - b.start || b.end - a.end);
  // Drop hits nested inside a longer one ("cao" inside "chiều cao").
  return hits.filter((h, i) => !hits.some((o, j) => j !== i && o.start <= h.start && o.end >= h.end && o.end - o.start > h.end - h.start));
}

/** Nearest kind keyword ending before `pos`, within `window` chars and the same clause. */
export function kindBefore(text: string, pos: number, window = 45, stop = /[.?!;]/u): KindHit | null {
  const hits = findKinds(text).filter((h) => h.end <= pos && pos - h.end <= window && !stop.test(text.slice(h.end, pos)));
  return hits.length ? hits[hits.length - 1] : null;
}
export function kindAfter(text: string, pos: number, window = 30): KindHit | null {
  return findKinds(text).find((h) => h.start >= pos && h.start - pos <= window && !/[.?!;,]/u.test(text.slice(pos, h.start))) ?? null;
}

export const INDEX2_RE = /(?<!\p{L})(mới|thứ\s+hai|khác|sau\s+khi|lúc\s+sau|sau\s+thay\s+đổi|so\s+sánh)(?!\p{L})/iu;
export const INDEX1_RE = /(?<!\p{L})(cũ|ban\s+đầu|lúc\s+đầu|thứ\s+nhất|tham\s+chiếu|trước)(?!\p{L})/iu;

export function indexCue(text: string): CylIndex | null {
  const two = INDEX2_RE.exec(text);
  const one = INDEX1_RE.exec(text);
  if (two && !one) return 2;
  if (one && !two) return 1;
  if (one && two) return two.index < one.index ? 2 : 1;
  return null;
}

export const OBJECT_NOUN = String.raw`(?:lon|cốc|bể|hộp|ống|thùng|khối|cột|bình|chai|hình\s+trụ|trụ)(?:\s+(?:nước|sữa|trụ))?`;

/** Removes Vietnamese diacritics (reuses the idea of cylinder/parse.ts#foldVietnamese). */
export function fold(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
}
