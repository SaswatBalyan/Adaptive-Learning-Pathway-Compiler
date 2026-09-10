# SPEC — Adaptive Learning Pathway Compiler (ALPC) & the Path-Lang language

Status: **draft for review** (2026-09-11). Decisions marked **[D]** close gaps the PRD left
open; they were chosen as the simplest defensible option per the user's instruction and are
open to change. Everything else is derived from `PRD_Adaptive_Learning_Pathway_Compiler.md`
and the 30-hour plan in `document-export-*.md`.

---

## 1. Objective

Build `alpc`, a command-line compiler that translates a Path-Lang source file
(`*.edu`) into LLVM IR and a runnable program, walking through — and independently
demonstrating — every classic compiler phase: lexing (Flex), parsing (Bison),
AST + RTTI, and LLVM IR code generation. Scoped to ≤30 hours and to BCSE307P
experiments 7–10.

**Users:** the lab student (implementer/demonstrator), the faculty evaluator (checks each
experiment), and — conceptually — an educator who would write Path-Lang.

**Not building:** a runtime service, a real adaptive-learning engine, optimization passes,
a standard library, or any language feature beyond §3.

---

## 2. The Path-Lang language

### 2.1 Program shape

A program is a sequence of statements. Following **Backward Design** (Wiggins & McTighe:
define desired results before planning activities), every learning **outcome** must be
declared before any adaptive rule branches to it.

```
# comment to end of line
OUTCOME remedial;
OUTCOME core;
OUTCOME advanced;

SET grade_level = 5;
SET performance = 60;

SET state = 0;
SET state += 15;

IF performance < 70 GOTO remedial;
IF performance > 85 GOTO advanced;

OUTCOME core; b
```

### 2.2 Lexical grammar (`scanner.l`, Exp 7 / Flex)

| Token | Pattern | Notes |
|---|---|---|
| `SET` | `SET` | keyword |
| `IF` | `IF` | keyword |
| `GOTO` | `GOTO` | keyword |
| `OUTCOME` | `OUTCOME` | keyword |
| `IDENT` | `[A-Za-z_][A-Za-z0-9_]*` | matched after keywords |
| `NUMBER` | `[0-9]+` | non-negative i32 literal |
| `LT` `GT` `EQ` | `<` `>` `==` | relational operators |
| `ASSIGN` | `=` | first assignment / declaration |
| `ADD_ASSIGN` `SUB_ASSIGN` | `+=` `-=` | Fusion-Function updates |
| `SEMI` | `;` | plain statement terminator |
| `SEMI_B` | `;[ \t]*b` | **[D]** binary-output terminator; also accepts `;b` |
| — | `#[^\n]*` | comment, discarded |
| — | `[ \t\r\n]+` | whitespace, discarded |
| — | any other char | lexical error: `line N: unexpected character '<c>'` |

`--dump-tokens` prints one `TYPE  lexeme  (line N)` per line, ending with `EOF`.

### 2.3 Context-free grammar (`parser.y`, Exp 7 / Bison, LALR(1), zero conflicts)

```
program     : stmt_list
stmt_list   : stmt_list stmt
            | stmt
stmt        : outcome_stmt
            | set_stmt
            | branch_stmt
outcome_stmt: OUTCOME IDENT term
set_stmt    : SET IDENT set_op NUMBER term
set_op      : ASSIGN | ADD_ASSIGN | SUB_ASSIGN
branch_stmt : IF IDENT rel NUMBER GOTO IDENT term
rel         : LT | GT | EQ
term        : SEMI | SEMI_B
```

Error recovery: `stmt : error term` — on a malformed statement, emit one diagnostic,
skip to the next terminator, continue; exit non-zero. No crash (Floor F4).

`--parse-trace` prints each reduction (`reduce: set_stmt -> SET IDENT set_op NUMBER term`).

### 2.4 Static semantics (semantic actions in `parser.y`)

Checked as the parse proceeds, so the source order is what matters:

1. **Backward Design** — the `IDENT` after `GOTO` must already have appeared in an
   `outcome_stmt`. Otherwise:
   `line N: Backward Design violation: 'X' is referenced before it is declared as an OUTCOME`
2. **Outcome uniqueness** — declaring the same outcome name twice:
   `line N: outcome 'X' is already declared`
3. **Variable-before-use** **[D]** — the `IDENT` in an `IF` condition must have been
   introduced by an earlier `SET IDENT = ...`:
   `line N: 'X' is used in a condition before it is set`
4. **Update-before-declare** **[D]** — `SET x += n` / `SET x -= n` requires an earlier
   `SET x = n`: `line N: 'X' is updated before it is set`
5. Reserved name **[D]** — `state` is the distinguished Student-State variable (§2.5); it
   may be `SET`/updated but not used as an outcome name.

