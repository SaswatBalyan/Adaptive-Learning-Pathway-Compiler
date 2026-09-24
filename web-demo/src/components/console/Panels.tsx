'use client'

import type { ReactNode, RefObject } from 'react'
import type { StageResult } from './types'
import { parseTokenDump, parseAstDump, parseTraceDump, groupTokensByLine } from '@/lib/dump-parse'
import { highlightIrLine, isIrLabel, isIrComment } from '@/lib/ir-highlight'
import { IconCheckCircle } from './icons'

type Status = 'pending' | 'success' | 'error' | 'skipped'

function statusOf(result: StageResult | null): Status {
  if (!result) return 'pending'
  return result.status
}

function StatusPill({ status, okLabel = 'ok' }: { status: Status; okLabel?: string }) {
  if (status === 'success') return <span className="pill pill-ok">{okLabel}</span>
  if (status === 'error') return <span className="pill pill-err">error</span>
  if (status === 'skipped') return <span className="pill pill-skip">skipped</span>
  return <span className="pill pill-pending">pending</span>
}

interface PanelShellProps {
  panelRef?: RefObject<HTMLDivElement>
  index: string
  title: string
  status: Status
  okLabel?: string
  footer?: ReactNode
  className?: string
  children: ReactNode
}

function PanelShell({ panelRef, index, title, status, okLabel, footer, className, children }: PanelShellProps) {
  return (
    <div className={`panel ${className ?? ''}`} ref={panelRef}>
      <div className="panel__head">
        <div className="panel__head-left">
          <span className="panel__index">{index}</span>
          <span className="panel__title">{title}</span>
        </div>
        <StatusPill status={status} okLabel={okLabel} />
      </div>
      <div className="panel__body">{children}</div>
      {footer && <div className="panel__foot">{footer}</div>}
    </div>
  )
}

function EmptyState({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="panel__empty">
      <span className="panel__empty-icon">{icon}</span>
      <p>{text}</p>
    </div>
  )
}

function ErrorBody({ result }: { result: StageResult }) {
  const text = (result.stderr || result.stdout).replace(/\r\n/g, '\n').trim()
  return <pre className="stderr-block" style={{ margin: '.4rem' }}>{text || 'Stage failed with no output.'}</pre>
}

function SkippedBody() {
  return <EmptyState icon={<span style={{ fontSize: '1.4rem' }}>—</span>} text="Not reached — an earlier stage failed." />
}

// ---------------------------------------------------------------------------

