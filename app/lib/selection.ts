import { neighborsEU } from "./roulette";

/**
 * 15 cores primárias de seleção
 */
export const SEL_ORDER = Array.from({ length: 15 }, (_, i) => `c${i + 1}` as const);

export type SelColor = (typeof SEL_ORDER)[number];

export type SelMode = "neighbors" | "unique" | "terminalDisguised" | "sumDisguised" | "newMarking" | "zoneMarking";

export type SelState = {
  activeColorIndex: number; // Índice da cor selecionada manualmente (0..14)
  sets: Record<SelColor, Set<number>>;
  strategyColors?: Record<string, string>; // Mapeamento de nome de estratégia para cor hexadecimal
};

export function initSel(): SelState {
  const sets = {} as Record<SelColor, Set<number>>;
  for (const c of SEL_ORDER) sets[c] = new Set<number>();
  return { activeColorIndex: 0, sets };
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

// Mapeamento da "Nova marcação" baseado no terminal do número clicado
const NEW_MARKING_MAP: Record<number, number[]> = {
  0: [0, 10, 20, 30, 19, 28],
  1: [1, 11, 21, 31, 10, 19],
  2: [2, 12, 22, 32, 11, 29, 20],
  3: [3, 13, 23, 33, 12, 21, 30],
  4: [4, 14, 24, 34, 13, 31, 22],
  5: [5, 15, 25, 35, 14, 23, 32],
  6: [6, 16, 26, 36, 33, 15, 24],
  7: [7, 17, 27, 34, 25, 16],
  8: [8, 18, 28, 26, 17, 35],
  9: [9, 19, 29, 18, 36, 27],
};

// Definição das zonas clássicas da roleta
const ZONES = {
  ZERO_GAME: [12, 35, 3, 26, 0, 32, 15],
  VOISINS: [22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25],
  TIERS: [27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33],
  ORPHELINS: [1, 20, 14, 31, 9, 17, 34, 6]
};

function setForMode(n: number, mode: SelMode): Set<number> {
  if (mode === "neighbors") {
    const nb = neighborsEU(n);
    return new Set<number>([nb.prev, nb.current, nb.next]);
  }

  if (mode === "unique") {
    return new Set<number>([n]);
  }

  if (mode === "terminalDisguised") {
    const t = Math.abs(n) % 10;
    const set = new Set<number>();
    for (const x of ALL_NUMS) {
      if (disguisedKey(x) === t && x !== t) set.add(x);
    }
    set.add(n);
    return set;
  }

  if (mode === "sumDisguised") {
    const s = disguisedKey(n);
    const set = new Set<number>();
    for (const x of ALL_NUMS) if (disguisedKey(x) === s) set.add(x);
    set.add(n);
    return set;
  }

  if (mode === "newMarking") {
    const t = Math.abs(n) % 10;
    const nums = NEW_MARKING_MAP[t] || [n];
    return new Set<number>(nums);
  }

  if (mode === "zoneMarking") {
    // Prioridade: Zero Game primeiro (pois está contido em Voisins)
    if (ZONES.ZERO_GAME.includes(n)) return new Set<number>(ZONES.ZERO_GAME);
    if (ZONES.VOISINS.includes(n)) return new Set<number>(ZONES.VOISINS);
    if (ZONES.TIERS.includes(n)) return new Set<number>(ZONES.TIERS);
    if (ZONES.ORPHELINS.includes(n)) return new Set<number>(ZONES.ORPHELINS);
  }

  return new Set<number>([n]);
}

/**
 * Aplica o clique usando a cor ATIVA.
 * markingMode: "unique" limpa a cor antes de marcar, "cumulative" acumula as marcações
 */
export function applyClick(sel: SelState, n: number, mode: SelMode = "neighbors", markingMode: "unique" | "cumulative" = "cumulative"): SelState {
  const color = SEL_ORDER[sel.activeColorIndex];
  const nextSet = setForMode(n, mode);

  const sets = {} as Record<SelColor, Set<number>>;
  for (const c of SEL_ORDER) sets[c] = new Set(sel.sets[c]);

  if (markingMode === "unique") {
    sets[color].clear();
    nextSet.forEach(x => sets[color].add(x));
  } else {
    const isAlreadyInThisColor = sets[color].has(n);
    
    if (isAlreadyInThisColor) {
      nextSet.forEach(x => sets[color].delete(x));
    } else {
      nextSet.forEach(x => sets[color].add(x));
    }
  }

  return { ...sel, sets };
}

/**
 * Marca múltiplos números com a cor ativa (para estratégias)
 */
export function markMultiple(sel: SelState, nums: number[], markingMode: "unique" | "cumulative" = "cumulative"): SelState {
  const color = SEL_ORDER[sel.activeColorIndex];
  const sets = {} as Record<SelColor, Set<number>>;
  for (const c of SEL_ORDER) sets[c] = new Set(sel.sets[c]);

  if (markingMode === "unique") {
    // No modo único, se os números já forem exatamente os mesmos, limpa.
    // Caso contrário, limpa e marca os novos.
    const currentSet = sets[color];
    const isSame = nums.length === currentSet.size && nums.every(n => currentSet.has(n));
    
    currentSet.clear();
    if (!isSame) {
      nums.forEach(n => currentSet.add(n));
    }
  } else {
    // No modo acumulado, se o primeiro número da lista já estiver marcado,
    // assumimos que queremos desmarcar a estratégia toda.
    const hasFirst = nums.length > 0 && sets[color].has(nums[0]);
    if (hasFirst) {
      nums.forEach(n => sets[color].delete(n));
    } else {
      nums.forEach(n => sets[color].add(n));
    }
  }

  return { ...sel, sets };
}

/**
 * Muda a cor ativa manualmente
 */
export function setActiveColor(sel: SelState, index: number): SelState {
  if (index < 0 || index >= SEL_ORDER.length) return sel;
  return { ...sel, activeColorIndex: index };
}

/**
 * Retorna todas as cores associadas a um número.
 * Útil para exibir múltiplas cores (gradientes/bordas).
 */
export function getNumberColors(sel: SelState, n: number): string[] {
  const colors: string[] = [];
  for (let i = 0; i < SEL_ORDER.length; i++) {
    const c = SEL_ORDER[i];
    if (sel.sets[c].has(n)) {
      colors.push(`var(--selC${i + 1})`);
    }
  }
  return colors;
}

/**
 * Mantido para compatibilidade onde apenas uma classe é necessária.
 * Prioridade visual fixa: C15 > ... > C1
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
