# MISSION CONTROL — Antigravity Build Prompt (v2, upgraded)

> **How to use this file**
> 1. Create an empty repo. Paste **Part 0 (Master Brief)** into Antigravity first. Also save it in the repo as AGENTS.md (or your project rules file) so every agent reads it.
> 2. Then paste **Part 1 -> Part 9** one phase at a time. Each phase has acceptance criteria. Do not start the next phase until the current one passes.

---

# PART 0 — MASTER BRIEF

## 0.1 What we are building
Mission Control is an AI-powered, real-time satellite operations platform. It is a full-stack app (React + TypeScript, Node/Express, MongoDB, Socket.IO, Google Gemini) built for Supernova, a 30-hour space hackathon (UEM Kolkata, 3 Oct 2026).

## 0.2 The upgrade thesis (what makes this win)
Make the simulated telemetry physically consistent with the real orbit. AI is an operator, not a chatbot.

## 0.3 Two-tier data model
- Tracked catalogue (thousands of objects): TLE/GP data from CelesTrak. Propagated on the client in a Web Worker.
- Mission fleet (about 30 satellites): a curated subset with full simulated telemetry.

## 0.4 Tech stack
Monorepo (npm workspaces): /client, /server, /shared.
- Frontend: React 18 + TS + Vite, Tailwind CSS, Zustand, React Router, Socket.io-client, Three.js, Recharts.
- Backend: Node 20 + Express + TS, zod, MongoDB + Mongoose, Socket.IO, Google Gemini.
- Ops: pino, helmet, express-rate-limit, node-cron. Docker Compose.

## 0.5 Non-negotiable engineering rules
1. Demo resilience beats everything (offline seed snapshot).
2. CelesTrak etiquette (cache in Mongo).
3. Secrets: Gemini key on server only.
4. Types everywhere.
5. Performance budgets: 60 fps.
6. Accessibility floor.
7. Attribution.
8. Real README.

## 0.6 Design system
Color tokens: --abyss, --hull, --starlight, --dust, --ion, --nominal, --solar, --nova, --aurora.
Typography: IBM Plex Sans, JetBrains Mono, Unbounded.

