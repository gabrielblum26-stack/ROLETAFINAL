"use client";

import { TABLE_ROWS, colorOf } from "../lib/roulette";
import type { SelState } from "../lib/selection";
import { selClass } from "../lib/selection";

export type RepHighlight =
  | "red"
  | "black"
  | "even"
  | "odd"
  | "low"
  | "high"
  | "dozen1"
  | "dozen2"
  | "dozen3"
  | "col1"
  | "col2"
  | "col3";

export default function TableMap({
  sel,
  rep,
  onPick,
}: {
  sel: SelState;
  rep: Set<RepHighlight>;
  onPick: (n: number) => void;
}) {
  const rowToCol: RepHighlight[] = ["col3", "col2", "col1"];

  const cellCls = (n: number) => {
    const base = `cell ${colorOf(n)}`;
    const s = selClass(sel, n);
    return `${base} ${s}`.trim();
  };

  const betCls = (k: RepHighlight) => `bet ${rep.has(k) ? "rep" : ""}`.trim();

  return (
    <div className="mapBox" aria-label="Mapa completo (clicável para seleção)">
      <div className="table">
        <div className={cellCls(0)} style={{ gridRow: "1 / span 3", gridColumn: "1", fontSize: 18 }} onClick={() => onPick(0)}>
          0
        </div>

        {TABLE_ROWS.map((row, rIdx) => (
          <div key={rIdx} style={{ display: "contents" }}>
            {row.map((n, cIdx) => (
              <div
                key={n}
                className={cellCls(n)}
                style={{ gridRow: String(rIdx + 1), gridColumn: String(2 + cIdx) }}
                onClick={() => onPick(n)}
              >
                {n}
              </div>
            ))}
            <div className={betCls(rowToCol[rIdx])} style={{ gridRow: String(rIdx + 1), gridColumn: "14" }}>
              2:1
            </div>
          </div>
        ))}

        <div className={betCls("dozen1")} style={{ gridRow: "4", gridColumn: "2 / span 4" }}>
          1st 12
        </div>
        <div className={betCls("dozen2")} style={{ gridRow: "4", gridColumn: "6 / span 4" }}>
          2nd 12
        </div>
        <div className={betCls("dozen3")} style={{ gridRow: "4", gridColumn: "10 / span 4" }}>
          3rd 12
        </div>

        <div className={betCls("low")} style={{ gridRow: "5", gridColumn: "2 / span 2" }}>
          1–18
        </div>
        <div className={betCls("even")} style={{ gridRow: "5", gridColumn: "4 / span 2" }}>
          EVEN
        </div>

        <div className={betCls("red")} style={{ gridRow: "5", gridColumn: "6 / span 2" }}>
          ♦ RED
        </div>
        <div className={betCls("black")} style={{ gridRow: "5", gridColumn: "8 / span 2" }}>
          ♦ BLACK
        </div>

        <div className={betCls("odd")} style={{ gridRow: "5", gridColumn: "10 / span 2" }}>
          ODD
        </div>
        <div className={betCls("high")} style={{ gridRow: "5", gridColumn: "12 / span 2" }}>
          19–36
        </div>
      </div>
    </div>
  );
}
