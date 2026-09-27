/**
 * Math Reasoning Canvas data contracts (PRODUCT_SPEC v0.4 §9).
 *
 * Pure types shared by browser, server and node:test. Keep this module free of
 * React/DOM and of the `@/` alias (Node runs it with type stripping).
 *
 * Every boundary distinguishes learner claims, machine interpretations and
 * verified facts through `Provenance` / `Epistemic`.
 */

// ------------------------------------------------------------------ shared (§9.1)

export type Provenance =
  | 'learner_claim'
  | 'learner_form'
  | 'problem_given'
  | 'deterministic_parse'
  | 'llm_interpretation'
  | 'verified_fact'
  | 'experiment_value'
  | 'system_rule';

/** Exact rational n/d times π^piPow. Always reduced, d > 0. 16π = {n:16,d:1,piPow:1}. */
export interface ExactValue {
  n: number;
  d: number;
  piPow: 0 | 1;
}

export type Unit = 'mm' | 'cm' | 'dm' | 'm';
export const UNITS: readonly Unit[] = ['mm', 'cm', 'dm', 'm'];
export type Dimension = 'length' | 'area' | 'volume' | 'ratio';
export type CylIndex = 1 | 2;
/** Base quantity kinds of the POC domain. */
export type Kind = 'r' | 'd' | 'h' | 'A' | 'V';
export type SymbolId =
  | 'r1' | 'r2' | 'd1' | 'd2' | 'h1' | 'h2' | 'A1' | 'A2' | 'V1' | 'V2'
  | 'kr' | 'kh' | 'kA' | 'kV';
export const SYMBOLS: readonly SymbolId[] = [
  'r1', 'r2', 'd1', 'd2', 'h1', 'h2', 'A1', 'A2', 'V1', 'V2', 'kr', 'kh', 'kA', 'kV',
];
/** A string in the closed grammar (§8.3.1), e.g. "pi*6^2". */
export type Expr = string;
export interface Span {
  start: number;
  end: number;
}

// ------------------------------------------------------------------ ProblemSpec (§9.2)

export interface Given {
  symbol: SymbolId;
  value: ExactValue;
  unit: Unit | null;
  sourceSpan: Span | null;
  provenance: 'problem_given' | 'learner_form';
}

/** target = source ⊗ value, e.g. h2 = h1 × 1/2, r2 = r1 + 2. */
export interface Relation {
  id: string;
  expr: Expr;
  target: SymbolId;
  source: SymbolId;
  op: 'mul' | 'add';
  value: ExactValue;
  sourceSpan: Span | null;
}

export interface Constraint {
  id: string;
  kind: 'fixed';
  symbols: [SymbolId, SymbolId];
  sourceSpan: Span | null;
}

export interface Unknown {
  symbol: SymbolId;
  askedAs: string;
  sourceSpan: Span | null;
}

/** Problem-level clarification (F1 ambiguous branch). Choosing an option applies its patch. */
export interface ProblemClarification {
  id: string;
  code: string;
  question: string;
  span: Span | null;
  options: { label: string; relation?: Omit<Relation, 'id'>; given?: Given }[];
}

export type InterpretationStatus = 'draft' | 'needs_clarification' | 'confirmed' | 'unsupported' | 'insufficient';

export interface ProblemSpec {
  id: string;
  version: number;
  text: string;
  domain: 'cylinder_geometry';
  problemType: 'compute' | 'scaling_ratio' | 'inverse';
  /** null only when the problem states no length at all (pure factor problems). */
  unit: Unit | null;
  cylinders: { index: CylIndex; label: string; labelSpan: Span | null }[];
  givens: Given[];
  relations: Relation[];
  constraints: Constraint[];
  unknowns: Unknown[];
  interpretationStatus: InterpretationStatus;
  statusReasons: string[];
  interpretationProvenance: 'deterministic_parse' | 'llm_interpretation' | 'learner_form';
  clarifications: ProblemClarification[];
  confirmedAt: number | null;
}