Any violation ⇒ compilation fails after parsing (non-zero exit), no IR emitted.

### 2.5 Dynamic semantics — the Student State / Fusion Function **[D]**

- One distinguished i32 variable **`state`** = the *Student State* / *Alignment Score*,
  initialized to `0`.
- `SET state = n` sets it; `SET state += n` / `SET state -= n` is the **Fusion Function**
  (`state ← state ± n`).
- `SET <other> = n` declares an auxiliary **profile** variable (`grade_level`,
  `performance`, …), i32, usable only in `IF` conditions. Updates to profile vars are
  allowed but do not affect `state`.
- `IF v REL n GOTO L` — evaluate `v REL n`; if true, transfer control to outcome `L`.
- Reaching any `OUTCOME` (by GOTO or fall-through) **ends the pathway**. The
  Alignment Score is the value of `state` at that point.
- If **any** statement in the program used the `; b` terminator, the program prints the
  final Alignment Score as a binary string (no leading zeros; `0` prints as `0`),
  followed by a newline. Otherwise it prints the score in decimal.
- Worked example: profile `performance = 60`; `state` 0 → `+= 15` → 15; `IF 60 < 70`
  true ⇒ GOTO `remedial`; pathway ends; `; b` present ⇒ prints `1111`.

---

## 3. Functional requirements → acceptance criteria

| # | Requirement | Acceptance check | PRD epic |
|---|---|---|---|
| R1 | Lexer recognizes every §2.2 token incl. `; b` | `--dump-tokens` on `tests/fixtures/valid/*` matches `*.tokens` golden files | Epic 1 |
| R2 | Parser accepts the §2.3 grammar, 0 Bison conflicts | `bison` clean (Floor F2); `--parse-trace` matches golden | Epic 1 |
| R3 | Backward Design violation rejected | `tests/fixtures/invalid/backward_design.edu` → exact diagnostic, exit≠0, no crash | Epic 1 |
| R4 | Malformed input → clear error, no crash | every `invalid/*.edu` → one `line N:` diagnostic, exit≠0 (Floor F4) | Epic 1 |
| R5 | AST models profile-set, conditional-branch, outcome nodes | `--dump-ast` matches golden tree | Epic 2 |
| R6 | LLVM-style RTTI (`classof` + `isa<>`/`dyn_cast<>`) used in traversal | `tests/unit_ast` asserts pass under ASan/UBSan (Floor F7) | Epic 2 |
| R7 | Traversal visits every node of a multi-statement pathway | `--dump-ast` node count == statement count on fixtures | Epic 2 |
| R8 | IR for `SET` + arithmetic (`alloca`/`store`/`add`/`sub`) | `--emit-ir` output contains the ops; `opt -passes=verify` clean (Floor F3) | Epic 3 |
| R9 | IR for `IF…GOTO` via `icmp` + `br` + basic blocks | generated `.ll` shows labeled blocks + conditional `br` | Epic 3 |
| R10 | `.ll` valid & inspectable | `llvm-as` + `opt -passes=verify` succeed | Epic 3 |
| R11 | IR reflects the correct final Alignment Score | `lli pathway.ll` output == expected | Epic 3 |
| R12 | End-to-end `examples/pathway.edu` compiles + runs | `make demo` diff-clean (Floor F6) | Epic 4 |
| R13 | `; b` prints correct binary | fixtures for `0→0`, `1→1`, `15→1111`, `255→11111111` | Epic 4 |
| R14 | Full pipeline shown in one run | `docs/DEMO.md` script: tokens → trace → AST → `.ll` → console | Epic 4 |

---

## 4. Commands

| Command | Purpose |
|---|---|
| `make` | build `./alpc` (`-std=c++17 -Wall -Wextra -Werror` on `src/*.cpp`) |
| `make check` | `make` + `tests/run.sh` — task-end gate (<90 s) |
| `make check-full` | `make test-asan` + `cppcheck` + `make demo` + fixture-coverage report |
| `make demo` | `./alpc examples/pathway.edu > pathway.ll && lli pathway.ll` vs `.expected` |
| `make test-asan` | build `alpc` + `tests/unit_ast` with `-fsanitize=address,undefined`, run fixtures |
| `make clean` | remove build artifacts + generated Flex/Bison sources |
| `./alpc --dump-tokens FILE` | Exp 7 artifact — token stream |
| `./alpc --parse-trace FILE` | Exp 7 artifact — parse/reduction trace |
| `./alpc --dump-ast FILE` | Exp 8 artifact — indented AST, RTTI-driven |
| `./alpc --emit-ir FILE` (default) | Exp 9 artifact — LLVM IR to stdout |
| `./alpc --help` | usage |

Exit codes: `0` ok, `1` lexical/syntax/semantic error, `2` bad CLI usage, `3` internal error.

---

## 5. Project structure

