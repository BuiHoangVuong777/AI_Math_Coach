# AGENT.md — Technical handoff

Operational memory for the next coding agent. Product requirements: [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md) **v0.7** (Vietnamese; hidden internal reasoning graph and learner-row explanations, preserving engine IDs, Voice, authentication and history). The code is the source of technical truth.
Last updated: 2026-09-27 (learner graph UI hidden; current implementation/results/limitations in §16. §14–15 record prior verification; Voice/auth configuration in §15 remains valid; `/coach` remains legacy/REG-01).

## 1. Product goal and verified POC scope

- **Product:** AI Math Coach. **POC = Math Reasoning Canvas** at `/canvas`: *Student Reasoning → Dynamic Visual Map*. The learner types a cylinder problem, confirms how it was read (F1), then writes **one reasoning step per row**. Each row is parsed, independently validated by deterministic maths, added to a dependency-aware ReasoningGraph, visualised through validated VisualSpecs, and coached (Socratic, disclosure-limited).
- **Core invariant (enforced + tested):** the learner's text is never rewritten; incorrect, ambiguous, unsupported and revised claims stay visible and distinguishable from verified facts; an LLM never decides correctness, writes learner text or changes the phase.
- **Verified domain:** right circular cylinders, ≤ 2 per problem, quantities r, d, h, A (base area), V and factors k = X₂/X₁; one unit (mm/cm/dm/m); problem types `compute`, `scaling_ratio` (r and/or h change by value, factor, "tăng thêm", %), `inverse` (h from V, r; r from V, h when rational). Many user-entered problems, not only the demos.
- **Users:** learners 11–15 (Vietnamese UI), parents are customers (no parent UI — FR-PARENT-001 TBD).
- `/` (Math Universe) and `/sphere-test` unchanged. `/coach` (v0.3 S1–S6) still works unchanged (see §12).

## 2. `/canvas` journey (phase machine in the orchestrator)

| Phase | Learner | System |
|---|---|---|
| `problem_input` | Types/pastes a problem (≤ 600 chars) or picks a sample | `POST /api/reasoning/problem` → rules parser; LLM only if rules find nothing; offline → same parser locally |
| `problem_review` | Confirms 4 groups (Dữ kiện/Ẩn số/Điều kiện/Cần tìm), may edit a given's kind/value, answers clarifications, or uses the structured form | Every given has a source span (highlighted on focus). Grounded edits accepted; contradicting edits become invalid learner claims (`f1-*`, `contradicts_problem_text`). `unsupported`/`insufficient` block with reasons |
| `reasoning` | Adds/edits/retracts rows, answers clarification cards, "Điều tra" (experiment), "Gợi ý", "Hỏi Coach", selects rows/visual elements | `POST /api/reasoning/turn` per operation (see §7); full revalidation each turn; visuals re-planned; coach speaks only on the policy triggers (§5) |
| `independent` (F8) | "Tự kiểm tra": solves a generated analog problem; submits once | Neutral reasoning rows only; no graph/coach/hints/3D/table/chart/main history/Voice; verdicts hidden until submit |
| `summary` | Reads evidence | Traced items (event seq numbers), "chưa có bằng chứng" for missing items, demo data flagged, fixed limitation sentence; submitted independent rows, no graph renderer |

## 3. Architecture and data flow

```
Browser (React 18 + Zustand)                          server/ (node:http, one process)
ReasoningCanvasPage ─ useCanvas store ─ client.ts ──POST /api/reasoning/turn (toWire(context))──▶ reasoningRoutes.ts
      ▲                                    │                                                         │ validateTurnRequest
      │  mergeResult(local, result)        │ network/timeout/5xx → runTurn(req, {}) LOCALLY          ▼
      └────────────────────────────────────┘ (same pure engine, no LLM, badge "Ngoại tuyến")    runTurn(req, ports)
                                                                                                      │
runTurn: silent revalidation of the incoming graph (never trust client validations)
  → op handler: parseRow (rules) → [LLM parser port only if unparsed] → grounding G1–G4
  → graph reducer (history, version+1) → revalidate ALL rows in row order (validator, probes, deps, RG-C1/C2, root causes)
  → decideCoach → [LLM tutor port] → validateTutorOutput (schema, level, ids, leak guard, praise check) else rule-based
  → planVisuals (deterministic) → TurnResult { context, visualSpecs, coach, clarification, events, degraded }
```
- **Deterministic:** parsers, grounding, validator, graph, planner, disclosure/leak guard, fallback tutor, analog generator, F8 grading, summary. **LLM (optional):** problem mention extraction, row transcription (after rules fail), tutor wording.
- **State:** the browser holds the canonical `SessionContext` in memory (no persistence). The reasoning endpoint is stateless and recomputes all validations (FR-ORCH-003); demo authentication has server-side sessions (§15). Slim wire format (`toWire`: validations/deps/edges/old events dropped, compact history) keeps a 40-row + 20-edit session ≈ 45 KB < 64 KB limit.
- Pure engine code lives in `src/lib/reasoning/` with the `src/lib/cylinder` conventions: no React/DOM/`@/`, `.ts` import extensions, `import type`, no enums/parameter properties (Node type-stripping).

## 4. Modules and files

| File | Responsibility |
|---|---|
| `src/lib/reasoning/types.ts` | Contracts §9: ProblemSpec, ReasoningNode, ReasoningGraph/GraphEvent, ValidationResult, VisualSpec (+params), CoachResponse/CoachContext, SessionContext, TurnRequest/TurnOp/TurnResult, LIMITS |
| `exact.ts`, `expr.ts` | Exact rationals × π^0/1 (`ExactValue`), approximation rule; closed grammar tokenizer/parser/AST evaluator (no eval), literal extraction, display |
| `rules.ts`, `facts.ts` | Rule catalog (R-A … R-INC) and generic derivation resolver; verified problem facts (free-parameter trick for symbolic h) |
| `lexicon.ts`, `problemParser.ts` | Vietnamese keyword lexicon; F1 extraction with spans, relations/constraints/unknowns, scope checks, clarifications, learner edits (`confirmProblem`), form fallback |
| `rowParser.ts` | Row → MathStatement (equation/formula/scaling/strategy/conclusion/justification/observation/question/free_text), justification analysis, ambiguities/alternatives |
| `grounding.ts` | LLM parser/problem JSON schemas + validators, `llmToStatement`, grounding G1–G4, problem-mention grounding |
| `validator.ts` | Math Validator: inference vs groundTruth, premise substitution (literal) check, `premise_changed`, units, scaling law, observations, formulas, plans, justifications, misconception probes, status resolution |
| `graph.ts` | Reducer: add/revise/retract, compact history, `revalidate` (row order, producers, RG-C1 cycles, RG-C2 conflicts, root causes, edges, symbol table, events) |
| `visualPlanner.ts` | Deterministic VisualSpecs: reasoning_graph, cylinder_3d, comparison_table, scaling_chart, formula_highlight; slider domain; spec validation |
| `disclosure.ts`, `tutorFallback.ts` | D0–D4 policy, forbidden values + leak guard (incl. Vietnamese number words), tutor output schema/validator; Vietnamese rule-based tutor |
| `analog.ts`, `summary.ts` | F8 analog generator (round-trips through the parser); evidence summary |
| `orchestrator.ts` | `runTurn`, `interpretProblem`, `startSession/confirmAndStart`, F8 evaluation, `toWire/mergeResult`, `planForContext` |
| `contract.ts` | Server-side structural validation of TurnRequest / problem request |
| `client.ts` | Browser client with timeouts and local fallback |
| `fixtures.ts`, `testkit.ts`, `*.test.ts` | Spec §15 texts (tests/E2E only — the engine never special-cases them), test driver, suites |
| `server/reasoningRoutes.ts`, `reasoningPrompts.ts` | `/api/reasoning/*`, ports with hard timeouts, prompts (trusted instructions vs `<<< >>>` learner data, canary `CANVAS-INSTR-5D2E`) |
| `server/app.ts`, `index.ts`, `config.ts`, `openaiGenerator.ts` | Existing server; now delegates `/api/reasoning/*`; generator accepts a per-capability `format` |
| `src/stores/reasoningSessionStore.ts` | Zustand store (UI phase, draft, context, specs, coach log, selection, one request at a time, stale-result drop) |
| `src/pages/ReasoningCanvasPage.tsx`, `src/components/canvas/*` | Page; ProblemStage (F1), RowsPanel, VisualStage (3D/chart, slider, element list), row explanations/details, Visuals (table, chart, KaTeX `trust={false}`; SVG graph only in opt-in dev inspector), CylinderScene (3D), CoachPanel, EndStages (F8, summary) |
| `src/components/three/Viewer3D.tsx` | Shell extracted from `CylinderViewer` (camera buttons, OrbitControls, WebGL error boundary); `/coach` DOM unchanged |
| `src/data/canvas/copy.ts` | Vietnamese UI copy (statuses, reasons, misconceptions, samples) |
| `scripts/e2e-canvas.mjs`, `scripts/mock-coach-server.ts` | Canvas browser E2E (CDP, no deps); mock server now also fakes Canvas parser/tutor |

## 5. Contracts and invariants (enforced in code, covered by tests)

- **Statuses:** `valid` (follows + true) · `invalid` (false, does not follow, unit mismatch, false justification) · `ambiguous` (no single reading; never validated/used as premise) · `unverified` (outside grammar/catalog/POC; never "invalid") · `insufficient_evidence` (depends on invalid/ambiguous/retracted, or a bare claim of an unknown without support). `checks.inference` and `checks.groundTruth` are separate (Case C row 5: follows + true + depends on invalid ⇒ insufficient).
- **Premises:** a row is checked against the learner's *own* earlier claims (latest active, non-superseded, non-hypothesis producer of each symbol), then givens, then derivations. Substituted literals must be premise values, so stale numbers give `premise_changed` (never auto-fixed).
- **Graph:** RG-C1 (explicit forward refs closing a cycle → ambiguous `cyclic_reference`), RG-C2 (different redefinition → ambiguous `symbol_redefined` until the learner chooses replace/keep_both), RG-C3 (problem nodes read-only), RG-C4 (+1 version per mutating op), RG-C5 (every turn revalidates all rows), RG-C6 (originalText/history/events append-only; property test 200 sequences), RG-C7 (≤ 40 rows).
- **Visual semantics:** meshes only from confirmed problem data or experiment parameters, one uniform scale (learner claims never change it); learner claims are annotations with their epistemic style (icon + word + dash, not colour only); derived values appear only once the learner wrote them; every element has `sourceNodeIds` or `factIds` (`validateVisualSpec`); experiment table never shows a factor.
- **Disclosure:** D0 default, +1 per hint request, auto D2 after 2 failed revisions, never the unknown's value in guided mode. Forbidden = verified facts not validly produced by the learner and not stated in the problem (change factors kr/kh of given data are allowed). Invitation and scope notices are always deterministic text.
- **F8:** analog generated deterministically (`generateAnalog`); rows parsed but verdicts hidden; one submission stored before evaluation; answer and reasoning graded separately; `analogText` override only with `ports.allowAnalogOverride` (tests) — the server forces it off.

