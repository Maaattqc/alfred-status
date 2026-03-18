import { useState, useEffect, useRef, useCallback } from "react";

export interface LogEntry {
  time: string;
  event: string;
}

export interface Stats {
  totalTokens?: number;
  totalCost?: number;
  sessionTokens?: number;
  sessionCost?: number;
  model?: string;
}

export interface AlfredState {
  status: string;
  task: string | null;
  started: string | null;
  lastUpdate: string | null;
  log: LogEntry[];
  stats: Stats;
  connected: boolean;
}

const INITIAL: AlfredState = {
  status: "idle",
  task: null,
  started: null,
  lastUpdate: null,
  log: [],
  stats: {},
  connected: false,
};

export function useAlfred(): AlfredState {
  const [state, setState] = useState<AlfredState>(INITIAL);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const applyData = useCallback((data: Partial<AlfredState>) => {
    setState((prev) => ({
      ...prev,
      status: data.status ?? prev.status,
      task: data.task ?? prev.task,
      started: data.started ?? prev.started,
      lastUpdate: data.lastUpdate ?? prev.lastUpdate,
      log: data.log ?? prev.log,
      stats: data.stats ?? prev.stats,
    }));
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/status.json");
      const data = await res.json();
      applyData(data);
    } catch {
      // silent
    }
  }, [applyData]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    // Detect base path from current location (e.g., /alfred/)
    const basePath = window.location.pathname.replace(/\/+$/, "");
    const wsPath = basePath ? `${basePath}/ws` : "/ws";
    const ws = new WebSocket(`${proto}//${window.location.host}${wsPath}`);

    ws.onopen = () => {
      setState((prev) => ({ ...prev, connected: true }));
      // Stop polling when WS is connected
      if (pollTimer.current) {
        clearInterval(pollTimer.current);
        pollTimer.current = null;
      }
    };

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        applyData(data);
      } catch {
        // ignore
      }
    };

    ws.onclose = () => {
      setState((prev) => ({ ...prev, connected: false }));
      wsRef.current = null;
      // Start polling as fallback
      if (!pollTimer.current) {
        pollTimer.current = setInterval(fetchStatus, 5000);
      }
      // Reconnect after delay
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, [applyData, fetchStatus]);

  useEffect(() => {
    // Initial fetch
    fetchStatus();
    // Connect WebSocket
    connect();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [connect, fetchStatus]);

  return state;
}
