'use client'

import { examples } from '@/data/examples'
import type { CompileResponse } from './types'
import { IconSpinner, IconPlay, IconColumns, IconMoon, IconSun } from './icons'

interface ToolbarProps {
  selectedId: string
  onSelectExample: (id: string) => void
  onCompile: () => void
  compiling: boolean
  result: CompileResponse | null
  elapsedMs: number | null
  layout: 'grid' | 'stack'
  onToggleLayout: () => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

function BrandMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="7" fill="var(--color-primary)" />
      <path d="M10 9.5L17 16L10 22.5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M19 22.5H23" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  )
}

export function Toolbar({
  selectedId,
  onSelectExample,
  onCompile,
  compiling,
  result,
  elapsedMs,
  layout,
  onToggleLayout,
  theme,
  onToggleTheme,
}: ToolbarProps) {
  const runStage = result?.stages.find((s) => s.id === 'run')
  const exitCode = runStage?.exitCode ?? null
  const failed = result?.stages.some((s) => s.status === 'error') ?? false

  return (
    <header className="app-header">
      <div className="app-header__left">
        <div className="brand">
          <BrandMark />
          <span className="brand__text">
            ALPC <span className="brand__suffix">Studio</span>
          </span>
        </div>
        <div className="header-divider" />
        <div className="crumb">
          <span>pathways /</span>
          <span className="crumb__file">pathway.edu</span>
        </div>
        <span className="chip-static">
          <span className="chip-static__dot" />
          LLVM 17 JIT
        </span>
      </div>

      <div className="app-header__right">
        {elapsedMs !== null && (
          <div className="metrics">
            <span className="metrics__label">Compiled</span>
            <span className="metrics__value">{elapsedMs.toFixed(1)}ms</span>
            {exitCode !== null && (
              <>
                <span className="metrics__sep">&middot;</span>
                <span className="metrics__label">Exit</span>
                <span className={`metrics__exit ${failed ? 'metrics__exit-err' : 'metrics__exit-ok'}`}>{exitCode}</span>
              </>
            )}
          </div>
        )}

        <select
          className="select"
          value={selectedId}
          onChange={(e) => onSelectExample(e.target.value)}
          disabled={compiling}
          aria-label="Load example"
        >
          <optgroup label="Valid">
            {examples.filter((e) => e.kind === 'valid').map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </optgroup>
          <optgroup label="Rejected">
            {examples.filter((e) => e.kind === 'invalid').map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </optgroup>
        </select>

        <button className="btn btn-primary" onClick={onCompile} disabled={compiling}>
          {compiling ? <IconSpinner /> : <IconPlay />}
          {compiling ? 'Compiling…' : 'Run'}
        </button>

        <div className="header-actions">
          <button
            className="icon-btn"
            title="Toggle panel layout"
            aria-label={layout === 'grid' ? 'Switch to stacked panel layout' : 'Switch to grid panel layout'}
            aria-pressed={layout === 'stack'}
            onClick={onToggleLayout}
          >
            <IconColumns />
          </button>
          <button
            className="icon-btn"
            title="Toggle theme"
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-pressed={theme === 'dark'}
            onClick={onToggleTheme}
          >
            {theme === 'dark' ? <IconMoon /> : <IconSun />}
          </button>
        </div>
      </div>

      {compiling && <div className="progress-bar" aria-hidden />}
    </header>
  )
}