## 6. Supported reasoning (rules parser; LLM only extends coverage, grounded)

Numbers `12,5`/`12.5`, fractions, `một nửa`, `một phần ba`, `gấp đôi/ba`, `%`; `π`/`pi`; `+ − × · * : / ÷ ^2 ^3 ² ³ ( ) √`; `≈` (approximation, `|x−v| ≤ 0.5·10^−d`); symbols `r d h A V` (+`S` for area) with `₁₂/1/2` or words (`cũ/ban đầu/mới`, problem labels); `V₂/V₁`, `V₂ : V₁`; rows like `A₁ = π·6² = 36π cm²`, `Chiều cao lon mới là 12 : 2 = 6 cm`, `Em đoán thể tích gấp 2 lần`, `Bán kính gấp 3 lần nên thể tích cũng gấp 3 lần`, `… vì chiều cao không đổi`, `V = πr²h`, `Em sẽ tính … rồi chia`, `Em thử r = 10 dm thì A = 100π, gấp 4 lần 25π` (experiment), questions `…?`. Out of scope (→ unverified): lateral/total area, cone/sphere, calculus. Misconception probes (always "possible"): radius_diameter, square_as_double, missing_pi, forgot_height, linear_scaling, increase_vs_factor, percent_vs_factor.

## 7. API, environment, commands

- `GET /api/reasoning/status` → `{ parserLLM, tutorLLM, model }` · `POST /api/reasoning/problem {problemText}` → `{ problemSpec, degraded }` · `POST /api/reasoning/turn TurnRequest` (≤ 64 KB) → `TurnResult` | `400 invalid_request` · `409 version_conflict` · `413` · `415` · `429` (+Retry-After) · `500 internal_error`. Legacy `/api/coach*` unchanged.
- Ops: `add_row, edit_row, retract_row, resolve_ambiguity, reject_interpretation, resolve_conflict, mark_revised_by, experiment(start|set|end), request_hint, ask_coach, select_node, start_independent, submit_independent, retry_independent_evaluation, finish`.
- Env (server-only, repo-root `.env`, never `VITE_`): `OPENAI_API_KEY` (unset → no LLM, deterministic mode), `OPENAI_MODEL` (default `gpt-4.1-mini`), `COACH_TIMEOUT_MS` (tutor, 12 000), `REASONING_PARSER_TIMEOUT_MS` (parser/problem, 8 000), `COACH_MAX_OUTPUT_TOKENS`, `COACH_SERVER_PORT/HOST`, rate limits (Canvas uses 3× the coach limits). Strict Structured Outputs schemas: `row_parse`, `canvas_coach`, `problem_mentions`; `store: false`; no SDK retries (orchestrator retries the parser once only for schema-invalid output).

```bash
npm install
npm run dev                  # API :8787 + Vite; open the printed URL + /canvas (or /coach)
npm test                     # node:test — all engine/server/legacy suites (never calls OpenAI)
npx tsc -b && npm run build  # typecheck (app + node + server) and production build
# Browser E2E (no paid calls): build, then serve and optionally start a backend
npm run build && npx vite preview --port 4191 --strictPort &
E2E_BASE_URL=http://127.0.0.1:4191 npm run test:e2e:canvas                      # no backend → offline mode
node scripts/mock-coach-server.ts &  # fake models on :8787
E2E_BASE_URL=http://127.0.0.1:4191 E2E_COACH_MODE=ai npm run test:e2e:canvas   # AI path via mock
E2E_BASE_URL=http://127.0.0.1:4191 E2E_COACH_MODE=ai npm run test:e2e          # legacy /coach
```
`vite preview` indexes `dist/` at start and the mock/real server load code at start: **restart both after rebuilding or editing the engine.** Stop servers by PID (`ps -eo pid,args | grep …`); never `pkill -f` a pattern that also matches your own shell command (it kills the shell — happened again this session).

## 8. Historical v0.4 verification (2026-09-27, Node 22.23, Chrome headless + SwiftShader)

Current takeover verification is recorded in §14; preserve these earlier results as history.

| Check | Result |
|---|---|
| `npm test` | **97/97 pass**: 42 pre-existing (coach/cylinder/graph localization) + 55 new (exact/grammar 5, cases 7, engine 34, server reasoning 9) |
| `npx tsc -b`, `npm run build` | **Pass** (pre-existing >500 kB main-chunk warning; Canvas chunk ≈ 180 kB + KaTeX CSS) |
| `npm run test:e2e:canvas` — no backend (offline) | **8/8 steps pass**, no page errors |
| same — real `server/index.ts` without key | **8/8 pass**; server log: 38 `/api/reasoning` requests, all 200 |
| same — `E2E_COACH_MODE=ai` with mock server | **9/9 pass** (validated fake AI replies; LLM-parsed row marked "AI đọc"; forbidden-value reply rejected → rule-based) |
| Legacy `npm run test:e2e` (ai mode, mock) | **11/11 pass** (Viewer3D refactor did not change `/coach`) |
| `npm run test:e2e:graph` (dev server :4180) | **Pass** (147 nodes × 5 tabs, locale cycling) |
| Screenshots inspected | Case A graph/table/formula, Case B experiment + chart + summary, Case C 3D before/after edits: labels, dashed invalid radius beyond the rim, stable scale |
| Bundle scan `dist/` | No `OPENAI_API_KEY`, `api.openai.com`, prompt text; canary string present (used by browser-side validators, as before) |
| `npm run lint` | **Blocked (pre-existing):** `eslint: not found` — ESLint deps not installed/declared |
| Live OpenAI call, real devices, mobile, screen reader, keyboard-only journey | **Not run** |

Bugs found and fixed during verification: leak guard missed values followed by a period (`d₂ = 8.`) — found by the AI-mode E2E; `một phần ba.` not parsed; `gấp ba` matched `gấp bao`; 3D scale changed on revisions (camera cut off).

## 9. Acceptance-criteria coverage

Legend: ✅ implemented + automated test · 🟡 partial · ⬜ not implemented · ❔ implemented but unverified. Tests: `cases`=src/lib/reasoning/cases.test.ts, `engine`=engine.test.ts, `exact`=exact.test.ts, `srv`=server/reasoning.test.ts, `e2e`=scripts/e2e-canvas.mjs.

| ID | Status | Where | Evidence / limitation |
|---|---|---|---|
| J-AC-01/02/03/04 | ✅ | problemParser, ProblemStage | engine F1 tests; e2e gate + cone step |
| J-AC-05 | ✅ | RowsPanel, orchestrator `missing_justification` | cases/e2e; "why" asked only for bare unknown claims |
| J-AC-06/07/08 | ✅ | disclosure, tutorFallback | engine hint ladder + leak tests; cases B |
| J-AC-09 | ✅ | validator, facts | engine ≥ 30 (r,h) + REG values |
| J-AC-10 | ✅ | visualPlanner rules | cases A (no chart, no spec for pure arithmetic) |
| J-AC-11 / FR-EVAL-003 | 🟡 | facts/validator use constraints | Conditions are enforced through the maths; no explicit per-condition "đạt/chưa đạt" display |
| J-AC-12/13/14 | ✅ | orchestrator F8, EndStages, summary | cases/engine F8; e2e F8 step |
| F1-AC-01…05 | ✅ | problemParser | engine (spans equal spec §9.2), form fallback |
| F2-AC-01/02/03 | ✅ | rowParser strategy, validator plan_check | engine F2 test; cases without strategy |
| F3-AC-01…04 | ✅ | rowParser, validator | cases A–C/REG; G1 test; two chains (C); ≥ 30 values |
| F4-AC-01…04 | ✅ | validator probes, planner | cases B/C, leak tests, C-AC-03 |
| F5-AC-01…03 | ✅ | rowParser ambiguities, validator | engine F5 + out-of-scope |
| F6-AC-01…04 | ✅ | orchestrator experiment, planner | cases B/REG; e2e B |
| F7-AC-01…04 | ✅ | graph revise/revalidate | cases C; property test; e2e C |
| F8-AC-01…04 | ✅ | analog, evaluateIndependent | engine F8 tests; e2e |
| Case A/B/C (A-AC-*, B-AC-*, C-AC-*), REG-01-AC-01/02 | ✅ | — | cases.test.ts + e2e (REG-01 F8 via test-only override) |
| FR-PROB-001…006 | ✅ | problemParser | engine |
| FR-STEP-001…005, FR-RG-001…005 | ✅ | graph, orchestrator | cases/engine |
| FR-PARSE-001…005 | ✅ | rowParser, grounding, orchestrator | engine LLM-port tests, srv parser test |
| FR-MATH-001, FR-VAL-001…006 | ✅ | exact, validator | exact/engine |
| FR-VIS-001…006, 009, 010 | ✅ | visualPlanner, canvas components | engine (spec validity on random ops), code scan test |
| FR-VIS-007 | 🟡 | EPISTEMIC_UI (icon + word + dash) | Grayscale screenshot check not done |
| FR-VIS-008 | 🟡 | selection in rows/graph/table/3D/element list | e2e by clicks; keyboard focus exists (buttons, `role=button` SVG nodes) but not tested |
| FR-CYL-001/003/004 | ✅ | CylinderScene, planner | cases/e2e; FR-CYL-002, FR-STEP-006, FR-EVAL-007 are SUPERSEDED (REG-01 only) |
| FR-COACH-001…007 | ✅ | tutorFallback, disclosure, orchestrator | engine/srv; pedagogical quality of wording not expert-reviewed |
| FR-PRED-001/002, FR-EXP-001/002 | ✅ | orchestrator, planner | cases B/REG, summary test |
| FR-EVAL-001/002/004/005/006/008 | ✅ | validator, evaluateIndependent | cases/engine |
| FR-EVID-001…003, FR-REC-001…003, FR-ORCH-001…003 | ✅ | summary, orchestrator, store, client | engine dup/stale/forged-state tests, srv round trip |
| FR-PARENT-001 | ⬜ | — | TBD by spec (no parent UI) |
| NFR-MATH-001 | ⬜ | — | Expert review of rules/templates/probes not done |
| NFR-MATH-002…007 | ✅ | rules/validator | engine/cases |
| NFR-AI-001…004, NFR-SEC-001/002 | ✅ | disclosure, grounding, reasoningRoutes | srv/engine; bundle scan |
| NFR-PRIV-001/003/005/007 | ✅ | ports input shape, `store:false`, in-memory | engine POC-AC-09 |
| NFR-PRIV-006 | 🟡 | UI warnings only | Automatic PII filtering (BL-15) not implemented |
| NFR-PRIV-002/004 | ⬜ | — | TBD by spec |
| NFR-A11Y-001…005 | 🟡❔ | labels, aria-live, element list, text fallbacks | Screen reader + keyboard-only journey not verified; WCAG level TBD |
| NFR-PERF-001 | ⬜ | — | TBD (LLM latency budget) |
| NFR-PERF-002/003, NFR-REL-001…003, NFR-OBS-001 | ✅ | store pending lock, engine | engine perf < 200 ms test; logs carry codes/counts only |
| POC-AC-01…07, 09, 10 | ✅ | — | tests above (POC-AC-06: no automated paid calls) |
| POC-AC-08 | ❔ | — | Keyboard-only completion of Case A **not verified** |

