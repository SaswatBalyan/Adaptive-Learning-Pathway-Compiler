'use client'

import type { CompileResponse } from './types'

interface FooterProps {
  compiling: boolean
  result: CompileResponse | null
  requestError: string | null
  cursorLine: number
  cursorCol: number
}

export function Footer({ compiling, result, requestError, cursorLine, cursorCol }: FooterProps) {
  const failed = requestError || result?.stages.some((s) => s.status === 'error')

  return (
    <footer className="app-footer">
      <div className="app-footer__left">
        {compiling ? (
          <span className="app-footer__busy">
            <span className="status-dot status-dot-busy" /> Compiling
          </span>
        ) : failed ? (
          <span className="app-footer__error">
            <span className="status-dot status-dot-err" /> Failed
          </span>
        ) : (
          <span className="app-footer__ready">
            <span className="status-dot status-dot-ok" /> Ready
          </span>
        )}
        <span className="app-footer__sep">|</span>
        <span>x86_64-w64-mingw32</span>
      </div>
      <div className="app-footer__right">
        <span>Ln {cursorLine}, Col {cursorCol}</span>
        <span className="app-footer__sep">|</span>
        <span>UTF-8</span>
      </div>
    </footer>
  )
}
