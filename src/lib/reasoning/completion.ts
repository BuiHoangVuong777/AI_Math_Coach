/**
 * Mission-completion experience (PRODUCT_SPEC §24.6): one deterministic builder that
 * combines evidence, score, badges, mission, support used, the optional next challenge
 * and an encouraging Coach message. The message is assembled from fixed templates that
 * cite real rows/evidence; it never claims mastery or ability, never contains a hidden
 * value, and is the ONLY text the completion Voice may read.
 */
import { buildForbidden, findLeak } from './disclosure.ts';
import { solveProblem } from './facts.ts';
import { awardBadges, calculateLearningScore, type Badge, type LearningScore } from './learningScore.ts';
import { deriveMissionProgress, type MissionProgress } from './mission.ts';
import { selectNextChallenge, type NextChallenge } from './nextChallenge.ts';
import { collectFinalAssessment, collectSessionEvidence, type FinalAssessment, type SessionEvidence, type SupportUsed } from './sessionEvidence.ts';
import type { SessionContext } from './types.ts';

export const LIMITATION_SENTENCE = 'Tóm tắt này chỉ phản ánh phiên học này; không phải đánh giá năng lực lâu dài.';

/** Words that would claim mastery/ability or judge the learner — never allowed (NFR-SAFE-001/002). */
export const UNSUPPORTED_CLAIM = /(thành thạo|nắm vững|nắm chắc|hiểu hoàn toàn|chắc chắn hiểu|giỏi|thông minh|thiên tài|xuất sắc|hoàn hảo|thần đồng|kém|yếu|dốt|ngốc|chậm hiểu|mất gốc|năng lực của em|trình độ của em)/iu;

export interface CompletionMessage {
  source: 'deterministic_template';
  headline: string;
  lines: string[];
  growth: string | null;
  limitation: string;
  /** Segments approved for Voice: exactly the displayed sentences, in order. */
  spoken: string[];
}

export interface ScoringResult {
  evidence: SessionEvidence;
  assessment: FinalAssessment;
  score: LearningScore;
  badges: Badge[];
  mission: MissionProgress;
  support: SupportUsed;
  nextChallenge: NextChallenge | null;
  message: CompletionMessage;
}

function supportLine(s: SupportUsed): string | null {
  const hints = s.hints.reduce((n, h) => n + h.count, 0);
  const parts = [hints ? `${hints} gợi ý` : '', s.coach.total ? `${s.coach.total} lượt trao đổi với Coach` : '', s.experiments.runs ? `${s.experiments.runs} lần thử trên mô hình` : ''].filter(Boolean);
  return parts.length ? `Em đã dùng ${parts.join(', ')} — dùng hỗ trợ khi cần là một cách học tốt.` : null;
}

