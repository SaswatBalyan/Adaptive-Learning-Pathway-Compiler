# CONSTRAINTS.md — ALPC quality bar

**Detected:** Greenfield C++17 project. Toolchain: Flex + Bison + LLVM C++ API + g++/clang
(MSYS2 mingw-w64). No pre-existing test runner, lint config, coverage data, or CI.
Harness: Claude Code.

**Strictness: Strict** (chosen 2026-09-11). Agents must read this file and must never weaken
a constraint to make a change pass — fix the code or raise the issue.

---

## Floor (always enforced — blocks the task)

| # | Rule | Command | Reason |
|---|---|---|---|
| F1 | Build completes with **zero** `-Wall -Wextra` warnings (hand-written `.cpp`/`.h`; generated Flex/Bison sources exempt) | `make` (uses `-Wall -Wextra -Werror` on our sources) | Warnings in a compiler are usually real bugs (uninit reads, sign mismatch in token codes). |
| F2 | **Zero** Bison shift/reduce and reduce/reduce conflicts | `bison -Wcounterexamples -Werror=conflicts-sr -Werror=conflicts-rr parser.y` | An ambiguous grammar silently mis-parses; the lab is graded on grammar correctness. |
| F3 | Generated IR is valid | `llvm-as pathway.ll -o /dev/null` and `opt -passes=verify pathway.ll -o /dev/null` | An `.ll` that fails the verifier is not a demonstrable Exp 9 artifact. |
| F4 | No crash / hang on any fixture (valid or invalid) | `tests/run.sh` (each fixture: exit 0 for valid, non-zero + diagnostic for invalid, no SIGSEGV/SIGABRT, 5s timeout) | PRD NFR: "malformed input produces a clear syntax error rather than a crash". |
| F5 | Every acceptance-criterion behaviour has ≥1 valid **and** ≥1 invalid fixture where meaningful | `tests/run.sh --coverage-report` | Demonstrability NFR: each stage independently showable. |
| F6 | End-to-end: `examples/pathway.edu` compiles + runs, `; b` prints the correct binary string | `make demo` compares against `examples/pathway.expected` | Primary success metric. |
| F7 | Test binary built with `-fsanitize=address,undefined` passes all fixtures | `make test-asan` | RTTI casts + manual AST memory management + IR buffer work are UB-prone. |

## Enforced numbers

| Metric | Value | Reason |
|---|---|---|
| Hand-written-source compile warnings | **0** | F1. |
| Bison conflicts | **0** | F2. |
| Fixture crash rate | **0%** | F4. |
| Slowest single check before handing work back | **90 s** (`make && tests/run.sh`) | Keeps the edit→verify loop usable within the 30-hour budget. Full `make test-asan` runs at review/CI only. |

## Measured-only (hold today's value, don't regress)

| Metric | Today (2026-09-11) | Notes |
|---|---|---|
| Fixture count | 6 (5 valid tokens + 1 invalid) | Ratchet up each phase; never delete a passing fixture to make a change land. |
| `--dump-tokens` working | yes (Phase 2) | `--parse-trace` P3, `--dump-ast` P4, `--emit-ir` P5. Once a mode exists it must keep working. |
| cppcheck findings (`cppcheck --enable=warning,style src/*.cpp`) | 0 | Advisory / warn. Don't increase it. |

## Check placement by cost

- **Edit loop (seconds):** compile the touched translation unit with `-Wall -Wextra -Werror`; `bison` conflict check when `parser.y` changed.
- **Task end (<90 s):** `make` + `tests/run.sh` (all fixtures, no sanitizer).
- **Review / CI:** `make test-asan`, `cppcheck`, `opt -passes=verify`, full `make demo`, fixture-coverage report.

## package.json equivalents (Makefile targets)

| Skill convention | Makefile target |
|---|---|
| `check:fast` | `make lint-fast` (compile sources `-Werror`, bison conflict check) |
| `check:task` | `make check` (`make` + `tests/run.sh`) |
| `check:full` | `make check-full` (`test-asan` + `cppcheck` + `demo` + coverage report) |

## Exceptions

| ID | Rule relaxed | Scope | Owner | Expires | Reason |
|---|---|---|---|---|---|
| — | none | — | — | — | — |

## Dropped dimensions

- **Accessibility, web vitals, bundle size** — no web surface; not applicable.
- **Secret scanning (gitleaks), dependency scanning (osv-scanner)** — no third-party package
  manifests, no network, no credentials; not applicable to an offline lab compiler.
- **Assertion-quality mutation testing (Stryker)** — no C++ mutation harness in the lab
  toolchain; substituted by F7 (sanitizers) + mandatory invalid fixtures (F5).
