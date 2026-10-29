# 🌲 Forest Desktop — Stay Focused, Be Present

<p align="center">
  <img src="assets/icon.png" width="100" height="100" alt="Forest Desktop Icon" style="border-radius: 20px;" />
</p>

<p align="center">
  <strong>A high-fidelity, memory-optimized desktop replica of the world-famous <a href="https://forestapp.cc/">Forest app</a>.</strong><br>
  Designed to cultivate deep focus, mindful productivity, and personal digital wellness with cozy portrait mobile proportions, dynamic land styling, and hardware-accelerated SVG animations.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Electron-45.1.0-47848F?style=flat-square&logo=electron&logoColor=white" alt="Electron" />
  <img src="https://img.shields.io/badge/React-19.0.0-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-6.0.3-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8.3.5-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/SQLite-better--sqlite3-003B57?style=flat-square&logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/RAM_Footprint-%3C130MB-2E7D32?style=flat-square" alt="Memory Budget" />
  <img src="https://img.shields.io/badge/Platform-Windows_x64-0078D6?style=flat-square&logo=windows&logoColor=white" alt="Windows" />
</p>

---

## 🌟 Key Architectural Highlights

- **⚡ Strict Memory Optimization (<130MB RAM Target)**:
  - **Zero Heavy Renderers**: No Three.js, WebGL, Canvas render loops, or heavy GPU shaders. All tree stages, land patches, charts, and grids are 100% pure scalable vector SVG with CSS hardware-accelerated transforms.
  - **Active View Mounting**: Inactive views are **completely unmounted** from the DOM (`activeView === 'timer' && <TimerView />`), eliminating invisible DOM node retention.
  - **Single Instance & V8 Flags**: Native single-instance lock and V8 memory caps (`--max-old-space-size=128`, `--disable-renderer-backgrounding`).

- **⏱️ Main-Process High-Precision Timer Engine**:
  - Singleton `TimerEngine` runs strictly in the Electron Main process using monotonic delta timing (`Date.now()`). Immune to Chromium renderer tab background throttling.
  - **Countdown Mode**: Interactive 10m–120m circular drag dial with 10-second grace cancel period and tree wither mechanics upon abandonment.
  - **Stopwatch Mode**: Open-ended count-up timer with a 10-minute minimum harvest threshold to prevent reward farming.
  - **Break Mode & Auto-Focus**: Configurable rest duration (5m–20m) with auto-start next session option.

- **🔔 Procedural Zero-Buffer Audio Synthesizer**:
  - Built-in Web Audio API nature sound generator (Rain, Wind, River, Forest Birds, Night Crickets) requiring **zero MP3/WAV files** or audio buffer RAM.
  - **Harmonic Break Chimes**: Soothing 3-tone Zen meditation chime (C5 → E5 → G5) on break start, and an energizing 4-tone alert chime (E5 → G5 → B5 → E6) on break expiration.
  - **YouTube Ambient Hub**: Memory-guarded YouTube ambient library safely opening in your default system browser.

- **💾 Fast Native SQLite Persistence (`better-sqlite3`)**:
  - Isolated strictly to the Main process with WAL mode and capped page cache (~2MB).
  - Renderer accesses data asynchronously through typed IPC ContextBridge channels (`window.forestAPI`).

---

## 📱 Modules & Features

| Module | Features & Capabilities |
| :--- | :--- |
| **🌱 Plant (Timer)** | Circular drag dial (10m–120m), Countdown & Stopwatch switcher, 5-stage SVG seedling-to-mature tree animation, tag selector, motivational quotes, and wither screen. |
| **🌲 Forest (Analytics)** | Isometric 2.5D land grid displaying healthy and withered trees. Day, Week, Month, and Year focus analytics with pure-SVG distribution bar charts and tag distribution meters. |
| **📜 Timeline** | Chronological focus session log with tree species, tags, duration, coin earnings, and editable reflection notes. |
| **🏷️ Tags Manager** | Full CRUD for custom focus categories (Work, Study, Design, Reading, Sport, etc.) with custom color palettes. |
| **🏆 Challenges** | Gamified focus milestones (Seed Planter, Deep Roots, Unbroken Zen, Seasonal Botanist, etc.) with claimable coin rewards. |
| **🎧 Ambient Sounds** | Procedural Web Audio Nature soundscapes + YouTube Music ambient library with volume dock and timer auto-sync. |
| **🛍️ Store & Nursery** | Rich botanical catalog across **18 Tree Species** (Classic, Plus, Seasonal) and **8 Land Styles** with atomic coin transactions. |
| **⚙️ Settings & Diagnostics** | Live preferences, RAM & V8 heap telemetry inspector, break chimes test panel, and test coin grant. |

