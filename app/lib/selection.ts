import { neighborsEU } from "./roulette";

export type SelColor = "blue" | "yellow" | "green";

export type SelState = {
  cursor: number; // 0..2
  sets: Record<SelColor, Set<number>>;
};

export function initSel(): SelState {
  return {
    cursor: 0,
    sets: {
      blue: new Set<number>(),
      yellow: new Set<number>(),
      green: new Set<number>(),
    },
  };
}

export function applyClick(sel: SelState, n: number): SelState {
  const order: SelColor[] = ["blue", "yellow", "green"];
  const color = order[sel.cursor];

  const nb = neighborsEU(n);
  const nextSet = new Set<number>([nb.prev, nb.current, nb.next]);

  const sets = {
    blue: new Set(sel.sets.blue),
    yellow: new Set(sel.sets.yellow),
    green: new Set(sel.sets.green),
  };

  // limpa só a cor que está sendo reutilizada
  sets[color].clear();
  nextSet.forEach(x => sets[color].add(x));

  return { cursor: (sel.cursor + 1) % 3, sets };
}

// prioridade visual: verde > amarelo > azul
export function selClass(sel: SelState, n: number): "" | "selBlue" | "selYellow" | "selGreen" {
  if (sel.sets.green.has(n)) return "selGreen";
  if (sel.sets.yellow.has(n)) return "selYellow";
  if (sel.sets.blue.has(n)) return "selBlue";
  return "";
}
