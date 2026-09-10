# Ship Decision: GO

Scope: ALPC v1 — the full lexer → parser → AST/RTTI → LLVM IR pipeline for the
BCSE307P lab demo. "Ship" here = ready to present to the evaluator.

The three `/ship` personas were run as an inline synthesis in the main context
(this session does not spawn subagents without an explicit request); the
code-review axis is `tasks/review-findings.md`, security and test-coverage below.

## Blockers (must fix before ship)

None.

## Recommended fixes (should fix before ship)

None outstanding — the two Important review findings (NUMBER overflow, `;b`
glued-identifier mis-lex) are fixed with regression fixtures.

## Acknowledged risks (shipping anyway)

| Risk | Mitigation |
|---|---|
| Real AddressSanitizer can't run on the mingw toolchain | UBSan-trap + `_GLIBCXX_ASSERTIONS` + stack-protector cover the sanitized gate; `make test-asan SAN='-fsanitize=address,undefined'` gives real ASan on the Linux lab box (ADR 0003). |
| LLVM C++ API pinned to 22.x; a lab machine on an older LLVM may need small edits | API surface is deliberately conservative (IRBuilder, BasicBlock, verifyModule — stable across many majors). Version assumption stated in README + ADR 0001. |
| `strdup` return not null-checked in the scanner | OOM on a short identifier is not a realistic failure; accepted in review. |
| Path-Lang semantics contain `[D]` design choices that may not match the evaluator's expectation | All documented in SPEC §2 + ADR 0002; only SPEC + `codegen.cpp` change if revised, phase structure is unaffected. |

## Security audit (OWASP-adapted, offline single-user CLI)

| Area | Finding |
|---|---|
| Injection | Only input is the `.edu` source, consumed by flex/bison. No shell-out, `eval`, SQL, or template rendering. The file path is embedded as the LLVM ModuleID — LLVM escapes it on print, and the `.ll` is only ever read by the same user's `opt`/`lli`. No vector. |
| Untrusted data | The `.edu` file is validated (`check_program`) before any IR is produced; invalid input never reaches codegen. |
| Resource exhaustion | Flat grammar (no production recursion beyond a left-recursive list); table-driven parser; AST is a flat `vector` — a huge input is bounded linear memory, no stack blow-up. `@print_binary` loop is bounded at 32. 150+ random-input fuzz runs across all modes: no crash or hang. |
| Integer overflow | `NUMBER` now via `strtol` + `ERANGE`/`INT_MAX` check (was `atoi`). |
| Memory safety | RTTI via static tags (no `dynamic_cast`); `unique_ptr` ownership, no cross-links; `strdup`/`free` paired in rule actions or the `%destructor`; UBSan-trap + libstdc++ assertions clean. |
| Secrets / auth / network | None present. No credentials, no sockets, no third-party services. |
| Dependencies | flex 2.6.4, bison 3.8.2, LLVM 22.1.8 — current releases, system toolchain (not vendored). No package manifest, nothing to CVE-scan. |

No High/Critical security findings.

## Test-coverage analysis

| Axis | Coverage |
|---|---|
| Happy path | 12 valid fixtures, each checked across the modes it has goldens for (`--dump-tokens` / `--parse-trace` / `--dump-ast`) plus `opt -passes=verify` on the IR and `lli` stdout. All 4 pipeline stages + all 14 functional requirements (SPEC §3). |
| Edge cases | empty program, `; b` at EOF (no newline), negative score (`-=` below 0), multiple `; b` markers, binary 0/1/15/255, comments + irregular whitespace, all three relational operators, declared-but-unreached outcome. |
| Error paths | 10 invalid fixtures covering every SPEC §2.4 rule (Backward Design, dup outcome, var-before-use, update-before-declare, reserved `state`) plus syntax errors (missing terminator, `IF` without `GOTO`), lexical error (bad char), NUMBER overflow, `;b` glued to an identifier. Each asserts: non-zero exit, exact stderr substring, no crash/hang (5 s timeout). |
| CLI contract | exit 0 (`--help`, valid), 1 (any compile error), 2 (no args / missing file / bad mode) — all fixture-adjacent checks pass. |
| RTTI unit tests | `tests/unit_ast.cpp` — 19 assertions on `isa`/`dyn_cast`/`cast` (positive, negative, null-safe), traversal completeness, dump line count, semantic pass; built and run under UBSan+assertions. |
| Concurrency | N/A — single-threaded batch compiler. |

Remaining gap (non-blocking): the generated `.ll` is checked by property
(`opt -passes=verify` + `.irhas` substrings + `.run` output) rather than a
full golden `.ll` — deliberate, since `.ll` goldens are brittle across LLVM
versions.

## Infrastructure

- No runtime service, no env vars, no migrations, no feature flags — it is a
  build artifact. `make` bakes the toolchain PATH; `make check` / `make demo`
  are the only entry points needed.
- Monitoring: N/A. The "observability" surface is the five demo artifacts
  themselves (tokens, trace, AST, `.ll`, console output).

## Documentation

- `README.md` — build, run, layout, LLVM-version note.
- `docs/DEMO.md` — the evaluator walkthrough: five artifacts in sequence, each
  labeled with its lab experiment, plus the invalid-input demonstrations.
- `docs/adr/0001`–`0004` — toolchain, Path-Lang semantics, AST/RTTI + sanitizers,
  codegen control-flow.
- `SPEC.md`, `tasks/plan.md`, `tasks/todo.md`, `tasks/review-findings.md`.

## Rollback plan

- **Trigger conditions:** the evaluator's environment has an LLVM major where the
  IR fails to build; a Path-Lang semantic decision is rejected; a demo step
  errors on the lab machine.
- **Rollback procedure:** every phase is an isolated commit (`git log --oneline`,
  `Phase N (CP-x): ...`). `git checkout <phase-commit>` drops to any earlier
  working pipeline stage — each is independently demonstrable. For an LLVM API
  break, `codegen.cpp` is the only file touching LLVM headers; the conservative
  API surface is listed in ADR 0004.
- **Recovery time objective:** < 15 min (rebuild + `make check` from any commit).

## Full specialist reports

- Code review: `tasks/review-findings.md`
- Security + test coverage: above
