'use client'

import { useRef } from 'react'
import { highlightLine } from '@/lib/alp-highlight'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
}

export function CodeEditor({ value, onChange }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLPreElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)

  const lines = value.split('\n')

  function syncScroll() {
    const ta = textareaRef.current
    if (!ta) return
    if (highlightRef.current) {
      highlightRef.current.scrollTop = ta.scrollTop
      highlightRef.current.scrollLeft = ta.scrollLeft
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = ta.scrollTop
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== 'Tab') return
    e.preventDefault()
    const ta = e.currentTarget
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const next = value.slice(0, start) + '  ' + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + 2
    })
  }

  return (
    <div className="editor-wrap">
      <div className="editor-gutter" ref={gutterRef} aria-hidden>
        {lines.map((_, i) => (
          <div key={i} className="editor-gutter-line">{i + 1}</div>
        ))}
      </div>
      <div className="editor-code">
        <pre className="editor-highlight" ref={highlightRef} aria-hidden>
          {lines.map((line, i) => (
            <div key={i} className="editor-line">
              {line.length === 0
                ? ' '
                : highlightLine(line).map((tok, j) => (
                    <span key={j} className={`tok-${tok.cls}`}>{tok.text}</span>
                  ))}
            </div>
          ))}
        </pre>
        <textarea
          ref={textareaRef}
          className="editor-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={syncScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          wrap="off"
          aria-label="ALP source"
        />
      </div>
    </div>
  )
}
