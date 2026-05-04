"use client";

import React from "react";
import { WHEEL_EU, colorOf } from "../lib/roulette";
import type { SelState } from "../lib/selection";
import { getNumberColors } from "../lib/selection";

type Pt = { x: number; y: number; angle: number; n: number };

function buildTrackPoints(): Pt[] {
  const W = 900;
  const H = 240;
  const r = 90; 
  const paddingX = 80;
  const straightLen = W - 2 * paddingX - 2 * r;
  
  const leftX = paddingX + r;
  const rightX = W - paddingX - r;
  const topY = (H / 2) - r;
  const bottomY = (H / 2) + r;
  const midY = H / 2;

  const arcLen = Math.PI * r;
  const totalLen = 2 * straightLen + 2 * arcLen;
  const step = totalLen / WHEEL_EU.length;

  const offset = (arcLen / 2) + step;

  function pointAt(index: number): Pt {
    let s = (offset + (index * step)) % totalLen;
    const n = WHEEL_EU[index];

    if (s <= arcLen) {
      const t = s / arcLen;
      const ang = (-Math.PI / 2) + t * Math.PI;
      return { x: rightX + r * Math.cos(ang), y: midY + r * Math.sin(ang), angle: ang, n };
    }
    s -= arcLen;

    if (s <= straightLen) {
      return { x: rightX - s, y: bottomY, angle: Math.PI / 2, n };
    }
    s -= straightLen;

    if (s <= arcLen) {
      const t = s / arcLen;
      const ang = (Math.PI / 2) + t * Math.PI;
      return { x: leftX + r * Math.cos(ang), y: midY + r * Math.sin(ang), angle: ang, n };
    }
    s -= arcLen;

    return { x: leftX + s, y: topY, angle: -Math.PI / 2, n };
  }

  const pts: Pt[] = [];
  for (let i = 0; i < WHEEL_EU.length; i++) {
    pts.push(pointAt(i));
  }
  return pts;
}

function selectionFill(sel: SelState, n: number) {
  const colors = getNumberColors(sel, n);
  if (colors.length === 0) return null;
  if (colors.length === 1) return colors[0];
  return `url(#grad-race-${n})`;
}

type Props = {
  sel: SelState;
  onPick: (n: number) => void;
  getCellStyles: (n: number) => React.CSSProperties;
};

export default function RaceTrack({
  sel,
  onPick,
  getCellStyles
}: Props) {
  const pts = buildTrackPoints();
  const viewW = 900;
  const viewH = 240;

  return (
    <div className="raceBox" aria-label="Race Profissional">
      <svg viewBox={`0 0 ${viewW} ${viewH}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          {WHEEL_EU.map(n => {
            const colors = getNumberColors(sel, n);
            if (colors.length <= 1) return null;
            const step = 100 / colors.length;
            return (
              <linearGradient id={`grad-race-${n}`} key={n} x1="0%" y1="0%" x2="100%" y2="100%">
                {colors.map((c, idx) => (
                  <React.Fragment key={idx}>
                    <stop offset={`${idx * step}%`} stopColor={c} />
                    <stop offset={`${(idx + 1) * step}%`} stopColor={c} />
                  </React.Fragment>
                ))}
              </linearGradient>
            );
          })}
        </defs>

        <path
          d="M 170,30 L 730,30 A 90,90 0 0 1 730,210 L 170,210 A 90,90 0 0 1 170,30 Z"
          fill="rgba(0,0,0,0.8)"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="2"
        />

        <path
          d="M 170,75 L 730,75 A 45,45 0 0 1 730,165 L 170,165 A 45,45 0 0 1 170,75 Z"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="2"
        />

        <line x1="280" y1="75" x2="360" y2="165" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
        <line x1="480" y1="75" x2="480" y2="165" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
        <path d="M 680,75 Q 740,120 680,165" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />

        <text x="230" y="125" textAnchor="middle" fontSize="16" fontWeight="bold" fill="rgba(255,255,255,0.7)">TIER</text>
        <text x="410" y="125" textAnchor="middle" fontSize="16" fontWeight="bold" fill="rgba(255,255,255,0.7)">ORPHELINS</text>
        <text x="580" y="125" textAnchor="middle" fontSize="16" fontWeight="bold" fill="rgba(255,255,255,0.7)">VOISINS</text>
        <text x="750" y="125" textAnchor="middle" fontSize="16" fontWeight="bold" fill="rgba(255,255,255,0.7)">ZERO</text>

        {pts.map((p) => {
          const n = p.n;
          const base = colorOf(n);
          const override = selectionFill(sel, n);
          const fill = override ?? `var(--${base})`;
          const customStyles = getCellStyles(n);
          
          return (
            <g 
              key={n} 
              onClick={() => onPick(n)} 
              style={{ cursor: "pointer", ...customStyles }}
              className="raceNode"
            >
              <circle
                cx={p.x}
                cy={p.y}
                r="18"
                fill={fill}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1"
                className="raceCell"
              />
              <text 
                x={p.x} 
                y={p.y + 5} 
                textAnchor="middle" 
                fontSize="14" 
                fontWeight="bold" 
                fill="#fff"
                style={{ userSelect: 'none' }}
              >
                {n}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
