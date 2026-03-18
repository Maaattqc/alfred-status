import { useAlfred } from "./hooks/useAlfred";
import { StatusCard } from "./components/StatusCard";
import { StatsCard } from "./components/StatsCard";
import { ActivityLog } from "./components/ActivityLog";
import "./App.css";

function App() {
  const { status, task, started, lastUpdate, stats, log, connected } = useAlfred();

  return (
    <div className="app">
      <header className="header">
        <h1>🎩 Alfred Status</h1>
        <span className="subtitle">Real-time AI Assistant Dashboard</span>
      </header>

      <main className="main">
        <StatusCard
          status={status}
          task={task}
          started={started}
          lastUpdate={lastUpdate}
          connected={connected}
        />
        <StatsCard stats={stats} />
        <ActivityLog log={log} />
      </main>

      <footer className="footer">
        <span>Alfred • Powered by OpenClaw</span>
      </footer>
    </div>
  );
}

export default App;
