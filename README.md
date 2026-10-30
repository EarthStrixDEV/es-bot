# ES Bot

Front-end for **ES Bot — AI teammates with a transparent, controllable harness**, built from the
"ES Bot — App Design" canvas (10 desktop + 10 mobile screens).

```bash
npm install
npm run dev:server   # gateway on :8787 (mock model, connectors and LINE unless keys are set)
npm run dev          # http://localhost:5173 — proxies /api to the gateway
npm test             # harness tests (policy, approval, budget, broker, gateway, full runs)
npm run typecheck
```

Without the gateway running, every screen shows the design's demo state. With it, the Workspace
(`/`) is live: send *"ดึงร้านอาหารในชลบุรีจาก Google Sheet แล้วร่างข้อความ LINE OA …"* to watch a run
plan, wait for approval, send a canary and finish. Copy `.env.example` to `.env` for real services.

## Harness — phase 1 (MVP)

Built from "ES Bot — Workflow, Modules & System Design"; decisions are in
[`docs/adr/0001-mvp-harness-architecture.md`](docs/adr/0001-mvp-harness-architecture.md).

| Module | Where | What it guarantees |
|---|---|---|
| Gateway | `server/src/gateway` | bearer auth, rate limit, REST + WebSocket `/api/events` |
| Orchestrator | `server/src/orchestrator` | plan → policy → checkpoint → tool + lease → audit; every transition persisted, resumes after restart |
| Policy Engine | `server/src/policy` | hard deny → budget → passport → trust ladder → risk → auto-review (only stricter) |
| Approval Service | `server/src/approval` | pending → escalated (30 min, LINE) → paused (2 h); canary; bound to payload hash |
| Budget Meter | `server/src/budget` | `reserve()` / `commit()`, hard stop at the run cap |
| Credential Broker | `server/src/credentials` | AES-256-GCM vault, 5-minute single-use leases |
| Connector Gateway | `server/src/connectors` | tools start disabled, injection scan, `desc_hash` re-check, output redaction, MCP client |
| Audit Log | `server/src/audit` | append-only (SQLite triggers; Postgres trigger in the migration) |

Connectors: Google Sheets, ES Account CRM, LINE OA (+ the Bot's own Workspace for drafts).
Persistence: SQLite via `node:sqlite` now; `server/db/migrations/001_init.sql` is the Supabase schema with RLS.
Not in phase 1 (per the doc): sandbox, rollback, side chat, fork, model router, verifier.

## Structure

- `tailwind.config.ts` — design tokens (colors, fonts, rings/shadows). Type: IBM Plex Sans Thai + IBM Plex Mono.
- `src/components/ui` — shared kit: Button/ButtonLink, IconButton/IconLink, Icon, Pill, Card, StatTile, KeyValue, Meter, Segmented, Switch, Bubble, Composer, avatars.
- `src/components/layout` — DesktopPage, PageHeader, MobileScreen (390-wide phone frame on large screens), MobileTabBar.
- `src/lib` — `routes.ts` (one route per artboard), `data.ts` (shared demo content), `cn.ts` (clsx + tailwind-merge), `api.ts` + `useBotThread.ts` (gateway client).
- `src/screens/desktop`, `src/screens/mobile` — one file per screen.

## Routes

| Desktop | | Mobile | |
|---|---|---|---|
| `/` | Workspace + Session rail | `/m` | Bot list |
| `/passport` | Bot Passport | `/m/chat` | Chat + approval |
| `/runs/run_0412` | Run Inspector | `/m/side-chat` | Side chat sheet |
| `/side-chat` | Side Chat | `/m/rail` | Session rail |
| `/fork` | Fork Session | `/m/fork` | Fork Session |
| `/artifacts` | Artifacts | `/m/passport` | Bot Passport |
| `/images` | Image Preview | `/m/artifact` | Artifact |
| `/settings` | Settings | `/m/image` | Image Preview |
| `/connectors` | MCP Connectors | `/m/model` | Model selector |
| `/models` | Model Selector | `/m/settings` | Settings + Connectors |

Values the design leaves open stay as `[placeholders]` (prices, totals, images).
