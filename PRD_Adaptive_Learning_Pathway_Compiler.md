# Product Requirements Document: Adaptive Learning Pathway Compiler (ALPC)

---

## 1. Overview & Vision

Build the **Adaptive Learning Pathway Compiler (ALPC)**, a simplified Domain-Specific Language (DSL) compiler for **"Path-Lang"** — a language educators use to describe student profiles and adaptive branching logic. ALPC translates Path-Lang source into **LLVM Intermediate Representation (IR)**, simulating how a student's performance state evolves as they move through a learning pathway. The project is scoped to fit the **30-hour Compiler Design Lab (BCSE307P)** requirement and is designed to walk through the full compiler pipeline — lexing, parsing, AST construction with RTTI, and IR code generation — using a concrete, demonstrable educational scenario rather than a generic toy language.

## 2. Research Inspiration

The design draws on three sources for its theoretical and pedagogical grounding:

- **Adaptive learning / LLM-powered personalization research** — motivates mapping a student profile (`X_student`) and performance metrics (`m_i`) to a customized curriculum path.
- **LLM alignment with curriculum standards and student personas research** — motivates modeling student attributes (grade level, locale) as first-class profile fields the DSL can branch on.
- **An Ethical AI Framework for STEM Education** — motivates keeping the adaptive logic transparent and traceable (every branch decision should be inspectable in the generated IR), balancing predictive accuracy with stakeholder trust.

> **Note:** The proposal document's citation numbers for the first source (arXiv 2412.10950) point to a different paper than the one titled — that arXiv ID actually resolves to *"Adaptive Learning Pipeline for Comprehensive AI Analysis" (ALPACA)*. Worth double-checking the reference list before submission so the bibliography matches what's actually being cited.

## 3. Problem Statement

The Compiler Design Lab curriculum requires students to build a working lexer → parser → AST → codegen pipeline, but the standard lab exercises use generic, disconnected toy grammars that don't map to any real-world domain. This makes it hard to demonstrate *why* each compiler stage matters. ALPC solves this by giving every compiler phase a concrete educational purpose: tokens represent curriculum concepts, the grammar enforces a pedagogical design principle (Backward Design), and the final IR output produces a meaningful, checkable artifact (a student's binary-encoded performance score) rather than an arbitrary number.

## 4. Target Users

- **Lab Student (Implementer):** Builds and demonstrates the compiler to satisfy the BCSE307P lab requirements.
- **Lab Evaluator / Faculty:** Assesses whether each experiment (Flex, Bison, RTTI, IR/Assembler) is correctly implemented and demonstrated.
- **Educator (DSL End User, conceptual):** The persona Path-Lang is written for — defines student profiles and adaptive rules in a readable, domain-specific syntax.

---

## 5. Core Requirements

### 5.1 Functional Requirements

- Lexer (Flex) recognizing Path-Lang tokens: `SET`, `IF`, `GOTO`, `OUTCOME`, identifiers, numeric literals, comparison operators (`<`, `>`, `==`), and the custom `; b` binary-output terminator
- Parser (Bison) implementing a Context-Free Grammar that enforces **Backward Design** ordering — outcomes must be declared before activities/branches that reference them
- Support for the three core Path-Lang constructs: **Student Profile** (`SET grade_level = 5;`), **Adaptive Logic** (`IF performance < 70 GOTO remedial;`), and the **Binary Output Trigger** (`; b`)
- Abstract Syntax Tree (AST) where each node type represents a curriculum stage (profile assignment, conditional branch, outcome)
- LLVM-style RTTI (`classof`, `isa<>`, `dyn_cast<>`-equivalent pattern) for safely traversing and identifying AST node types
- Code generation that emits **LLVM IR** modeling the "Fusion Function" — updating a "Student State" value via basic arithmetic (e.g., `skill + 10`)
- Binary-output trigger: when a statement ends in `; b`, the emitted IR/assembler includes logic to convert the final Alignment Score into a binary string printed to the console (e.g., `15` → `1111`)
- A runnable end-to-end example: compiling and executing a sample `pathway.edu` source file

### 5.2 Non-Functional Requirements

- **Scope:** Implementation must be completable within the 30-hour lab time budget
- **Curriculum Fit:** Each phase must map cleanly onto a specific Indicative Experiment (Exp. 7–10) in BCSE307P
- **Toolchain:** Must build with standard Flex, Bison, and the LLVM C++ API/toolchain available in the lab environment
- **Correctness:** Grammar must reject pathways that violate Backward Design ordering (activity before outcome)
- **Demonstrability:** Every stage (tokens, parse tree, AST, IR, final binary output) must be independently showable to an evaluator, not just the final result

