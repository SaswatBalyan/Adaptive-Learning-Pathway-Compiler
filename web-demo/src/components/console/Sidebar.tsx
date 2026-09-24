'use client'

import { IconCode, IconTokens, IconTrace, IconTree, IconIr, IconRun } from './icons'

export type PanelTarget = 'editor' | 'tokens' | 'parse' | 'ast' | 'ir' | 'run'

interface SidebarProps {
  active: PanelTarget
  onNavigate: (target: PanelTarget) => void
}

const ITEMS: { id: PanelTarget; icon: React.ReactNode; label: string }[] = [
  { id: 'editor', icon: <IconCode />, label: 'Workbench' },
  { id: 'tokens', icon: <IconTokens />, label: 'Lexer Tokens' },
  { id: 'parse', icon: <IconTrace />, label: 'Parse Trace' },
  { id: 'ast', icon: <IconTree />, label: 'Syntax Tree' },
  { id: 'ir', icon: <IconIr />, label: 'LLVM IR' },
  { id: 'run', icon: <IconRun />, label: 'Execution' },
]

export function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside className="app-sidebar" aria-label="Panel navigation">
      <nav className="app-sidebar__nav">
        {ITEMS.map((item) => (
          <button
            key={item.id}
            className="app-sidebar__item"
            title={item.label}
            aria-label={item.label}
            aria-current={active === item.id}
            onClick={() => onNavigate(item.id)}
          >
            {item.icon}
          </button>
        ))}
      </nav>
    </aside>
  )
}
