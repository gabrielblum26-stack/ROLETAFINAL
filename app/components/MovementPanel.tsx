"use client";

import { useState } from "react";
import { wheelDistance } from "../lib/roulette";

export type MovementRecord = {
  from: number;
  to: number;
  h: number;
  ah: number;
};

type DistanceMode = "shortest" | "longest";

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

  // Calcular os movimentos dos últimos 100 números
  const movements: MovementRecord[] = [];
  for (let i = 0; i < Math.min(history.length - 1, 100); i++) {
    const from = history[i + 1];
    const to = history[i];
    const { h, ah } = wheelDistance(from, to);
    movements.push({ from, to, h, ah });
  }

  // Pegar o último movimento para destaque
  const lastMovement = movements.length > 0 ? movements[0] : null;
  let lastDistance = 0;
  let lastDirection = "";
  let lastIsH = false;

  if (lastMovement) {
    lastIsH = lastMovement.h <= lastMovement.ah;
    lastDistance = lastIsH ? lastMovement.h : lastMovement.ah;
    lastDirection = lastIsH ? "H" : "A";
  }

  return (
    <div className="movementPanel">
      <div className="movementHeader">
        <div className="movementTitle">Deslocamento (H/A) - Últimos 100</div>
        <div className="movementModeSelector">
          <button
            className={`modeBtn ${mode === "shortest" ? "active" : ""}`}
            onClick={() => setMode("shortest")}
          >
            Mais Curto
          </button>
          <button
            className={`modeBtn ${mode === "longest" ? "active" : ""}`}
            onClick={() => setMode("longest")}
          >
            Mais Longo
          </button>
        </div>
      </div>

      {/* Seção de Destaque do Último Movimento */}
      {lastMovement && (
        <div className="movementHighlight">
          <div className="highlightBox">
            <div className="highlightLabel">H ATUAL</div>
            <div className="highlightValue" style={{ color: lastIsH ? "#ffd000" : "#aaa" }}>
              {lastMovement.h}
            </div>
          </div>
          <div className="highlightBox">
            <div className="highlightLabel">ÚLTIMO</div>
            <div className="highlightValue">{lastMovement.to}</div>
          </div>
          <div className="highlightBox">
            <div className="highlightLabel">AH</div>
            <div className="highlightValue" style={{ color: !lastIsH ? "#ffd000" : "#aaa" }}>
              {lastMovement.ah}
            </div>
          </div>
          <div className="highlightBox">
            <div className="highlightLabel">RESULTADO</div>
            <div className="highlightValue" style={{ color: getMovementColor(lastDistance) }}>
              {lastDirection}/{lastDistance}
            </div>
          </div>
        </div>
      )}

      {/* Grade 10x10 dos últimos 100 movimentos */}
      <div className="movementGrid">
        {movements.length === 0 ? (
          <div className="movementEmpty">Insira números para ver o deslocamento</div>
        ) : (
          movements.map((mov, idx) => {
            let distance: number;
            let direction: string;
            let isH: boolean;

            if (mode === "shortest") {
              isH = mov.h <= mov.ah;
              distance = isH ? mov.h : mov.ah;
              direction = isH ? "H" : "A";
            } else {
              isH = mov.h >= mov.ah;
              distance = isH ? mov.h : mov.ah;
              direction = isH ? "H" : "A";
            }

            const color = getMovementColor(distance);
            const isLatest = idx === 0;

            return (
              <div
                key={idx}
                className={`movementGridCell ${isLatest ? "latest" : ""}`}
                style={{ borderLeftColor: color }}
              >
                <div className="gridCellNum">{mov.to}</div>
                <div className="gridCellDist" style={{ color }}>
                  {direction}/{distance}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
