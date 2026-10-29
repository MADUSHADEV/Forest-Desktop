# Rule 03: Modular Architecture & Forest Mobile UI Fidelity

> **CORE PRINCIPLE**: Maintain strict process boundary separation and replicate the organic, calming, cozy aesthetics of the official Forest mobile app within desktop portrait dimensions.

## 1. Directory & Process Boundaries:
- `src/shared/`: Process-agnostic domain contracts, interfaces, and static catalogs (`types.ts`, `catalog.ts`). No Electron or Node.js runtime imports allowed.
- `src/main/`: Electron Main process only. Manages native window lifecycle, V8 flags, single-instance lock, SQLite database repository, and IPC handlers.
- `src/preload/`: ContextBridge bridge layer (`forestAPI`). Strictly exposes safe typed IPC invokers. No direct Node module leaks to the renderer.
- `src/renderer/`: Pure React 19 UI layer:
  - `state/`: Lightweight reactive observable store and selector hooks.
  - `components/layout/`: Mobile app shell, top header, navigation drawer, theme provider.
  - `modules/<feature>/`: Isolated feature modules (`timer`, `forest`, `timeline`, `tags`, `challenges`, `ambient`, `store`, `settings`).

## 2. Forest Mobile Aesthetic Standards:
- **Dimensions**: Portrait mobile ratio (Default `width: 420px, height: 780px`, minimum `380x680`).
- **Color Palette**:
  - Forest Deep Green: `#1E392A`, `#2D5A3F`, `#182E21`
  - Meadow Grass: `#4E7D55`, `#7CB342`, `#81C784`
  - Cream & Mint Highlights: `#F1F8F3`, `#E8F5E9`, `#C8E6C9`
  - Warm Sunlight Gold: `#FFD700`, `#FFA000`, `#F5A623`
- **Dynamic Theming**:
  - The window background gradient dynamically adapts to the user's active `LandStyle` (e.g., Lush Meadow, Zen Sand, Snowy Tundra, Midnight Bioluminescence).
- **Navigation Drawer**:
  - Smooth frosted slide-over drawer with backdrop blur and organic pill buttons.
  - Locked during active countdown focus sessions to preserve user commitment.