```
src/
  scanner.l          Flex lexer  (generated -> lex.yy.c, git-ignored)
  parser.y           Bison grammar + semantic checks (-> parser.tab.{c,h})
  ast.h  ast.cpp     ASTNode hierarchy, NodeKind enum, classof/isa/dyn_cast, dump, free
  codegen.h codegen.cpp   AST -> llvm::Module (IRBuilder), @print_binary loop
  diagnostics.h diagnostics.cpp   line-tracked error reporting, exit-code policy
  driver.cpp         mode dispatch
  main.cpp           CLI parsing -> driver
tests/
  run.sh             fixture runner (+ --coverage-report)
  unit_ast.cpp       assert-based RTTI / traversal tests (no framework)
  fixtures/valid/    NAME.edu + NAME.tokens + NAME.ast + NAME.expected
  fixtures/invalid/  NAME.edu + NAME.err   (expected diagnostic substring)
examples/
  pathway.edu        the demonstration program
  pathway.expected   its console output ("1111")
docs/
  EXECUTION_PLAN.md  phase plan + skill mapping
  DEMO.md            evaluator walkthrough (written in Phase 8)
  adr/               architecture decision records
Makefile
CONSTRAINTS.md  CLAUDE.md  SPEC.md
```

Build order (each phase depends on the previous): `diagnostics` → `scanner` →
`parser` → `ast` → `codegen` → `driver`/`main` → `examples` + `demo`.

---

## 6. Code style

- C++17. No exceptions across the Flex/Bison boundary; return-code + diagnostics instead.
- AST nodes: plain structs under a base `ASTNode` with a `NodeKind kind` set by the
  protected base ctor; ownership via `std::unique_ptr` in a single `std::vector<Stmt>`
  program root (no cross-links, so no cycles).
- RTTI mirrors LLVM: each derived class has `static bool classof(const ASTNode*)`; free
  functions `isa<T>`, `cast<T>`, `dyn_cast<T>` in `ast.h`. No `dynamic_cast`, no
  `-frtti` dependency.
- `llvm::` API: `LLVMContext` + `Module` + `IRBuilder<>`; emit textual IR via
  `Module::print`. Match the LLVM version MSYS2 installs (record it in an ADR).
- Generated Flex/Bison C sources are never edited and never committed.
- Diagnostics: exactly `line N: message`, lowercase, no trailing period, to stderr.

---

## 7. Testing strategy

- **Golden-file fixtures** drive R1–R14. A feature is not done until it has a valid
  fixture (with `.tokens`/`.ast`/`.expected` as relevant) *and*, where the feature can be
  violated, an invalid fixture with a `.err` expectation.
- `tests/run.sh`: for each `valid/*.edu` — run every `--dump-*` mode that has a golden,
  diff; run end-to-end, diff `.expected`. For each `invalid/*.edu` — assert exit≠0,
  assert stderr contains the `.err` string, assert no signal death (`timeout 5`).
- `tests/unit_ast.cpp`: constructs nodes, asserts `isa<>`/`dyn_cast<>` results, asserts a
  visitor reaches every node. Built and run under ASan+UBSan in `make test-asan`.
- Required fixtures at minimum: `profile_only`, `arithmetic` (`15→1111`), `branch_taken`,
  `branch_not_taken`, `all_relops`, `binary_zero` (`0→0`), `binary_255`
  (`255→11111111`), `comments_ws`; invalid: `backward_design`, `dup_outcome`,
  `var_before_set`, `update_before_declare`, `bad_char`, `missing_semi`, `if_no_goto`.
- No mocking; the compiler is pure (file in, text out).

---

## 8. Boundaries

**Always**
- Keep `make` warning-free on `src/*` (Floor F1) and Bison conflict-free (F2).
- Keep every already-built `--dump-*` / `--parse-trace` mode working in later phases.
- Add the fixtures a feature requires in the same phase that adds the feature.
- One `line N:` diagnostic per error; never crash on input (F4).
- Record each **[D]**-style choice or toolchain-version pin as an ADR in `docs/adr/`.

**Ask first**
- Adding any Path-Lang construct beyond §2 (loops, expressions, string types, nested
  blocks, multiple state vars…).
- Replacing Bison with a hand-written parser, or Make with CMake.
- Changing the scoring model (§2.5) or the meaning of `; b`.
- Introducing a third-party dependency or any network access.

**Never**
- Commit generated Flex/Bison sources.
- Silence F1 with `#pragma`/`-Wno-*`, or make invalid IR "pass" by skipping `opt -verify`.
- Skip, delete, or weaken a fixture to land a change (`/constraints guard` will catch it).
- Leave codegen paths stubbed such that `--emit-ir` produces IR that fails the verifier.
- Use `dynamic_cast` / enable `-frtti` for AST type identification (defeats the Exp 8 point).
