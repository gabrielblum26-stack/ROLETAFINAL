import { neighborsEU } from "./roulette";

/**
 * 20 camadas de seleção (ciclo):
 * C1 .. C20 -> volta pro C1
 */
export const SEL_ORDER = Array.from({ length: 20 }, (_, i) => `c${i + 1}` as const);

export type SelColor = (typeof SEL_ORDER)[number];

export type SelState = {
  cursor: number; // 0..SEL_ORDER.length-1
  sets: Record<SelColor, Set<number>>;
};

export function initSel(): SelState {
  const sets = {} as Record<SelColor, Set<number>>;
  for (const c of SEL_ORDER) sets[c] = new Set<number>();
  return { cursor: 0, sets };
}

export function applyClick(sel: SelState, n: number): SelState {
  const color = SEL_ORDER[sel.cursor];

  const nb = neighborsEU(n);
  const nextSet = new Set<number>([nb.prev, nb.current, nb.next]);

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