**The POC is not fully accepted:** POC-AC-08 (keyboard-only run) and the 🟡/⬜ items above remain open; a live OpenAI run has not been done.

## 10. Historical limitations and next tasks before v0.6 (current state: §15)

- **Deviations from spec contracts (documented, additive):** `MathStatement` adds `observation`; `Interpretation` adds `justification`, `explicitRefs`, `outOfScope`; `ProblemSpec.unit`/`labelSpan` nullable + `clarifications`; `ValidationResult` adds `producedSymbol`/`claimedValue`; extra ops (`reject_interpretation`, `select_node`, `retry_independent_evaluation`, `experiment:set`); unsupported visual requests are flagged on the reasoning_graph spec; experiment `set` moves are not logged as events (only start/end + visited values, per S4-AC-05); history is stored compactly.
- **Design choices to revisit:** bare values of intermediate quantities (`r₁ = 3 cm`) count as valid mental steps, bare values of the unknown need a supporting row or reason; F8 has no clarification prompts; the tutor speaks only on policy triggers; invitations/limit notices are deterministic.
- **Parser coverage** is rule-based Vietnamese patterns (§6). Unrecognised phrasing → `unparsed` (or LLM if configured). Word-problem phrasings outside the lexicon may need the form fallback. LLM problem interpretation is only called when rules find no givens/unknowns.
- **Leak guard** covers numerals, decimals, π multiples, Vietnamese number words 0–20 and simple fractions in kind context; paraphrases beyond that are not detected — review real transcripts.
- **Not done (backlog):** BL-15 PII filter, BL-17 ESLint deps, BL-18 mobile/screen-reader audit, BL-19 live paid run + expert transcript review, BL-20 `/coach` removal decision, BL-21 persistence (blocked on privacy decisions). BL-16 (number words) is done.
- The server is dev/demo only (no auth/HTTPS, in-memory rate limit that behaves globally behind the Vite proxy). Learner text goes to OpenAI only when a key is configured; consent/retention are TBD (NFR-PRIV-002) — do not use with real child data yet.

## 11. Rules for the next agent

1. **Maths is deterministic.** Correctness, statuses, phases, unlocking and F8 grading come only from `src/lib/reasoning` rules; never let model output decide or overwrite them. Never special-case fixture texts/values.
2. **Never rewrite learner text.** `originalText`, `history`, `events` are append-only; corrections are the learner's edits or explicit choices (clarification, replace/keep_both, revised_by).
3. **Every model output is untrusted:** schema-validate, ground (G1–G4), leak-guard, render as text. Changing a schema means updating schema + validator + tests together. Tests must never call OpenAI (use ports/mocks).
4. **Every visual element must be traceable** (`sourceNodeIds`/`factIds`) and pass `validateVisualSpec`; no renderer outside the catalog; KaTeX with `trust={false}` for Canvas; no eval/`dangerouslySetInnerHTML` (a test scans for this).
5. **Server never trusts client state:** keep the silent revalidation at the start of `runTurn`; keep `allowAnalogOverride` off on the server.
6. **Minimum data to models:** keep ParserInput/CoachContext field sets (tested); no names/ids.
7. Keep `/coach` and its E2E green until BL-20 is decided; keep the legacy rules in §12.
8. Don't commit or push unless asked. The current user authorizes additive Voice and demo-authentication updates to `docs/PRODUCT_SPEC.md`; preserve stable IDs, decisions and history. Pre-existing user changes (README, i18n, …) are not yours.

## 12. Legacy `/coach` (v0.3 S1–S6) — kept, unchanged behaviour

Files: `src/lib/cylinder/*` (math, parse, S1–S6 `session.ts` reducer, `coachContract.ts` + leak guard, `coachClient.ts`), `src/data/lessons/cylinderLesson.ts`, `src/components/coach/*`, `src/pages/CylinderCoachPage.tsx`, `server/prompt.ts`, `POST /api/coach` (`{step, learnerMessage, hintLevel, solvedSteps, stepReasonCorrect, lastAttempt, prediction}` → `{source:'ai', model, reply}`; errors 400/404/413/415/429/502/503/504; `GET /api/coach/status`). Invariants: every number from `math.ts`; reducer is the only mutation path; S5 hides model/slider/hints/coach; GPT replies validated server+client and never grade. Only change this session: `CylinderViewer` now renders through the shared `Viewer3D` shell (same DOM/labels; E2E 11/11) and `CylinderPair` exports `Rim`. The v0.3 lesson is also regression case REG-01 in the Canvas engine.

## 13. Bàn giao bản địa hóa đồ thị tiếng Việt (26/09/2026)

### Nguyên nhân và luồng dữ liệu

- Trước lần sửa này, UI mặc định `vi` nhưng danh mục đồ thị chỉ có `zh`/`en`. `getLocalizedText` chọn `zh` khi thiếu `vi`; bảng chi tiết còn lấy trực tiếp `names.zh[0]`, `nameZh[0]` và quốc tịch tiếng Trung.
- Luồng thực: 11 môđun `src/data/fields/*.ts` → `fields/index.ts` → `assignPositions` → `fieldsData` → Zustand `fieldStore` → `Scene`/`FieldNodes`. Hover đặt `hoveredField` cho `Tooltip`; click đặt `selectedField` cho `DetailPanel`. Search đọc cùng dữ liệu và gọi cùng hành động chọn nút.
- Danh mục nguồn có **157 khái niệm**. `assignPositions` hiện chỉ trả cấp 1–2, nên đồ thị có **147 nút**; 10 khái niệm cấp 3 không được hiển thị là giới hạn có từ trước. Không sửa thuật toán bố trí, quan hệ, màu hoặc số nút trong nhiệm vụ bản địa hóa.

### Kiến trúc và quy tắc bổ sung nội dung

- Tái sử dụng `LocalText` với trường hiển thị `vi` bên cạnh `en`/`zh` trong từng khái niệm có ID ổn định. Đã thêm **1.733 trường `vi`** cho tên, mô tả, định nghĩa, phạm vi, lịch sử, nguyên lý, công thức, biến, ứng dụng và đóng góp. Khi thêm khái niệm, thêm các locale vào đúng đối tượng; không dùng tên dịch làm ID.
- `src/lib/localization.ts` định nghĩa `Language`, `LocalText`, `normalizeLanguage` và `getLocalizedText`; `src/types/index.ts` tái xuất để giữ các import hiện có.
- `vi-VN`/`vi_VN` được chuẩn hóa thành `vi`; tương tự `en`/`zh`. Locale không hỗ trợ chọn `vi`.
- **Nội dung danh mục ở VI:** chỉ dùng `vi` hợp lệ. Nếu thiếu, rỗng hoặc chứa chữ Hán, hiển thị rõ **“Nội dung tiếng Việt đang được cập nhật.”** Không âm thầm chọn Trung hoặc Anh. 19 trường song ngữ vốn rỗng vẫn không được tự bịa nội dung.
- **Nội dung danh mục ở EN/ZH:** dùng locale được yêu cầu; khi thiếu có thể dùng `en` nếu không chứa chữ Hán; nếu vẫn thiếu dùng thông báo cập nhật của locale đó. Một câu `en` vốn trộn chữ Trung đã được sửa về tiếng Anh.
- **Chuỗi UI:** dùng tài nguyên i18next `vi.json`, `en.json`, `zh.json`; `fallbackLng: 'vi'` tiếp tục là quy tắc fallback minh bạch cho khóa UI còn thiếu ở ngôn ngữ khác.
- i18next là nguồn thay đổi ngôn ngữ: `setLanguage` gọi `changeLanguage`; sự kiện `languageChanged` đồng bộ store và `document.documentElement.lang`. Mặc định VI, giữ chu kỳ VI → EN → ZH → VI.
- Quốc tịch giữ trường nguồn `nationality`, thêm `nationalityNames`. Từ ngữ trong LaTeX được dịch qua `latexLocales`; `latex` gốc, ký hiệu, biểu thức và đơn vị giữ nguyên. Hiển thị và sao chép dùng cùng công thức đã chọn locale.
- Từ khóa nội bộ dùng khóa ổn định trong `i18n.*.tags` hoặc tên khái niệm đã dịch. Tìm kiếm dùng nhãn được bản địa hóa; quan hệ hiển thị tên thay cho ID. Mã quan hệ không có khái niệm đích dùng trạng thái không tìm thấy; không tạo thêm quan hệ.

### Thuật ngữ

Dùng nhất quán: **Tô pô đại cương, tô pô đại số, tô pô vi phân; đồng phôi; đồng luân; đồng điều; đối đồng điều; tính compact; vành; trường; iđêan; môđun; hàm tử; lược đồ; thặng dư; trị riêng; vectơ riêng**. Tên riêng và ký hiệu như Hilbert, Banach, Fourier, π, Γ, Ric, Res, diag giữ theo thông lệ toán học. Tên tác phẩm/tài liệu nguồn giữ nguyên khi là tên thư mục tham khảo, không coi đó là UI tiếng Trung cần xóa.

### Tệp thay đổi trong nhiệm vụ này

- Dữ liệu: `src/data/fields/{logic,algebra,geometry,analysis,topology,numbertheory,probability,discrete,applied,mathphysics,interdisciplinary}.ts`.
- Chính sách/locale: `src/lib/localization.ts`, `src/types/index.ts`, `src/i18n/index.ts`, `src/i18n/{vi,en,zh}.json`, `src/stores/fieldStore.ts`.
- Hiển thị: `src/components/detail/DetailPanel.tsx`, `src/components/ui/{Header,SearchBar,FilterBar}.tsx`.
- Kiểm thử: `src/lib/graphLocalization.test.ts`, `scripts/e2e-graph-localization.mjs`; thêm `test:e2e:graph` vào `package.json`. Không thêm dependency.
- `AGENT.md` được bổ sung phần này. `docs/PRODUCT_SPEC.md` giữ nguyên, đã đối chiếu SHA-256. Không sửa nội dung hoặc logic Coach, không commit/push; giữ các thay đổi đang có của người dùng.

