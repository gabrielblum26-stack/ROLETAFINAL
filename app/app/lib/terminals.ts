import { neighborsEU } from "./roulette";

export type TerminalStats = { d: number; T: number; V: number; S: number };

function terminal(n: number){ return Math.abs(n) % 10; }

export function computeTerminals(history: number[]): TerminalStats[] {
  const T = Array.from({length:10}, () => 0);
  for (const n of history) T[terminal(n)]++;

  // Conjunto de vizinhos (V-1/V+1) de todos os números 0..36 que terminam em d
  const neighborSets: Array<Set<number>> = Array.from({length:10}, () => new Set<number>());
  for (let n = 0; n <= 36; n++){
    const d = terminal(n);
    const nb = neighborsEU(n);
    neighborSets[d].add(nb.prev);
    neighborSets[d].add(nb.next);
  }

  const V = Array.from({length:10}, () => 0);
  for (const n of history){
    for (let d = 0; d < 10; d++){
      if (neighborSets[d].has(n)) V[d]++;
    }
  }

  return Array.from({length:10}, (_, d) => ({ d, T: T[d], V: V[d], S: T[d] + V[d] }));
}
