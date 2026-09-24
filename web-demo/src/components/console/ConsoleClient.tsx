'use client'

import { useState } from 'react'
import { Toolbar } from './Toolbar'
import { CodeEditor } from './CodeEditor'
import { PipelineStage } from './PipelineStage'
import { STAGE_ORDER } from './types'
import type { CompileResponse } from './types'
import { examples, defaultExample } from '@/data/examples'

export function ConsoleClient() {
  const [selectedId, setSelectedId] = useState(defaultExample.id)
  const [source, setSource] = useState(defaultExample.source)
  const [compiling, setCompiling] = useState(false)
  const [result, setResult] = useState<CompileResponse | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)

  function handleSelectExample(id: string) {
    const example = examples.find((e) => e.id === id)
    if (!example) return
    setSelectedId(id)
    setSource(example.source)
    setResult(null)
    setRequestError(null)
  }

  async function handleCompile() {
    setCompiling(true)
    setRequestError(null)
    try {
      const res = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source }),
      })
      const data = await res.json()
      if (!res.ok) {
        setRequestError(data.error || 'Compilation request failed.')
        setResult(null)
      } else {
        setResult(data)
      }
    } catch {
      setRequestError('Could not reach the compile server — is the dev server running?')
      setResult(null)
    } finally {
      setCompiling(false)
    }
  }

  return (
    <div className="console-shell">
      <Toolbar
        selectedId={selectedId}
        onSelectExample={handleSelectExample}
        onCompile={handleCompile}
        compiling={compiling}
      />
      <main className="console-main">
        <section className="console-pane">
          <div className="pane-head">
            <span>pathway.edu</span>
            <span className="dim">{source.split('\n').length} lines</span>
          </div>
          <div className="pane-body pane-body-editor">
            <CodeEditor value={source} onChange={setSource} />
          </div>
        </section>

        <section className="console-pane">
          <div className="pane-head">
            <span>Pipeline</span>
            {result && <span className="dim">real alpc + lli output</span>}
          </div>
          <div className="pane-body pane-body-pipeline">
            {requestError && (
              <div className="setup-error">
                <strong>Couldn&apos;t compile.</strong>
                <p>{requestError}</p>
              </div>
            )}

            {!result && !requestError && (
              <div className="pipeline-empty">
                <p>Write Path-Lang source or pick an example, then <strong>Compile &amp; Run</strong>.</p>
                <p className="dim">Every stage below runs the real alpc.exe and lli on your machine.</p>
              </div>
            )}

            {result && (
              <div className="stage-list">
                {STAGE_ORDER.map((id, i) => {
                  const stageResult = result.stages.find((s) => s.id === id) ?? null
                  return <PipelineStage key={id} index={i} id={id} result={stageResult} />
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
