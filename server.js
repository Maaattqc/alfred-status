const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const { WebSocketServer } = require("ws");

const PORT = 3850;
const STATUS_FILE = path.join(__dirname, "status.json");
const CLIENT_DIR = path.join(__dirname, "client", "dist");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

// --- HTTP Server ---
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // API: Get status
  if (url.pathname === "/status.json") {
    try {
      const data = await fs.readFile(STATUS_FILE, "utf-8");
      res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-cache" });
      res.end(data);
    } catch {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end('{"status":"idle","task":null,"log":[],"stats":{}}');
    }
    return;
  }

  // API: Update status (POST)
  if (url.pathname === "/api/status" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", async () => {
      try {
        const input = JSON.parse(body);
        let current;
        try {
          current = JSON.parse(await fs.readFile(STATUS_FILE, "utf-8"));
        } catch {
          current = { status: "idle", task: null, log: [], stats: {} };
        }

        current.status = input.status || "idle";
        current.task = input.task || null;
        current.started =
          input.status === "idle" ? null : current.started || new Date().toISOString();
        current.lastUpdate = new Date().toISOString();

        // Update stats if provided
        if (input.tokens || input.cost || input.model) {
          current.stats = current.stats || {
            totalTokens: 0,
            totalCost: 0,
            model: "anthropic/claude-sonnet-4-6",
            sessionTokens: 0,
            sessionCost: 0,
          };
          if (input.model) current.stats.model = input.model;
          if (input.tokens) {
            current.stats.totalTokens = (current.stats.totalTokens || 0) + input.tokens;
            current.stats.sessionTokens = (current.stats.sessionTokens || 0) + input.tokens;
          }
          if (input.cost) {
            current.stats.totalCost = (current.stats.totalCost || 0) + input.cost;
            current.stats.sessionCost = (current.stats.sessionCost || 0) + input.cost;
          }
        }

        if (input.event) {
          current.log = current.log || [];
          current.log.push({ time: new Date().toISOString(), event: input.event });
          if (current.log.length > 50) current.log = current.log.slice(-50);
        }

        await fs.writeFile(STATUS_FILE, JSON.stringify(current, null, 2));

        // Broadcast to all WebSocket clients
        broadcast(current);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end('{"ok":true}');
      } catch (e) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(`{"error":"${e.message}"}`);
      }
    });
    return;
  }

  // Static files from client/dist
  let filePath = url.pathname === "/" ? "/index.html" : url.pathname;
  try {
    const fullPath = path.join(CLIENT_DIR, filePath);
    // Prevent directory traversal
    if (!fullPath.startsWith(CLIENT_DIR)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    const data = await fs.readFile(fullPath);
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  } catch {
    // SPA fallback: serve index.html for non-file routes
    try {
      const data = await fs.readFile(path.join(CLIENT_DIR, "index.html"));
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  }
});

// --- WebSocket Server ---
const wss = new WebSocketServer({ server, path: "/ws" });

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(msg);
    }
  });
}

wss.on("connection", async (ws) => {
  console.log(`🔌 WS client connected (total: ${wss.clients.size})`);

  // Send current status immediately on connect
  try {
    const data = await fs.readFile(STATUS_FILE, "utf-8");
    ws.send(data);
  } catch {
    ws.send('{"status":"idle","task":null,"log":[],"stats":{}}');
  }

  ws.on("close", () => {
    console.log(`🔌 WS client disconnected (total: ${wss.clients.size})`);
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`🎩 Alfred Status running on port ${PORT} (HTTP + WebSocket)`);
});
