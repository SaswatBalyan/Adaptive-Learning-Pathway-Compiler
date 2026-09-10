# ALPC — Execution Plan (skill-mapped)

Greenfield build of the Adaptive Learning Pathway Compiler: Flex + Bison + LLVM C++
pipeline for Path-Lang, scoped to BCSE307P experiments 7–10.

Environment decision: install MSYS2 + LLVM via winget; build/run/test locally on Windows.
Spec-gap decision: pick sensible defaults, document them in `SPEC.md`, proceed.

Skills referenced below are from the `agent-skills` plugin unless noted.

| Phase | Goal | Primary skill(s) | Key deliverables | Maps to |
|---|---|---|---|---|
| **0. Environment & foundation** | Working toolchain + repo scaffold + quality bar | `agent-skills:constraints`, `init` | MSYS2/LLVM installed, `Makefile` stub, `CLAUDE.md`, `CONSTRAINTS.md`, dir layout, git | infra |
| **1. Spec & task breakdown** | Close PRD ambiguities; ordered backlog | `agent-skills:spec`, then `agent-skills:plan` | `SPEC.md` (grammar EBNF, token table, scoring model, GOTO / Backward-Design rules, `; b` semantics, error handling), `docs/TASKS.md` | all Epics |
| **2. Lexer** | Tokenize Path-Lang incl. `; b` | `agent-skills:test` (fixtures first) → `agent-skills:build` | `src/scanner.l`, `--dump-tokens` mode, token-stream fixtures | Exp 7 (Flex), Epic 1 |
| **3. Parser + Backward Design** | CFG + outcome-ordering check + error recovery | `agent-skills:source-driven-development` (Bison manual) + `agent-skills:test` → `agent-skills:build` | `src/parser.y`, outcome registry, `--parse-trace` mode, valid/invalid fixtures | Exp 7 (Bison), Epic 1 |
| **4. AST + RTTI** | Node hierarchy, LLVM-style `classof`/`isa<>`/`dyn_cast<>`, traversal | `agent-skills:api-and-interface-design` + `agent-skills:test` → `agent-skills:build` | `src/ast.h`, `src/ast.cpp`, `--dump-ast` mode, RTTI/traversal unit tests | Exp 8, Epic 2 |
| **5. LLVM IR codegen** | Lower AST → `pathway.ll` (alloca/store, icmp/br, basic blocks) | `agent-skills:source-driven-development` (LLVM C++ API / Kaleidoscope) → `agent-skills:build`, `agent-skills:debugging-and-error-recovery` for verifier bugs | `src/codegen.cpp`, valid `.ll` passing `opt -verify` | Exp 9, Epic 3 |
| **6. Binary output + end-to-end** | `; b` → binary print; one-command build & run | `agent-skills:test` (0,1,15,255) → `agent-skills:build` | `@print_binary` IR, `examples/pathway.edu`, working `Makefile`, executable prints `1111` | Exp 10, Epic 4 |
| **7. Review & simplify** | Correctness/readability/arch/security/perf pass, then trim | `agent-skills:review` (or `/code-review`) → `agent-skills:code-simplify` | review report, fixes applied | quality |
| **8. Demo readiness** | Evaluator walkthrough of all 5 artifacts in one run | `agent-skills:ship` + `agent-skills:documentation-and-adrs` | `README.md`, `docs/DEMO.md` (step → Exp mapping), ADRs for grammar/scoring choices | Success Metrics |

## Gap resolutions to be finalized in Phase 1 (`SPEC.md`)

- **Arithmetic / Fusion Function** — PRD codegen wants `skill + 10` but §4.2 grammar has none.
  Default: extend `profile_stmt` and add an `update_stmt` → `SET IDENT (ASSIGN | PLUS_ASSIGN | MINUS_ASSIGN) NUMBER SEMI`;
  the Fusion Function is the accumulated effect of these on the student-state variable.
- **Score model** — Default: single i32 `alignment_score`, starts at 0; each `SET x = n` seeds a
  named slot, arithmetic updates mutate it, the last-updated value is the Alignment Score.
- **GOTO semantics** — Default: `GOTO IDENT` targets a declared `OUTCOME` label; lowered as an LLVM
  `br` to that outcome's basic block. Backward-Design check applies to GOTO targets too.
- **Error handling** — Default: Bison `error` productions + `%destructor`; one clear diagnostic
  line (`line N: <message>`), non-zero exit, no crash.

## Cadence

Each phase: land code in small commits, keep the build warning-free, keep every prior
`--dump-*` mode working, then report the phase's demo artifact before moving on.
