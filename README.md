# ES Bot

Front-end for **ES Bot — AI teammates with a transparent, controllable harness**, built from the
"ES Bot — App Design" canvas (10 desktop + 10 mobile screens).

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Structure

- `tailwind.config.ts` — design tokens (colors, fonts, rings/shadows). Type: IBM Plex Sans Thai + IBM Plex Mono.
- `src/components/ui` — shared kit: Button/ButtonLink, IconButton/IconLink, Icon, Pill, Card, StatTile, KeyValue, Meter, Segmented, Switch, Bubble, Composer, avatars.
- `src/components/layout` — DesktopPage, PageHeader, MobileScreen (390-wide phone frame on large screens), MobileTabBar.
- `src/lib` — `routes.ts` (one route per artboard), `data.ts` (shared demo content), `cn.ts` (clsx + tailwind-merge).
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
