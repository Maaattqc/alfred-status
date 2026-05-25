# Alfred Status

> Real-time dashboard for monitoring an AI assistant's activity — live status, task tracking, and activity log via WebSocket.
>
> Dashboard temps réel pour surveiller l'activité d'un assistant IA — statut en direct, suivi des tâches et journal d'activité via WebSocket.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Bun](https://img.shields.io/badge/Bun-1.x-fbf0df?logo=bun&logoColor=black)](https://bun.sh/)
[![WebSocket](https://img.shields.io/badge/WebSocket-realtime-brightgreen)]()
[![Live](https://img.shields.io/badge/live-mathieu--fournier.net%2Falfred-blue)](https://mathieu-fournier.net/alfred/)

---

## Overview

Alfred Status is a real-time monitoring dashboard that displays what an AI assistant is currently doing. It shows live status (idle / coding / thinking), current task description, and a chronological activity log — all pushed instantly via WebSocket.

The dashboard is publicly accessible at [mathieu-fournier.net/alfred](https://mathieu-fournier.net/alfred/).

**[FR]** Alfred Status est un dashboard de monitoring temps réel qui affiche l'activité d'un assistant IA en direct. Statut, tâche en cours et journal d'activité — mis à jour instantanément via WebSocket.

---

## Architecture

```
Shell script (alfred-status.sh)
        │
        ▼
    status.json  ←──────────────┐
        │                       │
        ▼                       │
 Bun HTTP Server           REST API (POST /status)
 + WebSocket (ws)               │
        │                  AI Agent (OpenClaw)
        ▼
  React Client
  ├── StatusCard     — idle / coding / thinking
  ├── StatsCard      — token usage + cost
  └── ActivityLog    — event timeline
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite |
| **Backend** | Bun (native HTTP + WebSocket) |
| **Real-time** | WebSocket (ws) — push, no polling |
| **State** | JSON file persistence (`status.json`) |
| **Hosting** | OVH VPS + Cloudflare Tunnel |
| **Integration** | Shell scripts called by the AI agent |

---

## Features

- **Live status indicator** — idle / coding / thinking with visual feedback
- **Current task display** — what the assistant is working on right now
- **Activity log** — chronological event history with timestamps
- **WebSocket push** — instant updates, no page refresh
- **Webhook API** — agent updates status via `POST /status` before and after each task
- **Public dashboard** — zero auth, accessible from anywhere

---

## Technical Highlights

- **Dual-runtime** — Bun server (TypeScript) for production, Node.js fallback
- **`useAlfred()` hook** — manages WebSocket connection, reconnection, and state hydration
- **File-based state** — `status.json` as single source of truth, written by shell scripts
- **Zero-config deployment** — runs behind Cloudflare Tunnel, no port forwarding needed
- **Shell integration** — `alfred-status.sh` called by the agent before/after every task

---

## Quick Start

```bash
# Backend
npm install
npm start          # port 3850

# Frontend (dev)
cd client && npm install && npm run dev

# Frontend (build)
cd client && npm run build
```

Copy `.env.example` → `.env` and fill in required values.

---

## Agent Integration

The AI agent updates its own status before and after each task:

```bash
alfred-status coding "Building feature X" "Started"
alfred-status idle "" "Feature X complete ✅"
alfred-status thinking "Analyzing codebase" "Reading files"
```

---

## Project Structure

```
alfred-status/
├── server.ts              # Bun HTTP + WebSocket server
├── server.js              # Node.js fallback
├── status.json            # Live state
└── client/src/
    ├── hooks/useAlfred.ts        # WebSocket hook
    └── components/
        ├── StatusCard.tsx
        ├── StatsCard.tsx
        └── ActivityLog.tsx
```

---

## Author

**Mathieu Fournier** · mathieufournierqc@outlook.com — [@Maaattqc](https://github.com/Maaattqc)

---

# Version française

Alfred Status est un dashboard de monitoring temps réel pour un assistant IA. Il affiche le statut en direct (idle/coding/thinking), la tâche en cours, et un journal d'activité — le tout mis à jour instantanément via WebSocket.

L'agent IA met à jour son propre statut avant et après chaque tâche grâce à un script shell. Le dashboard est accessible publiquement sur [mathieu-fournier.net/alfred](https://mathieu-fournier.net/alfred/).

**Stack:** React + TypeScript (frontend), Bun + WebSocket (backend), JSON file state, Cloudflare Tunnel (déploiement).
