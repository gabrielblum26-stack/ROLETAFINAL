export function Metric({ title, value }: { title: string; value: number | null }) {
  return (
    <div className="repCard">
      <div className="repTitle">{title}</div>
      <div className="repBox">{value && value >= 2 ? value : ""}</div>
    </div>
  );
}
