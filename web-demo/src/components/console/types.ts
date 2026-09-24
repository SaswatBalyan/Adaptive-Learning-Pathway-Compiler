export type StageId = 'tokens' | 'parse' | 'ast' | 'ir' | 'run'
export type StageStatus = 'success' | 'error' | 'skipped'

export interface StageResult {
  id: StageId
  status: StageStatus
  command: string
  stdout: string
  stderr: string
  exitCode: number | null
}

export interface CompileResponse {
  stages: StageResult[]
  runOutput: { stdout: string; stderr: string; exitCode: number | null } | null
  error?: string
}

export const STAGE_META: Record<StageId, { title: string; tag: string; blurb: string; next: string | null }> = {
  tokens: {
    title: 'Lexical analysis',
    tag: 'Flex',
    blurb: 'scanner.l turns the source text into a stream of tokens: keywords, identifiers, numbers, operators, and the binary-output terminator "; b".',
    next: 'Next, the token stream goes to the parser.',
  },
  parse: {
    title: 'Syntax analysis & Backward Design',
    tag: 'Bison',
    blurb: 'parser.y runs an LALR(1) grammar over the tokens and checks that every GOTO target was already declared as an OUTCOME.',
    next: 'If the source parses cleanly, ALPC builds an AST from it.',
  },
  ast: {
    title: 'AST construction',
    tag: 'AST / RTTI',
    blurb: 'Each statement becomes a typed node — Outcome, ProfileSet, or CondBranch — walked with LLVM-style RTTI instead of dynamic_cast.',
    next: 'The AST is lowered to LLVM IR next.',
  },
  ir: {
    title: 'LLVM IR generation',
    tag: 'LLVM IR',
    blurb: 'codegen.cpp emits one alloca per variable, load/add/store for each SET, and icmp + br for every IF … GOTO, converging on a single prog_end block.',
    next: 'The generated module is executed with lli.',
  },
  run: {
    title: 'Execution',
    tag: 'lli',
    blurb: 'The IR module is JIT-executed. If the source used "; b", prog_end calls @print_binary — an in-IR bit loop over @putchar.',
    next: null,
  },
}

export const STAGE_ORDER: StageId[] = ['tokens', 'parse', 'ast', 'ir', 'run']
