import { classify, Classif } from "./roulette";

export type Streaks = {
  color: { key: "red" | "black" | "none"; count: number };
  parity: { key: "even" | "odd" | "none"; count: number };
  half: { key: "low" | "high" | "none"; count: number };
  column: { key: 1 | 2 | 3 | "none"; count: number };
  dozen: { key: 1 | 2 | 3 | "none"; count: number };
};

function streakBy<T>(vals: (T | null)[]): { key: T | null; count: number } {
  if (vals.length === 0) return { key: null, count: 0 };
  const first = vals[0];
  if (first === null) return { key: null, count: 0 };
  let c = 1;
  for (let i = 1; i < vals.length; i++) {
    if (vals[i] === first) c++;
    else break;
  }
  return { key: first, count: c };
}

export function computeStreaks(history: number[]): Streaks {
  const cls: Classif[] = history.map(classify);

  const colors = cls.map(c => c.color === "zero" ? null : c.color);
  const parity = cls.map(c => c.parity === "zero" ? null : c.parity);
  const half = cls.map(c => c.half === "zero" ? null : c.half);
  const column = cls.map(c => c.column === 0 ? null : c.column);
  const dozen = cls.map(c => c.dozen === 0 ? null : c.dozen);

  const sc = streakBy(colors);
  const sp = streakBy(parity);
  const sh = streakBy(half);
  const scol = streakBy(column);
  const sd = streakBy(dozen);

  return {
    color: { key: (sc.key ?? "none") as any, count: sc.count },
    parity: { key: (sp.key ?? "none") as any, count: sp.count },
    half: { key: (sh.key ?? "none") as any, count: sh.count },
    column: { key: (scol.key ?? "none") as any, count: scol.count },
    dozen: { key: (sd.key ?? "none") as any, count: sd.count },
  };
}
