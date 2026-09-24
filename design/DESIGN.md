---
name: Compiler Workbench Precision
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#3f4850'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#707881'
  outline-variant: '#bfc7d2'
  surface-tint: '#006398'
  primary: '#006194'
  on-primary: '#ffffff'
  primary-container: '#007bb9'
  on-primary-container: '#fdfcff'
  inverse-primary: '#93ccff'
  secondary: '#006c4a'
  on-secondary: '#ffffff'
  secondary-container: '#82f5c1'
  on-secondary-container: '#00714e'
  tertiary: '#4d5d73'
  on-tertiary: '#ffffff'
  tertiary-container: '#66768d'
  on-tertiary-container: '#fdfcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cce5ff'
  primary-fixed-dim: '#93ccff'
  on-primary-fixed: '#001d31'
  on-primary-fixed-variant: '#004b73'
  secondary-fixed: '#85f8c4'
  secondary-fixed-dim: '#68dba9'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005137'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display:
    fontFamily: Geist
    fontSize: 2.25rem
    fontWeight: '600'
    lineHeight: 2.75rem
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Geist
    fontSize: 1.75rem
    fontWeight: '600'
    lineHeight: 2.25rem
    letterSpacing: -0.025em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 1.375rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 1.25rem
    fontWeight: '500'
    lineHeight: 1.625rem
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Geist
    fontSize: 1rem
    fontWeight: '500'
    lineHeight: 1.375rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 0.9375rem
    fontWeight: '400'
    lineHeight: 1.5rem
    letterSpacing: -0.005em
  body-md:
    fontFamily: Geist
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.375rem
    letterSpacing: '0'
  body-sm:
    fontFamily: Geist
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: 1.25rem
    letterSpacing: '0'
  code-lg:
    fontFamily: JetBrains Mono
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.5rem
    letterSpacing: -0.01em
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: 1.375rem
    letterSpacing: -0.01em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1.125rem
    letterSpacing: '0'
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: 0.03em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 0.6875rem
    fontWeight: '500'
    lineHeight: 0.875rem
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.75rem
  gutter-lg: 1rem
  margin: 1rem
  margin-lg: 1.5rem
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
---

## Brand & Style

This design system embodies high-precision developer infrastructure: surgical, lucid, unencumbered, and hyper-legible. Tailored for systems engineers, compiler researchers, and developers inspecting ASTs, intermediate representations (IR), bytecodes, and assembly output, the interface minimizes visual friction to maximize cognitive bandwidth. 

The aesthetic is grounded in modern developer minimalism—drawing inspiration from precision workbench tools like Linear and Vercel. Pristine off-white surfaces isolate complex structured data, while subtle ink hierarchies guide scanning eyes without artificial decoration. Dense data visualizations (tokens, disassembly trees, pass logs) are elevated through deliberate typographic discipline, subtle hairline dividers, and surgical color accents. The UI feels like an optical calibration instrument: responsive, exact, and calm.

## Colors

The palette leverages high-order optical clarity. The background foundation alternates between `#ffffff` for primary code editors and deep inspect panels, `#f8fafc` for structural canvas and workspace backdrops, and `#f1f5f9` for side rails, tabwells, and collapsed panels. 

Borders are strictly structural: hairline boundaries in `#e2e8f0` structure panels, while `#cbd5e1` defines active focus rings and emphasized splitters. Text layers strictly govern the readability hierarchy: `#0f172a` for primary code tokens and dominant headers, `#334155` for secondary data values and inspector labels, and `#64748b` for metadata, line counts, and deactivated controls.

Functional accents remain restrained:
- Primary (`#0284c7` - Sky): Used for active pipeline stages, compilation pass indicators, caret markers, and selected nodes.
- Secondary (`#059669` - Emerald): Used for successful emission flags, optimized bytecode branches, zero-cost abstractions, and execution success signals.
- Tertiary & Slate tones (`#64748b`): Maintain system metadata, diagnostic offsets, and terminal outputs.
- Destructive/Warning roles use crisp crimson (`#e11d48`) and amber (`#d97706`) reserved strictly for syntax breaks, warnings, and compilation halts.

## Typography

Typographic hierarchy utilizes two complementary typefaces: `Geist` for structured interface management, headings, and contextual workflows, and `JetBrains Mono` for source code, disassembled instructions, AST token tags, registers, and numeric counters.

- **Editor & Disassembly Windows**: Exclusively bound to `code-lg` and `code-md` using `JetBrains Mono` with tabular numerals enabled to ensure vertical alignment of memory addresses, opcodes, and IR statements.
- **Labels & Stage Badges**: Rely on uppercase `label-md` and `label-sm` with slight positive tracking to provide scan-friendly identification across dense compiler stages (e.g., `LEX`, `PARSE`, `TYPECHECK`, `LLVM-IR`, `ASM`).
- **Headings & Body UI**: Keep letter tracking neutral-to-tight, matching standard technical dashboard conventions for seamless reading without excessive visual footprint.

## Layout & Spacing

The workspace uses a full-viewport fluid multi-pane layout model engineered around continuous data streaming and side-by-side comparative inspection (e.g., Source Code alongside Target Assembly or Optimization Passes).

