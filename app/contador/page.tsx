"use client";

import { useState, useMemo, useEffect } from "react";
import RaceTrack from "../components/RaceTrack";
import { initSel, setActiveColor, markMultiple, SelState, getNumberColors } from "../lib/selection";
import { wheelDistance, WHEEL_EU } from "../lib/roulette";

type SelectionPair = {
  n1: number;
  n2: number;
  h: number;
  ah: number;
  colorIndex: number;
};

export default function ContadorPage() {
  const [sel, setSel] = useState<SelState>(initSel());
  const [history, setHistory] = useState<SelectionPair[]>([]);
  const [currentPair, setCurrentPair] = useState<number[]>([]);
  const [activeColorIdx, setActiveColorIdx] = useState(0);

  const colors = [0, 1, 2, 4, 5]; // 5 cores: Azul, Amarelo, Verde, Roxo, Laranja

  useEffect(() => {
    document.documentElement.classList.add("theme-dark");
    document.body.classList.add("theme-dark");
    document.body.style.background = "#121212";
    document.body.style.color = "#fff";
  }, []);

  const onPick = (n: number) => {
    if (currentPair.length === 0) {
      // Primeiro número do par
      setCurrentPair([n]);
      // Marcar o número na RaceTrack com a cor atual
      setSel(prev => {
        const withColor = setActiveColor(prev, colors[activeColorIdx]);
        return markMultiple(withColor, [n], "cumulative");
      });
    } else if (currentPair.length === 1) {
      // Segundo número do par
      const n1 = currentPair[0];
      const n2 = n;
      
      // Se clicar no mesmo número, não faz nada ou desmarca? Vamos assumir que quer o segundo
      if (n1 === n2) return;

      const dist = wheelDistance(n1, n2);
      const newPair: SelectionPair = {
        n1,
        n2,
        h: dist.h + 1, // Ajuste para incluir a casa de destino conforme visual do usuário
        ah: dist.ah + 1,
        colorIndex: colors[activeColorIdx]
      };

      setHistory(prev => [newPair, ...prev]);
      
      // Marcar o segundo número
      setSel(prev => {
        return markMultiple(prev, [n2], "cumulative");
      });

      // Resetar par e mudar para a próxima cor (ciclo de 5)
      setCurrentPair([]);
      setActiveColorIdx(prev => (prev + 1) % colors.length);
    }
  };

  const getCellStyles = (n: number) => {
    const nColors = getNumberColors(sel, n);
    if (nColors.length === 0) return {};
    if (nColors.length === 1) return { backgroundColor: nColors[0], boxShadow: `0 0 15px ${nColors[0]}88` };
    const step = 100 / nColors.length;
    const gradientParts = nColors.map((c, i) => `${c} ${i * step}%, ${c} ${(i + 1) * step}%`);
    return {
      background: `linear-gradient(135deg, ${gradientParts.join(", ")})`,
      boxShadow: `0 0 15px ${nColors[0]}88`
    };
  };

  const clearAll = () => {
    setSel(initSel());
    setHistory([]);
    setCurrentPair([]);
    setActiveColorIdx(0);
  };

  return (
    <div className="contador-page" style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#ffd000' }}>CONTADOR DE DISTÂNCIA</h1>
        <button 
          onClick={clearAll}
          style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          LIMPAR TUDO
        </button>
      </div>

      <div className="panel" style={{ padding: '10px', marginBottom: '20px', background: '#1a1a1a' }}>
        <RaceTrack sel={sel} onPick={onPick} getCellStyles={getCellStyles} />
      </div>

      <div className="results-container">
        <h2 style={{ fontSize: '18px', color: '#888', marginBottom: '15px' }}>ÚLTIMAS SELEÇÕES</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {history.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#444', border: '2px dashed #333', borderRadius: '12px' }}>
              Clique em dois números na RaceTrack para calcular a distância
            </div>
          )}
          {history.map((item, idx) => (
            <div 
              key={idx} 
              className="panel" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '15px 25px',
                borderLeft: `6px solid var(--selC${item.colorIndex + 1})`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#888', fontSize: '12px' }}>NÚMEROS:</span>
                  <span style={{ fontSize: '20px', fontWeight: '900' }}>{item.n1}</span>
                  <span style={{ color: '#444' }}>➔</span>
                  <span style={{ fontSize: '20px', fontWeight: '900' }}>{item.n2}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '30px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#888', fontWeight: 'bold' }}>HORÁRIO</div>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#ffd000' }}>{item.h}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#888', fontWeight: 'bold' }}>ANTI-HORÁRIO</div>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#ffd000' }}>{item.ah}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .contador-page .raceBox {
          min-height: 300px;
        }
      `}</style>
    </div>
  );
}