### Xác minh trong nhiệm vụ này

| Kiểm tra | Kết quả |
|---|---|
| `npm test` | **42/42 đạt**: 36 bài có sẵn và 6 bài mới về danh mục, fallback, locale, store/search, render chi tiết/tooltip và từ khóa. |
| `npm run build` | **Đạt**: gồm `tsc -b` và Vite; còn cảnh báo kích thước bundle >500 kB. |
| `npm run lint` | **Không chạy được:** `eslint: not found`; không thêm dependency để thay đổi cấu hình lint trong nhiệm vụ này. |
| Bất biến dữ liệu | Đối chiếu 157 đối tượng với dữ liệu gốc: giữ ID, quan hệ, tọa độ, màu, công thức và EN/ZH; chỉ thêm trường hiển thị, sửa một câu EN trộn Trung. |
| Quét toàn bộ chuỗi nguồn và tài nguyên tĩnh | Chữ Trung còn lại thuộc `zh`, tên/quốc tịch nguồn và LaTeX nguồn có locale thay thế; các nhánh điều khiển Trung của trang hình cầu/bộ lọc chỉ dùng khi chọn ZH. Không có chữ Trung trong locale VI/EN hoặc SVG công khai. Comments và fixture kiểm thử được giữ. |
| Chrome: xoay/zoom đồ thị và `/sphere-test` | **Đạt**; kiểm tra văn bản, title, aria-label, placeholder và alt ở trang thử hình cầu VI, không thấy chữ Trung ngoài ý muốn. |
| `E2E_BASE_URL=http://127.0.0.1:4181 E2E_COACH_MODE=ai npm run test:e2e` | **11/11 đạt**, không lỗi trang; backend là `mock-coach-server.ts` ở cổng riêng 8799, kiểm tra AI giả lập và fallback sau đầu ra không hợp lệ. |
| Chrome: 11 nhóm, 147 nút × 5 tab, search và chuyển locale | **Đạt**: hover/click thật ở đủ 11 nhóm; toàn bộ 147 nút × 5 tab đã render sau chuyển cảnh; tìm kiếm “Tô pô đại cương”, chọn kết quả, chu kỳ VI → EN → ZH → VI và thuộc tính lang đều đúng; không lỗi trang hoặc chữ Trung ngoài ý muốn trong VI. |

**Chạy lại kiểm thử đồ thị:** khởi động `npm run dev:web -- --host 127.0.0.1 --port 4180 --strictPort`, rồi `npm run test:e2e:graph` (hoặc đặt `E2E_BASE_URL`). Cần Chrome và Node ≥22. Script dùng CDP, không thêm thư viện. Các module được nhập bằng URL thật trong resource timing của trang để giữ hậu tố HMR của Vite, tránh tạo store kiểm thử khác với ứng dụng. Profile riêng dùng kiểu hình cầu tối giản có sẵn; sau click thực ở 11 nhóm, render theo nhu cầu để duyệt các tab. Không thay cấu hình người dùng.

**Giới hạn:** kiểm thử headless trên máy hiện tại, chưa kiểm tra thiết bị thật, màn hình nhỏ hoặc trình đọc màn hình. Nội dung sinh từ dịch vụ AI trực tiếp chưa được đánh giá ngôn ngữ trong nhiệm vụ này; luồng Coach dùng mock để kiểm tra hồi quy. Các trường nội dung vốn rỗng và khái niệm cấp 3 chưa hiển thị vẫn là giới hạn danh mục hiện có.

## 14. Lịch sử tiếp quản Explainable Reasoning Graph v0.5 — 27/09/2026

> Ghi nhận lịch sử trước v0.6; phần Voice chưa triển khai và điểm tiếp tục bên dưới đã được thay thế bởi §15.

### 14.1 Repository và phạm vi thực tế

**Repository của phiên Claude là `/home/hoangvuongbui/Innovillage/AI_Math_Coach`.** Workspace IDE `/home/hoangvuongbui/Innovillage/Math-Universe` là bản cũ, không có Canvas; không sửa repository đó.

Yêu cầu tổng thể **chưa hoàn thành**: lượt tiếp quản này hoàn thiện và kiểm chứng phần v0.5; **Voice chưa được định nghĩa trong đặc tả hoặc triển khai**. Không có VoiceExplanationPlan, endpoint TTS, provider TTS, điều khiển âm thanh hay kiểm thử Voice trong mã. Tiếp tục từ 14.6, không xây lại Canvas và không hỏi lại quyền triển khai đã được người dùng cấp.

Giữ toàn bộ thay đổi có sẵn, bao gồm README, bản địa hóa và `.env` chưa được theo dõi. Không đọc/in khóa, không commit/push. Đối chiếu SHA-256: `PRODUCT_SPEC.md` và README giữ nguyên trong lượt này. Đặc tả vẫn có các đoạn hiện trạng v0.5 “chưa triển khai”; đây là ghi nhận cũ, cần cập nhật có truy vết trong bước bổ sung Voice. Không được hiểu các đoạn đó là lý do xây lại tính năng đã có.

### 14.2 Đã có sẵn và phần được hoàn thiện

Đã có trước tiếp quản: `ValidationResult.ruleIds`, `Dependency.symbol/origin/depth`, Explanation Builder xác định, view model node/cạnh, provenance, liên kết established/provisional/broken, Level 1/Level 2, chế độ Học sinh/Trình bày/Debug, dạng danh sách/bottom sheet, bảo vệ F8 và 109 kiểm thử engine/server/legacy/localization. Các kết quả này đã được chạy lại độc lập, không chỉ lấy từ log Claude.

Các sửa đổi mới:

1. **Lỗi “Timed out waiting for: review” thuộc cách phát phím CDP:** nút phân tích có tiêu điểm, đang bật, đề và trạng thái React đúng, nhưng keyDown/keyUp Enter không có `text: '\r'` không kích hoạt hành vi native của nút. Helper nay phát Enter đúng; không tăng timeout hay bỏ qua xác nhận.
2. **Lỗi UI thật ở điểm Tab của bản đồ:** GraphMap khởi tạo khi mới có dữ kiện đề; roving tabIndex giữ node dữ kiện dù dòng 1 đã xuất hiện. Đồng bộ điểm vào theo dòng đầu/selection, vẫn giữ điều hướng mũi tên.
3. **Điều hướng Level 2:** chọn tiền đề/ảnh hưởng chuyển tiêu điểm tới thẻ nguồn; Esc từ trong chi tiết đóng và trả tiêu điểm về thẻ. E2E kiểm cả chuyển tiền đề và Esc, ngoài mở/đóng thẻ.
4. **Race trong E2E sau kết thúc thử nghiệm:** thao tác tiếp theo trước khi lượt kết thúc hoàn tất bị khóa gửi. Test chờ panel thử nghiệm biến mất và nút gửi thật sự bật, giữ mọi assertion về số dòng/nội dung.
5. **Bố cục/thu phóng:** thẻ thường tối đa 96 px, thẻ gọn 76 px; Ctrl/⌘ + cuộn, hai ngón liên tiếp qua render, phím 0 đặt lại; “Vừa khung” tính theo chiều rộng viewport/đồ thị trong miền 50%–100%, vẫn cho cuộn khi đồ thị vượt miền thu phóng.
6. **Ranh giới VisualSpec:** Planner truyền `ExplainContext` hiện tại vào `validateVisualSpec`; đối chiếu graphVersion, revision với node thật và kiểm lại mọi chuỗi giải thích/nhãn bằng `findLeak`. Có kiểm thử giả mạo giải thích và revision. Khi gọi validator không có evidence, chỉ kiểm cấu trúc; không dùng đường đó làm bằng chứng an toàn tiết lộ. Đường tạo VisualSpec trong sản phẩm luôn truyền evidence.
7. **Timer cập nhật:** timer của lượt cũ chỉ được xóa đúng mảng `changedNodeIds` của lượt đó; không xóa dấu của lượt mới. Browser test giữ và gọi hai callback có kiểm soát để xác minh, không chờ giả theo thời gian.
8. **Giới hạn nội dung:** `explanationShort` tối đa 120 ký tự, nhãn cạnh tối đa 40, cắt ở ranh giới từ; nội dung ngắn đầy đủ được giữ ở chi tiết nếu cần rút gọn. Không đổi phép tính, trạng thái kiểm chứng, nguyên văn hay quan hệ toán.
9. **Độ phủ:** 200 phiên ngẫu nhiên × 6 thao tác; D0–D4 tường minh cho ca C node gốc và kết luận thiếu cơ sở; kiểm layout/neighbor; kiểm context thật trước/sau đổi chế độ trên dev bằng đúng URL module Vite từ resource timing (tránh tạo store khác).

Tệp thay đổi:

- `src/lib/reasoning/{explanations,visualPlanner,explanations.test}.ts`.
- `src/components/canvas/graph/{GraphMap,DetailPanel,ExplainableGraph,NodeCard}.tsx`.
- `src/components/canvas/graph/layout.ts`, mới `layout.test.ts`.
- `src/stores/reasoningSessionStore.ts` (chỉ timer hiển thị).
- `scripts/e2e-canvas.mjs`, `AGENT.md` (cập nhật cuối).

Không đổi validator toán, danh mục quy tắc, F1–F8, cấu hình AI, dependency, route `/coach`, danh mục/bản địa hóa Math Universe hoặc PRODUCT_SPEC.

### 14.3 Kết quả xác minh của lượt tiếp quản

Node 22.23; Chrome headless + SwiftShader. Mọi backend AI trong browser test là `scripts/mock-coach-server.ts`, không đọc `.env`, không gọi API trả phí. Test ngoại tuyến dùng preview proxy tới cổng không có backend.

| Lệnh/kiểm tra | Kết quả quan sát |
|---|---|
| `npm test` | 113/113 đạt; 109 có sẵn + 2 layout/navigation + 1 guard VisualSpec + 1 ma trận D0–D4 ca C |
| `npx --no-install tsc -b` | Đạt |
| `npm run build` | Đạt; còn cảnh báo bundle >500 kB có từ trước |
| `npm run lint` | Blocked: `eslint: not found`; dependency lint không được khai báo/cài; không thêm gói |
| Canvas production, mock AI | 17/17 đạt trước sửa timer hiển thị cuối (timer được kiểm trên dev); A/B/C, REG-01, selection, disclosure, revision, F8, 40 node, mobile, bàn phím, Ctrl+cuộn/hai ngón |
| Canvas không có backend | 16/16 đạt trước sửa timer hiển thị cuối (timer được kiểm trên dev); cùng hành trình, engine cục bộ |
| Canvas dev, mock AI | 18/18 đạt; thêm Debug, fact ẩn, context thật bất biến qua các chế độ, F8 chặn Debug đã bật, timer cũ/mới, reduced-motion và tương phản tiêu điểm ≥3:1 theo style tính bởi browser |
| `/coach`, mock AI | 11/11 đạt; không lỗi trang |
| `test:e2e:graph` trên Vite dev | 11 nhóm hover/click thật; 147 node × 5 tab; tìm kiếm, VI→EN→ZH→VI, document lang; không lỗi trang |
| Ảnh chụp | Đã xem thẻ/chi tiết ca A và ca C thang xám; icon/chữ/nét vẫn phân biệt; ảnh mobile/dense được tạo bởi E2E |
| TTS thật, speechSynthesis, audio mock | Chưa chạy: Voice chưa có |
| OpenAI thật, thiết bị thật, trình đọc màn hình, nghiên cứu học sinh/chuyên gia | Chưa chạy; không suy diễn kết quả kiểm thử thành kết quả học tập |