---

## 6. User Stories & Acceptance Criteria

### Epic 1: Lexical & Syntax Analysis (Flex / Bison)

**As a** lab student, **I want** a scanner and parser for Path-Lang, **so that** curriculum source files can be tokenized and validated against the language grammar.

**Acceptance Criteria:**
- [ ] `scanner.l` recognizes `SET`, `IF`, `GOTO`, `OUTCOME`, identifiers, numbers, comparators, and `; b`
- [ ] `parser.y` defines a CFG covering profile assignment, conditional branches, and the binary terminator
- [ ] Grammar rejects a pathway where an activity references an outcome not yet declared (Backward Design check)
- [ ] Parser produces a syntax tree / parse trace for a sample program
- [ ] Malformed input produces a clear syntax error rather than a crash

### Epic 2: AST Construction & RTTI

**As a** lab student, **I want** an AST with LLVM-style RTTI, **so that** curriculum-stage nodes can be identified and traversed safely during code generation.

**Acceptance Criteria:**
- [ ] AST node hierarchy models profile-set, conditional-branch, and outcome-trigger nodes
- [ ] RTTI pattern (`classof`/`isa`-equivalent) implemented and used during traversal
- [ ] Tree traversal correctly visits every node in a multi-statement pathway
- [ ] AST structure demonstrated with a printed/visualized tree for a sample input

### Epic 3: LLVM IR Code Generation

**As a** lab student, **I want** the AST lowered to LLVM IR, **so that** the "Fusion Function" (student state update) can be simulated and inspected.

**Acceptance Criteria:**
- [ ] IR generated for `SET` assignments and arithmetic updates (e.g., `skill + 10`)
- [ ] IR generated for `IF ... GOTO` branching logic using LLVM basic blocks
- [ ] Generated `.ll` file is valid and inspectable with standard LLVM tools
- [ ] IR correctly reflects the final "Alignment Score" after all statements execute

### Epic 4: Binary Output Trigger & Demonstration

**As a** lab evaluator, **I want** to see the `; b` terminator produce a binary-formatted result, **so that** the unique lab modification requirement is verifiably met.

**Acceptance Criteria:**
- [ ] Compiling `pathway.edu` end-to-end produces a running executable/assembler output
- [ ] A statement terminated with `; b` prints the final performance metric in binary (e.g., `15` → `1111`)
- [ ] `scanner.l` and `parser.y` are presented as part of the demonstration
- [ ] Full pipeline (lex → parse → AST/RTTI → IR → binary output) is shown in one run

---

## 7. Technical Considerations

- **Toolchain:** Flex (lexer), Bison (parser), LLVM C++ API (IR generation + RTTI patterns), standard C/C++ compiler
- **Integration Points:**
  - `scanner.l` — token definitions, including the `; b` terminator
  - `parser.y` — CFG + Backward Design ordering checks
  - `ast.h` / `ast.cpp` — AST node classes with RTTI
  - `codegen.cpp` — AST → LLVM IR lowering, Fusion Function logic
  - `pathway.edu` — sample Path-Lang source file for demonstration
- **Curriculum Mapping:**

| Phase | Lab Experiment | Implementation Detail |
|---|---|---|
| Lexical Analysis | Exp 7: Intro to Flex | Tokens for `OUTCOME`, `GOTO`, and the `; b` binary terminator |
| Syntax Analysis | Exp 7: Intro to Bison | CFG enforcing Backward Design (outcomes before activities) |
| AST & RTTI | Exp 8: LLVM-style RTTI | AST nodes for curriculum stages, traversed via RTTI |
| Code Generation | Exp 9 & 10: IR & Assembler | AST → LLVM IR modeling the Fusion Function; binary output logic |

- **Deployment / Demo Strategy:** No runtime service — this is a lab artifact. Demonstrated by compiling and running `pathway.edu` locally and showing intermediate outputs (tokens, parse tree, AST dump, `.ll` IR, final binary result) at each stage.

## 8. Success Metrics

- **Pipeline Completeness:** All four stages (lex, parse, AST/RTTI, IR codegen) implemented and independently demonstrable
- **Correctness:** Sample `pathway.edu` compiles and runs without errors
- **Binary Output Accuracy:** `; b`-terminated statements print the correct binary representation of the final score
- **Grammar Enforcement:** Backward Design ordering violations are correctly rejected at parse time
- **Time Budget:** Full implementation completed within the 30-hour lab allocation
- **Demonstration Readiness:** `scanner.l`, `parser.y`, and a full compile-and-run walkthrough are ready to present to the evaluator
