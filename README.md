# Alfred Status 🎩

> Real-time dashboard for monitoring an AI assistant's activity — live status, task tracking, token usage, and activity log via WebSocket.
>
> Dashboard temps réel pour surveiller l'activité d'un assistant IA — statut en direct, suivi des tâches, usage de tokens et journal d'activité via WebSocket.

## 🚀 Overview / Aperçu

**[EN]** Alfred Status is a real-time monitoring dashboard that displays what an AI assistant (Alfred, powered by OpenClaw) is currently doing. It shows live status (idle/coding/thinking), current task description, token usage and cost statistics, and a chronological activity log — all updated in real-time via WebSocket. The dashboard is publicly accessible at [mathieu-fournier.net/alfred](https://mathieu-fournier.net/alfred/).

**[FR]** Alfred Status est un dashboard de monitoring temps réel qui affiche ce que l'assistant IA (Alfred, propulsé par OpenClaw) fait en ce moment. Il montre le statut en direct (idle/coding/thinking), la description de la tâche en cours, les statistiques d'usage de tokens et coûts, et un journal d'activité chronologique — le tout mis à jour en temps réel via WebSocket.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React, TypeScript, Vite |
| **Backend** | Bun (native HTTP server) |
| **Real-time** | WebSocket (ws) |
| **State** | JSON file-based persistence |
| **Hosting** | OVH VPS via Cloudflare Tunnel |
| **Integration** | OpenClaw shell scripts for status updates |

## 🧠 Technical Highlights / Défis Techniques

- **WebSocket-powered real-time updates** — no polling, instant status changes pushed to all connected clients
- **Dual-runtime architecture** — Bun server (TypeScript) for production with Node.js fallback, React + Vite client
- **File-based state** — `status.json` as single source of truth, updated by shell scripts and read by the API
- **Shell script integration** — `alfred-status.sh` called by the AI agent before/after every task for live tracking
- **Component architecture** — `StatusCard`, `StatsCard`, `ActivityLog` as clean, focused React components
- **Custom hook** — `useAlfred()` hook managing WebSocket connection, reconnection, and state hydration
- **Zero-config deployment** — runs behind Cloudflare Tunnel, no port forwarding needed

## ✨ Features / Fonctionnalités

- 🟢 **Live status indicator** — idle / coding / thinking with visual feedback
- 📋 **Current task display** — what Alfred is working on right now
- 📊 **Token & cost stats** — session and total token usage with cost tracking
- 📜 **Activity log** — chronological event history with timestamps
- ⚡ **Real-time updates** — WebSocket push, no page refresh needed
- 🔗 **Public dashboard** — accessible at mathieu-fournier.net/alfred

## 📦 Installation

```bash
# Backend
npm install        # or bun install
npm start          # starts server on port 3849

# Frontend (development)
cd client
npm install
npm run dev        # Vite dev server

# Frontend (production)
cd client
npm run build      # outputs to dist/
```

## 📁 Architecture

```
alfred-status/
├── server.ts          # Bun HTTP + WebSocket server
├── server.js          # Node.js fallback server
├── status.json        # Current state (updated by scripts)
├── package.json
└── client/            # React frontend
    └── src/
        ├── App.tsx
        ├── hooks/
        │   └── useAlfred.ts        # WebSocket hook
        └── components/
            ├── StatusCard.tsx       # Status display
            ├── StatsCard.tsx        # Token/cost stats
            └── ActivityLog.tsx      # Event timeline
```

## 🔌 Integration / Intégration

Alfred updates his status via shell script:
```bash
# Start a task
alfred-status coding "Building feature X" "Started work"

# Finish a task  
alfred-status idle "" "Feature X complete ✅"

# Thinking
alfred-status thinking "Analyzing code" "Reading repo"
```

## 👤 Author / Auteur

**Mathieu Fournier** — [@Maaattqc](https://github.com/Maaattqc)
