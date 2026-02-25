"use client";

import { colorOf, neighborsEU } from "../lib/roulette";
import { selClass, type SelState } from "../lib/selection";

type Props = {
  history: number[]; // mais recente primeiro
  sel: SelState;
  onPick: (n: number) => void;
  max?: number;
};

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


function Chip({
  value,
  className,
  onClick,
  aria,
}: {
  value: number | string | null;
  className: string;
  onClick?: () => void;
  aria?: string;
}) {
  const empty = value === null || value === "" || value === undefined;
  return (
    <div className={`${className} ${empty ? "nbEmpty" : ""}`.trim()} onClick={onClick} aria-label={aria}>
      {empty ? "—" : value}
    </div>
  );
}

export default function NeighborsBlock({ history, sel, onPick, max = 10 }: Props) {
  const atuais = history.slice(0, max);

  const dis = atuais.map((n) => disguisedKey(n));

  const pairAt = (idx: number) =>
    idx % 2 === 0 && dis[idx] !== undefined && dis[idx + 1] !== undefined ? dis[idx] + dis[idx + 1] : null;

  const tripleAt = (idx: number) =>
    idx % 3 === 0 && dis[idx] !== undefined && dis[idx + 1] !== undefined && dis[idx + 2] !== undefined
      ? dis[idx] + dis[idx + 1] + dis[idx + 2]
      : null;

  const minusAbs = (a: number, b: number) => Math.abs(a - b);

  const Mini = ({
    value,
    tone,
    actualColor,
    selClass,
    clickable,
    neutral,
  }: {
    value: number | null;
    tone: "neutral" | "colored";
    actualColor?: string;
    selClass?: string;
    clickable?: boolean;
    neutral?: boolean;
  }) => {
    const empty = value === null || value === undefined;
    const cls =
      "nbMini " +
      (tone === "colored" ? `nbColored ${actualColor ?? ""} ${selClass ?? ""}` : "nbNeutral") +
      (neutral ? " nbNeutralForce" : "") +
      (empty ? " nbEmpty" : "") +
      (clickable ? " nbClickable" : "");
    return (
      <div
        className={cls}
        onClick={() => {
          if (clickable && value !== null) onPick(value);
        }}
      >
        {empty ? "—" : value}
      </div>
    );
  };

  const ColTitle = ({ children }: { children: string }) => <div className="nbColTitle">{children}</div>;

  return (
    <div className="panel neighborsPanel" aria-label="Vizinhos + disfarçado + agrupamentos">
      <div className="neighborsTitle">ATUAIS (10)</div>

      <div className="nbCols">
        {/* LEFT: atual - 1 (vizinho) */}
        <div className="nbCol">
          <ColTitle>atual - 1 (vizinho)</ColTitle>
          <div className="nbStack">
            {Array.from({ length: max }).map((_, idx) => {
              const d = atuais[idx];
              if (typeof d !== "number") {
                return (
                  <div className="nbTriple" key={idx}>
                    <Mini value={null} tone="neutral" />
                    <Mini value={null} tone="colored" />
                    <Mini value={null} tone="neutral" />
                  </div>
                );
              }
              const v = neighborsEU(d).prev;
              return (
                <div className="nbTriple" key={idx}>
                  <Mini value={minusAbs(v, d)} tone="neutral" neutral />
                  <Mini value={v} tone="colored" actualColor={colorOf(v)} clickable selClass={selClass(sel, v)} />
                  <Mini value={v + d} tone="neutral" neutral />
                </div>
              );
            })}
          </div>
        </div>

        {/* 2x + D */}
        <div className="nbCol nbNarrow">
          <ColTitle>2×</ColTitle>
          <div className="nbStack">
            {Array.from({ length: max }).map((_, idx) => (
              <Mini key={idx} value={pairAt(idx)} tone="neutral" neutral />
            ))}
          </div>
        </div>

        <div className="nbCol nbNarrow">
          <ColTitle>D</ColTitle>
          <div className="nbStack">
            {Array.from({ length: max }).map((_, idx) => {
              const d = atuais[idx];
              return <Mini key={idx} value={typeof d === "number" ? Number(String(disguisedKey(d)).padStart(2, "0")) : null} tone="neutral" neutral />;
            })}
          </div>
        </div>

        {/* ATUAIS */}
        <div className="nbCol nbAtuais">
          <ColTitle>atuais</ColTitle>
          <div className="nbStack">
            {Array.from({ length: max }).map((_, idx) => {
              const d = atuais[idx];
              return (
                <div className="nbSingle" key={idx}>
                  <Mini
                    value={typeof d === "number" ? d : null}
                    tone="colored"
                    actualColor={typeof d === "number" ? colorOf(d) : ""}
                    selClass={typeof d === "number" ? selClass(sel, d) : ""}
                    clickable
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* 3x */}
        <div className="nbCol nbNarrow">
          <ColTitle>3×</ColTitle>
          <div className="nbStack">
            {Array.from({ length: max }).map((_, idx) => (
              <Mini key={idx} value={tripleAt(idx)} tone="neutral" neutral />
            ))}
          </div>
        </div>

        {/* RIGHT: atual + 1 (vizinho) */}
        <div className="nbCol">
          <ColTitle>atual + 1 (vizinho)</ColTitle>
          <div className="nbStack">
            {Array.from({ length: max }).map((_, idx) => {
              const d = atuais[idx];
              if (typeof d !== "number") {
                return (
                  <div className="nbTriple" key={idx}>
                    <Mini value={null} tone="neutral" />
                    <Mini value={null} tone="colored" />
                    <Mini value={null} tone="neutral" />
                  </div>
                );
              }
              const v = neighborsEU(d).next;
              return (
                <div className="nbTriple" key={idx}>
                  <Mini value={minusAbs(v, d)} tone="neutral" neutral />
                  <Mini value={v} tone="colored" actualColor={colorOf(v)} clickable selClass={selClass(sel, v)} />
                  <Mini value={v + d} tone="neutral" neutral />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
