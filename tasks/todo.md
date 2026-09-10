# ALPC — TODO

Legend: `[ ]` todo · `[~]` in progress · `[x]` done. Detail in `tasks/plan.md`.

## Phase 0 — Foundation  ✅ (CP-0)
- [x] MSYS2 toolchain installed + verified (ADR 0001)
- [x] Self-contained Makefile, scaffold dirs, .gitignore, .gitattributes (LF)
- [x] CLAUDE.md, CONSTRAINTS.md (strict), EXECUTION_PLAN.md
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

## Phase 3 — Parser + Backward Design (Exp 7 / Bison)   → CP-2
- [ ] T3.1 grammar productions + `--parse-trace`; `bison` zero conflicts
- [ ] T3.2 wire scanner↔parser; `--dump-tokens` regression still green
- [ ] T3.3 outcome registry + Backward Design check
- [ ] T3.4 dup-outcome / var-before-use / update-before-declare / reserved `state`
- [ ] T3.5 error recovery (`stmt : error term`), no crash
- [ ] T3.6 `.parsetrace` goldens + 7 invalid fixtures
- [ ] **CP-2:** conflict-free; valid parse; all invalid rejected with exact `line N:`

## Phase 4 — AST + RTTI (Exp 8)   → CP-3
- [ ] T4.1 node hierarchy + LLVM-style `classof`/`isa`/`cast`/`dyn_cast` (no dynamic_cast)
- [ ] T4.2 ownership model + program root
- [ ] T4.3 parser builds the AST; `--parse-trace` still works
- [ ] T4.4 `--dump-ast` RTTI-driven printer + `.ast` goldens
- [ ] T4.5 `tests/unit_ast.cpp` + `make test-asan`
- [ ] **CP-3:** dump matches goldens; unit tests pass under ASan/UBSan

## Phase 5 — LLVM IR codegen (Exp 9)   → CP-4
- [ ] T5.1 codegen skeleton (`@main`, Module::print) + LLVM link; verifier-clean empty IR
- [ ] T5.2 `SET` + `+=`/`-=` (alloca/store/load/add/sub)
- [ ] T5.3 `IF...GOTO` → icmp + br i1 + per-outcome basic blocks
- [ ] T5.4 outcome blocks → prog_end → load `state`
- [ ] T5.5 property assertions in `run.sh` (verify + lli output)
- [ ] **CP-4:** every valid fixture passes `opt -passes=verify` and runs under `lli`

## Phase 6 — Binary output + end-to-end (Exp 10)   → CP-5
- [ ] T6.1 `@print_binary` bit loop in IR (0→0, 1→1, 15→1111, 255→11111111)
- [ ] T6.2 `; b` program flag → binary vs decimal at prog_end
- [ ] T6.3 `examples/pathway.edu` + `.expected` (== `1111`)
- [ ] T6.4 `make demo` + binary fixtures
- [ ] **CP-5:** `make demo` green; full pipeline in one run

## Phase 7 — Review & simplify   → CP-6
- [ ] T7.1 `agent-skills:review` five-axis → `tasks/review-findings.md`
- [ ] T7.2 fix correctness/security findings
- [ ] T7.3 `agent-skills:code-simplify` pass
- [ ] T7.4 `make check-full` green
- [ ] **CP-6**

## Phase 8 — Demo readiness   → CP-7
- [ ] T8.1 `agent-skills:ship` pre-demo checklist
- [ ] T8.2 `docs/DEMO.md` — 5 artifacts in sequence, labeled by Exp
- [ ] T8.3 `README.md`
- [ ] T8.4 ADRs finalized
- [ ] **CP-7:** demo runs from `DEMO.md` alone