- **Multi-Pane Dock System**: Panels span a horizontal multi-column canvas utilizing flexible CSS grid and subgrid structures with `0.75rem` split gutters.
- **Desktop (>= 1280px)**: 3-pane orchestration default (Project/AST Navigator [240px-280px], Editor Workspace [flexible 1fr], Inspector/Output Console [flexible 1fr]). Gaps collapse to hairlines via outer border collapses.
- **Tablet (768px - 1279px)**: 2-pane configuration with tabbed compiler output and persistent collapsible sidebar navigation. Gutter shifts to `0.75rem`.
- **Mobile (< 768px)**: Stacked viewport with full-width segmented tab switching between code view, console, and pipeline phases; section margins step down to `space-sm` (`0.5rem`).
- **Internal Density**: Strict 4px/8px coordinate rhythm for internal component padding to allow dense visual throughput without visual suffocation.

## Elevation & Depth

This design system avoids traditional dropped shadows, instead using crisp low-contrast outlines, hairline borders, and subtle tonal layering to establish depth.

- **Layer 0 (Base Frame)**: `#f8fafc` canvas background behind panels, gutters, and breadcrumb trails.
- **Layer 1 (Work Surfaces)**: `#ffffff` surfaces for active editors, console sheets, and visualizer nodes. Defined by `1px solid #e2e8f0`.
- **Layer 2 (Header, Dock, & Toolbars)**: `#f1f5f9` panels with bottom or right hairline edges in `#e2e8f0` maintaining static grounding.
- **Layer 3 (Modals, Command Palette, Floating Tooltips)**: `#ffffff` base accompanied by a hairline border (`1px solid #cbd5e1`) and an ultra-subtle, clean ambient diffusion (`0 4px 20px -2px rgba(15, 23, 42, 0.05)`).
- **Focus & Active States**: Modulated strictly through sharp 1px focus borders in `#0284c7` (or an offset 2px ring at `rgba(2, 132, 199, 0.15)`) instead of heavy elevation blurs.

## Shapes

The interface embraces a disciplined "Soft" curvature philosophy (scale `1`). The geometric language communicates engineered reliability:
- Base components (inputs, buttons, inspector chips, editor tabs): `0.25rem` (4px).
- Containers, popovers, and inner diagnostic cards: `0.5rem` (8px).
- Outer main stage viewports and dialog structures: `0.75rem` (12px).
- Zero-radius edges are retained for docked viewport tabs, split-screen panels, and edge-to-edge console rows to keep scan lines clean and uninterrupted.

## Components

### Buttons & Actions
- **Primary Button**: Background `#0284c7`, color `#ffffff`, 4px border-radius, font `label-md`. Hover: `#0369a1`. Active: `#075985`. No drop shadow; sharp 1px inset boundary.
- **Secondary / Ghost Button**: Background transparent, border `1px solid #e2e8f0`, color `#334155`. Hover: background `#f1f5f9`, border `#cbd5e1`.
- **Run/Compile CTA**: Emerald variant using `#059669` background with white text, signalling immediate execution.

### Compiler Phase Chips & Status Pills
- Compact badges with `space-xs` (4px) vertical and `space-sm` (8px) horizontal padding.
- Mono typography (`label-sm`).
- **Active Stage**: `#f0f9ff` background, `#0284c7` border, `#0369a1` text.
- **Pass Success**: `#ecfdf5` background, `#059669` border, `#047857` text.
- **Error / Warn**: Inset crimson `#fff1f2` / amber `#fffbeb` background with matched monochrome label colors.

### Editor Panes & Tab Wells
- Tabs sit on `#f1f5f9` wells with bottom border `1px solid #e2e8f0`.
- Active Tab: `#ffffff` background with crisp top border indicator `2px solid #0284c7` and zero bottom border to seamlessly bridge into the workspace.
- Tab close actions reveal on hover with minimal `space-2xs` hitboxes.

### Tree Views & AST Lists
- Visual tree lines use hairline `1px solid #e2e8f0`.
- Row height fixed at 24px with typography `code-sm`. Hover renders `#f8fafc` background across the full width. Active node selection applies `#f0f9ff` and a 2px left border accent in `#0284c7`.

### Inputs & Command Palette
- **Inputs**: Background `#ffffff`, border `1px solid #e2e8f0`, text `#0f172a`, font `code-md` or `body-md`. Focus applies `border-color: #0284c7` and a flat `box-shadow: 0 0 0 1px #0284c7`.
- **Command Palette**: Centered overlay modal (`#ffffff`, border `1px solid #cbd5e1`), with a top sticky search input and bottom keyboard shortcut hint legend rendered in `JetBrains Mono`.

### Checkboxes & Segmented Controls
- Checkboxes: 14px square, `0.125rem` radius, border `1px solid #cbd5e1`. Checked: `#0284c7` fill with crisp white checkmark SVG.
- Segmented Switches (e.g., IR / AST / ASM toggle): Enclosed `#f1f5f9` container with `2px` internal padding; active item sits on a floating `#ffffff` tile with `1px solid #e2e8f0`.