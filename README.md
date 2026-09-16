# ALPC — Adaptive Learning Pathway Compiler

A small **Flex + Bison + LLVM C++** compiler for **Path-Lang**, a DSL in which an
educator describes a student profile and adaptive branching logic. ALPC lowers a
`pathway.edu` source file to **LLVM IR** and a runnable program that computes and
prints a student's *Alignment Score* — in **binary** when a statement ends with
`; b`.

A compiler that walks through every classic compiler phase: lexing (Flex), parsing (Bison),
AST construction with RTTI, and LLVM IR code generation.

| Stage | Entry point |
|---|---|
| Lexical analysis (Flex) | `alpc --dump-tokens` |
| Syntax analysis + Backward-Design check (Bison) | `alpc --parse-trace` |
| AST with LLVM-style RTTI | `alpc --dump-ast` |
| LLVM IR code generation + binary-output trigger | `alpc --emit-ir` (default) |

## Quick start

Requires the MSYS2 toolchain (`flex`, `bison`, `make`, `g++`, and LLVM 22 —
`llvm-config`, `llvm-as`, `opt`, `lli`). See `docs/adr/0001-toolchain.md` for how
it was set up on Windows; on Linux the distro packages are enough.

```sh
make            # build ./alpc  (the Makefile bakes the toolchain onto PATH)
make check      # build + run the fixture suite   (task-end gate, < 90 s)
make demo       # compile & run examples/pathway.edu, expect "1111"
make check-full # check + sanitized run + cppcheck + demo
```

`make demo` output:

```
examples/pathway.edu compiles, verifies, runs -> 1111
```

`15` in binary is `1111` — the worked example from the PRD.

## Commands

| Command | Description |
|---|---|
| `alpc FILE` / `alpc --emit-ir FILE` | Emit LLVM IR to stdout |
| `alpc --dump-tokens FILE` | Token stream |
| `alpc --parse-trace FILE` | Reduction trace |
| `alpc --dump-ast FILE` | RTTI-driven AST dump |
| `alpc --parse FILE` | Parse + static-semantic checks only |
| `alpc --help` | Usage |

Exit codes: `0` ok · `1` lexical/syntax/semantic error · `2` bad CLI usage ·
`3` internal error (generated IR failed verification).

Run a compiled pathway:

```sh
alpc examples/pathway.edu > pathway.ll
lli pathway.ll          # or: clang pathway.ll -o pathway && ./pathway
```

## The language

`SET` a profile, run the **Fusion Function** over the Student State, branch on the
profile, end at an **outcome**. An outcome can carry an adjustment
(`OUTCOME advanced += 10;`) that is applied to the score when a branch reaches it, so the
pathway taken changes the result. Outcomes must be declared before any `IF … GOTO`
targets them (Backward Design). Full grammar and semantics: **`SPEC.md`**.

```
OUTCOME remedial;
OUTCOME core;
OUTCOME advanced;

SET grade_level = 5;
SET performance = 60;

SET state = 0;
SET state += 15;

IF performance < 70 GOTO remedial;
IF performance > 85 GOTO advanced;
IF performance < 1000 GOTO core; b
```

## Layout

```
src/
  scanner.l   diagnostics.{h,cpp}   tokens.{h,cpp}     lexer + diagnostics
  parser.y    semantics.{h,cpp}                        grammar + Backward-Design checks
  ast.{h,cpp}                                          AST + LLVM-style RTTI
  codegen.{h,cpp}                                      AST -> llvm::Module
  main.cpp                                             CLI / mode dispatch
tests/
  run.sh              fixture runner
  unit_ast.cpp        RTTI / traversal assertions
  fixtures/valid/     17 programs + .tokens/.parsetrace/.ast/.run/.irhas goldens
  fixtures/invalid/   11 programs + .err (expected diagnostic)
examples/pathway.edu  the demonstration program
docs/
  DEMO.md            evaluator walkthrough (all five artifacts, one run)
  EXECUTION_PLAN.md   how the project was built, phase by phase
  adr/                0001 toolchain · 0002 Path-Lang semantics ·
                      0003 AST/RTTI + sanitizers · 0004 codegen control flow
SPEC.md  CONSTRAINTS.md
```

## Architecture notes

- **RTTI** follows the LLVM idiom (`NodeKind` tag + `classof` + free
  `isa`/`dyn_cast`/`cast`) — no `dynamic_cast`, no `-frtti`. See ADR 0003.
- **Codegen** converges every exit path (any GOTO'd outcome, or fall-through) on a
  single `prog_end` block that loads `state` and prints it. `@print_binary` is an
  in-IR bit loop over `@putchar`. See ADR 0004.
- **LLVM version:** the code targets the **LLVM 22.x** C++ API. The surface used
  (IRBuilder, BasicBlock, `verifyModule`) is stable across many majors; an older
  lab LLVM may need minor edits confined to `codegen.cpp`.
- Quality bar and how it is enforced: **`CONSTRAINTS.md`**.
