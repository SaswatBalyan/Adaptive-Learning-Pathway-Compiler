import {
  Check,
  X,
  Minus,
  CircleNotch,
  CaretRight,
  Terminal,
  FileCode,
  Play,
  GearSix,
  Columns,
  Code,
  TreeStructure,
  BracketsCurly,
  Bug,
  Question,
  CheckCircle,
  Copy,
  FolderOpen,
  Lightning,
  MoonStars,
  Sun,
  ArrowRight,
} from '@phosphor-icons/react/dist/ssr'

export function IconCheck({ className }: { className?: string }) {
  return <Check className={className} size={12} weight="bold" />
}

export function IconCross({ className }: { className?: string }) {
  return <X className={className} size={12} weight="bold" />
}

export function IconDash({ className }: { className?: string }) {
  return <Minus className={className} size={12} weight="bold" />
}

export function IconSpinner({ className }: { className?: string }) {
  return <CircleNotch className={`spin ${className ?? ''}`} size={14} weight="bold" />
}

export function IconChevron({ className, open }: { className?: string; open: boolean }) {
  return (
    <CaretRight
      className={className}
      size={12}
      weight="bold"
      style={{ transform: open ? 'rotate(90deg)' : 'none' }}
    />
  )
}

export function IconPrompt({ className }: { className?: string }) {
  return <Terminal className={className} size={30} weight="light" />
}

export function IconFile({ className }: { className?: string }) {
  return <FileCode className={className} size={13} weight="regular" />
}

export function IconPlay({ className }: { className?: string }) {
  return <Play className={className} size={12} weight="fill" />
}

export function IconTerminal({ className }: { className?: string }) {
  return <Terminal className={className} size={16} weight="regular" />
}

export function IconSettings({ className }: { className?: string }) {
  return <GearSix className={className} size={16} weight="regular" />
}

export function IconColumns({ className }: { className?: string }) {
  return <Columns className={className} size={16} weight="regular" />
}

export function IconCode({ className }: { className?: string }) {
  return <Code className={className} size={17} weight="regular" />
}

export function IconTree({ className }: { className?: string }) {
  return <TreeStructure className={className} size={17} weight="regular" />
}

export function IconTokens({ className }: { className?: string }) {
  return <BracketsCurly className={className} size={17} weight="regular" />
}

export function IconRun({ className }: { className?: string }) {
  return <Bug className={className} size={17} weight="regular" />
}

export function IconHelp({ className }: { className?: string }) {
  return <Question className={className} size={16} weight="regular" />
}

export function IconCheckCircle({ className }: { className?: string }) {
  return <CheckCircle className={className} size={13} weight="fill" />
}

export function IconCopy({ className }: { className?: string }) {
  return <Copy className={className} size={13} weight="regular" />
}

export function IconFolder({ className }: { className?: string }) {
  return <FolderOpen className={className} size={13} weight="regular" />
}

export function IconBolt({ className }: { className?: string }) {
  return <Lightning className={className} size={12} weight="fill" />
}

export function IconMoon({ className }: { className?: string }) {
  return <MoonStars className={className} size={15} weight="regular" />
}

export function IconSun({ className }: { className?: string }) {
  return <Sun className={className} size={15} weight="regular" />
}

export function IconArrow({ className }: { className?: string }) {
  return <ArrowRight className={className} size={11} weight="bold" />
}

export function IconTrace({ className }: { className?: string }) {
  return <Terminal className={className} size={17} weight="regular" />
}

export function IconIr({ className }: { className?: string }) {
  return <FileCode className={className} size={17} weight="regular" />
}
