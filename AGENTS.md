# AGENTS.md — Forest Desktop Project Governance & Architecture

> **MANDATORY AGENT RULE**: Before starting ANY task or writing ANY code, you MUST read all rule files inside the `.agent/rules/` directory (`01-mandatory-plan-protocol.md`, `02-memory-optimization.md`, `03-modular-architecture-and-ui.md`) and execute the `/plan` workflow defined in `.agent/workflows/plan.md`.

---

## 1. Project Overview
Forest Desktop is a high-fidelity, memory-optimized desktop replica of the mobile **Forest app** (https://forestapp.cc/).
- **Runtime**: Electron 45 + Vite 8 + TypeScript 6 + React 19.
- **Persistence**: SQLite (`better-sqlite3`) in Electron Main process with WAL mode and ~2MB page cache cap.
- **Memory Target**: <130MB total combined RAM footprint.
- **Aesthetic**: Cozy portrait mobile proportions (420x780), organic earth tones, dynamic land gradients, vector SVG trees, and smooth hardware-accelerated transitions.

---

## 2. Directory Architecture Map

```
Forest-Desktop/
├── .agent/
│   ├── rules/
│   │   ├── 01-mandatory-plan-protocol.md   # Pre-task planning protocol
│   │   ├── 02-memory-optimization.md       # <130MB RAM target, DOM unmounting, SVG only
│   │   └── 03-modular-architecture-and-ui.md # Process isolation & Forest UI aesthetic
│   └── workflows/
│       └── plan.md                         # /plan architectural planning workflow
├── src/
│   ├── main/                               # Electron Main Process
│   │   ├── database/
│   │   │   └── db.ts                       # SQLite repository, schema, seed data, WAL pragma
│   │   ├── ipc/
│   │   │   └── handlers.ts                 # Typed IPC handlers connecting Main to DB
│   │   └── main.ts                         # V8 flags, single instance, 420x780 window
│   ├── preload/                            # Electron Preload ContextBridge
│   │   └── preload.ts                      # window.forestAPI exposure
│   ├── shared/                             # Universal Domain Contracts & Catalogs
│   │   ├── types.ts                        # TypeScript domain interfaces
│   │   └── catalog.ts                      # Classic, Plus, Seasonal trees & lands
│   └── renderer/                           # Pure React 19 UI
│       ├── state/                          # Lightweight external store (useSyncExternalStore)
│       │   └── forestStore.ts
│       ├── components/                     # Shared UI & Shell Layout
│       │   └── layout/
│       │       ├── AppShell.tsx            # Forest mobile shell, header bar, dynamic theme
│       │       └── NavDrawer.tsx           # Frosted mobile slide-out navigation drawer
│       ├── modules/                        # Feature-specific view modules
│       │   ├── timer/                      # Plant / Timer stage
│       │   ├── forest/                     # Isometric forest & land overview
│       │   ├── timeline/                   # History & daily logs
│       │   ├── tags/                       # Tag manager
│       │   ├── challenges/                 # Focus milestones
│       │   ├── ambient/                    # Nature & YouTube music player
│       │   ├── store/                      # Tree & Land store
│       │   └── settings/                   # Live SQLite preferences
│       ├── index.css                       # Forest typography, scrollbars, resets
│       └── renderer.tsx                    # Root React mounting
├── forge.config.mts                        # Electron Forge configuration
├── vite.main.config.mts                    # Rollup external: ['better-sqlite3']
├── vite.preload.config.mts                 # Preload bundler config
├── vite.renderer.config.mts                # Vite React plugin config
└── tsconfig.json                           # TypeScript configuration
```

---

## 3. Standard Development Commands

| Command | Purpose |
| :--- | :--- |
| `npm run typecheck` | Validates TypeScript types across the entire project with zero emit |
| `npm run start` | Launches Vite dev server and starts Electron with hot-reload |
| `npm run package` | Builds production bundles and packages the Electron executable |
| `npm run make` | Generates distributable installers (Squirrel, ZIP) |

---

## 4. Key Engineering Constraints
1. **Never import `better-sqlite3` in `src/renderer/` or `src/preload/`**: Native SQLite belongs strictly in `src/main/database/db.ts`.
2. **Never hide inactive views with `display: none`**: Always conditionally unmount inactive modules to save memory.
3. **Clean up all timers**: All `setInterval`, `setTimeout`, and animation loops must be cancelled in component cleanup functions.
4. **Adhere to the Forest Design Language**: Maintain the natural forest palette, rounded pill buttons, subtle shadows, and calm focus atmosphere.
