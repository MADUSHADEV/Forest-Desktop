# Rule 02: Strict Memory Optimization (<130MB RAM Target)

> **CORE PRINCIPLE**: Forest Desktop is a lightweight background companion app. Its combined Electron Main and Renderer process memory footprint must remain under **130MB total RAM** at all times.

## Strict Guidelines:

1. **Rendering & Graphics**:
   - **Never** use heavy 3D engines, Three.js, Babylon.js, WebGL renderers, or unconstrained Canvas rendering loops.
   - Use clean, scalable **vector SVG** and lightweight, hardware-accelerated CSS transitions (`transform: translate3d(x, y, 0)`, `opacity`).
   - Prevent layout thrashing and forced synchronous reflows.

2. **DOM Lifecycle & View Unmounting**:
   - **Inactive views MUST be completely unmounted from the DOM**.
   - **Never** hide inactive tabs using CSS `display: none` or `visibility: hidden`, as hidden DOM trees continue consuming memory.
   - Use conditional rendering (`activeView === 'timer' && <TimerView />`).

3. **Lifecycle Cleanup**:
   - Every `useEffect` that creates an `interval`, `timeout`, animation frame, DOM event listener, or IPC listener **MUST** return a clean teardown function that cancels/removes it on component unmount.
   - Avoid memory leaks from lingering closures or unbound event listeners.

4. **Database & IPC Isolation**:
   - All SQLite queries and mutations **MUST** remain exclusively in the Electron Main process (`src/main/database/db.ts`).
   - Always use prepared statements (`db.prepare(...)`) with parameter binding.
   - The SQLite page cache is capped at ~2MB (`PRAGMA cache_size = -2000;`).
   - Renderer accesses database strictly through asynchronous IPC ContextBridge calls (`window.forestAPI`).

5. **State Management**:
   - Use zero-bloat state management (`useSyncExternalStore` or minimal observable store).
   - Component subscriptions must use targeted selectors so components re-render only when their specific slice of state changes.
