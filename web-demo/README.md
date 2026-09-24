# ALPC Console

An interactive console for Path-Lang: write source on the left, click **Compile & Run**,
and watch it move through the real compiler — lexer, parser, AST, LLVM IR, and execution —
one stage at a time, with the actual output of each.

This is a normal Next.js server (not a static export): the `/api/compile` route shells out
to the real `alpc.exe` and `lli` on the machine it runs on, so it needs the compiler built
and the MSYS2 toolchain available.

## Run it

From the repository root, build the compiler once:

```sh
make build
```

Then, from this directory:

```sh
npm install
npm run dev
```

Open http://localhost:3000.

By default the app looks for `alpc.exe` one directory up (the repo root) and expects the
MSYS2 toolchain at `C:\msys64`. Override with the `ALPC_BIN`, `LLI_BIN`, `MSYS_MINGW_BIN`,
and `MSYS_USR_BIN` environment variables if your setup differs.
