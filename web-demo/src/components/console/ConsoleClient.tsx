'use client'

import { useEffect, useRef, useState } from 'react'
import { Toolbar } from './Toolbar'
import { Sidebar } from './Sidebar'
import type { PanelTarget } from './Sidebar'
import { PipelineRibbon } from './PipelineRibbon'
import { Footer } from './Footer'
import { CodeEditor } from './CodeEditor'
import { PipelineStage } from './PipelineStage'
import { TokensPanel, ParseTracePanel, AstPanel, IrPanel, RunPanel } from './Panels'
import { IconCheckCircle, IconCopy, IconCross } from './icons'
import { STAGE_ORDER } from './types'
import type { CompileResponse, StageId } from './types'
import { examples, defaultExample } from '@/data/examples'

type Layout = 'grid' | 'stack'
type Theme = 'light' | 'dark'

function editorStatus(result: CompileResponse | null, requestError: string | null) {
  if (requestError) return { ok: false, text: 'Request failed' }
  if (!result) return null
  const failed = result.stages.find((s) => s.status === 'error')
  if (failed) return { ok: false, text: `${failed.id} failed` }
  return { ok: true, text: 'Parsed & lowered cleanly' }
}

export function ConsoleClient() {
  const [selectedId, setSelectedId] = useState(defaultExample.id)
  const [source, setSource] = useState(defaultExample.source)
  const [compiling, setCompiling] = useState(false)
  const [result, setResult] = useState<CompileResponse | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [elapsedMs, setElapsedMs] = useState<number | null>(null)
  const [layout, setLayout] = useState<Layout>('grid')
  const [theme, setTheme] = useState<Theme>('light')
  const [cursor, setCursor] = useState({ line: 1, col: 1 })
  const [activeTarget, setActiveTarget] = useState<PanelTarget>('editor')
  const [copied, setCopied] = useState(false)

  const editorPanelRef = useRef<HTMLDivElement>(null)
  const tokensPanelRef = useRef<HTMLDivElement>(null)
  const parsePanelRef = useRef<HTMLDivElement>(null)
  const astPanelRef = useRef<HTMLDivElement>(null)
  const irPanelRef = useRef<HTMLDivElement>(null)
  const runPanelRef = useRef<HTMLDivElement>(null)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Guards the dataset.theme write effect below: a blocking inline script in
  // layout.tsx already applies the persisted theme before first paint, so the
  // very first run of that effect must not clobber it with the 'light' state
  // default while this effect (which reads localStorage into React state) is
  // still in flight — that race is what causes a flash-of-wrong-theme.
  const themeEffectRanOnce = useRef(false)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('alpc-theme')
      if (stored === 'dark' || stored === 'light') setTheme(stored)
    } catch {
      // localStorage unavailable — keep default theme
    }
  }, [])

  useEffect(() => {
    if (!themeEffectRanOnce.current) {
      themeEffectRanOnce.current = true
      return
    }
    document.documentElement.dataset.theme = theme
    try {
      window.localStorage.setItem('alpc-theme', theme)
    } catch {
      // ignore persistence failures
    }
  }, [theme])

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
    }
  }, [])

  function handleSelectExample(id: string) {
    const example = examples.find((e) => e.id === id)
    if (!example) return
    setSelectedId(id)
    setSource(example.source)
    setResult(null)
    setRequestError(null)
    setElapsedMs(null)
    setCursor({ line: 1, col: 1 })
  }

  async function handleCompile() {
    setCompiling(true)
    setRequestError(null)
    const startedAt = performance.now()
    try {
      const res = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source }),
      })
      const data = await res.json()
      setElapsedMs(performance.now() - startedAt)
      if (!res.ok) {
        setRequestError(data.error || 'Compilation request failed.')
        setResult(null)
      } else {
        setResult(data)
      }
    } catch {
      setElapsedMs(null)
      setRequestError('Could not reach the compile server — is the dev server running?')
      setResult(null)
    } finally {
      setCompiling(false)
    }
  }

  function handleCopy() {
    navigator.clipboard?.writeText(source).then(() => {
      setCopied(true)
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false)
        copyTimeoutRef.current = null
      }, 1200)
    }).catch(() => {})
  }

  function navigateTo(target: PanelTarget) {
    setActiveTarget(target)
    const map: Record<PanelTarget, React.RefObject<HTMLDivElement>> = {
      editor: editorPanelRef,
      tokens: tokensPanelRef,
      parse: parsePanelRef,
      ast: astPanelRef,
      ir: irPanelRef,
      run: runPanelRef,
    }
    map[target].current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
  }

  const stagesById = new Map((result?.stages ?? []).map((s) => [s.id, s]))
  const status = editorStatus(result, requestError)
  const stageRefs: Partial<Record<StageId, React.RefObject<HTMLDivElement>>> = {
    tokens: tokensPanelRef,
    parse: parsePanelRef,
    ast: astPanelRef,
    ir: irPanelRef,
    run: runPanelRef,
  }

  return (
    <div className="app-shell">
      <Toolbar
        selectedId={selectedId}
        onSelectExample={handleSelectExample}
        onCompile={handleCompile}
        compiling={compiling}
        result={result}
        elapsedMs={elapsedMs}
        layout={layout}
        onToggleLayout={() => setLayout((l) => (l === 'grid' ? 'stack' : 'grid'))}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
      />
      <div className="app-body">
        <Sidebar active={activeTarget} onNavigate={navigateTo} />
        <main className="app-main">
          <PipelineRibbon result={result} compiling={compiling} />

          <div className="content-grid">
            <div className="panel editor-panel" ref={editorPanelRef} role="region" aria-label="Source editor">
              <div className="panel__head">
                <div className="panel__head-left">
                  <span className="panel__title">pathway.edu</span>
                  <span className="panel__tag">{source.split('\n').length} LOC</span>
                </div>
                <div className="panel__actions">
                  <button className="icon-btn" title="Copy source" onClick={handleCopy}>
                    {copied ? <IconCheckCircle /> : <IconCopy />}
                  </button>
                </div>
              </div>
              <div className="panel__body" style={{ overflow: 'hidden' }}>
                <CodeEditor
                  value={source}
                  onChange={setSource}
                  onCursorChange={(line, col) => setCursor({ line, col })}
                />
              </div>
              <div className="panel__foot">
                {requestError && (
                  <span className="panel__foot-err"><IconCross /> {requestError}</span>
                )}
                {!requestError && status && (
                  <span className={status.ok ? 'panel__foot-ok' : 'panel__foot-err'}>
                    {status.ok ? <IconCheckCircle /> : <IconCross />} {status.text}
                  </span>
                )}
                {!requestError && !status && <span>Untitled source</span>}
                <span>{examples.find((e) => e.id === selectedId)?.kind === 'invalid' ? 'expects rejection' : 'LALR(1)'}</span>
              </div>
            </div>

            {layout === 'grid' ? (
              <div className="panels-grid">
                <TokensPanel panelRef={tokensPanelRef} result={stagesById.get('tokens') ?? null} />
                <ParseTracePanel panelRef={parsePanelRef} result={stagesById.get('parse') ?? null} />
                <AstPanel panelRef={astPanelRef} result={stagesById.get('ast') ?? null} />
                <IrPanel panelRef={irPanelRef} result={stagesById.get('ir') ?? null} />
                <RunPanel panelRef={runPanelRef} result={stagesById.get('run') ?? null} elapsedMs={elapsedMs} />
              </div>
            ) : (
              <div className="panel" style={{ overflow: 'hidden' }}>
                <div className="panel__head">
                  <span className="panel__title">Pipeline</span>
                </div>
                <div className="panel__body">
                  {!result && !requestError && (
                    <div className="panel__empty" style={{ height: '100%' }}>
                      <p>Write Path-Lang source or pick an example, then <strong>Run</strong>.</p>
                      <p className="dim">Every stage runs the real alpc.exe and lli on your machine.</p>
                    </div>
                  )}
                  {requestError && (
                    <div className="setup-error">
                      <strong>Couldn&apos;t compile.</strong>
                      <p>{requestError}</p>
                    </div>
                  )}
                  {result && (
                    <div className="stage-list">
                      {STAGE_ORDER.map((id, i) => (
                        <div key={id} ref={stageRefs[id]}>
                          <PipelineStage index={i} id={id} result={stagesById.get(id) ?? null} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      <Footer
        compiling={compiling}
        result={result}
        requestError={requestError}
        cursorLine={cursor.line}
        cursorCol={cursor.col}
      />
    </div>
  )
}
