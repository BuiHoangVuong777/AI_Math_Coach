/**
 * Closed expression grammar (§8.3.1) and AST evaluator. Never uses eval/new Function.
 *
 *   expr     = term (("+" | "-") term)*
 *   term     = implicit (("*" | "/") implicit)*
 *   implicit = unary unary*            juxtaposition binds tighter: "80π/20π" = (80π)/(20π)
 *   unary    = "-" unary | power
 *   power    = primary ("^" (2|3))?
 *   primary  = number | "pi" | "π" | symbol | "(" expr ")" | "√" primary
 *   symbol   = r|d|h|A|V with optional index 1|2, or kr|kh|kA|kV
 */
import { ExactError, PI, add, div, exact, fromDecimal, formatExact, mul, neg, pow, sqrt, sub } from './exact.ts';
import type { ExactValue } from './types.ts';

export type Ast =
  | { t: 'num'; v: ExactValue; text: string }
  | { t: 'pi' }
  | { t: 'sym'; s: string }
  | { t: 'add' | 'sub' | 'mul' | 'div'; a: Ast; b: Ast; implicit?: boolean }
  | { t: 'pow'; a: Ast; e: number }
  | { t: 'neg'; a: Ast }
  | { t: 'sqrt'; a: Ast };

export class ExprError extends Error {
  readonly code: 'syntax' | 'unknown_symbol' | 'unsupported';
  constructor(code: ExprError['code'], message: string = code) {
    super(message);
    this.code = code;
  }
}

type Tok = { k: 'num'; text: string } | { k: 'pi' } | { k: 'sym'; s: string } | { k: 'op'; o: string };

const SYMBOL_RE = /^(k[rhAV]|[rdhAV][12]?)/;

function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  const s = src.replace(/\s+/g, '');
  while (i < s.length) {
    const rest = s.slice(i);
    const num = /^\d+(?:\.\d+)?/.exec(rest);
    if (num) {
      out.push({ k: 'num', text: num[0] });
      i += num[0].length;
      continue;
    }
    if (rest.startsWith('pi')) {
      out.push({ k: 'pi' });
      i += 2;
      continue;
    }
    if (rest[0] === 'π') {
      out.push({ k: 'pi' });
      i += 1;
      continue;
    }
    if (rest.startsWith('sqrt')) {
      out.push({ k: 'op', o: '√' });
      i += 4;
      continue;
    }
    const sym = SYMBOL_RE.exec(rest);
    if (sym) {
      out.push({ k: 'sym', s: sym[0] });
      i += sym[0].length;
      continue;
    }
    if ('+-*/^()√'.includes(rest[0])) {
      out.push({ k: 'op', o: rest[0] });
      i += 1;
      continue;
    }
    throw new ExprError('syntax', `unexpected "${rest[0]}"`);
  }
  return out;
}

export function parseExpr(src: string): Ast {
  const toks = tokenize(src);
  if (!toks.length) throw new ExprError('syntax', 'empty');
  let p = 0;
  const peek = () => toks[p];
  const isOp = (o: string) => {
    const t = peek();
    return !!t && t.k === 'op' && t.o === o;
  };
  const startsPrimary = () => {
    const t = peek();
    return !!t && (t.k === 'num' || t.k === 'pi' || t.k === 'sym' || (t.k === 'op' && (t.o === '(' || t.o === '√')));
  };

  function primary(): Ast {
    const t = toks[p++];
    if (!t) throw new ExprError('syntax', 'unexpected end');
    if (t.k === 'num') return { t: 'num', v: fromDecimal(t.text), text: t.text };
    if (t.k === 'pi') return { t: 'pi' };
    if (t.k === 'sym') return { t: 'sym', s: t.s };
    if (t.o === '(') {
      const e = expr();
      if (!isOp(')')) throw new ExprError('syntax', 'missing )');
      p++;
      return e;
    }
    if (t.o === '√') return { t: 'sqrt', a: primary() };
    throw new ExprError('syntax', `unexpected ${t.o}`);
  }
  function power(): Ast {
    const base = primary();
    if (isOp('^')) {
      p++;
      const e = toks[p++];
      if (!e || e.k !== 'num' || !/^[23]$/.test(e.text)) throw new ExprError('unsupported', 'only ^2 and ^3');
      return { t: 'pow', a: base, e: Number(e.text) };
    }
    return base;
  }
  function unary(): Ast {
    if (isOp('-')) {
      p++;
      return { t: 'neg', a: unary() };
    }
    return power();
  }
  function implicit(): Ast {
    let left = unary();
    while (startsPrimary()) left = { t: 'mul', a: left, b: unary(), implicit: true };
    return left;
  }
  function term(): Ast {
    let left = implicit();
    while (isOp('*') || isOp('/')) {
      const o = (toks[p++] as { o: string }).o;
      left = { t: o === '*' ? 'mul' : 'div', a: left, b: implicit() };
    }
    return left;
  }
  function expr(): Ast {
    let left = term();
    while (isOp('+') || isOp('-')) {
      const o = (toks[p++] as { o: string }).o;
      left = { t: o === '+' ? 'add' : 'sub', a: left, b: term() };
    }
    return left;
  }
  const result = expr();
  if (p !== toks.length) throw new ExprError('syntax', 'trailing tokens');
  return result;
}

