"use client";

import { useState } from "react";
import { wheelDistance, WHEEL_EU } from "../lib/roulette";

export type MovementRecord = {
  from: number;
  to: number;
  h: number;
  ah: number;
};

type DistanceMode = "shortest" | "longest";

// Cores para marcação manual no painel de deslocamento
const MARK_COLORS = ["#3b82f6", "#a855f7", "#ec4899", "#eab308"]; // Azul, Roxo, Rosa, Amarelo

function getMovementColor(distance: number): string {
  if (distance <= 5) return "#ffd000"; // Amarelo (curto)
  if (distance <= 12) return "#ff6b6b"; // Vermelho (médio)
  return "#26d07c"; // Verde (longo)
}

export default function MovementPanel({
  history,
}: {
  history: number[];
}) {
  const [mode, setMode] = useState<DistanceMode>("shortest");
  const [activeMarkColor, setActiveMarkColor] = useState<number>(0);
  const [marks, setMarks] = useState<Record<string, string>>({});

  const movements: MovementRecord[] = [];
  for (let i = 0; i < Math.min(history.length - 1, 100); i++) {
    const from = history[i + 1];
    const to = history[i];
    const { h, ah } = wheelDistance(from, to);
    movements.push({ from, to, h, ah });
  }

  const lastMovement = movements.length > 0 ? movements[0] : null;
  const prevMovement = movements.length > 1 ? movements[1] : null;

  let lastDistance = 0;
  let lastDirection = "";
  let lastIsH = false;
  let sumDist = 0;
  let sumLeftNum = -1;
  let sumRightNum = -1;

  if (lastMovement) {
    lastIsH = lastMovement.h <= lastMovement.ah;
    lastDistance = lastIsH ? lastMovement.h : lastMovement.ah;
    lastDirection = lastIsH ? "H" : "A";

    const currentIdx = WHEEL_EU.indexOf(lastMovement.to);
    if (currentIdx >= 0) {
      const L = WHEEL_EU.length;
      if (prevMovement) {
        const prevIsH = mode === "shortest" ? prevMovement.h <= prevMovement.ah : prevMovement.h >= prevMovement.ah;
        const prevDistance = prevIsH ? prevMovement.h : prevMovement.ah;
        sumDist = lastDistance + prevDistance;
        sumLeftNum = WHEEL_EU[(currentIdx - sumDist + L * 10) % L];
        sumRightNum = WHEEL_EU[(currentIdx + sumDist) % L];
      }
    }
  }

  const handleCellClick = (direction: string, distance: number) => {
    const key = `${direction}/${distance}`;
    const color = MARK_COLORS[activeMarkColor];
    setMarks(prev => {
      const next = { ...prev };
      if (next[key] === color) delete next[key];
      else next[key] = color;
      return next;
    });
  };

  return (
    <div className="movementPanel compact">
      <div className="movementHeader">
        <div className="movementTitle">DESLOCAMENTO (H/A)</div>
        <div className="movementControls">
          <div className="markColorPicker">
            {MARK_COLORS.map((c, idx) => (
              <div
                key={idx}
                className={`markColorCircle ${activeMarkColor === idx ? "active" : ""}`}
                style={{ backgroundColor: c }}
                onClick={() => setActiveMarkColor(idx)}
              />
            ))}
          </div>
          <button className="btn-reset-marks" onClick={() => setMarks({})}>RESET</button>
          <div className="movementModeSelector">
            <button className={`modeBtn ${mode === "shortest" ? "active" : ""}`} onClick={() => setMode("shortest")}>CURTO</button>
            <button className={`modeBtn ${mode === "longest" ? "active" : ""}`} onClick={() => setMode("longest")}>LONGO</button>
          </div>
        </div>
      </div>

      {lastMovement && (
        <div className="movementHighlight compact">
          <div className="highlightRow">
            <div className="highlightBox">
              <div className="highlightLabel">HORÁRIO</div>
              <div className="highlightValue" style={{ color: lastIsH ? "#ffd000" : "#aaa" }}>{lastMovement.h}</div>
            </div>
            <div className="highlightBox">
              <div className="highlightLabel">ATUAL</div>
              <div className="highlightValue">{lastMovement.to}</div>
            </div>
            <div className="highlightBox">
              <div className="highlightLabel">ANTI-HORÁRIO</div>
              <div className="highlightValue" style={{ color: !lastIsH ? "#ffd000" : "#aaa" }}>{lastMovement.ah}</div>
            </div>
            <div className="highlightBox">
              <div className="highlightLabel">RESULTADO</div>
              <div className="highlightValue" style={{ color: getMovementColor(lastDistance) }}>{lastDirection}/{lastDistance}</div>
            </div>
          </div>

          <div className="highlightRow secondary">
            <div className="highlightBox">
              <div className="highlightLabel">SOMA ÚLT. 2</div>
              <div className="highlightValue" style={{ color: "#ffd000" }}>{sumDist || "--"}</div>
            </div>
            <div className="highlightBox highlightEsquerda">
              <div className="highlightLabel">ESQUERDA</div>
              <div className="highlightValue" style={{ color: "#26d07c" }}>{sumLeftNum !== -1 ? sumLeftNum : "--"}</div>
            </div>
            <div className="highlightBox highlightDireita">
              <div className="highlightLabel">DIREITA</div>
              <div className="highlightValue" style={{ color: "#26d07c" }}>{sumRightNum !== -1 ? sumRightNum : "--"}</div>
            </div>
          </div>
        </div>
      )}

      <div className="movementGrid compact">
        {movements.length === 0 ? (
          <div className="movementEmpty">Aguardando dados...</div>
        ) : (
          movements.map((mov, idx) => {
            const isH = mode === "shortest" ? mov.h <= mov.ah : mov.h >= mov.ah;
            const distance = isH ? mov.h : mov.ah;
            const direction = isH ? "H" : "A";
            const baseColor = getMovementColor(distance);
            const markColor = marks[`${direction}/${distance}`];
            return (
              <div
                key={idx}
                className={`movementGridCell ${idx === 0 ? "latest" : ""}`}
                style={{ 
                  borderLeftColor: baseColor,
                  backgroundColor: markColor ? `${markColor}33` : "transparent",
                  borderColor: markColor || "rgba(255,255,255,0.05)"
                }}
                onClick={() => handleCellClick(direction, distance)}
              >
                <div className="gridCellNum">{mov.to}</div>
                <div className="gridCellDist" style={{ color: markColor || baseColor }}>{direction}/{distance}</div>
              </div>
            );
          })
        )}
      </div>

      <style jsx>{`
        .movementPanel.compact { padding: 8px; }
        .movementTitle { font-size: 11px; font-weight: 900; color: #888; }
        .movementHighlight.compact { gap: 4px; margin-bottom: 8px; padding: 6px; }
        .highlightRow { gap: 4px; }
        .highlightBox { padding: 4px 2px; border-radius: 4px; }
        .highlightLabel { font-size: 7px; margin-bottom: 1px; }
        .highlightValue { font-size: 14px; }
        .movementGrid.compact { 
          display: grid; 
          grid-template-columns: repeat(10, 1fr); 
          gap: 2px; 
        }
        .movementGridCell { padding: 2px; font-size: 9px; min-height: 30px; }
        .gridCellNum { font-weight: bold; }
        .gridCellDist { font-size: 8px; }
        .modeBtn { padding: 2px 6px; font-size: 9px; }
        .btn-reset-marks { padding: 2px 6px; font-size: 9px; }
      `}</style>
    </div>
  );
}
