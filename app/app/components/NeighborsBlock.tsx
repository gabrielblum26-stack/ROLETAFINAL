"use client";

import { neighborsEU, colorOf } from "../lib/roulette";
import { selClass, type SelState } from "../lib/selection";

function calc(n: number) {
  // mantém sempre o valor (mesmo fora de 0-36) conforme sua regra
  return n;
}

type BaseTone = "red" | "black" | "green" | "neutral" | "empty";

function Cell({
  n,
  tone,
  sel,
  onPick,
  applySelection,
  emptyDash = "-",
}: {
  n: number | null;
  tone: BaseTone;
  sel: SelState;
  onPick: (n: number) => void;
  applySelection: boolean;
  emptyDash?: string;
}) {
  if (n === null) {
    return <div className="abcCell abcEmpty">{emptyDash}</div>;
  }

  const scls = applySelection ? selClass(sel, n) : "";
  const cls = `abcCell ${tone} ${scls}`.trim();

  return (
    <div className={cls} onClick={() => onPick(n)} title="Clique para selecionar (não registra)">
      {n}
    </div>
  );
}

function Group3({
  a,
  b,
  c,
  tones,
  sel,
  onPick,
  selMask,
}: {
  a: number | null;
  b: number | null;
  c: number | null;
  tones: [BaseTone, BaseTone, BaseTone];
  sel: SelState;
  onPick: (n: number) => void;
  selMask: [boolean, boolean, boolean];
}) {
  return (
    <div className="abcGroup">
      <Cell n={a} tone={tones[0]} sel={sel} onPick={onPick} applySelection={selMask[0]} />
      <Cell n={b} tone={tones[1]} sel={sel} onPick={onPick} applySelection={selMask[1]} />
      <Cell n={c} tone={tones[2]} sel={sel} onPick={onPick} applySelection={selMask[2]} />
    </div>
  );
}

export default function NeighborsBlock({
  last,
  sel,
  onPick,
}: {
  last: number[];
  sel: SelState;
  onPick: (n: number) => void;
}) {
  const rows = last.slice(0, 10);

  return (
    <div className="panel middle" aria-label="Vizinhos dos 10 últimos números inseridos">
      <div className="sectionTitle">Vizinhos (10)</div>

      <div className="neiListABC">
        {Array.from({ length: 10 }).map((_, idx) => {
          const atual = rows[idx];

          if (atual === undefined) {
            return (
              <div key={idx} className="neiRowABC">
                <Group3
                  a={null}
                  b={null}
                  c={null}
                  tones={["empty", "empty", "empty"]}
                  sel={sel}
                  onPick={onPick}
                  selMask={[false, false, false]}
                />
                <div className="abcCenterWrap">
                  <Cell n={null} tone="empty" sel={sel} onPick={onPick} applySelection={false} />
                </div>
                <Group3
                  a={null}
                  b={null}
                  c={null}
                  tones={["empty", "empty", "empty"]}
                  sel={sel}
                  onPick={onPick}
                  selMask={[false, false, false]}
                />
              </div>
            );
          }

          const nb = neighborsEU(atual);
          const menor = nb.prev; // V-1
          const maior = nb.next; // V+1

          // a b c (esquerda)
          const a = calc(Math.abs(menor - atual)); // fórmula neutra (diferença sempre positiva)
          const b = menor;                         // ANTERIOR (selecionável)
          const c = calc(menor + atual);           // fórmula neutra

          // d (centro)
          const d = atual;                         // ATUAL (selecionável)

          // e f g (direita)
          const e = calc(Math.abs(maior - atual)); // fórmula neutra (diferença sempre positiva)
          const f = maior;                         // POSTERIOR (selecionável)
          const g = calc(maior + atual);           // fórmula neutra

          const toneMenor = colorOf(menor) as BaseTone;
          const toneAtual = colorOf(atual) as BaseTone;
          const toneMaior = colorOf(maior) as BaseTone;

          return (
            <div key={idx} className="neiRowABC" aria-label={`Linha de vizinhos do número ${atual}`}>
              <Group3
                a={a}
                b={b}
                c={c}
                tones={["neutral", toneMenor, "neutral"]}
                sel={sel}
                onPick={onPick}
                selMask={[false, true, false]} // só o ANTERIOR recebe seleção por cor
              />
              <div className="abcCenterWrap">
                <Cell n={d} tone={toneAtual} sel={sel} onPick={onPick} applySelection={true} />
              </div>
              <Group3
                a={e}
                b={f}
                c={g}
                tones={["neutral", toneMaior, "neutral"]}
                sel={sel}
                onPick={onPick}
                selMask={[false, true, false]} // só o POSTERIOR recebe seleção por cor
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
