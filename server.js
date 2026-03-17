const http = require("http");
const fs = require("fs/promises");
const path = require("path");

const PORT = 3850;
const STATUS_FILE = path.join(__dirname, "status.json");
const CLIENT_DIR = path.join(__dirname, "client");

const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // API: Get status
  if (url.pathname === "/status.json") {
    try {
      const data = await fs.readFile(STATUS_FILE, "utf-8");
      res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-cache" });
      res.end(data);
    } catch {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end('{"status":"idle","task":null,"log":[]}');
    }
    return;
  }

  // API: Update status (POST)
  if (url.pathname === "/api/status" && req.method === "POST") {
    let body = "";
    req.on("data", c => body += c);
    req.on("end", async () => {
      try {
        const input = JSON.parse(body);
        const current = JSON.parse(await fs.readFile(STATUS_FILE, "utf-8"));

        current.status = input.status || "idle";
        current.task = input.task || null;
        current.started = input.status === "idle" ? null : (current.started || new Date().toISOString());
        current.lastUpdate = new Date().toISOString();

        if (input.event) {
          current.log = current.log || [];
          current.log.push({ time: new Date().toISOString(), event: input.event });
          if (current.log.length > 50) current.log = current.log.slice(-50);
        }

        await fs.writeFile(STATUS_FILE, JSON.stringify(current, null, 2));
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end('{"ok":true}');
      } catch (e) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(`{"error":"${e.message}"}`);
      }
    });
    return;
  }

  // Static files
  let filePath = url.pathname === "/" ? "/index.html" : url.pathname;
  try {
    const fullPath = path.join(CLIENT_DIR, filePath);
    const data = await fs.readFile(fullPath);
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`🎩 Alfred Status running on port ${PORT}`);
});
