import type { LogEntry } from "../hooks/useAlfred";

interface Props {
  log: LogEntry[];
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-CA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("fr-CA", { month: "short", day: "numeric" });
}

export function ActivityLog({ log }: Props) {
  const recent = [...log].reverse().slice(0, 15);

  return (
    <div className="card activity-card">
      <h3>📋 Activity Log</h3>
      {recent.length === 0 ? (
        <div className="empty-log">No activity yet</div>
      ) : (
        <div className="log-list">
          {recent.map((entry, i) => (
            <div key={`${entry.time}-${i}`} className="log-entry">
              <span className="log-time">
                {formatDate(entry.time)} {formatTime(entry.time)}
              </span>
              <span className="log-event">{entry.event}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
