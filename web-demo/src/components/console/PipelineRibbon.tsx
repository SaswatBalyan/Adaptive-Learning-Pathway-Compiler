'use client'

import { STAGE_ORDER, STAGE_META } from './types'
import type { CompileResponse, StageStatus } from './types'
import { IconCheck, IconCross, IconDash, IconBolt } from './icons'

interface PipelineRibbonProps {
  result: CompileResponse | null
  compiling: boolean
}

const SHORT_LABEL: Record<string, string> = {
  tokens: 'Lex',
  parse: 'Parse',
  ast: 'AST',
  ir: 'IR',
  run: 'Run',
}

function chipClass(status: StageStatus | 'pending' | 'active') {
  if (status === 'success') return 'pipeline-chip pipeline-chip-success'
  if (status === 'error') return 'pipeline-chip pipeline-chip-error'
  if (status === 'skipped') return 'pipeline-chip pipeline-chip-skipped'
  if (status === 'active') return 'pipeline-chip pipeline-chip-active'
  return 'pipeline-chip'
}

function chipIcon(status: StageStatus | 'pending' | 'active') {
  if (status === 'success') return <IconCheck />
  if (status === 'error') return <IconCross />
  if (status === 'skipped') return <IconDash />
  if (status === 'active') return <IconBolt />
  return null
}

export function PipelineRibbon({ result, compiling }: PipelineRibbonProps) {
  const failedStage = result?.stages.find((s) => s.status === 'error')
  const allPassed = !!result && !failedStage

  let statusText = 'Idle'
  let dotClass = 'status-dot'
  if (compiling) {
    statusText = 'Compiling…'
    dotClass = 'status-dot status-dot-busy'
  } else if (result && allPassed) {
    statusText = 'All passes passed'
    dotClass = 'status-dot status-dot-ok'
  } else if (result && failedStage) {
    statusText = `Failed at ${STAGE_META[failedStage.id].title}`
    dotClass = 'status-dot status-dot-err'
  }

  return (
    <div className="pipeline-ribbon">
      <div className="pipeline-ribbon__left">
        <span className="pipeline-ribbon__label">Pipeline</span>
        <div className="header-divider" />
        <div className="pipeline-ribbon__stages">
          {STAGE_ORDER.map((id, i) => {
            const stageResult = result?.stages.find((s) => s.id === id) ?? null
            const isNextToRun = compiling && !stageResult
            const status: StageStatus | 'pending' | 'active' = isNextToRun ? 'active' : stageResult?.status ?? 'pending'
            return (
              <span key={id} style={{ display: 'contents' }}>
                {i > 0 && <span className="pipeline-arrow">&rarr;</span>}
                <span className={chipClass(status)}>
                  {chipIcon(status)} {SHORT_LABEL[id]}
                </span>
              </span>
            )
          })}
        </div>
      </div>
      <div className="pipeline-ribbon__status" role="status" aria-live="polite">
        <span>{statusText}</span>
        <span className={dotClass} aria-hidden />
      </div>
    </div>
  )
}
