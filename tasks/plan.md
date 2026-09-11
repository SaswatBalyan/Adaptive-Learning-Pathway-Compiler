# ALPC Implementation Plan

Derived from `SPEC.md` (authoritative) and `docs/EXECUTION_PLAN.md` (phase map).
Work is sliced **vertically**: each task drives one construct all the way through the
stage being built and lands with its fixtures, not a horizontal "all tokens, then all
grammar" layering.

## Dependency graph

```
diagnostics.{h,cpp}            (Phase 2, leaf — everything reports through it)
        │
   scanner.l  ──────────────►  token stream            (Phase 2)
        │
   parser.y   ──────────────►  parse + semantic checks  (Phase 3)  depends: scanner, diagnostics
        │
   ast.{h,cpp} ─────────────►  AST + RTTI               (Phase 4)  depends: parser actions
        │
   codegen.{h,cpp} ─────────►  llvm::Module / .ll       (Phase 5)  depends: ast
        │
   @print_binary + driver ──►  runnable program         (Phase 6)  depends: codegen
        │
   review → simplify → demo                              (Phases 7-8)
```

Driver/CLI (`main.cpp`, `driver.cpp`) grows one mode per phase:
`--dump-tokens` (P2) → `--parse-trace` (P3) → `--dump-ast` (P4) → `--emit-ir` (P5) → default run (P6).

## Checkpoints (stop, verify, report before continuing)

- **CP-0 → done:** toolchain builds, `make` clean, SPEC.md approved-in-principle.
- **CP-1 (after Phase 2):** `--dump-tokens` matches goldens for all valid fixtures;
  bad-char fixture errors cleanly. Demo artifact = token stream. Maps to Lexer (Flex).
- **CP-2 (after Phase 3):** `bison` zero conflicts; valid fixtures parse; all 7 invalid
  fixtures rejected with the exact `line N:` diagnostic; no crash. Maps to Parser (Bison).
- **CP-3 (after Phase 4):** `--dump-ast` matches goldens; `tests/unit_ast` passes under
  ASan/UBSan; node count == statement count. Maps to AST/RTTI.
- **CP-4 (after Phase 5):** `--emit-ir` output passes `llvm-as` + `opt -passes=verify`
  for every valid fixture; branch fixtures show labeled blocks + conditional `br`. Maps to Codegen.
- **CP-5 (after Phase 6):** `make demo` green; binary fixtures `0/1/15/255` correct;
  full pipeline shown in one run. Maps to Binary Output.
- **CP-6 (after Phase 7):** five-axis review findings resolved; `make check-full` green.
- **CP-7 (after Phase 8):** `docs/DEMO.md` walkthrough runs end to end; README done.

## Task detail

### Phase 2 — Lexer (Flex)

- **T2.1 diagnostics module.** `src/diagnostics.{h,cpp}`: `report(line, msg)` →
  `stderr` as `line N: msg`; global error count; exit-code policy (1 = compile error).
  *AC:* unit-links; a manual call prints the exact format. *Verify:* `g++ -Wall -Wextra -Werror -c`.
- **T2.2 token set + scanner skeleton.** `src/scanner.l` with the SPEC §2.2 table,
  line tracking (`yylineno`), comment + whitespace skip, `<<EOF>>`. A temporary
  `token_name()` table for dumping. *AC:* `flex` no warnings; compiles.
- **T2.3 `--dump-tokens` mode + driver bootstrap.** `main.cpp` parses argv, opens the
  file, loops `yylex()`, prints `TYPE lexeme (line N)`, ends `EOF`. Wire into Makefile
  (`HAND_SRCS`, `GEN_SRCS`, flex rule, link).
  *AC:* `./alpc --dump-tokens f` works. *Verify:* build + run on a hand file.
- **T2.4 the `; b` terminator.** Rule for `;[ \t]*b` → `SEMI_B`, plain `;` → `SEMI`.
  *AC:* `SET x = 1; b` yields `... SEMI_B`; `SET x = 1;` yields `SEMI`.
- **T2.5 fixtures + golden goldens + runner v1.** `tests/fixtures/valid/{profile_only,
  arithmetic,branch_taken,all_relops,comments_ws}.edu` + `.tokens`; invalid `bad_char.edu`
  + `.err`. `tests/run.sh` diffs `--dump-tokens`, checks invalid exit≠0 + stderr, `timeout 5`.
  *AC (CP-1):* `make check` green; bad-char exits 1 with `line N: unexpected character`.

### Phase 3 — Parser + Backward Design (Bison)

- **T3.1 grammar productions.** `src/parser.y` per SPEC §2.3, `%define parse.error verbose`,
  `%locations`, tokens shared with the scanner (`%option bison-bridge`/`yylval` or a
  shared header). Build a temporary parse-trace hook (`--parse-trace` prints each reduction).
  *AC:* `bison -Wcounterexamples` — **zero** shift/reduce and reduce/reduce (Floor F2).
- **T3.2 wire scanner↔parser.** Replace the P2 standalone loop; `--dump-tokens` still
  works (regression). *Verify:* CP-1 goldens still pass.
- **T3.3 outcome registry + Backward Design check.** Ordered `std::set`/vector of
  declared outcome names; on `branch_stmt` reduction, verify GOTO target is present.
  *AC:* `invalid/backward_design.edu` → `line N: Backward Design violation: 'X' is
  referenced before it is declared as an OUTCOME`, exit 1.
- **T3.4 remaining semantic checks.** dup outcome, var-before-use, update-before-declare,
  reserved `state`. One fixture each.
