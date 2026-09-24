import { NextResponse } from 'next/server'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const execFileAsync = promisify(execFile)

const ALPC_ROOT = path.resolve(process.cwd(), '..')
const ALPC_BIN = process.env.ALPC_BIN || path.join(ALPC_ROOT, 'alpc.exe')
const LLI_BIN = process.env.LLI_BIN || 'lli'
const MSYS_BIN_DIRS = [
  process.env.MSYS_MINGW_BIN || 'C:\\msys64\\mingw64\\bin',
  process.env.MSYS_USR_BIN || 'C:\\msys64\\usr\\bin',
]

const MAX_SOURCE_BYTES = 32 * 1024
const EXEC_TIMEOUT_MS = 8000
const MAX_BUFFER = 8 * 1024 * 1024

type StageId = 'tokens' | 'parse' | 'ast' | 'ir' | 'run'
type StageStatus = 'success' | 'error' | 'skipped'

interface StageResult {
  id: StageId
  status: StageStatus
  command: string
  stdout: string
  stderr: string
  exitCode: number | null
}

function runEnv() {
  return {
    ...process.env,
    PATH: [...MSYS_BIN_DIRS, process.env.PATH || ''].join(path.delimiter),
  }
}

async function run(bin: string, args: string[], cwd: string) {
  try {
    const { stdout, stderr } = await execFileAsync(bin, args, {
      cwd,
      env: runEnv(),
      timeout: EXEC_TIMEOUT_MS,
      maxBuffer: MAX_BUFFER,
      windowsHide: true,
    })
    return { stdout, stderr, exitCode: 0 }
  } catch (err) {
    const e = err as NodeJS.ErrnoException & { stdout?: string; stderr?: string; code?: number | string }
    if (e.code === 'ENOENT') {
      throw new Error(`"${bin}" was not found. Build the compiler first (make) and confirm the MSYS2 toolchain is installed.`)
    }
    return {
      stdout: e.stdout ?? '',
      stderr: e.stderr ?? e.message ?? 'unknown error',
      exitCode: typeof e.code === 'number' ? e.code : 1,
    }
  }
}

export async function POST(request: Request) {
  let body: { source?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON.' }, { status: 400 })
  }

  const source = body.source
  if (typeof source !== 'string' || source.length === 0) {
    return NextResponse.json({ error: 'Missing "source" string.' }, { status: 400 })
  }
  if (Buffer.byteLength(source, 'utf8') > MAX_SOURCE_BYTES) {
    return NextResponse.json({ error: `Source too large (max ${MAX_SOURCE_BYTES} bytes).` }, { status: 400 })
  }

  const workDir = await mkdtemp(path.join(tmpdir(), 'alpc-console-'))
  const srcPath = path.join(workDir, 'input.edu')
  const irPath = path.join(workDir, 'input.ll')

  const stages: StageResult[] = []
  let runOutput: { stdout: string; stderr: string; exitCode: number | null } | null = null

  try {
    await writeFile(srcPath, source, 'utf8')

    const tokens = await run(ALPC_BIN, ['--dump-tokens', 'input.edu'], workDir)
    stages.push({
      id: 'tokens',
      status: tokens.exitCode === 0 ? 'success' : 'error',
      command: 'alpc --dump-tokens pathway.edu',
      stdout: tokens.stdout,
      stderr: tokens.stderr,
      exitCode: tokens.exitCode,
    })
    if (tokens.exitCode !== 0) {
      for (const id of ['parse', 'ast', 'ir', 'run'] as StageId[]) {
        stages.push({ id, status: 'skipped', command: '', stdout: '', stderr: '', exitCode: null })
      }
      return NextResponse.json({ stages, runOutput })
    }

    const parse = await run(ALPC_BIN, ['--parse-trace', 'input.edu'], workDir)
    stages.push({
      id: 'parse',
      status: parse.exitCode === 0 ? 'success' : 'error',
      command: 'alpc --parse-trace pathway.edu',
      stdout: parse.stdout,
      stderr: parse.stderr,
      exitCode: parse.exitCode,
    })
    if (parse.exitCode !== 0) {
      for (const id of ['ast', 'ir', 'run'] as StageId[]) {
        stages.push({ id, status: 'skipped', command: '', stdout: '', stderr: '', exitCode: null })
      }
      return NextResponse.json({ stages, runOutput })
    }

    const ast = await run(ALPC_BIN, ['--dump-ast', 'input.edu'], workDir)
    stages.push({
      id: 'ast',
      status: ast.exitCode === 0 ? 'success' : 'error',
      command: 'alpc --dump-ast pathway.edu',
      stdout: ast.stdout,
      stderr: ast.stderr,
      exitCode: ast.exitCode,
    })
    if (ast.exitCode !== 0) {
      for (const id of ['ir', 'run'] as StageId[]) {
        stages.push({ id, status: 'skipped', command: '', stdout: '', stderr: '', exitCode: null })
      }
      return NextResponse.json({ stages, runOutput })
    }

    const ir = await run(ALPC_BIN, ['--emit-ir', 'input.edu'], workDir)
    stages.push({
      id: 'ir',
      status: ir.exitCode === 0 ? 'success' : 'error',
      command: 'alpc --emit-ir pathway.edu',
      stdout: ir.stdout,
      stderr: ir.stderr,
      exitCode: ir.exitCode,
    })
    if (ir.exitCode !== 0) {
      stages.push({ id: 'run', status: 'skipped', command: '', stdout: '', stderr: '', exitCode: null })
      return NextResponse.json({ stages, runOutput })
    }

    await writeFile(irPath, ir.stdout, 'utf8')
    const lli = await run(LLI_BIN, ['input.ll'], workDir)
    const runSuccess = lli.stderr.trim().length === 0
    stages.push({
      id: 'run',
      status: runSuccess ? 'success' : 'error',
      command: 'lli pathway.ll',
      stdout: lli.stdout,
      stderr: lli.stderr,
      exitCode: lli.exitCode,
    })
    runOutput = lli

    return NextResponse.json({ stages, runOutput })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal compile error'
    return NextResponse.json({ error: message, stages }, { status: 500 })
  } finally {
    await rm(workDir, { recursive: true, force: true })
  }
}