export function buildCompletionMessage(e: SessionEvidence, a: FinalAssessment, score: LearningScore, mission: MissionProgress): CompletionMessage {
  const c = e.conclusion;
  const headline = mission.complete
    ? `Em đã hoàn thành nhiệm vụ “${mission.title}”!`
    : e.endedEarly
      ? 'Phiên kết thúc sớm — đây là những gì em đã làm được.'
      : `Em đã đi qua ${mission.milestones.filter((m) => !m.optional && m.state === 'achieved').length}/3 chặng của nhiệm vụ “${mission.title}”.`;
  const lines: string[] = [];
  const corrected = e.mistakes.find((m) => m.correction);
  if (corrected) lines.push(`Em đã tự phát hiện bước ${corrected.row} chưa khớp và tự sửa lại — sai rồi sửa là một phần của việc học.`);
  if (e.crossChecks.length) lines.push(`Em đã kiểm tra lại kết quả bằng hai cách khác nhau (bước ${e.crossChecks[0].rows[0]} và bước ${e.crossChecks[0].rows[1]}).`);
  const tested = e.testedPredictions[0];
  if (tested) lines.push(`Em đã ghi dự đoán ở bước ${tested.hypothesisRow} và tự kiểm tra nó ở bước ${tested.testRow}${tested.via === 'experiment_observation' ? ' trên mô hình' : ''}.`);
  if (c.answer === 'correct' && c.answerStatus === 'valid' && c.reasoning === 'sufficient') lines.push(`Kết luận ở bước ${c.answerRow} có cơ sở từ các bước của chính em.`);
  if (e.justifications.supported.length) lines.push(`Em đã nêu lý do bằng lời của mình ở bước ${e.rowOf[e.justifications.supported[0]]}.`);
  const ev = a.evaluation;
  if (a.status === 'evaluated' && ev) {
    lines.push(ev.answer === 'correct' && !a.answerBare && ev.reasoning === 'sufficient'
      ? 'Ở bài tự kiểm tra, em tự làm đúng và lập luận đủ — không có gợi ý nào.'
      : ev.answer === 'correct' && !a.answerBare
        ? 'Ở bài tự kiểm tra, đáp án của em khớp; phần lập luận còn có thể nêu rõ hơn.'
        : 'Bài tự kiểm tra cho em biết chỗ cần luyện thêm — đó là thông tin để học tiếp, không phải lời nhận xét về em.');
  } else if (a.status === 'not_started' || a.status === 'in_progress') lines.push('Bài tự kiểm tra chưa được làm, nên phần tự làm chưa có bằng chứng.');
  const support = supportLine(e.support);
  const kept = [...lines.slice(0, 4), ...(support ? [support] : [])];
  const weakest = score.criteria.filter((x) => x.status !== 'full' && x.status !== 'incomplete').sort((x, y) => x.points / x.max - y.points / y.max)[0];
  const GROWTH: Record<string, string> = {
    problem_understanding: 'Lần sau, em thử dùng rõ dữ kiện và điều kiện của đề trong các bước nhé.',
    evidence_reasoning: 'Lần sau, em thử viết đủ các bước dẫn tới kết luận để mỗi bước đều có cơ sở.',
    verification: 'Lần sau, em thử kiểm tra lại kết quả bằng một cách khác — không cần mắc lỗi mới được tính.',
    independent_transfer: 'Lần sau, ở bài tự kiểm tra em thử viết từng bước và nêu điều kiện như khi làm bài chính.',
    own_explanation: 'Lần sau, em thử thêm “vì …” để nói rõ lý do của một bước.',
  };
  const growth = weakest ? GROWTH[weakest.id] : null;
  const scoreLine = `Điểm của phiên này: ${score.total}/100${score.complete ? '' : ' (còn phần chưa có bằng chứng)'} — chỉ tính cho phiên hôm nay.`;
  const spoken = [headline, ...kept, scoreLine, ...(growth ? [growth] : []), LIMITATION_SENTENCE];
  return { source: 'deterministic_template', headline, lines: kept, growth, limitation: LIMITATION_SENTENCE, spoken };
}

/**
 * Builds the whole completion result from a session context. Pure; the browser and the
 * completion Voice route call the same function on the same (recomputed) evidence.
 */
export function buildScoringResult(ctx: SessionContext): ScoringResult {
  const evidence = collectSessionEvidence(ctx);
  const assessment = collectFinalAssessment(ctx);
  const score = calculateLearningScore(evidence, assessment);
  const badges = awardBadges(evidence, assessment);
  const mission = deriveMissionProgress(evidence, assessment);
  const nextChallenge = selectNextChallenge(ctx.problemSpec, evidence, assessment);
  let message = buildCompletionMessage(evidence, assessment, score, mission);
  // Guard: no mastery/ability claims and no value the disclosure policy still hides.
  const forbidden = buildForbidden(ctx.problemSpec, solveProblem(ctx.problemSpec), ctx.graph);
  const unsafe = (t: string) => UNSUPPORTED_CLAIM.test(t) || !!findLeak(t, forbidden);
  if (message.spoken.some(unsafe)) {
    const safe = message.spoken.filter((t) => !unsafe(t));
    message = { ...message, lines: message.lines.filter((t) => !unsafe(t)), growth: message.growth && !unsafe(message.growth) ? message.growth : null, spoken: safe };
  }
  return { evidence, assessment, score, badges, mission, support: evidence.support, nextChallenge, message };
}