Log ở `/tmp/canvas-takeover-{tests,typecheck,e2e,offline,dev-e2e,coach,localization,lint}.log`; build ở `/tmp/canvas-build-takeover.log`; ảnh ở `/tmp/xg-takeover-shots/`. Baseline SHA-256 trước sửa ở `/tmp/ai-math-coach-takeover-baseline.sha256`. Tệp `/tmp` có thể mất, không phải nơi lưu dữ liệu học sinh.

### 14.4 Ma trận yêu cầu v0.5

`U`: explanations/layout tests; `I`: engine/server và guard VisualSpec; `E`: `e2e-canvas.mjs` production/offline/dev. Implemented là thực thi + bằng chứng trong môi trường thử nghiệm, không phải phê duyệt sư phạm/WCAG hay phát hành cho trẻ thật.

| ID | Trạng thái | Tệp nguồn | Kiểm chứng | Giới hạn |
|---|---|---|---|---|
| FR-XG-001 | Implemented | NodeCard, explanations, layout | U/E A–C, 96 px, 120 ký tự | Chưa rà soát bởi chuyên gia |
| FR-XG-002 | Implemented | explanations | U 200 phiên, E | — |
| FR-XG-003 | Implemented | explanations, visualPlanner | U/I giả revision, E | — |
| FR-XG-004 | Implemented | DetailPanel | E ba vùng/provenance | — |
| FR-XG-005 | Implemented | explanations/disclosure | U D0–D4, E B/F8 | — |
| FR-XG-006 | Implemented | explanations, visualPlanner | U/I leak guard, E | Giới hạn nhận diện số viết chữ tại §10 vẫn áp dụng |
| FR-XG-007 | Implemented | explanations/templates | U/I deterministic, tutor fallback | LLM rephrase là P1, chưa bật |
| FR-XG-008 | Implemented | DetailPanel | E chín mục | — |
| FR-XG-009 | Implemented | explanations, planner/store | U/I/E sửa ca C | — |
| FR-XG-010 | Implemented | explanations, NodeCard | U/E trace IDs | — |
| FR-XE-001 | Implemented | explanations, GraphMap | U/E established labels | — |
| FR-XE-002 | Implemented | explanations, GraphMap | U LLM/cycle/conflict, E provisional | — |
| FR-XE-003 | Implemented | explanations/graph | U nguồn cạnh thực | Không tự sinh implements |
| FR-XE-004 | Implemented | explanations, visualPlanner | U/I guard, giới hạn 40 ký tự | — |
| FR-XE-005 | Implemented | explanations, GraphMap | U/E C broken edge | — |
| FR-XM-001 | Implemented | ExplainableGraph/store | U purity; E dev deep context/no requests | — |
| FR-XM-002 | Implemented | PresenterLanes | E ba làn/selection | — |
| FR-XM-003 | Implemented | DebugPanel/ExplainableGraph | E production/dev/F8 | Không có trong production |
| FR-XN-001 | Implemented | GraphMap/DetailPanel/layout | U neighbor, E bàn phím đầy đủ | Chưa thử screen reader |
| FR-XN-002 | Implemented | GraphMap/ExplainableGraph | E Ctrl+cuộn, hai ngón, phím 0; đọc mã fit/chain | Thiết bị cảm ứng thật chưa thử |
| FR-XN-003 | Implemented | NodeCard/layout | U 40 node; E bounding boxes | — |
| FR-XN-004 | Implemented | GraphList/DetailPanel | E 390×844, không cuộn ngang | Thiết bị thật chưa thử |
| FR-XN-005 | Implemented | planner/store/VisualStage/DetailPanel | U linked IDs; E hai chiều/cạnh | — |
| NFR-LANG-002 | Partial | explanations/templates | U 120 ký tự; E VI | Chưa có chuyên gia duyệt văn phong |
| NFR-A11Y-006 | Partial | GraphList/ExplainableGraph | E list/aria-live + đọc mã | Chưa kiểm trình đọc màn hình |
| NFR-A11Y-007 | Implemented | NodeCard/GraphMap/DetailPanel | E focus/Esc, tương phản ring ≥3:1, update animation tắt khi reduce | Chưa thiết bị thật; không khẳng định tuân thủ WCAG toàn ứng dụng |
| NFR-PERF-004 | Implemented | explanations | U 40 node <50 ms | Chỉ máy phát triển; PROPOSED |
| NFR-MATH-001 | Partial | rules/templates | Unit kiểm toán học | Chưa có chuyên gia duyệt; không phát hành cho trẻ thật dựa riêng vào test |

| Tiêu chí | Trạng thái | Bằng chứng | Giới hạn |
|---|---|---|---|
| XG-AC-01 | Implemented | U 200 phiên ×6 thao tác; E A/B/C | — |
| XG-AC-02 | Implemented | U nguồn số/giữ nguyên; E nguyên văn | — |
| XG-AC-03 | Implemented | U icon/chữ/epistemic; E; đã xem ảnh thang xám | Chưa thiết bị thật |
| XG-AC-04 | Implemented | U B/C D0–D4, I forged leak, E AI leak fallback | Không có LLM rephrase trên bản đồ |
| XG-AC-05 | Implemented | U/E labels established | — |
| XG-AC-06 | Implemented | U LLM/cycle/conflict; E provisional | — |
| XG-AC-07 | Implemented | U/I/E C revisions | — |
| XG-AC-08 | Implemented | U/I guard version; E loại ID cũ | — |
| XG-AC-09 | Implemented | E node/edge/row/table/3D | — |
| XG-AC-10 | Implemented | E mũi tên, Enter, nguồn, Esc, F8/tóm tắt | — |
| XG-AC-11 | Implemented | U/E 40 node, mobile 390×844 | Môi trường headless |
| XG-AC-12 | Implemented | U purity, E dev context thật + zero API, Debug mask | — |
| XG-AC-13 | Implemented | U/E F8; dev bật Debug trước F8 | — |
| XG-AC-14 | Implemented | U/E IDs/template catalog | — |
| XG-AC-15 | Implemented | U <50 ms | Chỉ máy phát triển, PROPOSED |
| POC-AC-08 | Implemented | E Ca A tới summary chỉ bằng phím | — |
| POC-AC-11 | Implemented | XG-AC-01…14 tự động + ảnh thang xám đã xem | Nghiệm thu kỹ thuật trong môi trường thử; không thay chuyên gia hay nghiệm thu phát hành |
| POC-AC-12 | Implemented | E A/B/C trên browser | — |

### 14.5 Giới hạn còn lại

- Lint thiếu tooling; chuyên gia, screen reader, thiết bị thật và OpenAI thật chưa được kiểm chứng. Không thêm dependency hoặc tự công bố kết quả.
- Browser đã kiểm class update animation khi `prefers-reduced-motion: reduce`, focus-visible/ring và tỷ lệ tương phản ring với màu nền tính bởi CSS ≥3:1. Không coi đây là đánh giá WCAG toàn diện; screen reader và thiết bị thật còn chưa thử.
- Không có Voice. Không cấu hình TTS và không có audio/subtitle/speech cue để kiểm thử. Các mục này không được báo là đã hoàn thành hoặc “bị chặn” bởi quyền người dùng.
- Khi `validateVisualSpec` thiếu `ExplainContext`, chỉ kiểm cấu trúc. Provider Voice tương lai phải lấy graph đã revalidate và builder hiện tại, không tin view model/approved text do client gửi.

### 14.6 Điểm tiếp tục chính xác — Voice chưa bắt đầu

1. Làm việc trong `AI_Math_Coach`, đọc đặc tả và bàn giao này; giữ `.env`, README và nguồn đã có. Không xây lại graph hoặc legacy Coach.
2. Đối chiếu ma trận và chạy lại kiểm thử khi cần; v0.5 đã có bằng chứng kỹ thuật tại 14.3–14.4. Các giới hạn chuyên gia/screen reader/thiết bị thật vẫn phải giữ tường minh; không tự phát minh xác nhận.
3. **Sửa PRODUCT_SPEC trước khi viết Voice:** bổ sung một mục Voice riêng và ID FR/AC không trùng; cập nhật hiện trạng 18.3 bằng bằng chứng 14.3; giữ lịch sử/ID/F1–F8/D0–D4, phạm vi hình trụ. Định nghĩa rõ VoiceExplanationPlan, segment/cue, subtitles, user trigger, controls, privacy, provider/fallback và tiêu chí nghiệm thu. Không cần xin lại xác nhận để thực hiện yêu cầu Voice đã được cấp.
4. Pipeline: graph được kiểm chứng → Explanation Builder (`buildGraphViewModel`, `explanationForbidden`, `findLeak`) → plan dẫn xuất chỉ từ nội dung được phép → adapter TTS → playback/cues. Không nhận văn bản tùy ý từ client rồi đưa thẳng vào TTS. Server phải revalidate và tự dựng plan từ node hiện tại. Không tạo kết luận toán mới; không viết vào `originalText/history/events`.
5. Dùng server `node:http` hiện có. Chưa có provider TTS. Kiểm tra SDK OpenAI đã cài và tài liệu chính thức trước khi dùng `audio.speech`; áp dụng skill OpenAI khi cần. Thêm port mock không gọi mạng và speechSynthesis fallback dùng được. API key chỉ ở server, không `VITE_`; chỉ gửi đoạn lời nói đã duyệt, không tên/ID/session history cho provider. Chính sách dữ liệu trẻ hiện có vẫn áp dụng.
6. Phạm vi đầu tiên nhỏ: đoạn gợi mở/giải thích của node được chọn, cue node/cạnh và `VisualSpec.elementId` có thực, cùng text cho audio/subtitle. Nếu provider không có timestamp, chỉ đồng bộ cấp đoạn, không giả word timing. Một controller chung tránh âm thanh chồng nhau.
7. Listen/Pause/Resume/Replay/Stop/speed chỉ do học sinh chủ động; states loading/speaking/paused/error/text-only. Hủy fetch/audio/utterance và xóa cue khi stop, selection/revision/version đổi, F8, reset/unmount. F8 chặn mọi coaching audio và truy cập giải thích cũ ở cả browser và server.
8. Kiểm thử plan/guard D0–D4/provenance/current revisions/ID thật; fake TTS adapter không nhận đáp án được bảo vệ; cancellation/no overlap/network fallback/controls/accessibility. Mở rộng E2E A/B/C có Voice. Phân biệt mock playback, browser speech thật và provider thật; không gọi API trả phí trong routine tests.
9. Chạy lại unit/typecheck/build/lint nếu có, ba cấu hình Canvas, `/coach` và localization; cập nhật ma trận bằng kết quả thật. **Cập nhật AGENT cuối**, ghi rõ phần chưa thực hiện nếu phải bàn giao tiếp.