// ------------------------------------------------------------------ ReasoningNode (§9.3)

export type SemanticType =
  | 'given' | 'unknown' | 'constraint' | 'strategy' | 'formula' | 'computation'
  | 'relation_claim' | 'hypothesis' | 'observation' | 'justification' | 'conclusion' | 'question' | 'free_text';

export interface FactorChange {
  symbol: SymbolId; // one of kr, kh, kA, kV
  factor: ExactValue;
}

export type MathStatement =
  | { kind: 'equation'; target: SymbolId | null; chain: Expr[]; unit: string | null }
  | { kind: 'formula'; ruleId: string; lhs: Kind; rhs: Expr }
  | { kind: 'scaling'; changes: FactorChange[]; fixed: SymbolId[]; claim: FactorChange; chain: Expr[] }
  | { kind: 'strategy'; plan: string[] }
  | { kind: 'conclusion'; target: SymbolId; value: ExactValue; approx?: { value: number; decimals: number }; unit: string | null }
  | { kind: 'justification'; forNodeId: string | null; citesConstraintIds: string[]; ruleIds: string[] }
  /** Extension (F6): a setting chosen in the experiment plus claims read from it. */
  | { kind: 'observation'; setting: { symbol: SymbolId; value: ExactValue } | null; claims: { symbol: SymbolId | null; chain: Expr[]; ofValue?: Expr; negated?: boolean }[] }
  | { kind: 'question' }
  | { kind: 'free_text' };

export interface Justification {
  text: string;
  citesConstraintIds: string[];
  citesRelationIds: string[];
  ruleIds: string[];
  vague: boolean;
  /** Quantities the learner says are unchanged (checked against the problem). */
  claimsFixed?: Kind[];
}

export interface Ambiguity {
  code: string;
  span: Span | null;
  question: string;
}

export interface Interpretation {
  status: 'interpreted' | 'ambiguous' | 'unparsed' | 'rejected_by_learner';
  provenance: 'deterministic_parse' | 'llm_interpretation' | 'learner_form';
  semanticType: SemanticType;
  normalized: MathStatement | null;
  displayText: string;
  justification: Justification | null;
  /** 1-based row numbers the learner referenced ("bước 2"). */
  explicitRefs: number[];
  alternatives: { statement: MathStatement; semanticType: SemanticType; displayText: string }[];
  ambiguities: Ambiguity[];
  learnerConfirmed: boolean | null;
  /** Row mentions mathematics outside the POC domain (→ unverified, never invalid). */
  outOfScope?: boolean;
}

export interface Dependency {
  nodeId: string;
  via: 'symbol' | 'explicit_reference' | 'constraint' | 'relation' | 'llm_suggested';
  symbol?: SymbolId;
  /** v0.5: computation premise vs condition cited in the learner's "vì …" reason. */
  origin?: 'premise' | 'justification';
  /** v0.5: direct = substituted/used in this step; indirect = only through a derivation. */
  depth?: 'direct' | 'indirect';
  /** v0.5: this source changed after the step was written (premise_changed). */
  broken?: boolean;
}

export interface NodeRevision {
  revision: number;
  originalText: string;
  interpretation: Interpretation;
  validation: ValidationResult | null;
  at: number;
}

export interface ReasoningNode {
  id: string;
  graphId: 'main' | 'independent';
  rowIndex: number;
  revision: number;
  originalText: string;
  source: 'learner' | 'problem' | 'demo_script';
  provenance: Provenance;
  interpretation: Interpretation;
  dependsOn: Dependency[];
  validation: ValidationResult | null;
  lifecycle: 'active' | 'stale' | 'retracted';
  revisedBy: string[];
  /** RG-C2: learner chose "keep both" → treated as hypothesis, never a symbol producer. */
  keptAsHypothesis?: boolean;
  history: NodeRevision[];
  createdAt: number;
  updatedAt: number;
}

