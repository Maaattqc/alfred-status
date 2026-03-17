import { serve } from "bun";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";

const PORT = 3849;
const STATUS_FILE = join(import.meta.dir, "status.json");
const CLIENT_DIR = join(import.meta.dir, "client");

serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // API: Get status
    if (url.pathname === "/status.json") {
      try {
        const data = await readFile(STATUS_FILE, "utf-8");
        return new Response(data, {
          headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" }
        });
      } catch {
        return new Response('{"status":"idle","task":null,"log":[]}', {
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // API: Update status (POST /api/status)
    if (url.pathname === "/api/status" && req.method === "POST") {
      try {
        const body = await req.json();
        const current = JSON.parse(await readFile(STATUS_FILE, "utf-8"));

        current.status = body.status || "idle";
        current.task = body.task || null;
        current.started = body.status === "idle" ? null : (current.started || new Date().toISOString());
        current.lastUpdate = new Date().toISOString();

        if (body.event) {
          current.log = current.log || [];
          current.log.push({ time: new Date().toISOString(), event: body.event });
          // Keep last 50 entries
          if (current.log.length > 50) current.log = current.log.slice(-50);
        }

        await writeFile(STATUS_FILE, JSON.stringify(current, null, 2));
        return new Response('{"ok":true}', { headers: { "Content-Type": "application/json" } });
      } catch (e) {
        return new Response(`{"error":"${e}"}`, { status: 500 });
      }
    }

    // Static files
    let filePath = url.pathname === "/" ? "/index.html" : url.pathname;
    try {
      const file = Bun.file(join(CLIENT_DIR, filePath));
      if (await file.exists()) return new Response(file);
    } catch {}

    return new Response("Not found", { status: 404 });
  }
});

console.log(`🎩 Alfred Status running on port ${PORT}`);
