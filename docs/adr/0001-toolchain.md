# ADR 0001 — Toolchain and build environment

Date: 2026-09-11
Status: accepted

## Context

The dev machine is Windows 11 with only an old MinGW GCC 6.3.0 and no Flex, Bison,
LLVM, or Make. The BCSE307P lab environment is a standard Linux toolchain. The PRD
requires Flex + Bison + the LLVM C++ API.

## Decision

Install **MSYS2** (`winget install MSYS2.MSYS2`) and, via pacman:
`flex 2.6.4`, `bison 3.8.2`, `make 4.4.1`, `mingw-w64-x86_64-gcc 16.2.0`,
`mingw-w64-x86_64-llvm 22.1.8` (provides `llvm-config`, `llvm-as`, `opt`, `lli`),
`mingw-w64-x86_64-clang 22.1.8`, `mingw-w64-x86_64-cppcheck`.

- Build system: **GNU Make** (not CMake) — lighter, matches lab convention.
- The `Makefile` bakes `C:/msys64/mingw64/bin` and `C:/msys64/usr/bin` onto `PATH`
  so `make` is self-contained from any shell. Direct tool invocations in this repo's
  scripts do the same `export PATH=...` prefix.
- C++ standard: **C++17** (available features well beyond what GCC 6 offered).
- Target LLVM API: **22.x**. Code that touches LLVM headers must match this major
  version; a newer/older lab LLVM may need small API adjustments (noted where used).

## Consequences

- `alpc.exe` and `lli` load MSYS2 mingw64 DLLs (libstdc++, libLLVM) at runtime, so
  anything that runs them must have `C:/msys64/mingw64/bin` on PATH (handled in the
  Makefile recipes and `tests/run.sh`).
- The lab machine will use its own LLVM; document the version assumption in `README`
  and keep LLVM API usage conservative (IRBuilder, BasicBlock, verifyModule — stable
  across many majors).
- Settings PATH injection via `.claude/settings.local.json` was **not** used: the
  `${PATH}` expansion is unreliable and a bad value breaks every shell command. The
  Makefile-baked PATH is the safe equivalent.
