'use client'

import { examples } from '@/data/examples'

interface ToolbarProps {
  selectedId: string
  onSelectExample: (id: string) => void
  onCompile: () => void
  compiling: boolean
}

export function Toolbar({ selectedId, onSelectExample, onCompile, compiling }: ToolbarProps) {
  return (
    <header className="console-topbar">
      <div className="console-brand">
        <span className="console-brand__mark">ALPC</span>
        <span className="console-brand__name">Path-Lang Console</span>
      </div>
      <div className="console-controls">
        <select
          className="select"
          value={selectedId}
          onChange={(e) => onSelectExample(e.target.value)}
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
          {compiling ? 'Compiling…' : 'Compile & Run'}
        </button>
      </div>
    </header>
  )
}