### 14.7 Chạy lại

```bash
cd /home/hoangvuongbui/Innovillage/AI_Math_Coach
npm run dev                   # /canvas; /coach vẫn được giữ
npm test
npx --no-install tsc -b
npm run build
# Mock, tuyệt đối không chạy server/index.ts khi chỉ muốn kiểm thử không trả phí:
COACH_SERVER_PORT=8897 node scripts/mock-coach-server.ts
COACH_SERVER_PORT=8897 npm run preview -- --host 127.0.0.1 --port 4291 --strictPort
E2E_BASE_URL=http://127.0.0.1:4291 E2E_COACH_MODE=ai npm run test:e2e:canvas
E2E_BASE_URL=http://127.0.0.1:4291 E2E_COACH_MODE=ai npm run test:e2e
# Debug và canonical context test:
COACH_SERVER_PORT=8897 npm run dev:web -- --host 127.0.0.1 --port 4292 --strictPort
E2E_BASE_URL=http://127.0.0.1:4292 E2E_COACH_MODE=ai E2E_BUILD_MODE=dev npm run test:e2e:canvas
E2E_BASE_URL=http://127.0.0.1:4292 npm run test:e2e:graph
# Offline: preview proxy tới cổng trống, không backend:
COACH_SERVER_PORT=8898 npm run preview -- --host 127.0.0.1 --port 4293 --strictPort
E2E_BASE_URL=http://127.0.0.1:4293 npm run test:e2e:canvas
```

`E2E_CDP_PORT` tùy chọn cho Canvas (mặc định 9334), `E2E_BUILD_MODE=dev` chỉ là cấu hình test; không phải cờ sản phẩm. Thêm `E2E_SCREENSHOT_DIR` trỏ tới thư mục đã tạo nếu cần ảnh. Khởi động lại preview/backend sau build/sửa engine; dừng đúng tiến trình của mình. Không đọc/in `.env`.

## 15. Bàn giao giọng đọc tiếng Việt và đăng nhập demo v0.6 — 27/09/2026

### 15.1 Phạm vi và quyết định

Đã triển khai tích hợp hai tính năng của yêu cầu mới trong **AI_Math_Coach**, không phải repository Math-Universe đang mở trong IDE. Mục 14 là lịch sử tiếp quản v0.5; các câu “Voice chưa triển khai” ở đó đã được thay thế bởi hiện trạng này. Không xây lại engine; giữ F1–F8, D0–D4, Ca A/B/C, REG-01 và `/coach`. Không commit/push, không đọc/in/sửa `.env`, không thêm dependency. Checksum xác nhận README, `reasoning/{exact,expr,validator,graph,orchestrator}.ts` và `cylinder/{math,session}.ts` giữ nguyên so với baseline tiếp quản. Trạng thái git phần lớn untracked có từ trước; không dùng git diff để kết luận toàn bộ phạm vi thay đổi.

`PRODUCT_SPEC.md` v0.6: hợp đồng mới ở §22, hiện trạng §18.4; cập nhật route/phạm vi demo tại §12.2–12.3, ngoại lệ phiên auth tại §20.2 và nhật ký. Giữ ID/quyết định/lịch sử cũ; thêm FR-VOICE-001…006 và FR-DEMO-AUTH-001…004. Hiệu quả học tập, giọng thật và nghiệm thu sư phạm chưa được chứng minh.

### 15.2 Bản đồ tệp và pipeline

| Tệp | Vai trò |
|---|---|
| `src/lib/voice/plan.ts` | Dẫn xuất plan từ Explanation Builder hiện tại, revision/version, guard, segment/cue và ID có thật; không sửa context. D0 sai chỉ dùng câu hỏi gợi mở. |
| `src/lib/voice/playback.ts` | Controller duy nhất, epoch/AbortController loại callback cũ; phụ đề, pause/resume/replay/stop/rate, metadata provider. |
| `src/lib/voice/browserPort.ts` | Giọng VI qua SpeechSynthesis; thiếu VI → không khả dụng + giữ chữ; Blob/HTMLAudio lifecycle, revoke URL/cancel. |
| `src/stores/voiceStore.ts` | Port server/browser; hủy khi sửa/chọn/version/pending/F8/reset/logout; fetch timeout 15 giây. |
| `src/components/voice/VoiceControls.tsx` | Nghe, phụ đề, nhãn giọng tổng hợp, trạng thái và các điều khiển; sticky, responsive, dừng khi unmount. |
| `server/voiceRoutes.ts` | Cookie demo + same-origin; kiểm schema, revalidate qua runTurn rồi tự dựng plan; chỉ segment được duyệt ra provider, timeout/rate limit/lỗi cố định. |
| `server/openaiSpeech.ts` | OpenAI audio.speech qua SDK hiện có; cấu hình server, MP3, timeout 12 giây, không retry/log dữ liệu. Chưa gọi provider thật. |
| `server/mockSpeech.ts` | WAV xác định **im lặng** 3 giây; dùng kiểm thử, không phải bằng chứng phát âm. |
| `server/demoAuth.ts` | Credentials demo, token ngẫu nhiên, Map phiên 8 giờ, cookie, login/session/logout, expiry/origin/body/rate limit. |
| `src/lib/auth/demo.ts` | Adapter công khai ngoại tuyến, metadata phiên, kiểm input và route quay lại an toàn. |
| `src/stores/demoAuthStore.ts` | Store riêng, request/timeout/generation; offline phải chọn rõ, sessionStorage chỉ metadata; logout/reset Canvas và hủy lượt bất đồng bộ. |
| `src/pages/DemoLoginPage.tsx`, `src/components/canvas/DemoGuard.tsx` | Form VI, show/hide, validate, khóa gửi trùng, redirect/return/refresh/expiry. |
| `src/App.tsx`, `src/pages/ReasoningCanvasPage.tsx` | `/login`, guard `/canvas`, huy hiệu demo/logout, mount Voice trong reasoning. |
| `src/components/canvas/graph/{NodeCard,DetailPanel,GraphMap}.tsx` | Nghe tại node/chi tiết; điểm nhấn node/cạnh thật, không thay lựa chọn. |
| `src/components/canvas/{VisualStage,Visuals}.tsx` | Cue hình/table/chart theo nguồn; công thức và danh sách phần tử dùng ID thực. |
| `src/stores/reasoningSessionStore.ts` | Epoch/context kiểm lượt async để logout/reset không làm sống lại phiên cũ; không thay toán. |
| `server/{app,index}.ts`, `scripts/mock-coach-server.ts` | Gắn auth/TTS vào server hiện có; mock không đọc .env/gọi mạng. |
| `src/lib/{auth/demo,voice/voice}.test.ts`, `server/demoVoice.test.ts`, `scripts/e2e-canvas.mjs` | Unit/HTTP/browser, đăng nhập trước hành trình thật, không bỏ qua guard. |

Đồng bộ **cấp đoạn**, không timestamp từng từ. Cue dùng source node/cạnh/VisualSpec; highlighted và selected độc lập. Mỗi lượt đổi context hoặc bước đang kiểm lại hủy phát trước khi UI đổi. F8 không mount Voice, không plan/replay bài chính. Server không nhận script/approved text tùy ý: tái kiểm graph rồi lấy segment hiện tại. Engine server vẫn không trạng thái; client-context không trở thành một hệ thống thi cử hoặc tài khoản sản phẩm đáng tin cậy.

### 15.3 Cấu hình và khác biệt môi trường

