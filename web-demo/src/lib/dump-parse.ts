// Parsers for alpc.exe's plain-text dump formats (--dump-tokens, --dump-ast,
// --parse-trace). These mirror the exact printf/ostream formats in
// src/main.cpp and src/ast.cpp — see those files before changing the regexes.

export interface TokenRow {
  line: number
  kind: string
  lexeme: string
}

const TOKEN_LINE_RE = /^line (\d+): (\S+) "(.*)"$/

export function parseTokenDump(text: string): TokenRow[] {
  const rows: TokenRow[] = []
  for (const raw of text.split('\n')) {
    const line = raw.trimEnd()
    if (!line || line === 'EOF') continue
    const m = TOKEN_LINE_RE.exec(line)
    if (m) rows.push({ line: Number(m[1]), kind: m[2], lexeme: m[3] })
  }
  return rows
}

export interface TokenLineGroup {
  line: number
  tokens: TokenRow[]
}

// The lexer emits tokens in strict source order, so same-line tokens are
// always already adjacent — grouping them lets the UI show "line 4" once
// instead of repeating it on every single token row.
export function groupTokensByLine(rows: TokenRow[]): TokenLineGroup[] {
  const groups: TokenLineGroup[] = []
  for (const row of rows) {
    const last = groups[groups.length - 1]
    if (last && last.line === row.line) {
      last.tokens.push(row)
    } else {
      groups.push({ line: row.line, tokens: [row] })
    }
  }
  return groups
}

export interface AstNode {
  type: string
  fields: [string, string][]
}

export interface AstDump {
  binaryOutput: boolean
  nodes: AstNode[]
}

const AST_FIELD_RE = /(\w+)="([^"]*)"|(\w+)=(-?\d+)/g

export function parseAstDump(text: string): AstDump {
  let binaryOutput = false
  const nodes: AstNode[] = []

  for (const raw of text.split('\n')) {
    const line = raw.trimEnd()
    if (!line) continue
    if (line.startsWith('Program')) {
      binaryOutput = /binary_output=1/.test(line)
      continue
    }
    const trimmed = line.trim()
    const spaceIdx = trimmed.indexOf(' ')
    if (spaceIdx === -1) continue
    const type = trimmed.slice(0, spaceIdx)
    const rest = trimmed.slice(spaceIdx)
    const fields: [string, string][] = []
    AST_FIELD_RE.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = AST_FIELD_RE.exec(rest))) {
      if (m[1] !== undefined) fields.push([m[1], m[2]])
      else fields.push([m[3], m[4]])
    }
    nodes.push({ type, fields })
  }

  return { binaryOutput, nodes }
}

export type TraceRow =
  | { kind: 'set'; name: string; op: string; value: string }
  | { kind: 'branch'; varName: string; rel: string; value: string; target: string }
  | { kind: 'outcome'; name: string; adjustOp?: '+=' | '-='; adjustValue?: string }
  | { kind: 'binary' }

export function parseTraceDump(text: string): TraceRow[] {
  const rows: TraceRow[] = []
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) continue

    if (line === 'binary-output') {
      rows.push({ kind: 'binary' })
      continue
    }

    let m = /^set (\S+) (\S+) (-?\d+)$/.exec(line)
    if (m) {
      rows.push({ kind: 'set', name: m[1], op: m[2], value: m[3] })
      continue
    }

    m = /^branch (\S+) (\S+) (-?\d+) -> (\S+)$/.exec(line)
    if (m) {
      rows.push({ kind: 'branch', varName: m[1], rel: m[2], value: m[3], target: m[4] })
      continue
    }

    m = /^outcome (\S+)(?: (\+=|-=) (\d+))?$/.exec(line)
    if (m) {
      rows.push({
        kind: 'outcome',
        name: m[1],
        adjustOp: m[2] as '+=' | '-=' | undefined,
        adjustValue: m[3],
      })
    }
  }
  return rows
}