export function TokensPanel({ panelRef, result }: { panelRef?: RefObject<HTMLDivElement>; result: StageResult | null }) {
  const status = statusOf(result)
  const rows = status === 'success' && result ? parseTokenDump(result.stdout) : []
  const groups = groupTokensByLine(rows)
  const errorCount = status === 'error' ? 1 : 0

  return (
    <PanelShell
      panelRef={panelRef}
      index="01"
      title="Lexer Tokens"
      status={status}
      className="panel-accent-sky"
      footer={
        <>
          <span>{status === 'success' ? `${rows.length} tokens` : ' '}</span>
          <span className={errorCount ? 'panel__foot-err' : 'panel__foot-ok'}>
            {status === 'pending' ? 'awaiting run' : status === 'success' ? '0 errors' : status === 'error' ? 'lex error' : ''}
          </span>
        </>
      }
    >
      {status === 'pending' && <EmptyState icon="{ }" text="Run to see the Flex token stream." />}
      {status === 'skipped' && <SkippedBody />}
      {status === 'error' && result && <ErrorBody result={result} />}
      {status === 'success' && (
        <div className="token-groups">
          {groups.map((g) => (
            <div className="token-group" key={g.line}>
              <div className="token-group__line">Line {g.line}</div>
              <div className="token-group__tokens">
                {g.tokens.map((t, i) => (
                  <span className={`token-chip ${t.kind === '?' ? 'token-chip-error' : ''}`} key={i} title={t.kind}>
                    <span className="token-chip__kind">{t.kind}</span>
                    <span className="token-chip__lexeme">{t.lexeme}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </PanelShell>
  )
}

// ---------------------------------------------------------------------------

function traceRowNode(row: ReturnType<typeof parseTraceDump>[number], key: number) {
  if (row.kind === 'outcome') {
    return (
      <div className={`tree-row ${row.adjustOp ? 'tree-row-branch' : ''}`} key={key}>
        <span className="tree-node-type">outcome</span>
        <span className="tree-node-name">{row.name}</span>
        {row.adjustOp && (
          <span className={row.adjustOp === '+=' ? 'tree-node-adjust-pos' : 'tree-node-adjust-neg'}>
            ({row.adjustOp} {row.adjustValue})
          </span>
        )}
      </div>
    )
  }
  if (row.kind === 'set') {
    return (
      <div className="tree-row" key={key}>
        <span className="tree-node-key">set</span>
        <span>{row.name}</span>
        <span className="tree-node-op">{row.op}</span>
        <span className="tree-node-value">{row.value}</span>
      </div>
    )
  }
  if (row.kind === 'branch') {
    return (
      <div className="tree-row" key={key}>
        <span className="tree-node-type">branch</span>
        <span className="tree-node-value">{row.varName} {row.rel} {row.value}</span>
        <span className="tree-node-arrow">&rarr;</span>
        <span className="tree-node-target">{row.target}</span>
      </div>
    )
  }
  return (
    <div className="tree-row" key={key}>
      <span className="tree-node-key">binary-output</span>
    </div>
  )
}

export function ParseTracePanel({ panelRef, result }: { panelRef?: RefObject<HTMLDivElement>; result: StageResult | null }) {
  const status = statusOf(result)
  const rows = status === 'success' && result ? parseTraceDump(result.stdout) : []

  return (
    <PanelShell
      panelRef={panelRef}
      index="02"
      title="Parse Trace"
      status={status}
      className="panel-accent-violet"
      footer={
        <>
          <span>{status === 'success' ? `${rows.length} reductions` : ' '}</span>
          <span className={status === 'error' ? 'panel__foot-err' : 'panel__foot-ok'}>
            {status === 'pending' ? 'awaiting run' : status === 'success' ? 'LALR(1) clean' : status === 'error' ? 'parse error' : ''}
          </span>
        </>
      }
    >
      {status === 'pending' && <EmptyState icon="&larr;&rarr;" text="Run to see the Bison reduction trace." />}
      {status === 'skipped' && <SkippedBody />}
      {status === 'error' && result && <ErrorBody result={result} />}
      {status === 'success' && (
        <div className="tree-list">
          <div className="tree-branch">{rows.map((row, i) => traceRowNode(row, i))}</div>
        </div>
      )}
    </PanelShell>
  )
}

// AST fields come back as flat key=value pairs from the raw dump. Route each
// key through the same color language used elsewhere (violet=identifier,
// amber=numeric magnitude, faint=structural operator, green/red=adjustment
// sign) instead of printing every field as identical "key=value" text.
function AstField({ fieldKey, value }: { fieldKey: string; value: string }) {
  if (fieldKey === 'name' || fieldKey === 'var') {
    return <span className="tree-node-name">{value}</span>
  }
  if (fieldKey === 'target') {
    return (
      <>
        <span className="tree-node-arrow">&rarr;</span>
        <span className="tree-node-target">{value}</span>
      </>
    )
  }
  if (fieldKey === 'op' || fieldKey === 'rel') {
    return <span className="tree-node-op">{value}</span>
  }
  if (fieldKey === 'adjust') {
    const positive = value.startsWith('+')
    return <span className={positive ? 'tree-node-adjust-pos' : 'tree-node-adjust-neg'}>({value})</span>
  }
  if (fieldKey === 'value') {
    return <span className="tree-node-value">{value}</span>
  }
  return (
    <>
      <span className="tree-node-key">{fieldKey}=</span>
      <span className="tree-node-value">{value}</span>
    </>
  )
}

// ---------------------------------------------------------------------------

export function AstPanel({ panelRef, result }: { panelRef?: RefObject<HTMLDivElement>; result: StageResult | null }) {
  const status = statusOf(result)
  const dump = status === 'success' && result ? parseAstDump(result.stdout) : null

  return (
    <PanelShell
      panelRef={panelRef}
      index="03"
      title="Syntax Tree (AST)"
      status={status}
      className="panel-accent-emerald"
      footer={
        <>
          <span>{dump ? `${dump.nodes.length} nodes` : ' '}</span>
          <span className={status === 'error' ? 'panel__foot-err' : 'panel__foot-ok'}>
            {status === 'pending' ? 'awaiting run' : status === 'success' ? 'RTTI walk clean' : status === 'error' ? 'ast error' : ''}
          </span>
        </>
      }
    >
      {status === 'pending' && <EmptyState icon="&#128193;" text="Run to see the typed AST." />}
      {status === 'skipped' && <SkippedBody />}
      {status === 'error' && result && <ErrorBody result={result} />}
      {status === 'success' && dump && (
        <div className="tree-list">
          <div className="tree-root">
            <IconCheckCircle />
            <span>Root: ProgramNode{dump.binaryOutput ? ' (binary-output)' : ''}</span>
          </div>
          <div className="tree-branch">
            {dump.nodes.map((n, i) => {
              const lineField = n.fields.find(([k]) => k === 'line')
              const restFields = n.fields.filter(([k]) => k !== 'line')
              return (
                <div className="tree-row" key={i}>
                  {lineField && <span className="ast-line-badge">L{lineField[1]}</span>}
                  <span className="tree-node-type">{n.type}</span>
                  {restFields.map(([k, v]) => (
                    <AstField key={k} fieldKey={k} value={v} />
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </PanelShell>
  )
}

// ---------------------------------------------------------------------------

export function IrPanel({ panelRef, result }: { panelRef?: RefObject<HTMLDivElement>; result: StageResult | null }) {
  const status = statusOf(result)
  const lines = status === 'success' && result ? result.stdout.replace(/\r\n/g, '\n').replace(/\n+$/, '').split('\n') : []

  return (
    <PanelShell
      panelRef={panelRef}
      index="04"
      title="LLVM IR"
      status={status}
      okLabel="opt -O0"
      className="panel-accent-amber"
      footer={
        <>
          <span>{status === 'success' ? `${lines.length} lines` : ' '}</span>
          <span className="panel__foot-ok">{status === 'success' ? 'module verified' : status === 'pending' ? 'awaiting run' : ''}</span>
        </>
      }
    >
      {status === 'pending' && <EmptyState icon="IR" text="Run to see the lowered LLVM IR." />}
      {status === 'skipped' && <SkippedBody />}
      {status === 'error' && result && <ErrorBody result={result} />}
      {status === 'success' && (
        <div className="ir-list">
          {lines.map((line, i) => {
            if (isIrComment(line)) return <div className="ir-line ir-comment" key={i}>{line}</div>
            if (isIrLabel(line)) return <div className="ir-line ir-label" key={i}>{line}</div>
            const indented = /^\s/.test(line)
            return (
              <div className={`ir-line ${indented ? 'ir-line-indent' : ''}`} key={i}>
                {highlightIrLine(line).map((tok, j) => (
                  <span className={`ir-${tok.cls}`} key={j}>{tok.text}</span>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </PanelShell>
  )
}

// ---------------------------------------------------------------------------

export function RunPanel({
  panelRef,
  result,
  elapsedMs,
}: {
  panelRef?: RefObject<HTMLDivElement>
  result: StageResult | null
  elapsedMs: number | null
}) {
  const status = statusOf(result)
  const output = result ? result.stdout.replace(/\r\n/g, '\n').replace(/\s+$/, '') : ''

  return (
    <PanelShell
      panelRef={panelRef}
      index="05"
      title="JIT Output"
      status={status}
      okLabel="passed"
      className="panel-span-2 panel-accent-sky"
      footer={
        <>
          <span>{elapsedMs !== null ? `${elapsedMs.toFixed(1)}ms total` : ' '}</span>
          <span className={status === 'error' ? 'panel__foot-err' : 'panel__foot-ok'}>
            {result?.exitCode !== null && result?.exitCode !== undefined ? `RC: ${result.exitCode}` : status === 'pending' ? 'awaiting run' : ''}
          </span>
        </>
      }
    >
      {status === 'pending' && <EmptyState icon="$" text="Compile &amp; run to JIT-execute the program with lli." />}
      {status === 'skipped' && <SkippedBody />}
      {status === 'error' && result && (
        <div className="run-body">
          <div className="run-cmd"><span className="run-cmd__prompt">$</span><span>{result.command || 'lli pathway.ll'}</span></div>
          <ErrorBody result={result} />
        </div>
      )}
      {status === 'success' && result && (
        <div className="run-body">
          <div className="run-cmd">
            <span className="run-cmd__prompt">$</span>
            <span>{result.command}</span>
          </div>

          {output.length > 0 ? (
            <div className="run-output-row">
              <span className="run-output-row__label">Output</span>
              <span className="run-output-row__value">{output}</span>
            </div>
          ) : (
            <div className="run-output-row">
              <span className="run-output-row__label">Output</span>
              <span className="dim" style={{ fontFamily: 'var(--font-mono)', fontSize: '.7rem' }}>
                (nothing printed by this run)
              </span>
            </div>
          )}

          {result.exitCode !== null && (
            <div className="run-meta-row">
              <span className="run-meta-row__label">Exit Code</span>
              <span className="run-meta-row__value">
                {result.exitCode} (0x{result.exitCode.toString(16).padStart(2, '0')})
              </span>
            </div>
          )}

          <div className="run-footer">
            <span className="run-footer__ok">
              <IconCheckCircle /> Process exited cleanly
            </span>
            {elapsedMs !== null && <span>{elapsedMs.toFixed(1)}ms</span>}
          </div>
        </div>
      )}
    </PanelShell>
  )
}
