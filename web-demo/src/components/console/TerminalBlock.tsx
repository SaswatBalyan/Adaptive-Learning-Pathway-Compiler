interface TerminalBlockProps {
  title: string
  text: string
  tone?: 'out' | 'err'
  emptyLabel?: string
}

export function TerminalBlock({ title, text, tone = 'out', emptyLabel = '(no output)' }: TerminalBlockProps) {
  const trimmed = text.replace(/\r\n/g, '\n').replace(/\n+$/, '')
  const lines = trimmed.length > 0 ? trimmed.split('\n') : []

  return (
    <div className="term">
      <div className="term-bar">
        <span className="dot" />
        {title}
      </div>
      <pre className={`term-body ${tone === 'err' ? 'term-body-err' : ''}`}>
        {lines.length === 0
          ? <span className="dim">{emptyLabel}</span>
          : lines.map((line, i) => <div key={i}>{line || ' '}</div>)}
      </pre>
    </div>
  )
}
