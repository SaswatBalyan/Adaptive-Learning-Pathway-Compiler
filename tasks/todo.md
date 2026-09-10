# ALPC — TODO

Legend: `[ ]` todo · `[~]` in progress · `[x]` done. Detail in `tasks/plan.md`.

## Phase 0 — Foundation  ✅ (CP-0)
- [x] MSYS2 toolchain installed + verified (ADR 0001)
- [x] Self-contained Makefile, scaffold dirs, .gitignore, .gitattributes (LF)
- [x] CONSTRAINTS.md (strict), EXECUTION_PLAN.md
- [x] SPEC.md — grammar + semantics, PRD gaps closed (ADR 0002)

## Phase 1 — Spec & task breakdown  ✅
- [x] SPEC.md (six core areas + Path-Lang language spec)
- [x] tasks/plan.md — dependency graph, vertical slices, checkpoints
- [x] tasks/todo.md

## Phase 2 — Lexer (Exp 7 / Flex)   ✅ CP-1
- [x] T2.1 diagnostics module (`src/diagnostics.{h,cpp}`)
- [x] T2.2 token set + `src/scanner.l` skeleton (line tracking, comments, ws, EOF)
- [x] T2.3 `--dump-tokens` mode + driver bootstrap + Makefile wiring
- [x] T2.4 `; b` terminator rule (`SEMI_B` vs `SEMI`)
- [x] T2.5 valid+invalid fixtures, `.tokens` goldens, `tests/run.sh` v1
- [x] **CP-1:** `make check` green (6/6); bad-char → `line 1: unexpected character '$'`, exit 1;
      build `-Werror` clean, flex clean, cppcheck clean

## Phase 3 — Parser + Backward Design (Exp 7 / Bison)   ✅ CP-2
- [x] T3.1 grammar productions + `--parse-trace`; `bison` zero conflicts/warnings
- [x] T3.2 wire scanner↔parser via parser.tab.h; `--dump-tokens` regression green
- [x] T3.3 outcome registry + Backward Design check
- [x] T3.4 dup-outcome / var-before-use / update-before-declare / reserved `state`
- [x] T3.5 error recovery (`stmt : error term` + `yyerrok`), `parse.error detailed` + `parse.lac full`
- [x] T3.6 5 `.parsetrace` goldens + 7 new invalid fixtures
- [x] **CP-2:** `make check` 18/18; bison conflict-free; 120-run fuzz clean (no crash/hang);
      diagnostics doc-backed against Bison 3.8.2 info manual

## Phase 4 — AST + RTTI (Exp 8)   ✅ CP-3
- [x] T4.1 `src/ast.{h,cpp}`: NodeKind + ProfileSet/CondBranch/Outcome, LLVM-style
      `classof`/`isa`/`cast`/`dyn_cast` (no dynamic_cast, no -frtti) — verified against
      llvm.org/docs/HowToSetUpLLVMStyleRTTI.html
- [x] T4.2 `Program` owns nodes via `unique_ptr`, no cross-links
- [x] T4.3 parser reduce actions build the AST; semantics moved to `check_program()`
      source-order pass; `--parse-trace` walks the built Program
- [x] T4.4 `--dump-ast` RTTI-driven printer + 5 `.ast` goldens
- [x] T4.5 `tests/unit_ast.cpp` (19 checks) + `make test-asan`
- [x] **CP-3:** `make check-full` green — 23/23 fixtures (plain + sanitized), unit_ast 19/19,
      cppcheck clean. UBSan-trap + `_GLIBCXX_ASSERTIONS` (mingw has no libasan; real ASan
      via `make test-asan SAN='-fsanitize=address,undefined'` on Linux)

## Phase 5 — LLVM IR codegen (Exp 9)   ✅ CP-4
- [x] T5.1 `src/codegen.{h,cpp}`: LLVMContext/Module/IRBuilder, `@main`, `Module::print`;
      LLVM 22 API verified against installed headers. Link `-lLLVM-22`.
- [x] T5.2 `SET` + `+=`/`-=` → alloca (hoisted, zero-init) / store / load+add|sub+store
- [x] T5.3 `IF...GOTO` → `CreateICmp` + `CreateCondBr` to per-outcome BB + fresh `afterN`
- [x] T5.4 OUTCOME = declaration only (Backward Design puts them up top); every outcome
      block + fall-through → `prog_end` loads `state`; `@print_binary` bit-loop (PRD 4.6)
- [x] T5.5 `run.sh` `ir_check`: `opt -passes=verify` + `.irhas` substrings + `.run` lli stdout
- [x] **CP-4:** 28/28 fixture checks (plain + sanitized). 21/21 fuzz programs verify-clean.
      SPEC 2.1 example fixed (no dup outcome; catch-all `IF < 1000`).

## Phase 6 — Binary output + end-to-end (Exp 10)   ✅ CP-5
- [x] T6.1 `@print_binary` bit loop — fixtures binary_zero/one/fifteen/255
      (0→0, 1→1, 15→1111, 255→11111111) all verified via lli
- [x] T6.2 `; b` program flag → `@print_binary` vs `@printf "%d\n"` at prog_end
- [x] T6.3 `examples/pathway.edu` + `.expected` (== `1111`, matches PRD)
- [x] T6.4 `make demo` (emit → opt verify → lli → diff); fusion_branch_binary
      end-to-end fixture (100 −40 +195 = 255 → `11111111`)
- [x] **CP-5:** `make check-full` green — 36/36 fixtures, demo prints `1111`,
      full pipeline (tokens→trace→ast→ir→binary) demonstrable in one run

## Phase 7 — Review & simplify   ✅ CP-6
- [x] T7.1 five-axis review → `tasks/review-findings.md` (no Critical)
- [x] T7.2 fixed: NUMBER overflow (atoi→strtol+range), `;b` glued-identifier
      mis-lex (yyless), IDENT leak on error recovery (%destructor), parse-mode
      exit codes. Regression fixtures added.
- [x] T7.3 simplify: emit only the print helper the program uses (no dead
      `@putchar`/`@print_binary`/`@printf` in the `.ll`); drop dead using/includes
- [x] T7.4 `make check-full` green — 38/38 fixtures
- [x] **CP-6**

## Phase 8 — Demo readiness   ✅ CP-7
- [x] T8.1 ship checklist → `tasks/ship-decision.md` (GO; no blockers). Coverage-gap
      fixtures added: empty_program, semib_at_eof, negative_score, multi_binary
- [x] T8.2 `docs/DEMO.md` — 5 artifacts in sequence, each labeled by Exp, + invalid-input demos
- [x] T8.3 `README.md`
- [x] T8.4 ADRs 0001–0004 in `docs/adr/`; README points at the demo documentation
- [x] **CP-7:** `make demo` and every `docs/DEMO.md` command verified; 42/42 fixtures
