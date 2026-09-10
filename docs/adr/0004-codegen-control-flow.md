# ADR 0004 — Codegen control-flow model

Date: 2026-09-11
Status: accepted

## Context

The PRD describes "IF ... GOTO branching via LLVM basic blocks" and a final
Alignment Score, but not how OUTCOME statements interact with straight-line
execution — and Backward Design forces every OUTCOME to be declared before any
branch, i.e. all at the top of the file, so "fall through to the next OUTCOME"
has no textual meaning.

## Decision

- **`@main` returns `i32`** (the Alignment Score) and also prints it (`@print_binary`
  when any `; b`, else `@printf "%d\n"`).
- One `i32 alloca` per variable, hoisted to the top of `entry`, **all zero-initialised**
  (SPEC 2.5: `state` starts at 0; the others are provably written before use, but
  zero-init keeps the IR verifier-safe regardless).
- **OUTCOME is a declaration, not an executable statement.** Codegen pre-creates one
  empty `outcome.<name>` basic block per declared outcome, each doing
  `br label %prog_end`. In the statement-lowering pass, OUTCOME nodes emit nothing.
- **SET / IF form a single straight-line path.** `IF v REL n GOTO L` lowers to
  `load` + `icmp` + `CreateCondBr(cond, outcome.L, afterN)`; lowering continues in
  `afterN`.
- **Falling off the end** of the statement list branches to `prog_end` (no implicit
  outcome). `prog_end` loads `state`, prints it, `ret i32 %score`.
- Path-Lang has no unconditional jump, so a program that wants a guaranteed
  terminal outcome writes an always-true `IF` (e.g. `IF x < 1000 GOTO core;`).

## Consequences

- Every exit path (any GOTO'd outcome, or fall-through) converges on `prog_end` —
  one place that defines "the score is `state` here".
- `outcome.<name>` blocks for outcomes that are declared but never GOTO'd show as
  `; No predecessors!` in the `.ll`. The verifier accepts unreachable-but-terminated
  blocks; they are harmless and make the "all outcomes are real targets" structure
  visible in the dump.
- `@print_binary` uses `lshr` (logical shift), so a negative score (possible via
  `-=`) prints its full 32-bit two's-complement pattern rather than looping.
