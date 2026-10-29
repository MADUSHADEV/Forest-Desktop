# Rule 01: Mandatory Plan Protocol

> **CRITICAL DIRECTIVE**: Before starting EVERY development task or writing ANY code, you MUST execute the `/plan` action protocol defined in `.agent/workflows/plan.md`.

## Enforcement Rules:
1. **Never jump straight to writing code**:
   - Always analyze requirements first and output a structured **Implementation Plan** before writing, editing, or deleting files.
2. **Review All Project Rules**:
   - Verify compliance against `.agent/rules/02-memory-optimization.md` and `.agent/rules/03-modular-architecture-and-ui.md`.
3. **Plan Structure Required**:
   - **Task Objective**
   - **Affected Files**
   - **IPC & Database Impact**
   - **Memory Footprint Check (<130MB Budget)**
   - **Verification Steps**
4. **No Premature Optimization or Bloat**:
   - Keep architectural additions minimal, type-safe, and directly tied to the task objectives.
