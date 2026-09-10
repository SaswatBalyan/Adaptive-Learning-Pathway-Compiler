# ADR 0002 — Path-Lang semantic decisions (closing PRD gaps)

Date: 2026-09-11
Status: accepted (open to revision — see SPEC.md §2, marked [D])

## Context

The PRD's grammar (§4.2) and its codegen description (§4.5, "Fusion Function
`skill + 10`") are inconsistent, and several dynamic-semantics questions are
unspecified. Per the user's instruction, the simplest defensible option is chosen
and documented rather than left ambiguous or resolved by interview.

## Decisions

1. **Arithmetic / Fusion Function.** The grammar gains `SET IDENT += NUMBER` and
   `SET IDENT -= NUMBER` (tokens `ADD_ASSIGN`, `SUB_ASSIGN`). The Fusion Function is
   the accumulated effect of these updates on the state variable. No general
   expression grammar (kept out of scope; would blow the 30-hour budget and the
   Exp 7 grammar-simplicity goal).

2. **Student State / Alignment Score.** One distinguished i32 variable `state`,
   initialized to 0. `SET state = / += / -= n` is the only thing that changes the
   score. Other `SET x = n` variables are profile attributes usable only in `IF`
   conditions.

3. **`GOTO` / control flow.** `GOTO IDENT` targets a declared `OUTCOME`; lowered as
   an LLVM unconditional `br` to that outcome's basic block. Reaching any outcome
   ends the pathway; the score is `state` at that point.

4. **Backward Design check** applies to `GOTO` targets: the outcome must appear
   earlier in source. Also enforced: outcome-name uniqueness, variable-before-use in
   conditions, update-before-declare for `+=`/`-=`.

5. **`; b` terminator.** Allowed on any statement (`term : SEMI | SEMI_B`). If any
   statement uses it, the program prints the final score in binary (no leading
   zeros; `0` -> `0`); otherwise in decimal. Newline-terminated.

6. **`state` is reserved** — cannot be an outcome name.

## Consequences

- Grammar stays LALR(1) and conflict-free (verified in Phase 3).
- The demonstration example reproduces the PRD's `15 -> 1111`.
- If the evaluator expects different semantics, only SPEC.md §2 and the codegen
  mapping need to change; the phase structure is unaffected.
