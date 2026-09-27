/**
 * Optional next challenge (PRODUCT_SPEC §24.7): one follow-up problem chosen by fixed
 * rules from this session's evidence, generated only by the verified analog generator
 * (parser round-trip + solver). Only the problem text is exposed — never an answer —
 * and it starts a fresh session through F1. Not a long-term mastery claim.
 */
import { generateForFamily, type Family } from './analog.ts';
import { hash } from './problemParser.ts';
import type { FinalAssessment, SessionEvidence } from './sessionEvidence.ts';
import type { ProblemSpec } from './types.ts';

export interface NextChallenge {
  family: Family;
  label: string;
  problemText: string;
  /** Child-friendly, evidence-based reason (this session only). */
  reason: string;
  rule: 'stretch_after_independent_success' | 'data_reading_practice' | 'same_family_practice';
}

const LABEL: Record<Family, string> = {
  radius_change: 'Bán kính thay đổi',
  diameter_change: 'Bán kính hay đường kính?',
  height_change_down: 'Chiều cao giảm',
  height_change_up: 'Chiều cao tăng',
  both_change: 'Bán kính và chiều cao cùng đổi',
  compute_V: 'Tính thể tích',
  compute_A: 'Tính diện tích đáy',
  inverse_h: 'Tìm chiều cao từ thể tích',
  inverse_r: 'Tìm bán kính từ thể tích',
};

/** A different, supported relationship to explore after a sufficient independent solution. */
const STRETCH: Record<Family, Family[]> = {
  radius_change: ['height_change_up', 'both_change'],
  diameter_change: ['both_change', 'height_change_up'],
  height_change_down: ['radius_change', 'both_change'],
  height_change_up: ['radius_change', 'both_change'],
  both_change: ['diameter_change', 'radius_change'],
  compute_V: ['inverse_h', 'compute_A'],
  compute_A: ['compute_V', 'inverse_h'],
  inverse_h: ['inverse_r', 'compute_V'],
  inverse_r: ['inverse_h', 'compute_V'],
};

export function selectNextChallenge(problemSpec: ProblemSpec, evidence: SessionEvidence, finalAssessment: FinalAssessment | null): NextChallenge | null {
  const ev = finalAssessment?.evaluation;
  const strongIndependent = finalAssessment?.status === 'evaluated' && ev?.answer === 'correct' && !finalAssessment.answerBare && ev.reasoning === 'sufficient';
  const dataMisread = evidence.mistakes.some((m) => m.dataMisreading);
  const family = evidence.family;
  let candidates: { family: Family; rule: NextChallenge['rule']; reason: string }[];
  if (strongIndependent) {
    candidates = STRETCH[family].map((f) => ({ family: f, rule: 'stretch_after_independent_success', reason: 'Ở bài tự kiểm tra em đã làm đúng và đủ lý do, nên bài tiếp theo đổi sang một quan hệ khác của hình trụ để em khám phá.' }));
  } else if (dataMisread && family !== 'compute_V' && family !== 'compute_A') {
    candidates = [{ family: 'diameter_change', rule: 'data_reading_practice', reason: 'Trong phiên này có một bước về dữ kiện (bán kính/đường kính/chiều cao) em đã phải xem lại, nên bài tiếp theo giúp em luyện đọc dữ kiện.' }];
  } else {
    candidates = [{ family, rule: 'same_family_practice', reason: 'Bài tiếp theo cùng dạng với số khác, để em luyện thêm theo cách của mình.' }];
  }
  candidates.push({ family, rule: 'same_family_practice', reason: 'Bài tiếp theo cùng dạng với số khác, để em luyện thêm theo cách của mình.' });
  const avoid = [problemSpec.text, finalAssessment?.problemText ?? ''].filter(Boolean);
  const seed = Number.parseInt(hash(avoid.join('|')), 36) + 17;
  for (const c of candidates) {
    const spec = generateForFamily(c.family, seed, problemSpec.unit ?? 'cm', avoid);
    if (spec) return { family: c.family, label: LABEL[c.family], problemText: spec.text, reason: c.reason, rule: c.rule };
  }
  return null;
}
