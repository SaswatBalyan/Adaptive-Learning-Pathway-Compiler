'use client'

import { useState } from 'react'
import { TerminalBlock } from './TerminalBlock'
import { IconCheck, IconCross, IconDash, IconChevron } from './icons'
import type { StageResult, StageId } from './types'
import { STAGE_META } from './types'

interface PipelineStageProps {
  index: number
  id: StageId
  result: StageResult | null
}

function StatusBadge({ status }: { status: StageResult['status'] | 'pending' }) {
  if (status === 'success') {
    return <span className="badge badge-success"><IconCheck /> pass</span>
  }
  if (status === 'error') {
    return <span className="badge badge-error"><IconCross /> fail</span>
  }
  if (status === 'skipped') {
    return <span className="badge badge-skipped"><IconDash /> skipped</span>
  }
  return <span className="badge badge-idle">pending</span>
}

export function PipelineStage({ index, id, result }: PipelineStageProps) {
  const meta = STAGE_META[id]
  const [open, setOpen] = useState(true)
  const status = result?.status ?? 'pending'
  const isFinal = id === 'run'

  return (
    <div className={`stage-card stage-card-${status}`} style={{ animationDelay: `${index * 90}ms` }}>
      <button className="stage-card__head" onClick={() => setOpen((o) => !o)}>
        <span className="stage-card__idx">{String(index + 1).padStart(2, '0')}</span>
        <span className="stage-card__title-wrap">
          <span className="stage-card__title">{meta.title}</span>
          <span className="stage-card__tag">{meta.tag}</span>
        </span>
        <StatusBadge status={status} />
        <IconChevron className="stage-card__chevron" open={open} />
      </button>

      {open && (
        <div className="stage-card__body">
          <p className="stage-card__blurb">{meta.blurb}</p>

          {status === 'skipped' && (
            <p className="stage-card__note stage-card__note-skip">
              Not reached — an earlier stage failed, so ALPC never gets here.
            </p>
          )}

          {result && result.status !== 'skipped' && (
            <>
              <p className="cmd-line"><span className="chip">{result.command}</span></p>

              {status === 'error' && (
                <TerminalBlock title="stderr" text={result.stderr} tone="err" />
              )}

              {!isFinal && (
                <TerminalBlock
                  title={id === 'ir' ? 'pathway.ll' : `${id} output`}
                  text={result.stdout}
                  tone={status === 'error' ? 'err' : 'out'}
                />
              )}

              {isFinal && status === 'success' && (
                <div className="run-result">
                  {result.stdout.trim().length > 0 ? (
                    <div className="term">
                      <div className="term-bar"><span className="dot" />program output</div>
                      <pre className="term-body"><span className="big">{result.stdout.replace(/\s+$/, '')}</span></pre>
                    </div>
                  ) : (
                    <p className="stage-card__note">
                      Nothing was printed — this source never used <span className="chip">; b</span>. The Alignment
                      Score is the process exit code below instead.
                    </p>
                  )}
                  {result.exitCode !== null && (
                    <p className="stage-card__note">
                      Exit code <span className="chip">{result.exitCode}</span> — this is the final value of{' '}
                      <span className="chip">state</span>, the Alignment Score.
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {meta.next && status === 'success' && (
            <p className="stage-card__next">{meta.next}</p>
          )}
        </div>
      )}
    </div>
  )
}
