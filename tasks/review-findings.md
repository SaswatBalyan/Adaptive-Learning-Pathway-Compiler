# Phase 7 — Five-axis review of `src/` (commits Phase 2–6)

Reviewed: `scanner.l`, `parser.y`, `ast.{h,cpp}`, `semantics.{h,cpp}`, `codegen.{h,cpp}`,
`diagnostics.{h,cpp}`, `tokens.{h,cpp}`, `main.cpp`, `tests/*`.

**No Critical findings.** All Important findings fixed; Suggestions applied where cheap.

## Important (fixed)

| # | Finding | File | Fix |
|---|---|---|---|
| 1 | `atoi(yytext)` on `NUMBER` — integer-overflow UB; `SET state = 9999999999;` silently became `1410065407` | `scanner.l:29` | `strtol` + `ERANGE`/`INT_MAX` check → diagnostic `numeric literal '…' is out of range`, clamp to `INT_MAX`. Fixture `invalid/number_overflow`. |
| 2 | `;` glued to an identifier mis-tokenized: `OUTCOME done;bad` → `SEMI_B` + `IDENT("ad")` — the `b` was eaten by the terminator rule | `scanner.l:38` | New higher-priority rule `";"[ \t]*"b"[A-Za-z0-9_]` → `yyless(1)` keeps only `;`, rescans from `b`. `;b` at true EOF still lexes as `SEMI_B`. Fixture `invalid/semib_glued`. |

## Suggestions (applied)

| # | Finding | File | Fix |
|---|---|---|---|
| 3 | IDENT `strdup` string leaked when Bison error-recovery discards a shifted token (no `%destructor`) | `parser.y` | `%destructor { free($$); } <sval>` |
| 4 | `--parse-trace` / `--dump-ast` never ran `check_program`, so they exited 0 on a semantically invalid file | `main.cpp` | dispatch refactored — all four parse modes run `check_program`; exit code reflects validity for every mode except `--emit-ir` still gates IR emission on it |
| 5 | Dead `using llvm::ConstantInt;` + unused `<set>` / `<vector>` includes | `codegen.cpp` | removed |
| 6 | Comment "declared so far, in source order" on a `std::set` (sorted, not insertion order) was misleading | `semantics.cpp` | reworded |
| 7 | `@print_binary` scan loop's termination (relies on `val != 0`, so `i` can't go negative — `lshr` by a negative amount would be poison) was subtle and uncommented | `codegen.cpp` | comment added |

## Not changed (accepted)

- **`ok` out-parameter on `emit_ir`** instead of `std::optional` — documented, keeps LLVM
  types out of the header; fine at this size.
- **Multiple positional args → last wins as the file path** (`main.cpp`) — harmless for a
  lab tool; a usage error would be stricter but adds noise.
- **`strdup` NULL not checked** — OOM on a short identifier is not a realistic failure mode.
- **Reversed alloca order in `@main` entry** (cosmetic; instruction order among allocas is
  irrelevant).

## Axis summary

- **Correctness** — matches SPEC §2; the two tokenizer bugs (1, 2) are the only
  spec-deviations found, both fixed with regression fixtures. 38/38 fixtures + 19 unit
  assertions, plain and UBSan-trap.
- **Readability** — small files, descriptive names, one comment corrected.
- **Architecture** — clean layering (`diagnostics ← scanner ← parser → ast → semantics,
  codegen`); LLVM confined to `codegen.cpp`; `--emit-ir` returns a string.
- **Security** — sole untrusted input is the `.edu` source; validated before codegen;
  overflow path (1) was the one gap, now closed. No secrets, no network, no auth surface.
- **Performance** — every pass is a single linear walk of a small AST; no quadratic
  behavior, no unbounded loops (the `@print_binary` bound is 32).
