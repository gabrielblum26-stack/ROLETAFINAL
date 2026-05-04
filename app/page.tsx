"use client";

import { useEffect, useMemo, useState } from "react";
import { colorOf, parseInput, neighborsEU, WHEEL_EU } from "./lib/roulette";
import { initSel, applyClick, selClass, SelMode, setActiveColor, SEL_ORDER, markMultiple, getNumberColors } from "./lib/selection";
import RaceTrack from "./components/RaceTrack";
import TableMap, { type RepHighlight } from "./components/TableMap";
import NeighborsBlock from "./components/NeighborsBlock";
import { computeStreaks } from "./lib/streaks";
import { computeTerminals } from "./lib/terminals";
import { TerminalCard } from "./components/TerminalCard";
import { Metric } from "./components/Metric";
import MovementPanel from "./components/MovementPanel";

const SHORT_N = 20;
const LONG_N = 150;

export default function Page() {
  const [raw, setRaw] = useState("");
  const [history, setHistory] = useState<number[]>([]);
  const [sel, setSel] = useState(initSel());
  const [selMode, setSelMode] = useState<SelMode>("neighbors");
  const [markingMode, setMarkingMode] = useState<"unique" | "cumulative">("cumulative");
  const [showEaster99, setShowEaster99] = useState(false);
  const [onlyIntersections, setOnlyIntersections] = useState(false);

  // Estados para o Calculador de Distância
  const [distN1, setDistN1] = useState<number | null>(null);
  const [distN2, setDistN2] = useState<number | null>(null);
  const [pickingFor, setPickingFor] = useState<"n1" | "n2" | null>(null);

  // Estados para minimizar blocos
  const [minimized, setMinimized] = useState({
    history: false,
    neighbors: false,
    raceDist: false,
    trackMap: false,
    terminals: false,
    reps: false,
    zone: false
  });

  const toggleMin = (key: keyof typeof minimized) => {
    setMinimized(prev => ({ ...prev, [key]: !prev[key] }));
  };

  function triggerEaster99() {
    if (typeof window === "undefined") return;
    const key = "easter99Seen";
    if (window.localStorage.getItem(key) === "1") return;
    window.localStorage.setItem(key, "1");
    setShowEaster99(true);
    window.setTimeout(() => setShowEaster99(false), 2600);
  }

  useEffect(() => {
    if (history.length > 0 && history[0] === 99) triggerEaster99();
    
    // Sincronizar histórico com outras janelas
    localStorage.setItem("roulette_history", JSON.stringify(history));
    const bc = new BroadcastChannel("roulette_history_sync");
    bc.postMessage({ type: "UPDATE_HISTORY", value: history });
    bc.close();
  }, [history]);

  useEffect(() => {
    // Escutar comandos vindos das janelas Keyboard ou Estratégias
    const bc = new BroadcastChannel("roulette_keyboard");
    bc.onmessage = (event) => {
      if (event.data.type === "ADD_NUMBER") {
        addNumber(event.data.value);
      } else if (event.data.type === "MARK_STRATEGY") {
        const nums = event.data.value as number[];
        const colorIndex = event.data.colorIndex;
        onMarkStrategy(nums, colorIndex);
      } else if (event.data.type === "RESET_COLORS") {
        onResetColors();
      } else if (event.data.type === "SET_ACTIVE_COLOR") {
        onColorChange(event.data.value);
      }
    };
    return () => bc.close();
  }, [markingMode, sel]);

  const openKeyboard = () => {
    const width = 500;
    const height = 600;
    const left = window.screen.width - width - 50;
    const top = 100;
    
    window.open(
      "/keyboard",
      "RouletteKeyboard",
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes`
    );
  };

  const openStrategies = () => {
    const width = 600;
    const height = 700;
    const left = 50;
    const top = 100;
    
    window.open(
      "/estrategias",
      "RouletteStrategies",
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes`
    );
  };

  const longGridItems = useMemo(() => {
    const arr: (number | null)[] = [];
    for (let i = 0; i < LONG_N; i++) arr.push(history[i] ?? null);
    return arr;
  }, [history]);

  const lastTen = useMemo(() => history.slice(0, 10), [history]);

  const repHighlights = useMemo((): Set<RepHighlight> => {
    return new Set();
  }, [lastTen]);

  const disguisedPairIdx = useMemo(() => {
    const set = new Set<number>();
    for (let i = 0; i < history.length - 1; i++) {
      const a = history[i];
      const b = history[i + 1];
      if (a !== undefined && b !== undefined) {
        const aRoot = a === 28 ? 0 : 1 + ((a - 1) % 9);
        const bRoot = b === 28 ? 0 : 1 + ((b - 1) % 9);
        if (aRoot === bRoot && a !== b) {
          set.add(i);
          set.add(i + 1);
        }
      }
    }
    return set;
  }, [history]);

  function addNumber(n: number) {
    setHistory((prev) => {
      const next = [n, ...prev];
      return next.slice(0, LONG_N);
    });
  }

  function onSend() {
    const nums = parseInput(raw);
    if (nums.length > 0) {
      nums.forEach(addNumber);
      setRaw("");
    }
  }

  function onUndoLast() {
    if (history.length > 0) setHistory(history.slice(1));
  }

  function onResetAll() {
    setHistory([]);
    setSel(initSel());
  }

  function onResetColors() {
    setHistory([]);
    setSel(initSel());
  }

  function onSelect(n: number) {
    if (pickingFor === "n1") {
      setDistN1(n);
      setPickingFor(null);
      return;
    }
    if (pickingFor === "n2") {
      setDistN2(n);
      setPickingFor(null);
      return;
    }
    setSel((prev) => applyClick(prev, n, selMode, markingMode));
  }

  function onColorChange(index: number) {
    setSel((prev) => setActiveColor(prev, index));
  }

  function onMarkStrategy(nums: number[], colorIndex?: number) {
    setSel((prev) => {
      const targetColorIndex = colorIndex !== undefined ? colorIndex : prev.activeColorIndex;
      const tempSel = setActiveColor(prev, targetColorIndex);
      return markMultiple(tempSel, nums, markingMode);
    });
  }

  
  // Lógica de Números Mesclados (Convergência Máxima)
  const mergedNumbers = useMemo(() => {
    const counts: Record<number, number> = {};
    let maxCount = 0;

    for (let n = 0; n <= 36; n++) {
      const count = getNumberColors(sel, n).length;
      if (count > 0) {
        counts[n] = count;
        if (count > maxCount) maxCount = count;
      }
    }

    if (maxCount <= 1) return { numbers: [], maxCount: 0 };

    const result = Object.entries(counts)
      .filter(([_, count]) => count === maxCount)
      .map(([n, _]) => parseInt(n));

    return { numbers: result, maxCount };
  }, [sel]);

  const streaks = useMemo(() => computeStreaks(history), [history]);
  const terminals = useMemo(() => computeTerminals(history), [history]);

  const getCellStyles = (n: number) => {
    const colors = getNumberColors(sel, n);
    
    // Filtro de intersecção
    if (onlyIntersections && mergedNumbers.maxCount > 1) {
      if (colors.length < mergedNumbers.maxCount) {
        return { opacity: 0.1, pointerEvents: 'none' as const, transition: 'all 0.3s' };
      }
    }

    if (colors.length === 0) return {};
    if (colors.length === 1) return { backgroundColor: colors[0], boxShadow: `0 0 15px ${colors[0]}88` };
    const step = 100 / colors.length;
    const gradientParts = colors.map((c, i) => `${c} ${i * step}%, ${c} ${(i + 1) * step}%`);
    return {
      background: `linear-gradient(135deg, ${gradientParts.join(", ")})`,
      boxShadow: `0 0 15px ${colors[0]}88`
    };
  };

  const topZonePattern = useMemo(() => {
    if (history.length === 0) return null;
    const last = history[0];
    const count = history.filter((x) => x === last).length;
    return {
      xExample: last,
      count,
      triggerKind: "T" as const,
      triggerLabel: `Terminal ${last % 10}`,
      triggerMembers: [],
      zones9: [last],
    };
  }, [history]);

  const calcDist = useMemo(() => {
    if (distN1 === null || distN2 === null) return null;
    
    const idx1 = WHEEL_EU.indexOf(distN1);
    const idx2 = WHEEL_EU.indexOf(distN2);
    const L = WHEEL_EU.length;
    
    const h = (idx2 - idx1 + L) % L;
    const ah = (idx1 - idx2 + L) % L;
    
    return { h, ah };
  }, [distN1, distN2]);

  return (
    <div className="app">
      {showEaster99 && (
        <div className="easterOverlay" onClick={() => setShowEaster99(false)}>
          <img src="/easter-99.gif" alt="Easter 99" />
        </div>
      )}
      
      <div className="panel topbar">
        <div className="topbarLine">
          <div className="userGreeting">Olá, Cleber!</div>
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
          <button className="btn btn-reset" onClick={onResetAll}>RESET TOTAL</button>
          <button className="btn btn-keyboard" onClick={openKeyboard} style={{ background: "#9333ea", color: "#fff" }}>
            KEYBOARD
          </button>
          <button 
            className="btn btn-contador" 
            onClick={() => window.open('/contador', 'RouletteContador', 'width=1100,height=800')} 
            style={{ background: "#f59e0b", color: "#fff" }}
          >
            CONTADOR
          </button>
          <button className="btn btn-strategies" onClick={openStrategies} style={{ background: "#22c55e", color: "#fff" }}>
            ESTRATEGIAS
          </button>
        </div>

        <div className="topbarLine secondary">
          <button className="btn btn-colors" onClick={onResetColors} title="Limpa apenas seleções">
            RESET DE CORES
          </button>

          <div className="colorPicker">
            <span className="colorLabel">COR ATIVA:</span>
            {SEL_ORDER.map((_, idx) => (
              <div
                key={idx}
                className={`colorCircle activeC${idx + 1} ${sel.activeColorIndex === idx ? "active" : ""}`}
                style={{ backgroundColor: `var(--selC${idx + 1})` }}
                onClick={() => onColorChange(idx)}
                title={`Cor ${idx + 1}`}
              />
            ))}
          </div>

          <div className="modeSelectWrap" title="Muda a função do seletor de cores">
            <span className="modeLabel">MODO</span>
            <select
              className="modeSelect"
              value={selMode}
              onChange={(e) => setSelMode(e.target.value as SelMode)}
              aria-label="Modo do seletor de cores"
            >
              <option value="neighbors">1 — Vizinhos</option>
              <option value="unique">2 — Único</option>
              <option value="terminalDisguised">3 — Disfarçados do Terminal</option>
              <option value="sumDisguised">4 — Disfarçados da Soma</option>
              <option value="newMarking">5 — Nova marcação</option>
              <option value="zoneMarking">6 — Marcação de zona</option>
            </select>
          </div>

          <div className="markingModeWrap" title="Alterna entre marcacao unica e acumulada">
            <span className="markingLabel">MARCACAO</span>
            <button
              className={`markingBtn ${markingMode === "unique" ? "active" : ""}`}
              onClick={() => setMarkingMode("unique")}
              title="Cada clique limpa a cor anterior"
            >
              Unica
            </button>
            <button
              className={`markingBtn ${markingMode === "cumulative" ? "active" : ""}`}
              onClick={() => setMarkingMode("cumulative")}
              title="Cliques acumulam na mesma cor"
            >
              Acumulada
            </button>
          </div>
        </div>
      </div>

      <div className="panel lastStrip" aria-label="Últimos números">
        {lastTen.map((n, idx) => (
          <div
            key={idx}
            className={`chip ${colorOf(n)}`}
            style={getCellStyles(n)}
            onClick={() => onSelect(n)}
            title="Clique para selecionar"
          >
            {n}
          </div>
        ))}
      </div>

      {mergedNumbers.numbers.length > 0 && (
        <div className="panel mergedStrip" style={{ marginTop: '10px', border: '2px solid #3b82f6', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px 15px' }}>
            <span style={{ fontWeight: 'bold', color: '#3b82f6', whiteSpace: 'nowrap' }}>
              MESCLADOS ({mergedNumbers.maxCount} MARCAÇÕES):
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {mergedNumbers.numbers.map((n) => (
                <div
                  key={n}
                  className={`chip ${colorOf(n)}`}
                  style={{ ...getCellStyles(n), width: '35px', height: '35px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold', color: '#fff' }}
                  onClick={() => onSelect(n)}
                >
                  {n}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="main">
        <div className={`panel left ${minimized.history ? "minimized" : ""}`}>
          <div className="panelHeader">
            <div className="sectionTitle">Histórico (150)</div>
            <button className="btn-min" onClick={() => toggleMin("history")}>{minimized.history ? "+" : "−"}</button>
          </div>
          {!minimized.history && (
            <>
              <div className="longGrid" aria-label="Histórico longo">
                {longGridItems.map((n, idx) => {
                  if (n === null) return <div key={idx} className="longCell empty" />;
                  return (
                    <div
                      key={idx}
                      className={`longCell ${colorOf(n)} ${disguisedPairIdx.has(idx) ? "historyPair" : ""}`}
                      style={getCellStyles(n)}
                      onClick={() => onSelect(n)}
                      title="Clique para selecionar (não registra)"
                    >
                      {n}
                    </div>
                  );
                })}
              </div>
              <div className="hint">
                Entrada só pelo input. Clique em número seleciona N e vizinhos (ou outro modo) com a cor ativa.
                A seleção substitui a cor do chip. "RESET DE CORES" limpa as marcações.
              </div>
            </>
          )}
        </div>
        <div className="middleCols">
          <div className={`panel-wrap ${minimized.neighbors ? "minimized" : ""}`}>
            <NeighborsBlock 
              history={lastTen} 
              sel={sel} 
              onPick={onSelect} 
              onMarkStrategy={onMarkStrategy}
              onlyIntersections={onlyIntersections}
              onToggleIntersections={() => setOnlyIntersections(!onlyIntersections)}
              isMinimized={minimized.neighbors}
              onToggle={() => toggleMin("neighbors")}
            />
          </div>
          <div className={`panel-wrap ${minimized.raceDist ? "minimized" : ""}`}>
            <div className={`panel-wrap ${minimized.raceDist ? "minimized" : ""}`} style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
              <MovementPanel history={history} />
              
              {/* Calculador de Distância - Agora com botões de seleção */}
              <div className={`panel distCalcInside ${pickingFor ? 'isPicking' : ''}`}>
                <div className="distCalcTitle">
                  {pickingFor ? `SELECIONE O NÚMERO PARA ${pickingFor.toUpperCase()} NA RACE...` : 'CALCULADORA DE CASAS'}
                </div>
                <div className="distCalcContent">
                  <div className="distBtnGroup">
                    <button 
                      className={`distSelectBtn ${pickingFor === 'n1' ? 'active' : ''}`}
                      onClick={() => setPickingFor(pickingFor === 'n1' ? null : 'n1')}
                    >
                      {distN1 !== null ? `N1: ${distN1}` : 'SEL. N1'}
                    </button>
                    <button 
                      className={`distSelectBtn ${pickingFor === 'n2' ? 'active' : ''}`}
                      onClick={() => setPickingFor(pickingFor === 'n2' ? null : 'n2')}
                    >
                      {distN2 !== null ? `N2: ${distN2}` : 'SEL. N2'}
                    </button>
                  </div>
                  <div className="distResults">
                    <div className="distItem">
                      <span className="distLabel">H:</span>
                      <span className="distValue">{calcDist ? calcDist.h : "--"}</span>
                    </div>
                    <div className="distItem">
                      <span className="distLabel">AH:</span>
                      <span className="distValue">{calcDist ? calcDist.ah : "--"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rightCol">
          <div className={`panel-wrap ${minimized.trackMap ? "minimized" : ""}`}>
            <div className="panelHeader">
              <div className="sectionTitle">Mapa da Mesa</div>
              <button className="btn-min" onClick={() => toggleMin("trackMap")}>{minimized.trackMap ? "+" : "−"}</button>
            </div>
            {!minimized.trackMap && (
              <TableMap sel={sel} onPick={onSelect} repHighlights={repHighlights} getCellStyles={getCellStyles} />
            )}
          </div>

          <div className={`panel-wrap ${minimized.raceDist ? "minimized" : ""}`}>
            <div className="panelHeader">
              <div className="sectionTitle">RaceTrack</div>
              <button className="btn-min" onClick={() => toggleMin("raceDist")}>{minimized.raceDist ? "+" : "−"}</button>
            </div>
            {!minimized.raceDist && (
              <RaceTrack sel={sel} onPick={onSelect} getCellStyles={getCellStyles} />
            )}
          </div>
        </div>
      </div>

      <div className="bottomRow">
        <div className={`panel ${minimized.terminals ? "minimized" : ""}`}>
          <div className="panelHeader">
            <div className="sectionTitle">Terminais</div>
            <button className="btn-min" onClick={() => toggleMin("terminals")}>{minimized.terminals ? "+" : "−"}</button>
          </div>
          {!minimized.terminals && (
            <div className="terminalsGrid">
              {terminals.map((t) => (
                <TerminalCard key={t.d} s={t} />
              ))}
            </div>
          )}
        </div>

        <div className={`panel ${minimized.reps ? "minimized" : ""}`}>
          <div className="panelHeader">
            <div className="sectionTitle">Métricas</div>
            <button className="btn-min" onClick={() => toggleMin("reps")}>{minimized.reps ? "+" : "−"}</button>
          </div>
          {!minimized.reps && (
            <div className="metricsGrid">
              <Metric title="Vermelhos" value={streaks.color.key === "red" ? streaks.color.count : 0} />
              <Metric title="Pretos" value={streaks.color.key === "black" ? streaks.color.count : 0} />
              <Metric title="Pares" value={streaks.parity.key === "even" ? streaks.parity.count : 0} />
              <Metric title="Ímpares" value={streaks.parity.key === "odd" ? streaks.parity.count : 0} />
              <Metric title="1-18" value={streaks.half.key === "low" ? streaks.half.count : 0} />
              <Metric title="19-36" value={streaks.half.key === "high" ? streaks.half.count : 0} />
            </div>
          )}
        </div>

        <div className={`panel ${minimized.zone ? "minimized" : ""}`}>
          <div className="panelHeader">
            <div className="sectionTitle">Zona do Último</div>
            <button className="btn-min" onClick={() => toggleMin("zone")}>{minimized.zone ? "+" : "−"}</button>
          </div>
          {!minimized.zone && topZonePattern && (
            <div className="zonePattern">
              <div>Último: {topZonePattern.xExample}</div>
              <div>Frequência: {topZonePattern.count}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