---

## 🎨 Botanical & Land Styles Catalog

- **Classic Tree Species**: Cedar, Oak Bush, Pine, Sunflower, Lemon Tree, Emerald Bamboo.
- **Exclusive Plus Species**: Cherry Blossom (Sakura), Weeping Wisteria, Mystic Crystal Tree, Golden Ginkgo, Ancient Baobab, Celestial Starlight Banyan.
- **Seasonal Species**: Autumn Crimson Maple, Winter Frost Pine, Halloween Lantern Tree, Spring Pastel Tulip, Festive Starlight Fir, Summer Coconut Palm.
- **Land Styles**: Lush Meadow (`#51a387`), Woodland Clearing, Zen Sand Garden, Midnight Bioluminescence, Floating Sky Sanctuary, Snowy Winter Tundra, Autumn Harvest Field, Sakura Petal Grove.

---

## 📂 Project Architecture Map

```
Forest-Desktop/
├── .agent/
│   ├── rules/                              # Governance & memory protocols
│   │   ├── 01-mandatory-plan-protocol.md
│   │   ├── 02-memory-optimization.md
│   │   └── 03-modular-architecture-and-ui.md
│   └── workflows/
│       └── plan.md                         # Pre-task architectural planning workflow
├── assets/                                 # Production Windows icons (icon.ico, icon.png)
├── src/
│   ├── main/                               # Electron Main Process
│   │   ├── database/                       # better-sqlite3 schema, migrations & seed
│   │   ├── ipc/                            # Typed IPC handlers connecting Main to DB
│   │   ├── services/                       # TimerEngine & native Tray/Notification integration
│   │   └── main.ts                         # Window lifecycle, V8 flags & single-instance lock
│   ├── preload/                            # ContextBridge IPC isolation
│   │   └── preload.ts                      # window.forestAPI exposure
│   ├── shared/                             # Process-agnostic contracts & catalogs
│   │   ├── types.ts                        # Universal domain interfaces
│   │   └── catalog.ts                      # Botanical & Land catalogs
│   └── renderer/                           # Pure React 19 UI
│       ├── components/                     # AppShell, NavDrawer, pure-SVG trees & grids
│       ├── modules/                        # Isolated view modules (timer, forest, store, etc.)
│       ├── services/                       # Web Audio nature synth & break alarm chimes
│       ├── state/                          # Lightweight observable store (useSyncExternalStore)
│       └── renderer.tsx                    # Root React mounting
├── forge.config.mts                        # Squirrel.Windows packaging & native module hooks
├── vite.main.config.mts                    # Rollup externals (better-sqlite3, squirrel-startup)
├── vite.preload.config.mts                 # Preload bundler config
├── vite.renderer.config.mts                # Vite React plugin config
└── tsconfig.json                           # TypeScript 6 strict configuration
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v20 or higher
- **npm**: v10 or higher
- **OS**: Windows 10/11 x64 (primary target), macOS or Linux for development

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/forest-desktop.git
cd forest-desktop

# Install project dependencies
npm install
```

---

## 🛠️ Development & Build Commands

| Command | Description |
| :--- | :--- |
| **`npm run start`** | Launches the Vite dev server with hot reload and boots the Electron desktop app. |
| **`npm run typecheck`** | Validates TypeScript types across the entire project with zero emit (`tsc --noEmit`). |
| **`npm run package`** | Packages the Electron executable into `out/Forest Desktop-win32-x64/` with ASAR compression. |
| **`npm run make`** | Generates the official Squirrel.Windows installer (`Forest Desktop Setup.exe`, `.nupkg`, `RELEASES`). |

---

## 📦 Production Installer Output

Running `npm run make` builds production distributables inside:

```
out/make/squirrel.windows/x64/
├── Forest Desktop Setup.exe         # Standalone Windows installer with sprout icon
├── ForestDesktop-1.0.0-full.nupkg   # NuGet release package
└── RELEASES                         # Squirrel version index & delta update hash
```

---

## ⌨️ Desktop Keyboard Shortcuts

- <kbd>Escape</kbd>: Go back to previous screen (or close navigation drawer if open).
- <kbd>Space</kbd>: Start / Pause focus timer (when on Timer view).

---

## 📜 License

This project is open-source under the [MIT License](LICENSE). Inspired by the official Forest mobile app by Seekrtech.
