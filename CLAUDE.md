# ALPC — Adaptive Learning Pathway Compiler

A Flex + Bison + LLVM C++ compiler for **Path-Lang**, a DSL for student profiles and
adaptive branching logic. Built for the BCSE307P Compiler Design Lab (experiments 7–10).
Pipeline: `pathway.edu` → lexer → parser (+ Backward-Design check) → AST (LLVM-style RTTI)
→ LLVM IR codegen → executable that prints an Alignment Score (in binary when a statement
ends with `; b`).

## Source of truth

- `README.md` — build, run, layout, LLVM-version note
- `docs/DEMO.md` — the evaluator walkthrough (all five artifacts, one run)
- `PRD_Adaptive_Learning_Pathway_Compiler.md` — product requirements
- `document-export-*.md` — PRD + the 30-hour implementation plan (gap tables, schedules)
- `docs/EXECUTION_PLAN.md` — the phase-by-phase build plan and which skill drives each phase
- `SPEC.md` — Path-Lang grammar + semantics, including decisions that close PRD gaps
- `tasks/plan.md` + `tasks/todo.md` — dependency graph, vertical slices, checkpoints, backlog
- `docs/adr/` — architecture decision records

## Quality bar

Read **`CONSTRAINTS.md`** before changing code. Never weaken a constraint (silence a
warning, skip/delete a test, edit a threshold down, stub-and-move-on) to make a change
pass — fix the code or raise it with the user.

## Build & check (once toolchain is installed)

MSYS2 mingw64 provides `flex`, `bison`, `make`, `g++`, `clang`, `llvm-as`, `opt`, `lli`.
Add `C:\msys64\mingw64\bin` and `C:\msys64\usr\bin` to PATH.

| Command | What it does |
|---|---|
| `make` | Build the `alpc` compiler (`-Wall -Wextra -Werror` on our sources) |
| `make check` | Build + run all fixtures (`tests/run.sh`) — the task-end gate, <90 s |
| `make check-full` | `test-asan` + `cppcheck` + `demo` + fixture-coverage report |
| `make demo` | Compile & run `examples/pathway.edu`, diff against `.expected` |
| `./alpc --dump-tokens FILE` | Exp 7 artifact: token stream |
| `./alpc --parse-trace FILE` | Exp 7 artifact: parse trace |
| `./alpc --dump-ast FILE` | Exp 8 artifact: AST dump |
| `./alpc --emit-ir FILE` | Exp 9 artifact: `pathway.ll` |
| `./alpc FILE && ./pathway` | Exp 10 artifact: console output (binary on `; b`) |

## Conventions

- C++17. Hand-written code in `src/*.cpp` / `src/*.h`; Flex/Bison generated sources are
  build artifacts (git-ignored), warning-exempt.
- Every phase keeps all earlier `--dump-*` / `--*-trace` modes working.
- One clear diagnostic line for bad input: `line N: <message>`, non-zero exit, no crash.