- Dùng `OPENAI_API_KEY` hiện có, chỉ phía server. `OPENAI_TTS_ENABLED=false` tắt TTS; `OPENAI_TTS_MODEL` mặc định `gpt-4o-mini-tts`, `OPENAI_TTS_VOICE` mặc định `coral`. Tham chiếu SDK đã cài và [hướng dẫn TTS chính thức](https://developers.openai.com/api/docs/guides/text-to-speech), không tạo quy ước key thứ hai.
- `DEMO_AUTH_EMAIL` / `DEMO_AUTH_PASSWORD` mặc định công khai `student@mathcoach.demo` / `Demo@123456`; `DEMO_AUTH_ENABLED=true|false`. Mặc định bật khi NODE_ENV khác production; production phải bật rõ ràng. Vite production preview không tự đặt NODE_ENV cho backend.
- `/api/demo-auth/session` GET; `/login`, `/logout` POST dưới `/api/demo-auth`; `/api/voice/speech` POST yêu cầu cookie demo. `/canvas` có guard; `/`, `/coach` vẫn công khai. Reasoning API không lưu phiên học/tài nguyên riêng theo tài khoản; guard trình duyệt không bảo vệ backend dữ liệu.
- Cookie HttpOnly, SameSite=Lax, Max-Age 8 giờ; token/expiry trong Map, restart server mất phiên. Secure chỉ khi socket thật có TLS; server HTTP cục bộ không có Secure, chưa cấu hình reverse-proxy/TLS cho triển khai. Không production auth, database, đăng ký hay khôi phục mật khẩu.
- Refresh giữ đăng nhập trong hạn nhưng mất suy luận nằm trong bộ nhớ. Logout xóa Canvas/Voice ngay, chặn kết quả async cũ; nếu request logout mạng thất bại, marker tab chặn tự nhận lại cookie. Cookie máy chủ có thể còn đến expiry: không coi đây là thu hồi an toàn đa thiết bị.
- **Offline:** người dùng phải chọn “Demo ngoại tuyến”; không tự chuyển auth sau lỗi mạng. Chỉ public credentials, lưu email/mode/hạn dùng trong sessionStorage, không password. Đây là chặn điều hướng, không bảo mật. Voice đi thẳng SpeechSynthesis, không gọi TTS trả phí. Nếu không có giọng Việt: trạng thái rõ ràng, phụ đề giữ nguyên; không dùng giọng EN/ZH.
- Server TTS lỗi/không cấu hình → browser VI; tốc độ browser đầy đủ từ đoạn tiếp theo. UI công bố giọng tổng hợp. Provider chỉ nhận đoạn template đã guard, không token/tên/session. Lọc email/phone chỉ là lớp bổ sung, không chứng nhận loại bỏ mọi PII.

### 15.4 Kiểm thử và bằng chứng thực tế

Node 22.23, Chrome headless + SwiftShader. Baseline tự chạy trước sửa: 113/113 unit, typecheck/build đạt. Kết quả cuối:

| Kiểm tra | Kết quả |
|---|---|
| `npm test` | **123/123 đạt**, gồm 10 test mới Voice/auth/HTTP |
| `npx --no-install tsc -b` | Đạt |
| `npm run build` | Đạt; cảnh báo chunk >500 kB có sẵn |
| `npm run lint` | Chưa chạy được: `eslint: not found`; không báo pass |
| Canvas dev | **23/23 đạt**, Ca A/B/C/REG-01, graph, Debug, keyboard, Voice/auth |
| Canvas preview | **22/22 đạt**, không Debug, cùng các hành trình chính |
| Canvas offline | **21/21 đạt**, offline auth chọn rõ và deterministic coaching |
| Legacy `/coach` | **11/11 đạt**, S1–S6, không lỗi trang |
| Graph localization | 147 nút × 5 tab + 11 nhóm 3D, search và VI/EN/ZH đạt; chạy trực tiếp exit 0 |

Canvas đều không lỗi trang; không yếu hóa tiêu chí v0.5. Unit/HTTP kiểm guard D0–D4, IDs/revision, immutability, F8 refusal, approved text, control/no overlap/late callbacks, VI selection/missing voice, login sai/đúng/cookie/origin/expiry/lỗi provider an toàn. Browser kiểm subtitles đúng template, WAV mock qua HTMLAudio có thao tác người dùng, pause/resume/replay/rate/stop, edge/node cue, provider 503 → SpeechSynthesis giả, native không có VI → không khả dụng, sửa/chọn/F8 hủy, login double-submit 1 request, storage không password, redirect/return/refresh/logout, keyboard/focus.

Ảnh đã xem: `/tmp/xg-takeover-shots/{voice-controls,voice-controls-mobile,demo-login-mobile}.png`. Voice sticky và đăng nhập tại 390×844 không tràn ngang, controls nằm trong viewport. Browser cuối cùng cũng khẳng định cue công thức và phần tử hình trụ thực trong cả dev, preview và offline. Chrome headless có **0 giọng VI bản địa**; SpeechSynthesis có giọng VI dùng fake trong kiểm thử, native unsupported path được kiểm thật. Không phát âm thật/OpenAI, không paid API calls; không tuyên bố chất lượng giọng đã đạt.

Lần `npm run test:e2e:graph` đầu hoàn tất mọi assertion nhưng trả mã 143; đã chạy lại trực tiếp `E2E_BASE_URL=http://127.0.0.1:4292 node scripts/e2e-graph-localization.mjs`, toàn bộ assertion đạt và exit **0**. Log riêng `/tmp/voice-localization-direct.log`, mã thoát `/tmp/voice-localization-exit.txt`. Đã dừng đúng mock backend 8897 và dev/preview 4291–4293 của lượt này; không dừng tiến trình người dùng.

Log: `/tmp/voice-{tests,typecheck,build,lint,dev-e2e,prod-e2e,offline-e2e,coach-e2e,localization-e2e}.log`; mobile bổ sung `/tmp/voice-mobile-dev-e2e.log`. Scan dist JS: **0 file** chứa `OPENAI_API_KEY`, `api.openai.com`, `DEMO_AUTH_PASSWORD`; public offline credentials cố ý có ở client. Đây là kiểm marker cấu hình, không đọc khóa thật và không audit bí mật toàn diện.

### 15.5 Ma trận yêu cầu mới

| ID | Bằng chứng | Giới hạn |
|---|---|---|
| FR-VOICE-001 | Unit A/B/C: plan version/revision/ID/immutability | Không chuyên gia |
| FR-VOICE-002 | Unit D0–D4, HTTP và browser D0/F8 | Không thêm đọc hỗ trợ F8 |
| FR-VOICE-003 | HTTP injected provider/mock/lỗi; browser VI fake + native unavailable | OpenAI adapter typechecked, không live call |
| FR-VOICE-004 | Unit controller; browser play/pause/resume/replay/stop/rate/subtitle/phím/mobile | Giọng thật/screen reader chưa thử |
| FR-VOICE-005 | Unit nguồn ID; browser node/edge/formula/cylinder element | Chỉ cấp đoạn; chưa nghiệm thu cảm nhận audio-visual trên thiết bị thật |
| FR-VOICE-006 | Unit stale loading/callback; subscription + browser edit/selection/F8/logout; unmount cleanup | Không thử mọi tình huống thiết bị/OS |
| FR-DEMO-AUTH-001 | Unit input; HTTP credentials; browser invalid/double-submit/showhide/phím | Chỉ demo |
| FR-DEMO-AUTH-002 | HTTP cookie/expiry8h/origin/lỗi, kiểm storage/bundle | HTTP local, không Secure/TLS deployment |
| FR-DEMO-AUTH-003 | Browser redirect/return/refresh/logout; guard timer/focus + HTTP expiry | Timer expiry UI không đợi thực 8 giờ trong E2E |
| FR-DEMO-AUTH-004 | Unit offline + browser offline thật không backend/refresh | SessionStorage navigation gating, không auth sản phẩm |

### 15.6 Lệnh chạy và tiếp tục

```bash
cd /home/hoangvuongbui/Innovillage/AI_Math_Coach
npm run dev
# Mở /canvas → /login; tài khoản demo như trên. Chọn offline rõ ràng nếu không backend.
npm test
npx --no-install tsc -b
npm run build
npm run lint # hiện thiếu eslint

# Kiểm thử không trả phí, mỗi server ở terminal riêng:
COACH_SERVER_PORT=8897 node scripts/mock-coach-server.ts
COACH_SERVER_PORT=8897 npm run dev:web -- --host 127.0.0.1 --port 4292 --strictPort
COACH_SERVER_PORT=8897 npm run preview -- --host 127.0.0.1 --port 4291 --strictPort
COACH_SERVER_PORT=8898 npm run preview -- --host 127.0.0.1 --port 4293 --strictPort
E2E_BASE_URL=http://127.0.0.1:4292 E2E_COACH_MODE=ai E2E_BUILD_MODE=dev E2E_CDP_PORT=9335 npm run test:e2e:canvas
E2E_BASE_URL=http://127.0.0.1:4291 E2E_COACH_MODE=ai E2E_CDP_PORT=9336 npm run test:e2e:canvas
E2E_BASE_URL=http://127.0.0.1:4293 E2E_CDP_PORT=9337 npm run test:e2e:canvas
E2E_BASE_URL=http://127.0.0.1:4291 E2E_COACH_MODE=ai npm run test:e2e
E2E_BASE_URL=http://127.0.0.1:4292 npm run test:e2e:graph
```

Các mock chỉ để kiểm thử; không chạy `server/index.ts` nếu muốn đảm bảo không gọi provider. Production backend thật với NODE_ENV=production cần `DEMO_AUTH_ENABLED=true` để demo server hoạt động; không có server thì chọn offline. Không sửa `.env` hoặc tạo key client.

**Tiếp tục:** phần kỹ thuật Voice/demo auth đã tích hợp và kiểm thử trong môi trường trên. Các việc chưa nghiệm thu: phát âm tiếng Việt/công thức với provider thật sau khi có quyền gọi trả phí; thiết bị thật/browser voice availability; screen reader; chuyên gia sư phạm; đồng ý/retention dữ liệu trẻ; TLS/proxy và xác thực sản phẩm nếu có yêu cầu mới. Khôi phục lint chỉ khi được duyệt bổ sung tooling phù hợp. Không dựng lại engine hoặc bỏ guard để test; giữ mock và assertions, cập nhật đặc tả/ma trận khi thay đổi hợp đồng.

## 16. Bàn giao giao diện learner ẩn graph v0.7 — 27/09/2026

### 16.1 Quyết định và phạm vi thực tế

`/canvas` thông thường không render Reasoning Graph trong reasoning, independent hoặc summary; không tab “Bản đồ suy luận”, modes, graph navigation, zoom hay debug controls. Graph vẫn chạy nội bộ qua nguyên `runTurn`, reducer, dependency/revision/history, Validator, Explanation Builder, Visual Planner và các hợp đồng GraphParams/ViewModel/VisualSpec. `reasoning_graph` vẫn trong store.specs, dùng để lấy giải thích đã guard tại dòng. Không thay toán, F1–F8, D0–D4, API, auth/Tutor hoặc router.

Sau xác nhận đề, 3D mặc định khi có spec; chart chọn được khi có, bảng/công thức giữ nguyên. Một primary không hiện tab dư. Thiếu kích thước số: chart nếu có, nếu không trạng thái chữ; không dựng hình tùy ý hoặc lộ đáp án. WebGL fallback cũ giữ nguyên. Canvas có vùng cao 380/520 px, cột giữa rộng hơn; grid/min-width và header mobile đã sửa để không cắt cả vùng 3D. Nhãn 3D dày vẫn có danh sách đầy đủ/camera zoom để đọc, không tuyên bố đã tối ưu mọi góc nhìn/thiết bị.

Từng dòng hiển thị trạng thái + explanationShort/prompt từ view model hiện tại; chọn số bước hoặc “Giải thích” mở chín mục nội dòng, “Dựa trên”/“Ảnh hưởng tới” dẫn focus tới bước nguồn, Esc đóng và trả focus. Row source/3D/table/chart chọn hai chiều. Trong lúc sửa/revalidate: ẩn giải thích/lý do cũ của dòng stale và Nghe; sau kết quả, ID/version cập nhật và nguyên văn downstream giữ nguyên. aria-live chuyển sang RowsPanel.

Nghe tại dòng/chi tiết dùng pipeline v0.6, không TTS mới. Listen chọn dòng trước khi tạo plan để công thức/hình đồng bộ; cue node tô dòng, cue cạnh tô mục phụ thuộc nguồn thật, cue hình/công thức tiếp tục dùng ID planner. Control/subtitle/fallback/cancellation giữ nguyên. F8 không graph, lời giải, trạng thái chấm, hint, Coach/hình/Voice trước nộp. Summary giữ buildSummary(ctx.graph, independent) và dòng độc lập đã nộp, không graph renderer.

**Inspector:** chỉ Vite dev và URL chủ động `/canvas?inspect=graph`, sau auth; không có nút mở ở learner. Dùng ExplainableGraph/GraphMap/List/Presenter/Debug cũ và guard hiện tại, chỉ mount ở reasoning. Production bỏ qua query; F8/summary không mount kể cả đã bật debug trước đó. Không thêm bypass disclosure hoặc một engine thứ hai.

### 16.2 Tệp nguồn thay đổi

| Tệp | Thay đổi |
|---|---|
| `src/lib/canvas/presentation.ts` (mới) | Helper thuần chọn primary 3D/chart/text, lấy node/edge views khớp version/revision; không tính toán toán học. |
| `src/lib/canvas/presentation.test.ts` (mới) | Ba test: fallback/presentation; graph A/B/C/REG và ambiguity/F5/revision/history; không mount graph trong learner/F8/summary, opt-in dev. |
| `src/components/canvas/VisualStage.tsx` | Bỏ graph tab/render, giữ specs nội bộ và unsupported notice, 3D primary, chart/table/formula, fallback và không tab dư. |
| `src/components/canvas/RowsPanel.tsx` | Giải thích ngắn, inline detail, Voice, aria-live, revision/version ID, stale suppression, nguồn/focus và điểm nhấn Voice. |
| `src/components/canvas/graph/DetailPanel.tsx` | Tái dùng cùng guard với `presentation='row'`; chi tiết inline, nguồn tập trung row, không graph links/technical trace, lọc linked graph elements; cue trên dependency text. Default graph mode vẫn cho inspector. |
| `src/components/voice/VoiceControls.tsx` | Listen chọn source row trước khi phát; controller/provider không đổi. |
| `src/components/canvas/CylinderScene.tsx` | Chỉ className kích thước viewport; geometry/camera/scale/calculation không đổi. |
| `src/pages/ReasoningCanvasPage.tsx` | Primary lớn hơn, mobile min-width/grid/header, inspector chỉ dev opt-in và reasoning. |
| `src/components/canvas/EndStages.tsx` | Bỏ graph render ở F8/summary, giữ đánh giá/evidence; trạng thái dòng đã nộp dùng nhãn Việt. |
| `src/stores/reasoningSessionStore.ts` | visualTab mặc định/reset lúc confirm là 3D; giữ graph mode/view/selection cho inspector, không thay turn/orchestration. |
| `scripts/e2e-canvas.mjs` | Learner assertions tại rows/details/visuals; graph-specific presentation tests giữ trong inspector dev; phím source-row/focus; no graph, defaults/fallback/F8/summary, viewport và WebGL resize thật. |
| `docs/PRODUCT_SPEC.md` | v0.7, §23 quyết định/FR-UI-001…005/supersession; cập nhật 10–11, 13.10, 14.5, 16.1, 22, nhật ký; giữ IDs/math/contracts cũ. |
| `AGENT.md` | Cập nhật sau implementation/verification; §16 là hiện trạng, §14–15 là bằng chứng lịch sử. |

Checksum baseline `/tmp/canvas-hidden-baseline.sha256`: **0 tệp cũ trong src/lib/reasoning hoặc server thay đổi**; README và mã auth không thay. Không đọc/in/sửa `.env`, không dependencies mới, không commit/push, không reset/revert công việc người dùng. Phần lớn repository vẫn untracked từ trước; git diff không đủ để audit thay đổi. Chỉ dừng tiến trình do lượt này khởi động.

### 16.3 Kết quả kiểm thử quan sát được

Node 22.23, Chrome headless + SwiftShader, backend mock; không API trả phí.

| Kiểm tra | Kết quả thực tế |
|---|---|
| `npm test` | 126/126 đạt (123 đã có + 3 test presentation mới; F5/ambiguity, graph/property/math, auth/Voice/HTTP giữ xanh). |
| `npx --no-install tsc -b` | Đạt |
| `npm run build` | Đạt; cảnh báo chunk >500 kB đã có |
| `npm run lint` | Bị chặn: `eslint: not found`; không coi là pass |
| Canvas dev | 27/27 đạt, gồm inspector opt-in + learner và F8/summary isolation |
| Canvas production preview | 21/21 đạt, có query inspector nhưng không render |
| Canvas offline | 20/20 đạt; auth offline chọn rõ, deterministic engine và Voice fallback |
| Legacy `/coach` | 11/11 đạt, S1–S6; không lỗi trang |
| Homepage localization | Chưa đạt một lượt chạy sạch: lượt đầu kiểm xong 147 nút × 5 tab, 11 nhóm/search/locale nhưng thoát 143; lượt chạy lại exit 1, timeout ở `abstract-harmonic basics` sau mốc 75/147. Không đổi nguồn trang chủ, không coi là pass. |

Canvas đều không lỗi trang. Ca A/B/C/REG, status/units/unknown guard, upstream revision/downstream revalidation/immutable learner text, IDs/history, đúng/sai/tạm thời, rule D0–D2 và unit D0–D4 vẫn kiểm; không hạ assertion toán/safety để giữ graph presentation. Test graph-specific modes/labels/zoom/versions/edge status vẫn chạy ở inspector dev. Giao diện keyboard learner đổi đúng sang dòng/nguồn/chi tiết/visual; arrow navigation/96px graph-card criteria chỉ còn thuộc inspector, không dùng để đánh giá learner rows. Deep canonical context + zero API vẫn được kiểm khi đổi modes.

Mobile 390×844: 40 dòng, chi tiết inline, header, tab Hình, comparison table và viewport 3D/Canvas thực được kiểm; không chỉ dựa vào scrollWidth của trang (parent overflow có thể che lỗi). Test đợi Canvas resize và hai animation frames trước ảnh, không sửa geometry/camera để khớp snapshot. Đã xem ảnh cuối ở `/tmp/hidden-canvas-shots/{learner-explanations,learner-rows-mobile,learner-3d-mobile,voice-controls-mobile}.png`; hai hình trụ nằm trong viewport mobile sau resize. Keyboard toàn hành trình, focus-visible/ring contrast ≥3:1, dependency source → focus row, Esc restore và Voice/login bằng phím đạt.

Voice vẫn chỉ đồng bộ cấp đoạn. Test TTS bằng WAV mock **im lặng**, SpeechSynthesis giả và native thiếu VI; headless có 0 giọng VI thật. Không chạy OpenAI thật, không xác nhận phát âm hoặc trải nghiệm âm thanh thiết bị thật. Screen reader, thiết bị thật, WCAG toàn diện và chuyên gia sư phạm chưa kiểm/thẩm định. Auth/TLS/privacy các giới hạn §15 vẫn giữ nguyên.

Log: `/tmp/hidden-{tests,typecheck,build,lint,dev-e2e,prod-e2e,offline-e2e,coach-e2e,localization-e2e}.log`; bản địa hóa chạy lại riêng `/tmp/hidden-localization-direct.log` và `/tmp/hidden-localization-direct-exit.txt`. Một lần offline dừng do thư mục ảnh chưa tồn tại, đã tạo và chạy lại toàn bộ; không coi lần dừng đó là pass.

### 16.4 Ma trận yêu cầu hiện hành và tiếp tục

| Yêu cầu | Bằng chứng | Phạm vi |
|---|---|---|
| FR-UI-001 | Unit source guard + browser DOM no graph/modes/tab ở normal/F8/summary; production opt-in ignored | Dev inspector là ngoại lệ chủ động, không UI learner |
| FR-UI-002 | Unit primary fallback; browser default 3D, E-03 symbolic text, chart Ca B, bảng/công thức/camera | Không tạo trực quan ngoài catalog |
| FR-UI-003 | Browser chín mục, status/explanation/IDs, D0/D2 và keyboard/source/Esc; unit guard D0–D4 cũ | SR/thiết bị thật chưa thử |
| FR-UI-004 | Unit + browser Case C: revision 2/history, broken dep, không ID cũ, stale premise và 3D/table update; all valid sau sửa | Không tự viết lại downstream |
| FR-UI-005 | Browser row↔3D/table, chart, Voice subtitle/node/dependency/formula/3D cues, cancellation/F8/logout, dev modes invariant | TTS mock, chưa audio thật |
| FR-XG/FR-XE, XG-AC-01…08/13…15 | Engine/tests cũ giữ; learner nhận view model tại rows, source dependencies tại details | Hợp đồng không bị thay thế |
| FR-XM, FR-XN, XG-AC-09…12 | Presentation scope theo PRODUCT_SPEC §23; graph modes/nav dev-only; learner rows/visual/source-focus thay graph nav | Tiêu chí card-density không áp cho rows |
| F1–F8, D0–D4, Ca A/B/C/REG-01, auth, Voice, Tutor | Unit/HTTP toàn bộ + dev/prod/offline/Coach browser | Engine/server/auth provider không đổi |

```bash
cd /home/hoangvuongbui/Innovillage/AI_Math_Coach
npm run dev # /canvas mặc định không graph; dev inspector: /canvas?inspect=graph
npm test
npx --no-install tsc -b
npm run build
npm run lint # hiện thiếu ESLint
# Mỗi server ở terminal riêng; mock không đọc .env/gọi trả phí:
COACH_SERVER_PORT=8897 node scripts/mock-coach-server.ts
COACH_SERVER_PORT=8897 npm run dev:web -- --host 127.0.0.1 --port 4292 --strictPort
COACH_SERVER_PORT=8897 npm run preview -- --host 127.0.0.1 --port 4291 --strictPort
COACH_SERVER_PORT=8898 npm run preview -- --host 127.0.0.1 --port 4293 --strictPort
E2E_BASE_URL=http://127.0.0.1:4292 E2E_COACH_MODE=ai E2E_BUILD_MODE=dev E2E_CDP_PORT=9335 npm run test:e2e:canvas
E2E_BASE_URL=http://127.0.0.1:4291 E2E_COACH_MODE=ai E2E_CDP_PORT=9336 npm run test:e2e:canvas
E2E_BASE_URL=http://127.0.0.1:4293 E2E_CDP_PORT=9337 npm run test:e2e:canvas
E2E_BASE_URL=http://127.0.0.1:4291 E2E_COACH_MODE=ai npm run test:e2e
E2E_BASE_URL=http://127.0.0.1:4292 node scripts/e2e-graph-localization.mjs
```

Nếu dùng `E2E_SCREENSHOT_DIR`, tạo thư mục trước. Chờ lazy 3D/ResizeObserver thay vì assert ngay sau confirm/chuyển tab; không bỏ assertions hoặc bypass login. Tài khoản/cấu hình v0.6 giữ ở §15.3–15.6. Tiếp tục từ mã hiện tại; không dựng lại engine, không xóa graph contracts/specs để ẩn UI. Việc còn mở: ESLint tooling, SR/thiết bị thật, chuyên gia, TTS thật/quyền dữ liệu trẻ và auth sản phẩm/TLS. Chỉ xử lý khi có yêu cầu/phê duyệt tương ứng, không tự suy diễn đã nghiệm thu.

Các tiến trình mock/dev/preview do lượt v0.7 khởi động đã được dừng sau kiểm tra; không dừng server của người dùng.
