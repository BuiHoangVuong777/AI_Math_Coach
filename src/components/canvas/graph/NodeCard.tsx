import { forwardRef, type KeyboardEvent } from 'react';
import { VoiceListen } from '@/components/voice/VoiceControls';
import { useVoice } from '@/stores/voiceStore';
import { KaTeX } from '@/components/ui/KaTeX';
import { EPISTEMIC_UI } from '@/data/canvas/copy';
import type { GraphNodeViewModel } from '@/lib/reasoning/types';

interface Props {
  nv: GraphNodeViewModel;
  selected: boolean;
  focusable: boolean;
  compact: boolean;
  recent: boolean;
  stale: boolean;
  onSelect: () => void;
  onKeyDown?: (e: KeyboardEvent<HTMLButtonElement>) => void;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Level 1 card (§10.8.1): learner text (verbatim), status icon + word, one short
 * explanation, notation when allowed. The whole card is one button (keyboard target).
 */
const NodeCard = forwardRef<HTMLButtonElement, Props>(function NodeCard({ nv, selected, focusable, compact, recent, stale, onSelect, onKeyDown, style, className }, ref) {
  const voiceCue = useVoice(s => s.cue?.nodeIds.includes(nv.nodeId) ?? false);
  const problem = nv.row === null;
  const ui = EPISTEMIC_UI[nv.epistemic];
  const badge = stale ? { icon: '⟳', label: 'Đang kiểm tra lại' } : nv.statusBadge;
  const line = stale ? 'Đang kiểm tra lại vì một bước trước thay đổi.' : problem ? 'Dữ kiện của đề (em đã xác nhận).' : nv.explanation?.explanationShort ?? (nv.unavailableReason === 'independent_hidden' ? 'Bài tự kiểm tra — chưa đánh giá.' : '');
  const extras = stale ? [] : [nv.isHypothesis && !problem ? 'giả thuyết' : null, nv.revisedByRows.length ? `đã được em sửa ở bước ${nv.revisedByRows.join(', ')}` : null].filter(Boolean);
  return (
    <div className={`relative ${className ?? ""}`} style={style}>
    <button
      ref={ref}
      type="button"
      tabIndex={focusable ? 0 : -1}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      aria-pressed={selected}
      aria-label={`${problem ? 'Dữ kiện đề' : `Bước ${nv.row === 0 ? 'F1' : nv.row}`}: ${nv.learnerText}. ${badge.label}${extras.length ? ', ' + extras.join(', ') : ''}. ${line}`}
      data-node-id={nv.nodeId}
      data-voice-highlight={voiceCue || undefined}
      data-status={stale ? 'stale' : nv.validationStatus}
      data-epistemic={nv.epistemic}
      data-explanation-id={stale ? undefined : nv.explanation?.explanationId}
      data-template-id={stale ? undefined : nv.explanation?.templateId}
      className={`flex flex-col overflow-hidden rounded-lg border bg-slate-900/95 p-1.5 leading-tight text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300 ${selected ? 'ring-2 ring-white' : ''} ${recent ? 'animate-pulse motion-reduce:animate-none' : ''} ${ui.dash && !problem ? 'border-dashed' : ''} h-full w-full ${voiceCue ? "outline outline-2 outline-cyan-300" : ""}`}
      style={{ borderColor: stale ? '#94a3b8' : ui.color, borderWidth: selected ? 2 : 1.5 }}
    >
      <span className="flex items-center gap-1.5 text-[11px] pr-10">
        <span className="rounded bg-slate-700 px-1 font-semibold text-slate-100">{problem ? '📄' : nv.row === 0 ? 'F1' : nv.row}</span>
        <span className="font-semibold" style={{ color: stale ? '#cbd5e1' : ui.color }} data-testid="node-badge">
          <span aria-hidden>{badge.icon}</span> {badge.label}
        </span>
        {extras.length > 0 && <span className="truncate text-slate-400">· {extras.join(' · ')}</span>}
      </span>
      <span className={`mt-0.5 break-words text-xs text-slate-100 ${compact ? 'line-clamp-1' : 'line-clamp-2'}`} title={nv.learnerText} data-testid="node-learner-text">
        {!problem && <span className="mr-1 text-[10px] uppercase tracking-wide text-slate-500">Em viết</span>}
        {nv.learnerText}
      </span>
      {line && (
        <span className={`mt-0.5 break-words text-[11px] text-slate-300 ${compact ? 'line-clamp-1' : 'line-clamp-2'}`} data-testid="node-explanation">
          {line}
        </span>
      )}
      {!compact && !stale && nv.notation && (
        <span className="mt-auto max-h-4 overflow-hidden text-[11px] text-slate-200" aria-hidden>
          <KaTeX latex={nv.notation} displayMode={false} trust={false} />
        </span>
      )}
    </button>
    {!problem && !stale && nv.explanation && <span className="absolute right-1 top-1"><VoiceListen nodeId={nv.nodeId} /></span>}
    </div>
  );
});

export default NodeCard;
