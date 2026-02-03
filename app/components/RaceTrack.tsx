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
  if (scls === "selGreen") return "var(--selGreen)";
  if (scls === "selYellow") return "var(--selYellow)";
  if (scls === "selBlue") return "var(--selBlue)";
  return null;
}

export default function RaceTrack({ sel, onPick }: { sel: SelState; onPick: (n: number) => void }) {
  const W = 900;
  const H = 200;
  const chipR = 15;
  const pts = buildTrackPoints(WHEEL_EU.length);

  return (
    <div className="raceBox" aria-label="Race (racetrack real) — seleção">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img">
        <defs>
          <filter id="raceShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="rgba(0,0,0,.22)" />
          </filter>
          <linearGradient id="trackGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="rgba(0,0,0,.14)" />
            <stop offset="1" stopColor="rgba(0,0,0,.08)" />
          </linearGradient>
        </defs>

        {/* Pista: anel (cara de racetrack) */}
        <rect x="16" y="24" width={W - 32} height={H - 48} rx="76" fill="url(#trackGrad)" stroke="rgba(0,0,0,.22)" strokeWidth="2" />
        <rect x="62" y="52" width={W - 124} height={H - 104} rx="56" fill="rgba(240,240,240,.62)" stroke="rgba(0,0,0,.16)" strokeWidth="2" />

        {/* “faixas” (pinta cara de pista) */}
        <rect x="50" y="40" width={W - 100} height="10" rx="5" fill="rgba(255,255,255,.45)" opacity="0.7" />
        <rect x="50" y={H - 50} width={W - 100} height="10" rx="5" fill="rgba(255,255,255,.45)" opacity="0.7" />

        {/* “casinhas” + chips */}
        {WHEEL_EU.map((n, i) => {
          const p = pts[i];
          const base = colorOf(n);
          const scls = selClass(sel, n);
          const override = selectionFill(scls);
          const fill = override ?? `var(--${base})`;
          const textFill = scls === "selYellow" ? "#111" : "#fff";

          return (
            <g key={n} onClick={() => onPick(n)} style={{ cursor: "pointer" }} filter="url(#raceShadow)">
              <rect x={p.x - 21} y={p.y - 18} width="42" height="36" rx="10" fill="rgba(255,255,255,.12)" stroke="rgba(0,0,0,.10)" />
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