export type Env = (symbol: string) => ExactValue | undefined;

export function evaluate(ast: Ast, env: Env = () => undefined): ExactValue {
  switch (ast.t) {
    case 'num':
      return ast.v;
    case 'pi':
      return PI;
    case 'sym': {
      const v = env(ast.s);
      if (!v) throw new ExprError('unknown_symbol', ast.s);
      return v;
    }
    case 'add':
      return add(evaluate(ast.a, env), evaluate(ast.b, env));
    case 'sub':
      return sub(evaluate(ast.a, env), evaluate(ast.b, env));
    case 'mul':
      return mul(evaluate(ast.a, env), evaluate(ast.b, env));
    case 'div':
      return div(evaluate(ast.a, env), evaluate(ast.b, env));
    case 'pow':
      return pow(evaluate(ast.a, env), ast.e);
    case 'neg':
      return neg(evaluate(ast.a, env));
    case 'sqrt':
      return sqrt(evaluate(ast.a, env));
  }
}

/** Evaluates a grammar string; throws ExprError/ExactError. */
export function evalExpr(src: string, env?: Env): ExactValue {
  return evaluate(parseExpr(src), env);
}

export function tryEval(src: string, env?: Env): ExactValue | null {
  try {
    return evalExpr(src, env);
  } catch (err) {
    if (err instanceof ExprError || err instanceof ExactError) return null;
    throw err;
  }
}

/** Every numeric literal text in the tree (used by grounding check G1). */
export function numberTexts(ast: Ast): string[] {
  switch (ast.t) {
    case 'num':
      return [ast.text];
    case 'pi':
    case 'sym':
      return [];
    case 'pow':
    case 'neg':
    case 'sqrt':
      return numberTexts(ast.a);
    default:
      return [...numberTexts(ast.a), ...numberTexts(ast.b)];
  }
}

export function symbolsIn(ast: Ast): string[] {
  switch (ast.t) {
    case 'sym':
      return [ast.s];
    case 'num':
    case 'pi':
      return [];
    case 'pow':
    case 'neg':
    case 'sqrt':
      return symbolsIn(ast.a);
    default:
      return [...symbolsIn(ast.a), ...symbolsIn(ast.b)];
  }
}

/**
 * "Substituted values" of an expression: numbers, with an adjacent π folded in
 * ("36π" is one literal 36π). Exponents are not literals. Used to check that a
 * learner substituted the current premise values (§8.5, premise_changed).
 */
export function literalValues(ast: Ast): ExactValue[] {
  if (ast.t === 'num') return [ast.v];
  if (ast.t === 'mul') {
    const pair = [ast.a, ast.b];
    const num = pair.find((x) => x.t === 'num') as { t: 'num'; v: ExactValue } | undefined;
    if (num && pair.some((x) => x.t === 'pi')) return [mul(num.v, PI)];
  }
  switch (ast.t) {
    case 'pi':
    case 'sym':
      return [];
    case 'pow':
    case 'neg':
    case 'sqrt':
      return literalValues(ast.a);
    default:
      return [...literalValues(ast.a), ...literalValues(ast.b)];
  }
}

export function countOps(ast: Ast): number {
  switch (ast.t) {
    case 'num':
    case 'pi':
    case 'sym':
      return 0;
    case 'pow':
    case 'neg':
    case 'sqrt':
      return 1 + countOps(ast.a);
    default:
      return (ast.implicit && (ast.a.t === 'pi' || ast.b.t === 'pi') ? 0 : 1) + countOps(ast.a) + countOps(ast.b);
  }
}

