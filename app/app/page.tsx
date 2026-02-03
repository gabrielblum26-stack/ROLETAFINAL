"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../state/AuthProvider";
import Topbar from "../components/Topbar";
import { colorOf, parseInput } from "./lib/roulette";
import RaceTrack from "./components/RaceTrack";
import TableMap, { RepHighlight } from "./components/TableMap";
import NeighborsBlock from "./components/NeighborsBlock";
import { initSel, applyClick, selClass } from "./lib/selection";
import { computeStreaks } from "./lib/streaks";
import { computeTerminals } from "./lib/terminals";
import { TerminalCard } from "./components/TerminalCard";
import { Metric } from "./components/Metric";

const SHORT_N = 20;
const LONG_N = 100; // ajustado para caber com o bloco de vizinhos (sem scroll)

export default function Page() {

const { user, loading } = useAuth();
const router = useRouter();

useEffect(() => {
  if (!loading && !user) router.replace("/login");
}, [loading, user, router]);

if (loading) {
  return (
    <div className="app">
      <Topbar />
      <div className="panel" style={{ padding: 14 }}>Carregando...</div>
    </div>
  );
}
if (!user) return null;


  const [raw, setRaw] = useState("");
  const [history, setHistory] = useState<number[]>([]); // mais recente primeiro
  const [sel, setSel] = useState(initSel());
  const [showColorPrompt, setShowColorPrompt] = useState(false);


  function addNumber(n: number) {
    setHistory((prev) => {
      const next = [n, ...prev];
      return next.slice(0, LONG_N);
    });
  }

  function onSend() {
    const nums = parseInput(raw);
    if (nums.length === 0) return;
    nums.forEach(addNumber);
    setRaw("");
  }

  function onUndoLast() {
    setHistory((prev) => (prev.length ? prev.slice(1) : prev));
  }

  function onResetAll() {
    setRaw("");
    setHistory([]);
    setSel(initSel());
  }

  function onResetColors() {
    setSel(initSel());
    setShowColorPrompt(false);
  }

  function onSelect(n: number) {
    setSel((prev) => {
      const next = applyClick(prev, n);
      // se acabou de usar a 20ª cor (cursor estava no último índice), avisa
      if (prev.cursor === 19) {
        setShowColorPrompt(true);
      }
      return next;
    });
  }

  const streaks = useMemo(() => computeStreaks(history), [history]);
  const terminals = useMemo(() => computeTerminals(history), [history]);

  const repHighlights = useMemo(() => {
    const s = new Set<RepHighlight>();

    if (streaks.color.count >= 2) {
      if (streaks.color.key === "red") s.add("red");
      if (streaks.color.key === "black") s.add("black");
    }
    if (streaks.parity.count >= 2) {
      if (streaks.parity.key === "even") s.add("even");
      if (streaks.parity.key === "odd") s.add("odd");
    }
    if (streaks.half.count >= 2) {
      if (streaks.half.key === "low") s.add("low");
      if (streaks.half.key === "high") s.add("high");
    }
    if (streaks.dozen.count >= 2) {
      if (streaks.dozen.key === 1) s.add("dozen1");
      if (streaks.dozen.key === 2) s.add("dozen2");
      if (streaks.dozen.key === 3) s.add("dozen3");
    }
    if (streaks.column.count >= 2) {
      if (streaks.column.key === 1) s.add("col1");
      if (streaks.column.key === 2) s.add("col2");
      if (streaks.column.key === 3) s.add("col3");
    }

    return s;
  }, [streaks]);

  const longGridItems = useMemo(() => {
    const arr: (number | null)[] = [];
    for (let i = 0; i < LONG_N; i++) arr.push(history[i] ?? null);
    return arr;
  }, [history]);

  const selChipClass = (n: number) => selClass(sel, n);

  const lastTen = history.slice(0, 10);

  return (
    <div className="app">
      <div className="panel topbar">
        <label>Digite (vírgula):</label>
        <div className="inputWrap">
          <input
            type="text"
            placeholder="Ex: 1,24,36"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSend();
              }
            }}
          />
        </div>

        <button className="btn btn-send" onClick={onSend}>ENVIAR</button>
        <button className="btn btn-undo" onClick={onUndoLast}>APAGAR</button>
        <button className="btn btn-colors" onClick={onResetColors} title="Limpa apenas seleções (azul/amarelo/verde)">
          RESET DE CORES
        </button>
        <button className="btn btn-reset" onClick={onResetAll}>RESET</button>
      </div>

      <div className="panel lastStrip" aria-label="Últimos números (curto)">
        {history.slice(0, SHORT_N).map((n, i) => (
          <div
            key={`${n}-${i}`}
            className={`chip ${colorOf(n)} ${selChipClass(n)}`}
            onClick={() => onSelect(n)}
            title="Clique para selecionar (não registra)"
          >
            {n}
          </div>
        ))}
      </div>

      <div className="main">
        <div className="panel left">
          <div className="sectionTitle">Histórico (100)</div>
          <div className="longGrid" aria-label="Histórico longo">
            {longGridItems.map((n, idx) => {
              if (n === null) return <div key={idx} className="longCell empty" />;
              return (
                <div
                  key={idx}
                  className={`longCell ${colorOf(n)} ${selChipClass(n)}`}
                  onClick={() => onSelect(n)}
                  title="Clique para selecionar (não registra)"
                >
                  {n}
                </div>
              );
            })}
          </div>
          <div className="hint">
            Entrada só pelo input. Clique em número (histórico/race/mapa) seleciona N e vizinhos em camadas: Azul → Amarelo → Verde.
            A seleção substitui a cor do chip. “RESET DE CORES” limpa somente seleções.
          </div>
        </div>

        <NeighborsBlock last={lastTen} sel={sel} onPick={onSelect} />

        <div className="panel right">
          <RaceTrack sel={sel} onPick={onSelect} />
          <TableMap sel={sel} rep={repHighlights} onPick={onSelect} />
        </div>
      </div>

      <div className="panel terminals" aria-label="Terminais">
        {terminals.map((t) => <TerminalCard key={t.d} s={t} />)}
      </div>

      <div className="panel reps" aria-label="Repetições">
        <Metric title="VERMELHO" value={streaks.color.key === "red" ? streaks.color.count : null} />
        <Metric title="PRETO" value={streaks.color.key === "black" ? streaks.color.count : null} />

        <Metric title="PAR" value={streaks.parity.key === "even" ? streaks.parity.count : null} />
        <Metric title="ÍMPAR" value={streaks.parity.key === "odd" ? streaks.parity.count : null} />

        <Metric title="BAIXO" value={streaks.half.key === "low" ? streaks.half.count : null} />
        <Metric title="ALTO" value={streaks.half.key === "high" ? streaks.half.count : null} />

        <Metric title="COL 1" value={streaks.column.key === 1 ? streaks.column.count : null} />
        <Metric title="COL 2" value={streaks.column.key === 2 ? streaks.column.count : null} />
        <Metric title="COL 3" value={streaks.column.key === 3 ? streaks.column.count : null} />

        <Metric title="1ª DUZ" value={streaks.dozen.key === 1 ? streaks.dozen.count : null} />
        <Metric title="2ª DUZ" value={streaks.dozen.key === 2 ? streaks.dozen.count : null} />
        <Metric title="3ª DUZ" value={streaks.dozen.key === 3 ? streaks.dozen.count : null} />
      </div>
{showColorPrompt && (
  <div className="modalOverlay" role="dialog" aria-modal="true" aria-label="Aviso de cores">
    <div className="modal">
      <div className="modalTitle">FOI USADO 20 CORES</div>
      <div className="modalText">DESEJA RESETAR AS CORES?</div>
      <div className="modalActions">
        <button className="btn btn-secondary" onClick={() => setShowColorPrompt(false)}>CONTINUAR</button>
        <button className="btn btn-colors" onClick={onResetColors}>RESETAR CORES</button>
      </div>
    </div>
  </div>
)}

      <div className="versionBadge">v1.7.8</div>
    </div>
  );
}
