const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const { execSync } = require("child_process");
const { WebSocketServer } = require("ws");

const PORT = 3850;
const STATUS_FILE = path.join(__dirname, "status.json");
const CLIENT_DIR = path.join(__dirname, "client", "dist");
const CLICZONE_DIR = "/home/debian/cliczone";
const APPLY_SECRET = "alfred-apply-secret-2026";
const VERCEL_TOKEN = "vcp_6tXWEWI51ayEyM3xeRMaqcOAchKAM1pKc8haakXM4WDunNQ3az3ZiUPm";
const VERCEL_PROJECT = "prj_rWml7lYOucpAT2qprMw43eN2XAuR";

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
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Alfred-Secret");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // --- API: Apply code change ---
  if (url.pathname === "/api/apply" && req.method === "POST") {
    const secret = req.headers["x-alfred-secret"];
    if (secret !== APPLY_SECRET) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }

    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", async () => {
      try {
        const { file, fullContent, description } = JSON.parse(body);
        if (!file || !fullContent) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Missing file or fullContent" }));
          return;
        }

        // Security: prevent path traversal
        const resolved = path.resolve(CLICZONE_DIR, file);
        if (!resolved.startsWith(CLICZONE_DIR + "/")) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid file path" }));
          return;
        }

        // Ensure directory exists
        await fs.mkdir(path.dirname(resolved), { recursive: true });

        // Write file
        await fs.writeFile(resolved, fullContent, "utf-8");

        // Git add, commit, push
        const commitMsg = description
          ? `feat(chatbot): ${description}`
          : "feat(chatbot): apply change from dev chat";
        execSync(`git -C ${CLICZONE_DIR} add "${file}"`, { timeout: 10000 });
        execSync(`git -C ${CLICZONE_DIR} commit -m "${commitMsg.replace(/"/g, '\\"')}"`, { timeout: 10000 });
        execSync(`git -C ${CLICZONE_DIR} push`, { timeout: 30000 });

        // Trigger Vercel deployment
        let deployId = null;
        try {
          const deployRes = execSync(`curl -s -X POST \
            -H "Authorization: Bearer ${VERCEL_TOKEN}" \
            -H "Content-Type: application/json" \
            "https://api.vercel.com/v13/deployments" \
            -d '${JSON.stringify({
              name: "cliczone",
              project: VERCEL_PROJECT,
              target: "production",
              gitSource: { type: "github", repoId: "1175747742", ref: "main" }
            })}'`, { timeout: 15000 }).toString();
          const parsed = JSON.parse(deployRes);
          deployId = parsed.id || null;
        } catch (e) {
          console.error("Vercel deploy trigger failed:", e.message);
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, file, deployId }));
      } catch (e) {
        console.error("Apply error:", e.message);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // --- API: Read file from cliczone ---
  if (url.pathname === "/api/read" && req.method === "GET") {
    const secret = req.headers["x-alfred-secret"];
    if (secret !== APPLY_SECRET) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }

    const file = url.searchParams.get("file");
    if (!file) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing file parameter" }));
      return;
    }

    const resolved = path.resolve(CLICZONE_DIR, file);
    if (!resolved.startsWith(CLICZONE_DIR + "/")) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid file path" }));
      return;
    }

    try {
      const content = await fs.readFile(resolved, "utf-8");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, file, content }));
    } catch (e) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `File not found: ${file}` }));
    }
    return;
  }

  // --- API: List files in cliczone/src ---
  if (url.pathname === "/api/files" && req.method === "GET") {
    const secret = req.headers["x-alfred-secret"];
    if (secret !== APPLY_SECRET) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }

    try {
      const output = execSync(
        `find ${CLICZONE_DIR}/src -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.css" -o -name "*.json" \\) | sed 's|${CLICZONE_DIR}/||'`,
        { timeout: 5000 }
      ).toString().trim();
      const files = output ? output.split("\n") : [];
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, files }));
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: e.message }));
    }
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
