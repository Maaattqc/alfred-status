import { useMemo } from "react";

interface Props {
  status: string;
  task: string | null;
  started: string | null;
  lastUpdate: string | null;
  connected: boolean;
}

const STATUS_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  idle: { emoji: "🟢", label: "Idle", color: "#3fb950" },
  coding: { emoji: "🟠", label: "Coding", color: "#d29922" },
  thinking: { emoji: "🔵", label: "Thinking", color: "#58a6ff" },
};

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

export function StatusCard({ status, task, started, lastUpdate, connected }: Props) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.idle;

  const elapsed = useMemo(() => {
    if (!started || status === "idle") return null;
    const diff = Date.now() - new Date(started).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just started";
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }, [started, status]);

  return (
    <div className="card status-card">
      <div className="status-header">
        <div className="status-indicator">
          <span className={`pulse-dot ${status}`} style={{ background: config.color }} />
          <span className="status-label" style={{ color: config.color }}>
            {config.emoji} {config.label}
          </span>
        </div>
        <span className={`connection-badge ${connected ? "live" : "polling"}`}>
          {connected ? "⚡ Live" : "↻ Polling"}
        </span>
      </div>

      {task && <div className="task-text">{task}</div>}

      <div className="status-meta">
        {elapsed && <span className="elapsed">⏱ {elapsed}</span>}
        <span className="last-update">Updated {timeAgo(lastUpdate)}</span>
      </div>
    </div>
  );
}
