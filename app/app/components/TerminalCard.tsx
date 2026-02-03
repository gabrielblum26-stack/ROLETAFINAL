import type { TerminalStats } from "../lib/terminals";

export function TerminalCard({ s }: { s: TerminalStats }) {
  return (
    <div className="termCard">
      <div className="termTitle">Terminal({s.d})</div>
      <div className="termRow"><span>T</span><span className="termVal">{s.T}</span></div>
      <div className="termRow"><span>V</span><span className="termVal">{s.V}</span></div>
      <div className="termRow"><span>S</span><span className="termVal">{s.S}</span></div>
    </div>
  );
}