// ------------------------------------------------------------------ ValidationResult (§9.4)

export type ValidationStatus = 'valid' | 'invalid' | 'ambiguous' | 'unverified' | 'insufficient_evidence';

export interface Fact {
  id: string;
  symbol: SymbolId;
  value: ExactValue;
  unit: string | null;
  derivation: string;
  provenance: 'verified_fact' | 'experiment_value';
  disclosable: boolean;
}

export interface ValidationResult {
  nodeId: string;
  nodeRevision: number;
  graphVersion: number;
  problemSpecVersion: number;
  status: ValidationStatus;
  checks: {
    inference: 'follows' | 'does_not_follow' | 'not_applicable' | 'not_checked';
    groundTruth: 'true' | 'false' | 'unknown';
    units: 'ok' | 'mismatch' | 'not_applicable';
  };
  reasonCodes: string[];
  possibleMisconceptions: { code: string; evidence: string; status: 'possible' }[];
  rootCauseNodeIds: string[];
  facts: Fact[];
  method: 'exact_rational_pi' | 'rule_catalog' | 'scaling_law' | 'plan_check' | 'none';
  engineVersion: string;
  /** v0.5: rules used to check this node (persisted evidence for explanations). */
  ruleIds?: string[];
  /** Value the node claims for `producedSymbol` (the learner's value, never corrected). */
  producedSymbol?: SymbolId | null;
  claimedValue?: ExactValue | null;
}

// ------------------------------------------------------------------ ReasoningGraph (§9.5)

export type EdgeKind = 'depends_on' | 'justifies' | 'tests' | 'implements' | 'revised_by';

export interface Edge {
  from: string;
  to: string;
  kind: EdgeKind;
  provenance: Provenance;
}

export type DisclosureLevel = 0 | 1 | 2 | 3 | 4;

export type GraphEvent = { seq: number; at: number; graphVersion: number } & (
  | { type: 'problem_confirmed'; problemId: string; learnerEdits: number; contradictions: number }
  | { type: 'row_submitted'; nodeId: string; revision: number; text: string; source: 'learner' | 'demo_script' }
  | { type: 'node_interpreted'; nodeId: string; status: string; provenance: string }
  | { type: 'node_validated'; nodeId: string; status: string; reasonCodes: string[] }
  | { type: 'node_revised'; nodeId: string; from: number; to: number; affected: string[] }
  | { type: 'node_retracted'; nodeId: string; affected: string[] }
  | { type: 'ambiguity_resolved'; nodeId: string; choice: number | 'reject' }
  | { type: 'conflict_resolved'; nodeId: string; action: 'replace' | 'keep_both' }
  | { type: 'revised_by_marked'; nodeId: string; byNodeId: string }
  | { type: 'experiment'; event: 'start' | 'end'; symbol: SymbolId; from: number; to: number }
  | { type: 'hint_shown'; nodeId: string; level: DisclosureLevel }
  | { type: 'coach_exchange'; nodeId: string | null; source: 'ai' | 'rule_based'; replyType: string; level: DisclosureLevel; misconception: string }
  | { type: 'phase_changed'; from: Phase; to: Phase }
  | { type: 'independent_submitted'; rows: number }
  | { type: 'independent_evaluated'; answer: string; reasoning: string }
  | { type: 'turn_degraded'; parser?: string; tutor?: string }
);

export interface SymbolEntry {
  producerNodeId: string | null;
  status: ValidationStatus | 'given';
}

export interface ReasoningGraph {
  graphId: 'main' | 'independent';
  version: number;
  problemSpecVersion: number;
  nodes: Record<string, ReasoningNode>;
  edges: Edge[];
  symbolTable: Partial<Record<SymbolId, SymbolEntry>>;
  events: GraphEvent[];
  nextNodeNumber: number;
}

// ------------------------------------------------------------------ VisualSpec (§9.6)

