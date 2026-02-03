"use client";

import { WHEEL_EU, colorOf } from "../lib/roulette";
import type { SelState } from "../lib/selection";
import { selClass } from "../lib/selection";

type Pt = { x: number; y: number };

function buildTrackPoints(count: number): Pt[] {
  // Racetrack path: top straight -> right arc -> bottom straight -> left arc
  const W = 900;
  const H = 200;
  const padX = 46;
  const padY = 44;

  const r = 60; // raio das curvas (meia-lua)
  const left = padX;
  const right = W - padX;
  const top = padY;
  const bottom = H - padY;

  const straightLen = (right - left) - 2 * r;
  const arcLen = Math.PI * r; // meia circunferência
  const totalLen = 2 * straightLen + 2 * arcLen;
  const step = totalLen / count;

  const midY = (top + bottom) / 2;

  function pointAt(s: number): Pt {
    // 1) topo (esq->dir)
    if (s <= straightLen) return { x: left + r + s, y: top };
    s -= straightLen;

    // 2) curva direita (topo->baixo)
    if (s <= arcLen) {
      const t = s / arcLen;
      const ang = (-Math.PI / 2) + t * Math.PI;
      return { x: right - r + r * Math.cos(ang), y: midY + r * Math.sin(ang) };
    }
    s -= arcLen;

    // 3) baixo (dir->esq)
    if (s <= straightLen) return { x: right - r - s, y: bottom };
    s -= straightLen;

    // 4) curva esquerda (baixo->topo)
    const t = s / arcLen;
    const ang = (Math.PI / 2) + t * Math.PI;
    return { x: left + r + r * Math.cos(ang), y: midY + r * Math.sin(ang) };
  }

  const pts: Pt[] = [];
  for (let i = 0; i < count; i++) pts.push(pointAt(i * step));
  return pts;
}

function selectionFill(scls: string) {
  // classes: selC1..selC20
  if (scls && scls.startsWith("selC")) {
    const num = scls.slice(4); // after 'selC'
    return `var(--selC${num})`;
  }
  return null;
}

function needsDarkText(scls: string) {
  // fundos claros onde o texto branco perde contraste
  return (
    scls === "selC2" ||
    scls === "selC7" ||
    scls === "selC8" ||
    scls === "selC10" ||
    scls === "selC11" ||
    scls === "selC13" ||
    scls === "selC14" ||
    scls === "selC15" ||
    scls === "selC17" ||
    scls === "selC19" ||
    scls === "selC20"
  );
}

export default function RaceTrack({
  sel,
  onPick,
}: {
  sel: SelState;
  onPick: (n: number) => void;
}) {
  const pts = buildTrackPoints(WHEEL_EU.length);

  const viewW = 900;
  const viewH = 200;
  const chipR = 14;

  return (
    <div className="raceBox" aria-label="Race (clique para selecionar)">
      <svg viewBox={`0 0 ${viewW} ${viewH}`} width="100%" height="100%">
        <defs>
          <filter id="raceShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.25" />
          </filter>
        </defs>

        {WHEEL_EU.map((n, i) => {
          const p = pts[i];
          const base = colorOf(n);
          const scls = selClass(sel, n);
          const override = selectionFill(scls);
          const fill = override ?? `var(--${base})`;
          const textFill = needsDarkText(scls) ? "#111" : "#fff";

          return (
            <g key={n} onClick={() => onPick(n)} style={{ cursor: "pointer" }} filter="url(#raceShadow)">
              <rect
                x={p.x - 21}
                y={p.y - 18}
                width="42"
                height="36"
                rx="10"
                fill="rgba(255,255,255,.12)"
                stroke="rgba(0,0,0,.10)"
              />
              <circle cx={p.x} cy={p.y} r={chipR} fill={fill} stroke="rgba(255,255,255,.35)" strokeWidth="2" />
              <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize="12" fontWeight="900" fill={textFill}>
                {n}
              </text>
              <title>Selecionar {n} e vizinhos</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
