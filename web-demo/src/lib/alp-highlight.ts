export type TokenClass = 'keyword' | 'number' | 'operator' | 'comment' | 'ident' | 'punct' | 'text'

export interface HighlightToken {
  text: string
  cls: TokenClass
}

const KEYWORDS = new Set(['OUTCOME', 'SET', 'IF', 'GOTO'])
const TOKEN_RE = /(#.*$)|(\d+)|([A-Za-z_][A-Za-z0-9_]*)|(==|!=|<=|>=|\+=|-=|<|>|=)|(;)|(\s+)|(.)/gm

export function highlightLine(line: string): HighlightToken[] {
  const tokens: HighlightToken[] = []
  TOKEN_RE.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = TOKEN_RE.exec(line)) !== null) {
    const [text, comment, number, word, operator, punct] = match
    if (comment) tokens.push({ text, cls: 'comment' })
    else if (number) tokens.push({ text, cls: 'number' })
    else if (word) tokens.push({ text, cls: KEYWORDS.has(word) ? 'keyword' : 'ident' })
    else if (operator) tokens.push({ text, cls: 'operator' })
    else if (punct) tokens.push({ text, cls: 'punct' })
    else tokens.push({ text, cls: 'text' })
  }
  return tokens
}