- **T3.5 error recovery.** `stmt : error term`; one diagnostic, resync, no crash.
  *AC:* `invalid/{missing_semi,if_no_goto}.edu` → clean error, no SIGSEGV.
- **T3.6 fixtures + goldens.** `.parsetrace` goldens for valid fixtures; 7 invalid
  fixtures total with `.err`. *AC (CP-2):* `make check` green; `bison` conflict-free.

### Phase 4 — AST + RTTI

- **T4.1 node hierarchy + RTTI.** `src/ast.h`: `enum NodeKind`, `ASTNode` base with
  protected kind ctor, `ProfileSet`/`Update`/`CondBranch`/`OutcomeTrigger` (or a single
  `SetStmt` with an op field — decide in api-design step), `classof` on each, free
  `isa<T>/cast<T>/dyn_cast<T>`. No `dynamic_cast`, no `-frtti`.
  *AC:* header compiles `-Wall -Wextra -Werror`; `api-and-interface-design` checklist met.
- **T4.2 ownership + program root.** `std::vector<std::unique_ptr<ASTNode>>`; no cross
  links. `src/ast.cpp` for any out-of-line methods.
- **T4.3 parser builds the AST.** Semantic actions construct nodes instead of the
  temporary trace structs. Keep `--parse-trace` working off the built tree.
- **T4.4 `--dump-ast`.** RTTI-driven indented printer. *AC:* matches `.ast` goldens;
  node count == statement count (T7 check).
- **T4.5 `tests/unit_ast.cpp`.** assert-based: construct each node, `isa`/`dyn_cast`
  positive+negative, visitor reaches every node. `make test-asan` builds it with
  `-fsanitize=address,undefined`. *AC (CP-3):* unit tests + fixtures pass under sanitizers.

### Phase 5 — LLVM IR codegen

- **T5.1 codegen skeleton.** `src/codegen.{h,cpp}`: `LLVMContext`, `Module`,
  `IRBuilder<>`; emit `define i32 @main()` with an entry block; `Module::print` to
  stdout for `--emit-ir`. Link LLVM via `llvm-config --cxxflags --ldflags --libs core`.
  *AC:* empty program emits IR that passes `opt -passes=verify` (Floor F3).
  *(source-driven: cross-check IRBuilder / BasicBlock / verifyModule against llvm.org docs
  for v22.)*
- **T5.2 `SET` + arithmetic.** `alloca` per variable at entry; `store` for `=`;
  `load`+`add`/`sub`+`store` for `+=`/`-=`. *AC:* `arithmetic.edu` IR shows the ops;
  verifier clean.
- **T5.3 `IF ... GOTO` lowering.** Per branch: `icmp` (slt/sgt/eq), `br i1` to the
  target outcome block vs a fresh fallthrough block. Pre-create a `BasicBlock` per
  declared outcome. *AC:* `branch_taken.edu` `.ll` shows labeled blocks + conditional `br`.
- **T5.4 outcome blocks + prog_end.** Each outcome block `br`s to `prog_end`;
  `prog_end` loads `state`. *AC:* `lli` output == expected final score for all valid fixtures.
- **T5.5 goldens.** `.ll` goldens are brittle — instead assert *properties* in
  `run.sh` (contains `icmp`, `br i1`, block labels; `opt -passes=verify` exit 0;
  `lli` numeric output). *AC (CP-4):* all valid fixtures verify + run.

### Phase 6 — Binary output + end-to-end

- **T6.1 `@print_binary` in IR.** IRBuilder-generated bit loop (SPEC §2.5): handle 0,
  strip leading zeros, `@putchar`, trailing newline. *AC:* unit values 0→`0`, 1→`1`,
  15→`1111`, 255→`11111111`.
- **T6.2 wire the `; b` flag.** Program-level flag from any `SEMI_B`; `prog_end` calls
  `@print_binary` when set, else prints decimal (`@printf` or digit loop).
- **T6.3 `examples/pathway.edu` + `.expected`.** The SPEC §2.1 program; expected `1111`.
- **T6.4 `make demo`.** `./alpc examples/pathway.edu > build/pathway.ll && lli
  build/pathway.ll` diffed against `.expected`. Add binary fixtures to `run.sh`.
  *AC (CP-5):* `make demo` green; full pipeline in one run.

### Phase 7 — Review & simplify

- **T7.1** Perform a five-axis review over `src/` + tests. Record findings in
  `tasks/review-findings.md`.
- **T7.2** Fix correctness/security findings. **T7.3** Perform a code-simplification pass.
- **T7.4** `make check-full` green (test-asan + cppcheck + demo + coverage).
  *AC (CP-6).*

### Phase 8 — Demo readiness

- **T8.1** Complete the pre-demo checklist adapted to the evaluator demo.
- **T8.2** `docs/DEMO.md`: 5 artifacts in sequence (tokens → parse trace → AST → `.ll`
  → console binary), each labeled with its Exp number, plus the two invalid-input
  demos. **T8.3** `README.md` (build, run, layout). **T8.4** ADRs finalized.
  *AC (CP-7):* someone else can run the demo from `DEMO.md` alone.

## Risks (from the 30-hour plan §6)

- Bison conflicts → keep the grammar as in SPEC §2.3; `%left`/precedence only if forced.
- LLVM 22 API drift vs lab LLVM → conservative API surface; note version in README.
- Binary edge cases → T6.1 tests 0/1/15/255 first.
- scanner↔parser glue on Windows/MSYS → T3.2 is its own task with the regression gate.
