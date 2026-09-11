# ALPC — Evaluator Demonstration

One `pathway.edu` source, walked through every compiler phase. Each step produces
an artifact you can inspect on its own.

```sh
make            # build ./alpc
```

Demonstration program — `examples/pathway.edu`:

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

---

## 1 · Lexical analysis (Flex)

```sh
./alpc --dump-tokens examples/pathway.edu
```

```
line 3: OUTCOME "OUTCOME"
line 3: IDENT "remedial"
line 3: SEMI ";"
...
line 18: IDENT "core"
line 18: SEMI_B "; b"
EOF
```

`scanner.l` recognises `SET IF GOTO OUTCOME`, identifiers, numbers, the
comparators `< > ==`, `= += -=`, and the custom **`; b`** binary-output
terminator. Point out `SEMI_B` on the last line.

## 2 · Syntax analysis + Backward Design — (Bison)

```sh
./alpc --parse-trace examples/pathway.edu
```

```
outcome remedial
outcome core
outcome advanced
set grade_level = 5
set performance = 60
set state = 0
set state += 15
branch performance < 70 -> remedial
branch performance > 85 -> advanced
branch performance < 1000 -> core
binary-output
```

Each line is a grammar reduction (`parser.y`). The **Backward Design** rule —
every `GOTO` target must be an already-declared `OUTCOME` — is enforced here.
Show it rejecting a violation:

```sh
./alpc tests/fixtures/invalid/backward_design.edu ; echo "exit $?"
```

```
line 3: Backward Design violation: 'remedial' is referenced before it is declared as an OUTCOME
exit 1
```

`bison` reports **zero** shift/reduce and reduce/reduce conflicts
(`make` fails otherwise — `CONSTRAINTS.md` F2).

## 3 · AST construction + RTTI

```sh
./alpc --dump-ast examples/pathway.edu
```

```
Program binary_output=1
  Outcome     line=3  name="remedial"
  Outcome     line=4  name="core"
  Outcome     line=5  name="advanced"
  ProfileSet  line=8  name="grade_level" op="=" value=5
  ProfileSet  line=9  name="performance" op="=" value=60
  ProfileSet  line=12  name="state" op="=" value=0
  ProfileSet  line=13  name="state" op="+=" value=15
  CondBranch  line=16  var="performance" rel="<" value=70 target="remedial"
  CondBranch  line=17  var="performance" rel=">" value=85 target="advanced"
  CondBranch  line=18  var="performance" rel="<" value=1000 target="core"
```

Three node kinds — `ProfileSet`, `CondBranch`, `Outcome` — one per curriculum
stage. The dump walks the tree through **LLVM-style RTTI**: `ast.h` has a
`NodeKind` tag, a `static classof()` per class, and free `isa<>` / `dyn_cast<>` /
`cast<>` — **no `dynamic_cast`, no `-frtti`**. `tests/unit_ast.cpp` asserts the
RTTI behaviour (run under UBSan + libstdc++ assertions via `make test-asan`).

## 4 · LLVM IR code generation

```sh
./alpc --emit-ir examples/pathway.edu | tee pathway.ll
opt -passes=verify pathway.ll -o /dev/null && echo "IR verified"
```

In `@main` (see `codegen.cpp`, ADR 0004):

- one `i32 alloca` per variable, hoisted to `entry`, zero-initialised — `state`
  starts at 0;
- `SET state += 15` → `load` + `add` + `store` — the **Fusion Function**;
- each `IF … GOTO` → `load` + `icmp` + **conditional `br`** to a per-outcome
  basic block; execution continues in a fresh `afterN` block;
- every `outcome.<name>` block and the fall-through path converge on `prog_end`,
  which loads the final `state` (the **Alignment Score**).

## 5 · Binary-output trigger + run

```sh
lli pathway.ll        # or: make demo
```

```
1111
```

`performance = 60 < 70` ⇒ `GOTO remedial`; the score is `state = 0 + 15 = 15`;
the program used `; b`, so `@print_binary` (an in-IR bit loop over `@putchar`,
PRD §4.6) prints **`15` → `1111`**.

Binary conversion is checked for the PRD values:

| Program | Output |
|---|---|
| `SET state = 0; b`   | `0` |
| `SET state = 1; b`   | `1` |
| `SET state = 15; b`  | `1111` |
| `SET state = 255; b` | `11111111` |

## Invalid input never crashes

```sh
./alpc tests/fixtures/invalid/missing_semi.edu ; echo "exit $?"
./alpc tests/fixtures/invalid/number_overflow.edu ; echo "exit $?"
```

```
line 2: syntax error, unexpected OUTCOME, expecting SEMI or SEMI_B
exit 1
line 1: numeric literal '9999999999' is out of range (max 2147483647)
exit 1
```

## One command for the whole suite

```sh
make check        # 42 fixture checks + goldens
make check-full   # + sanitized run + cppcheck + demo
```