export type Epistemic =
  | 'problem_given' | 'verified_fact' | 'experiment_value' | 'learner_valid' | 'learner_invalid'
  | 'learner_hypothesis' | 'learner_ambiguous' | 'learner_unverified' | 'learner_insufficient';

export type Renderer = 'reasoning_graph' | 'cylinder_3d' | 'comparison_table' | 'scaling_chart' | 'formula_highlight';
export const RENDERERS: readonly Renderer[] = ['reasoning_graph', 'cylinder_3d', 'comparison_table', 'scaling_chart', 'formula_highlight'];

export type Purpose =
  | 'map_reasoning' | 'relate_given_to_shape' | 'investigate_invalid' | 'test_hypothesis'
  | 'compare_quantities' | 'show_formula_structure';

export interface VisualElement {
  elementId: string;
  kind: string;
  label: string;
  sourceNodeIds: string[];
  factIds: string[];
  epistemic: Epistemic;
}

export interface CylinderAnnotation {
  elementId: string;
  kind: 'radius' | 'diameter' | 'height' | 'base_area' | 'volume';
  cylinder: CylIndex;
  value: number;
  text: string;
  epistemic: Epistemic;
}

export interface CylinderParams {
  mode: 'static' | 'experiment';
  cylinders: { index: CylIndex; r: number; h: number; role: 'reference' | 'comparison' | 'single'; label: string }[];
  annotations: CylinderAnnotation[];
  unit: Unit | null;
}

// ------------------------------------------------------------------ Explainable graph view models (§9.8–9.9, v0.5)
// Derived for one graphVersion by the Explanation Builder; never persisted, never mathematical evidence.

export type ExplanationKind =
  | 'confirmation' | 'check_prompt' | 'inherited_issue' | 'stale_premise' | 'hypothesis_note'
  | 'clarification' | 'limit' | 'support_missing' | 'plan_note' | 'observation_note' | 'question_note';

export interface ExplanationViewModel {
  explanationId: string; // `${nodeId}@r${nodeRevision}@v${graphVersion}@D${disclosureLevel}`
  nodeId: string;
  nodeRevision: number;
  graphVersion: number;
  disclosureLevel: DisclosureLevel;
  kind: ExplanationKind;
  explanationShort: string;
  explanationDetailed: string | null;
  whyStatus: string;
  prompt: string | null;
  evidence: { reasonCodes: string[]; ruleIds: string[]; factIds: string[]; sourceNodeIds: string[] };
  templateId: string;
  source: 'deterministic_template' | 'tutor_ai';
  leakChecked: true;
}

export type UnavailableReason = 'independent_hidden' | 'pending_revalidation' | 'problem_node' | 'not_a_claim' | 'no_template';

export interface GraphNodeViewModel {
  nodeId: string;
  nodeRevision: number;
  graphVersion: number;
  row: number | null;
  learnerText: string;
  interpretedMeaning: string;
  interpretationProvenance: 'deterministic_parse' | 'llm_interpretation' | 'learner_form' | 'problem_given';
  validationStatus: ValidationStatus | 'given' | 'stale' | 'hidden';
  statusBadge: { icon: string; label: string };
  validationSummary: string;
  explanation: ExplanationViewModel | null;
  unavailableReason: UnavailableReason | null;
  relevantRuleIds: string[];
  sourceNodeIds: string[];
  indirectSourceNodeIds: string[];
  provisionalSourceNodeIds: string[];
  affectedNodeIds: string[];
  linkedElementIds: string[];
  disclosureLevel: DisclosureLevel;
  provenance: Provenance;
  epistemic: Epistemic;
  notation: string | null;
  possibleMisconceptions: string[];
  revisionCount: number;
  semanticType: SemanticType;
  isHypothesis: boolean;
  revisedByRows: number[];
}

export type EdgeRelation = 'depends_on' | 'supports' | 'tests' | 'corrects' | 'contradicts' | 'implements';

