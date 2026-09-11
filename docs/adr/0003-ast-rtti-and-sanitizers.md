# ADR 0003 — AST design, RTTI idiom, and the sanitizer gate

Date: 2026-09-11
Status: accepted

## AST

- Flat hierarchy: `ASTNode` base + three leaf nodes `ProfileSet`, `CondBranch`,
  `Outcome` — one per Path-Lang construct / curriculum stage (SPEC §2).
- `Program { vector<unique_ptr<ASTNode>> stmts; bool binary_output; }` owns
  everything. No parent pointers or cross-links, so no ownership cycles and the
  default destructor frees the tree.
- Node fields are `const`; the tree is built once in parser actions and only read
  afterward (dump, semantic check, codegen).

## RTTI

Follows the LLVM-style RTTI idiom exactly
(https://llvm.org/docs/HowToSetUpLLVMStyleRTTI.html):

- `enum NodeKind` in preorder hierarchy order (so a future non-leaf class can use
  a `>= first && <= last` range check in `classof`).
- `const NodeKind kind_` set by the protected `ASTNode` constructor.
- `static bool classof(const ASTNode*)` on each leaf: `kind() == NK_X`.
- Free `isa<T>` / `dyn_cast<T>` / `cast<T>` templates in `ast.h`; `isa` is
  null-safe, `cast` asserts. **No `dynamic_cast`, no `-frtti`**.

Static semantics run as one source-order pass (`check_program`) that dispatches on
node kind via `dyn_cast`. Document order reproduces the "declared before
referenced" rules (Backward Design etc.) without a separate symbol-table phase.

## Sanitizer gate (CONSTRAINTS F7)

The mingw-w64 GCC/Clang in MSYS2 ships **no `libasan` / `libubsan`**, and Clang's
`libclang_rt.asan` is absent too — full AddressSanitizer is not available on this
Windows toolchain.

`make test-asan` therefore uses, by default:
`-fsanitize=undefined -fsanitize-trap=undefined -D_GLIBCXX_ASSERTIONS
-fstack-protector-all -fno-omit-frame-pointer`

- UBSan **trap mode** needs no runtime: undefined behavior becomes `SIGILL`, which
  fails the test.
- `_GLIBCXX_ASSERTIONS` adds libstdc++ bounds/precondition checks (container OOB,
  bad iterators).

On a Linux lab machine, run the real thing:
`make test-asan SAN='-fsanitize=address,undefined -fno-omit-frame-pointer'`.
