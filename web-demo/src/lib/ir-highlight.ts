export type IrTokenClass =
  | 'reg'
  | 'global'
  | 'opcode-mem'
  | 'opcode-arith'
  | 'opcode-ctrl'
  | 'opcode'
  | 'num'
  | 'text'

export interface IrToken {
  text: string
  cls: IrTokenClass
}

const MEM_OPS = new Set(['load', 'store', 'alloca', 'getelementptr'])
const ARITH_OPS = new Set([
  'add', 'sub', 'mul', 'sdiv', 'srem', 'and', 'or', 'xor', 'fadd', 'fsub',
  'shl', 'lshr', 'ashr',
])
const CTRL_OPS = new Set(['br', 'ret', 'call', 'icmp', 'phi', 'switch'])
const ALL_OPS = new Set([
  ...MEM_OPS,
  ...ARITH_OPS,
  ...CTRL_OPS,
  'label',
  'define',
  'declare',
  'i32',
  'i1',
  'i8',
  'void',
  'ptr',
])

const IR_TOKEN_RE = /(%[\w.]+)|(@[\w.]+)|([A-Za-z_][\w]*)|(-?\b\d+\b)|(\s+)|(.)/g

// A basic-block label line, e.g. `entry:` or, more commonly, one LLVM
// suffixes with a predecessor comment: `zero:    ; preds = %entry`. Almost
// every block but the first carries that trailing comment, so it must be
// tolerated here — otherwise the line falls through to token-by-token
// highlighting, where the register names inside the comment (e.g. `%entry`)
// get misclassified as live operands instead of being part of a comment.
export function isIrLabel(line: string): boolean {
  return /^[A-Za-z_][\w.]*:(\s*;.*)?$/.test(line.trim())
}

export function isIrComment(line: string): boolean {
  return line.trim().startsWith(';')
}

export function highlightIrLine(line: string): IrToken[] {
  const tokens: IrToken[] = []
  IR_TOKEN_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = IR_TOKEN_RE.exec(line)) !== null) {
    const [text, reg, global, word, num] = m
    if (reg) tokens.push({ text, cls: 'reg' })
    else if (global) tokens.push({ text, cls: 'global' })
    else if (word) {
      if (MEM_OPS.has(word)) tokens.push({ text, cls: 'opcode-mem' })
      else if (ARITH_OPS.has(word)) tokens.push({ text, cls: 'opcode-arith' })
      else if (CTRL_OPS.has(word)) tokens.push({ text, cls: 'opcode-ctrl' })
      else if (ALL_OPS.has(word)) tokens.push({ text, cls: 'opcode' })
      else tokens.push({ text, cls: 'text' })
    } else if (num) tokens.push({ text, cls: 'num' })
    else tokens.push({ text, cls: 'text' })
  }
  return tokens
}