export interface GraphEdgeViewModel {
  edgeId: string; // `${from}->${to}:${relation}`
  from: string;
  to: string;
  relation: EdgeRelation;
  storedKind: EdgeKind | 'derived_conflict' | 'rejected_reference';
  via?: Dependency['via'];
  symbol?: SymbolId;
  ruleIds: string[];
  status: 'established' | 'provisional' | 'broken';
  /** Only direct edges are drawn at Level 1; indirect ones are listed in Level 2. */
  depth: 'direct' | 'indirect';
  labelShort: string;
  explanation: string;
  graphVersion: number;
  sourceEpistemic: Epistemic;
}

export interface GraphParams {
  /** v0.5 explainable graph view models (derived). */
  nodeViews?: GraphNodeViewModel[];
  edgeViews?: GraphEdgeViewModel[];
  neutral: boolean;
  nodes: { id: string; label: string; row: number | null; semanticType: SemanticType; status: ValidationStatus | 'given' | 'none'; epistemic: Epistemic; revisedBy: string[] }[];
  edges: { from: string; to: string; kind: EdgeKind | 'constraint' | 'relation'; suggested: boolean }[];
}

export interface TableCell {
  elementId: string;
  text: string;
  epistemic: Epistemic;
  sourceNodeIds: string[];
}

export interface TableParams {
  mode: 'reasoning' | 'experiment';
  columns: { index: CylIndex; label: string }[];
  rows: { quantity: 'r' | 'd' | 'h' | 'A' | 'V' | 'k'; label: string; unit: string; cells: (TableCell | null)[] }[];
}

export interface ChartParams {
  axis: 'r' | 'h';
  unit: Unit | null;
  xMax: number;
  reference: { x: number; y: number };
  curves: { elementId: string; exponent: number; label: string; epistemic: Epistemic; sourceNodeIds: string[] }[];
  points: { elementId: string; x: number; y: number; label: string }[];
}

export interface FormulaParams {
  ruleId: string;
  latex: string;
  highlight: string[];
}

export interface VisualSpec {
  specId: string;
  graphVersion: number;
  renderer: Renderer;
  purpose: Purpose;
  sourceNodeIds: string[];
  params: CylinderParams | TableParams | ChartParams | FormulaParams | GraphParams;
  elements: VisualElement[];
  interaction: {
    selectable: true;
    rotate?: boolean;
    zoom?: boolean;
    slider?: { symbol: SymbolId; min: number; max: number; step: number; locked: boolean; lockReason?: string };
  };
  scale?: { cmPerSceneUnit: number; uniform: true };
  fallback: { kind: 'text' | 'table'; content: string };
  unsupported?: { request: string; reason: string };
}

// ------------------------------------------------------------------ CoachResponse (§9.7)

export interface CoachResponse {
  source: 'ai' | 'rule_based';
  replyType: 'socratic_question' | 'hint' | 'feedback' | 'explanation' | 'invitation' | 'limit_notice';
  question: string;
  explanation: string;
  hint: { level: DisclosureLevel; text: string } | null;
  relevantNodeIds: string[];
  relevantElementIds: string[];
  disclosureLevel: DisclosureLevel;
  misconception: { detected: boolean; code: string; evidence: string; status: 'possible' };
}

export type TutorTrigger =
  | 'invalid_node' | 'missing_justification' | 'hint_request' | 'learner_question'
  | 'valid_conclusion' | 'observation' | 'unsupported_request';

/** Minimal context given to the tutor (§8.7, NFR-PRIV-005). */
export interface CoachContext {
  problemText: string;
  trigger: TutorTrigger;
  focusNode: {
    id: string;
    row: number;
    originalText: string;
    displayText: string;
    status: ValidationStatus;
    reasonCodes: string[];
    possibleMisconceptions: string[];
  } | null;
  relatedNodes: { id: string; row: number; displayText: string; status: ValidationStatus }[];
  disclosure: { allowedLevel: DisclosureLevel; forbiddenValues: string[]; disclosableFacts: string[] };
  learnerMessage: string | null;
  rootCauseRows: number[];
}

