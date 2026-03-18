import type { Stats } from "../hooks/useAlfred";

interface Props {
  stats: Stats;
}

function formatCost(n?: number): string {
  if (n == null) return "$0.00";
  return `$${n.toFixed(4)}`;
}

function formatTokens(n?: number): string {
  if (n == null) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function StatsCard({ stats }: Props) {
  const items = [
    { label: "Session Tokens", value: formatTokens(stats.sessionTokens) },
    { label: "Session Cost", value: formatCost(stats.sessionCost) },
    { label: "Total Cost", value: formatCost(stats.totalCost) },
    { label: "Model", value: stats.model?.split("/").pop() || "—" },
  ];

  return (
    <div className="card stats-card">
      <h3>📊 Stats</h3>
      <div className="stats-grid">
        {items.map((item) => (
          <div key={item.label} className="stat-item">
            <span className="stat-value">{item.value}</span>
            <span className="stat-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
