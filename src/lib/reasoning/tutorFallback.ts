/**
 * Rule-based Tutor (§8.7 fallback). Vietnamese templates chosen by trigger, the
 * focus node's reason/misconception codes and the allowed disclosure level. Every
 * text passes the same leak guard as model output; unsafe templates degrade to a
 * generic question.
 */
import { formatExact } from './exact.ts';
import { displaySymbol } from './expr.ts';
import { isSafeText, type ForbiddenValue } from './disclosure.ts';
import type { CoachContext, CoachResponse, DisclosureLevel, ProblemSpec } from './types.ts';

export const D0: Record<string, string> = {
  radius_diameter: 'Đề cho số đo này là bán kính hay đường kính? Em nhìn đoạn bán kính trên hình: nó có nằm gọn trong mặt đáy không?',
  linear_scaling: 'Khi bán kính tăng như vậy, diện tích mặt đáy thay đổi thế nào? Em có muốn thử trên mô hình không?',
  area_linear: 'Diện tích đáy phụ thuộc vào bán kính như thế nào? Em có muốn thử trên mô hình không?',
  square_as_double: 'Trong πr², r² nghĩa là r nhân với chính nó hay nhân với 2?',
  missing_pi: 'Công thức diện tích đáy có một thừa số mà kết quả của em chưa có. Đó là thừa số nào?',
  forgot_height: 'Thể tích khác diện tích đáy ở chỗ nào? Em đã dùng chiều cao chưa?',
  increase_vs_factor: 'Đề hỏi “gấp bao nhiêu lần” hay “tăng thêm bao nhiêu”?',
  percent_vs_factor: 'Tăng thêm p% và gấp k lần khác nhau thế nào? Em kiểm tra lại cách đổi nhé.',
  premise_changed: 'Bước {root} đã thay đổi nhưng bước {row} vẫn dùng số cũ. Em cập nhật lại bước {row} nhé?',
  depends_on_invalid: 'Bước {row} dựa trên bước {root}, mà bước {root} chưa khớp đề. Em xem lại bước {root} nhé?',
  arithmetic_error: 'Em tính lại phép tính ở bước {row} nhé: từng dấu “=” có thật sự bằng nhau không?',
  unit_error: 'Đại lượng ở bước {row} nên có đơn vị gì: độ dài, diện tích hay thể tích?',
  wrong_formula: 'Công thức ở bước {row} cho ra đại lượng gì? Đề cần đại lượng nào?',
  premise_mismatch: 'Bước {row} dùng số nào cho mỗi đại lượng? Các số đó có khớp với các bước trước và với đề không?',
  scaling_claim_false: 'Em thử kiểm tra quy luật ở bước {row} bằng một ví dụ cụ thể, hoặc trên mô hình nhé?',
  false_justification: 'Lý do ở bước {row} có đúng với điều kiện trong đề không? Em đọc lại đề nhé.',
  contradicts_problem_text: 'Em đọc lại cụm từ được tô trong đề nhé: đề nói bán kính hay đường kính, và bằng bao nhiêu?',
  wrong_value: 'Em kiểm tra lại bước {row}: nó dựa trên dữ kiện nào của đề?',
};

export const D2: Record<string, string> = {
  radius_diameter: 'Gợi ý: bán kính bằng một nửa đường kính (d = 2r).',
  linear_scaling: 'Gợi ý: diện tích đáy A = πr² phụ thuộc vào bình phương bán kính.',
  area_linear: 'Gợi ý: diện tích đáy A = πr² phụ thuộc vào bình phương bán kính.',
  square_as_double: 'Gợi ý: r² = r · r.',
  missing_pi: 'Gợi ý: diện tích đáy là A = πr², nên kết quả có π.',
  forgot_height: 'Gợi ý: thể tích V = A · h (diện tích đáy nhân chiều cao).',
  increase_vs_factor: 'Gợi ý: “gấp k lần” là V₂ : V₁ = k; phần tăng thêm là V₂ − V₁.',
  percent_vs_factor: 'Gợi ý: tăng thêm p% nghĩa là gấp (1 + p/100) lần.',
  scaling_claim_false: 'Gợi ý: nếu bán kính gấp k lần thì diện tích đáy gấp k² lần.',
  premise_changed: 'Gợi ý: thay các số mới của những bước trước vào phép tính.',
  depends_on_invalid: 'Gợi ý: sửa bước gốc trước, các bước sau sẽ được kiểm tra lại.',
  default: 'Gợi ý: viết công thức cần dùng rồi thay dữ kiện của đề vào.',
};

function pickCode(ctx: CoachContext): string {
  const f = ctx.focusNode;
  if (!f) return 'default';
  const order = [...f.possibleMisconceptions, ...f.reasonCodes];
  return order.find((c) => D0[c]) ?? 'wrong_value';
}

function fill(t: string, ctx: CoachContext): string {
  const row = ctx.focusNode?.row ?? '';
  const root = ctx.rootCauseRows[0] ?? row;
  return t.split('{row}').join(String(row)).split('{root}').join(String(root));
}