// ------------------------------------------------------------------ session / turn (§8.8)

export type Phase = 'problem_input' | 'problem_review' | 'reasoning' | 'independent' | 'summary';

export interface NodeDisclosure {
  hintRequests: number;
  failedRevisions: number;
  lastCoachedRevision: number | null;
  lastCoachedLevel: DisclosureLevel | null;
}
export type DisclosureState = Record<string, NodeDisclosure>;

export interface ExperimentState {
  active: boolean;
  symbol: 'r2' | 'h2';
  value: number;
  start: number;
  visited: number[];
  hypothesisNodeId: string | null;
}

export interface IndependentEvaluation {
  answer: 'correct' | 'incorrect' | 'missing' | 'unreadable';
  reasoning: 'sufficient' | 'partial' | 'contains_invalid' | 'insufficient_evidence';
  answerNodeId: string | null;
  expected: ExactValue | null;
  method: string;
  possibleMisconceptions: string[];
}

export interface IndependentState {
  problemSpec: ProblemSpec;
  graph: ReasoningGraph;
  submitted: boolean;
  evaluation: IndependentEvaluation | null;
  evaluationError: string | null;
}

export interface SessionContext {
  problemSpec: ProblemSpec;
  graph: ReasoningGraph;
  phase: Phase;
  disclosure: DisclosureState;
  experiment: ExperimentState | null;
  independent: IndependentState | null;
  processedOpIds: string[];
  pendingRevisedBy: { nodeId: string; byNodeId: string } | null;
}

export type TurnOp =
  | { type: 'add_row'; rowText: string; source?: 'learner' | 'demo_script' }
  | { type: 'edit_row'; nodeId: string; rowText: string }
  | { type: 'retract_row'; nodeId: string }
  | { type: 'resolve_ambiguity'; nodeId: string; choiceIndex: number | 'reject' }
  | { type: 'reject_interpretation'; nodeId: string }
  | { type: 'resolve_conflict'; nodeId: string; action: 'replace' | 'keep_both' }
  | { type: 'mark_revised_by'; nodeId: string; byNodeId: string; accept: boolean }
  | { type: 'experiment'; event: 'start' | 'set' | 'end'; symbol?: 'r2' | 'h2'; value?: number; nodeId?: string }
  | { type: 'request_hint'; nodeId: string }
  | { type: 'ask_coach'; message: string; nodeId?: string | null }
  | { type: 'select_node'; nodeId: string | null }
  | { type: 'start_independent'; analogText?: string }
  | { type: 'submit_independent' }
  | { type: 'retry_independent_evaluation' }
  | { type: 'finish' };

export interface TurnRequest {
  context: SessionContext;
  expectedGraphVersion: number;
  opId: string;
  op: TurnOp;
  selectedNodeIds?: string[];
}

export interface Clarification {
  nodeId: string;
  kind: 'ambiguity' | 'conflict' | 'revised_by' | 'split';
  question: string;
  options: { label: string; value: string }[];
}

export interface DegradedFlags {
  parser?: 'rules_only' | 'failed';
  tutor?: 'rule_based';
  offline?: boolean;
}

export interface TurnResult {
  context: SessionContext;
  changedNodeIds: string[];
  visualSpecs: VisualSpec[];
  removedSpecIds: string[];
  coach: CoachResponse | null;
  clarification: Clarification | null;
  events: GraphEvent[];
  degraded: DegradedFlags;
  error: { code: string; message: string } | null;
}

export const ENGINE_VERSION = 'reasoning-0.1';
export const LIMITS = {
  problemText: 600,
  rowText: 300,
  maxLearnerNodes: 40,
  turnBodyBytes: 64 * 1024,
  coachMessage: 500,
} as const;
