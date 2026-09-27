/** Shared policy for catalog text and locale selection. */
export type Language = 'vi' | 'en' | 'zh';
export interface LocalText { zh: string; en: string; [key: string]: string; }
export function normalizeLanguage(language: string): Language {
  const base = language.toLowerCase().split(/[-_]/)[0];
  return base === 'en' || base === 'zh' ? base : 'vi';
}
const missing: Record<Language, string> = {
  vi: 'Nội dung tiếng Việt đang được cập nhật.',
  en: 'Translation is being updated.',
  zh: '翻译正在更新。',
};
export function getLocalizedText(text: LocalText, language: string): string {
  const locale = normalizeLanguage(language);
  const value = text[locale];
  if (value?.trim() && (locale === 'zh' || !/[\u3400-\u9fff]/u.test(value))) return value;
  // Vietnamese never silently falls back to a different language.
  if (locale === 'vi') return missing.vi;
  return text.en?.trim() && !/[\u3400-\u9fff]/u.test(text.en) ? text.en : missing[locale];
}