const SUB: Record<string, string> = { '1': '₁', '2': '₂' };
const SYM_DISPLAY: Record<string, string> = { kr: 'r₂/r₁', kh: 'h₂/h₁', kA: 'A₂/A₁', kV: 'V₂/V₁' };

export function displaySymbol(s: string): string {
  if (SYM_DISPLAY[s]) return SYM_DISPLAY[s];
  return s.length === 2 ? s[0] + (SUB[s[1]] ?? s[1]) : s;
}

function prec(ast: Ast): number {
  switch (ast.t) {
    case 'add':
    case 'sub':
      return 1;
    case 'mul':
    case 'div':
      return ast.implicit ? 3 : 2;
    case 'neg':
      return 4;
    case 'pow':
      return 5;
    default:
      return 6;
  }
}

/** Human display ("π·6²", "(144π·10) : (36π·10)"). */
export function toDisplay(ast: Ast): string {
  const wrap = (child: Ast, min: number) => (prec(child) < min ? `(${toDisplay(child)})` : toDisplay(child));
  switch (ast.t) {
    case 'num':
      return ast.text.replace('.', ',');
    case 'pi':
      return 'π';
    case 'sym':
      return displaySymbol(ast.s);
    case 'add':
      return `${wrap(ast.a, 1)} + ${wrap(ast.b, 2)}`;
    case 'sub':
      return `${wrap(ast.a, 1)} − ${wrap(ast.b, 2)}`;
    case 'mul': {
      if (ast.implicit && (ast.b.t === 'pi' || ast.b.t === 'sym') && ast.a.t === 'num') return `${toDisplay(ast.a)}${toDisplay(ast.b)}`;
      return `${wrap(ast.a, 2)}·${wrap(ast.b, 3)}`;
    }
    case 'div':
      if (ast.a.t === 'num' && ast.b.t === 'num') return `${toDisplay(ast.a)}/${toDisplay(ast.b)}`;
      return `${wrap(ast.a, 3)} : ${wrap(ast.b, 3)}`;
    case 'pow':
      return `${wrap(ast.a, 6)}${ast.e === 2 ? '²' : '³'}`;
    case 'neg':
      return `−${wrap(ast.a, 4)}`;
    case 'sqrt':
      return `√${wrap(ast.a, 6)}`;
  }
}

export function displayExpr(src: string): string {
  try {
    return toDisplay(parseExpr(src));
  } catch {
    return src;
  }
}

/** LaTeX for a checked AST (Canvas renders it with KaTeX trust=false). */
export function toLatex(ast: Ast): string {
  const wrap = (child: Ast, min: number) => (prec(child) < min ? `\\left(${toLatex(child)}\\right)` : toLatex(child));
  switch (ast.t) {
    case 'num':
      return ast.text.replace('.', '{,}');
    case 'pi':
      return '\\pi';
    case 'sym':
      return ast.s.length === 2 && /[12]/.test(ast.s[1]) ? `${ast.s[0]}_{${ast.s[1]}}` : ast.s.startsWith('k') ? `\\frac{${ast.s[1]}_2}{${ast.s[1]}_1}` : ast.s;
    case 'add':
      return `${wrap(ast.a, 1)} + ${wrap(ast.b, 2)}`;
    case 'sub':
      return `${wrap(ast.a, 1)} - ${wrap(ast.b, 2)}`;
    case 'mul':
      return ast.implicit ? `${wrap(ast.a, 3)}${wrap(ast.b, 3)}` : `${wrap(ast.a, 2)} \\cdot ${wrap(ast.b, 3)}`;
    case 'div':
      return `\\frac{${toLatex(ast.a)}}{${toLatex(ast.b)}}`;
    case 'pow':
      return `${wrap(ast.a, 6)}^{${ast.e}}`;
    case 'neg':
      return `-${wrap(ast.a, 4)}`;
    case 'sqrt':
      return `\\sqrt{${toLatex(ast.a)}}`;
  }
}

export function exprToLatex(src: string): string | null {
  try {
    return toLatex(parseExpr(src.replace(/^~/, '')));
  } catch {
    return null;
  }
}

export { formatExact };
