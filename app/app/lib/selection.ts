import { neighborsEU } from "./roulette";

/**
 * 20 camadas de seleção (ciclo):
 * C1 .. C20 -> volta pro C1
 */
export const SEL_ORDER = Array.from({ length: 20 }, (_, i) => `c${i + 1}` as const);

export type SelColor = (typeof SEL_ORDER)[number];

export type SelMode = "neighbors" | "terminalDisguised" | "sumDisguised";

export type SelState = {
  cursor: number; // 0..SEL_ORDER.length-1
  sets: Record<SelColor, Set<number>>;
};

export function initSel(): SelState {
  const sets = {} as Record<SelColor, Set<number>>;
  for (const c of SEL_ORDER) sets[c] = new Set<number>();
  return { cursor: 0, sets };
}

function digitalRoot(n: number): number {
  const a = Math.abs(n);
  if (a === 0) return 0;
  return 1 + ((a - 1) % 9);
}

function disguisedKey(n: number): number {
  // Exceção: 28 conta como disfarçado do 0
  if (n === 28) return 0;
  return digitalRoot(n);
}


const ALL_NUMS = Array.from({ length: 37 }, (_, i) => i);

function setForMode(n: number, mode: SelMode): Set<number> {
  if (mode === "neighbors") {
    const nb = neighborsEU(n);
    return new Set<number>([nb.prev, nb.current, nb.next]);
  }

  if (mode === "terminalDisguised") {
    const t = Math.abs(n) % 10;
    const set = new Set<number>();
    for (const x of ALL_NUMS) {
      if (disguisedKey(x) === t && x !== t) set.add(x);
    }
    // inclui também o número clicado (para ficar marcado)
    set.add(n);
    return set;
  }

  // mode === "sumDisguised"
  const s = disguisedKey(n);
  const set = new Set<number>();
  for (const x of ALL_NUMS) if (disguisedKey(x) === s) set.add(x);
  set.add(n);
  return set;
}

export function applyClick(sel: SelState, n: number, mode: SelMode = "neighbors"): SelState {
  const color = SEL_ORDER[sel.cursor];
  const nextSet = setForMode(n, mode);

  const sets = {} as Record<SelColor, Set<number>>;
  for (const c of SEL_ORDER) sets[c] = new Set(sel.sets[c]);

  // limpa só a cor que está sendo reutilizada
  sets[color].clear();
  nextSet.forEach((x) => sets[color].add(x));

  return { cursor: (sel.cursor + 1) % SEL_ORDER.length, sets };
}

/**
 * Prioridade visual fixa: C20 > ... > C1
 */
export function selClass(sel: SelState, n: number): "" | `selC${number}` {
  for (let i = SEL_ORDER.length - 1; i >= 0; i--) {
    const c = SEL_ORDER[i];
    if (sel.sets[c].has(n)) {
      return `selC${i + 1}` as const;
    }
  }
  return "";
}
