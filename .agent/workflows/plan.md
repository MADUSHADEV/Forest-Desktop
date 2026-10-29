---
description: Execute architectural planning and memory impact analysis before writing code
---

# /plan Workflow: Architectural Planning & Memory Impact Protocol

Whenever `/plan` is invoked, or before beginning ANY implementation or modification task in this codebase, the agent MUST execute the following protocol:

1. **Governance & Rule Review**:
   - Read `AGENTS.md` at the project root.
   - Read all modular rule files in `.agent/rules/`:
     - `.agent/rules/01-mandatory-plan-protocol.md`
     - `.agent/rules/02-memory-optimization.md`
     - `.agent/rules/03-modular-architecture-and-ui.md`

2. **Scoped Codebase Inspection**:
   - Inspect only the files and modules directly relevant to the current task.
   - Do not perform unnecessary or excessive global file scans.

3. **Produce Structured Implementation Plan**:
   Before modifying or creating any code, formulate and output a concise plan containing:
   - **Task Objective**: Clear summary of what is being achieved.
   - **Affected Files**: Explicit list of files to create, modify, or delete.
   - **IPC & Database Impact**: Any new IPC channels, SQLite queries, schema changes, or prepared statements.
   - **Memory Footprint Check**: Verification against the <130MB RAM budget (DOM node cleanup, absence of heavy Canvas/WebGL render loops, unmounting inactive views, listener cleanup).
   - **Verification Steps**: Specific TypeScript checks and runtime test behaviors to confirm zero regressions.

4. **Execution & Validation**:
   - Execute file modifications strictly following the plan.
   - Run `npm run typecheck` to verify zero TypeScript errors.
   - Verify runtime behavior and database persistence.