export function exampleD3(code: string, forbidden: ForbiddenValue[]): string {
  for (const k of [5, 7, 10, 2, 3]) {
    const t =
      code === 'radius_diameter'
        ? `Ví dụ tương tự: một ống có đường kính ${2 * k} cm thì bán kính là ${2 * k} : 2 = ${k} cm.`
        : code === 'forgot_height'
          ? `Ví dụ tương tự: đáy ${k}π cm², cao 2 cm thì V = ${k}π · 2 = ${2 * k}π cm³.`
          : code === 'square_as_double'
            ? `Ví dụ tương tự: r = ${k} thì r² = ${k} · ${k} = ${k * k}.`
            : `Ví dụ tương tự: nếu bán kính gấp ${k} lần thì diện tích đáy gấp ${k}² = ${k * k} lần.`;
    if (isSafeText(t, forbidden)) return t;
  }
  return 'Em thử tự đặt một ví dụ nhỏ với số khác để kiểm tra quy luật.';
}

export function stepD4(code: string, spec: ProblemSpec): string {
  const d = spec.givens.find((g) => g.symbol.startsWith('d'));
  if (code === 'radius_diameter' && d) return `Bước trung gian: ${displaySymbol('r' + d.symbol[1])} = ${formatExact(d.value)} : 2. Em tính tiếp và giải thích vì sao lại chia cho 2.`;
  if (code === 'linear_scaling' || code === 'scaling_claim_false' || code === 'area_linear') return 'Bước trung gian: A₂ : A₁ = (r₂ : r₁)². Em thay số của đề vào và giải thích vì sao có bình phương.';
  if (code === 'forgot_height') return 'Bước trung gian: V = A · h. Em nhân diện tích đáy em đã có với chiều cao và giải thích.';
  return 'Bước trung gian: viết lại công thức của bước này với ký hiệu, rồi thay từng dữ kiện của đề. Em giải thích lại từng phép thay.';
}

export function fallbackResponse(ctx: CoachContext, spec: ProblemSpec, forbidden: ForbiddenValue[]): CoachResponse {
  const level = ctx.disclosure.allowedLevel;
  const code = pickCode(ctx);
  const focusIds = ctx.focusNode ? [ctx.focusNode.id] : [];
  let replyType: CoachResponse['replyType'] = 'socratic_question';
  let question = '';
  let explanation = '';
  let hint: CoachResponse['hint'] = null;

  switch (ctx.trigger) {
    case 'invalid_node':
    case 'hint_request': {
      question = fill(D0[code] ?? D0.wrong_value, ctx);
      if (level >= 1) {
        const givens = spec.givens.map((g) => `${displaySymbol(g.symbol)} = ${formatExact(g.value)}${g.unit ? ' ' + g.unit : ''}`).join('; ');
        const conds = spec.constraints.map((c) => `${c.symbols[0][0] === 'h' ? 'chiều cao' : 'bán kính'} giữ nguyên`).join('; ');
        hint = { level: 1, text: `Xem lại dữ kiện của đề: ${givens}${conds ? '; ' + conds : ''}.` };
        replyType = 'hint';
      }
      if (level >= 2) hint = { level: 2, text: D2[code] ?? D2.default };
      if (level >= 3) hint = { level: 3, text: exampleD3(code, forbidden) };
      if (level >= 4) {
        hint = { level: 4, text: stepD4(code, spec) };
        replyType = 'explanation';
      }
      break;
    }
    case 'missing_justification':
      question = `Vì sao em kết luận như ở bước ${ctx.focusNode?.row}? Điều kiện nào trong đề giúp em?`;
      break;
    case 'valid_conclusion':
      replyType = 'invitation';
      question = 'Em đã có kết luận kèm lập luận. Em có muốn tự kiểm tra bằng một bài tương tự (không có gợi ý) không?';
      break;
    case 'observation':
      question = `Điều em vừa thấy trên mô hình có khớp với dự đoán ở bước ${ctx.rootCauseRows[0] ?? ''} không?`.replace(' bước  ', ' ');
      break;
    case 'learner_question':
      replyType = 'socratic_question';
      explanation = 'Coach không đưa đáp án, nhưng sẽ cùng em đi từng bước.';
      question = ctx.focusNode
        ? fill(ctx.focusNode.status === 'valid' ? 'Bước {row} của em đã khớp. Em định dùng kết quả đó để tìm gì tiếp theo?' : (D0[code] ?? D0.wrong_value), ctx)
        : 'Em đã biết những đại lượng nào, và đề hỏi đại lượng nào? Em thử viết bước đầu tiên nhé.';
      break;
    case 'unsupported_request':
      replyType = 'limit_notice';
      explanation = 'Canvas hiện chỉ vẽ hình trụ, bảng so sánh, biểu đồ thay đổi theo bán kính/chiều cao và bản đồ suy luận. Em có thể xem các hình đó thay thế.';
      break;
  }
  const texts = [question, explanation, hint?.text ?? ''];
  const safe = texts.every((t) => isSafeText(t, forbidden));
  if (!safe) {
    question = 'Em kiểm tra lại bước này: nó dựa trên dữ kiện nào của đề?';
    explanation = '';
    hint = null;
  }
  const misconception = ctx.focusNode?.possibleMisconceptions[0];
  return {
    source: 'rule_based',
    replyType,
    question,
    explanation,
    hint: hint as { level: DisclosureLevel; text: string } | null,
    relevantNodeIds: focusIds,
    relevantElementIds: [],
    disclosureLevel: (hint?.level ?? 0) as DisclosureLevel,
    misconception: {
      detected: !!misconception,
      code: misconception ?? 'none',
      evidence: misconception ? `Dựa trên bước ${ctx.focusNode?.row}.` : '',
      status: 'possible',
    },
  };
}
