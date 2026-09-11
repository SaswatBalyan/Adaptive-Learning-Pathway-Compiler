# 



# Product Requirements Document: Adaptive Learning Pathway Compiler (ALPC)
---

## 1. Overview & Vision
Build the **Adaptive Learning Pathway Compiler (ALPC)**, a simplified Domain-Specific Language (DSL) compiler for **"Path-Lang"** — a language educators use to describe student profiles and adaptive branching logic. ALPC translates Path-Lang source into **LLVM Intermediate Representation (IR)**, simulating how a student's performance state evolves as they move through a learning pathway. The project is scoped to fit the **30-hour compiler design lab** requirement and is designed to walk through the full compiler pipeline — lexing, parsing, AST construction with RTTI, and IR code generation — using a concrete, demonstrable educational scenario rather than a generic toy language.

---

## 2. Research Inspiration
The design draws on three sources for its theoretical and pedagogical grounding:

- **Adaptive learning / LLM-powered personalization research** — motivates mapping a student profile (`X_student` ) and performance metrics (`m_i` ) to a customized curriculum path.
- **LLM alignment with curriculum standards and student personas research** — motivates modeling student attributes (grade level, locale) as first-class profile fields the DSL can branch on.
- **An Ethical AI Framework for STEM Education** — motivates keeping the adaptive logic transparent and traceable (every branch decision should be inspectable in the generated IR), balancing predictive accuracy with stakeholder trust.
>  **Note:** The proposal document's citation numbers for the first source (arXiv 2412.10950) point to a different paper than the one titled — that arXiv ID actually resolves to _"Adaptive Learning Pipeline for Comprehensive AI Analysis" (ALPACA)_. Worth double-checking the reference list before submission so the bibliography matches what's actually being cited. 

---

## 3. Problem Statement
The Compiler Design Lab curriculum requires students to build a working lexer → parser → AST → codegen pipeline, but the standard lab exercises use generic, disconnected toy grammars that don't map to any real-world domain. This makes it hard to demonstrate _why_ each compiler stage matters. ALPC solves this by giving every compiler phase a concrete educational purpose: tokens represent curriculum concepts, the grammar enforces a pedagogical design principle (Backward Design), and the final IR output produces a meaningful, checkable artifact (a student's binary-encoded performance score) rather than an arbitrary number.

---

## 4. Target Users
| User | Role |
| ----- | ----- |
| **Lab Student (Implementer)** | Builds and demonstrates the compiler to satisfy the compiler requirements. |
| **Lab Evaluator / Faculty** | Assesses whether each phase (Flex, Bison, RTTI, IR/Assembler) is correctly implemented and demonstrated. |
| **Educator (DSL End User, conceptual)** | The persona Path-Lang is written for — defines student profiles and adaptive rules in a readable, domain-specific syntax. |
---

## 5. Architecture
The architecture diagram illustrates the complete ALPC compiler pipeline, organized into three major stages that map directly onto the compiler phases:

1. **Front End** — The Lexer (`scanner.l` ) tokenizes `pathway.edu`  source files, producing tokens such as `SET` , `IF` , `GOTO` , `OUTCOME` , identifiers, numeric literals, comparison operators, and the `; b`  binary-output terminator. The Parser (`parser.y` ) consumes the token stream and enforces the Context-Free Grammar, including the Backward Design Check that rejects pathways referencing an outcome before it is declared.
2. **AST & RTTI** — The AST Builder (`ast.h`  / `ast.cpp` ) constructs an Abstract Syntax Tree with node types `ProfileSet` , `CondBranch` , and `OutcomeTrigger` . LLVM-style RTTI (`classof` , `isa<>` , `dyn_cast<>` ) enables safe traversal and node identification during code generation. An AST dump can be printed for demonstration purposes.
3. **Back End** — Codegen (`codegen.cpp` ) walks the AST and emits LLVM IR implementing the Fusion Function (e.g., `skill + 10` ) and branching logic via basic blocks. The resulting `pathway.ll`  file encodes the Student State and Alignment Score. When a statement ends with `; b` , the generated executable prints the final score in binary (e.g., `15`  → `1111` ).
---

## 6. Core Requirements
### 6.1 Functional Requirements
- Lexer (Flex) recognizing Path-Lang tokens: `SET` , `IF` , `GOTO` , `OUTCOME` , identifiers, numeric literals, comparison operators (`<` , `>` , `==` ), and the custom `; b`  binary-output terminator
- Parser (Bison) implementing a Context-Free Grammar that enforces **Backward Design** ordering — outcomes must be declared before activities/branches that reference them
- Support for the three core Path-Lang constructs:
    - **Student Profile** — `SET grade_level = 5;` 
    - **Adaptive Logic** — `IF performance < 70 GOTO remedial;` 
    - **Binary Output Trigger** — `; b` 

- Abstract Syntax Tree (AST) where each node type represents a curriculum stage (profile assignment, conditional branch, outcome)
- LLVM-style RTTI (`classof` , `isa<>` , `dyn_cast<>` -equivalent pattern) for safely traversing and identifying AST node types
- Code generation that emits **LLVM IR** modeling the "Fusion Function" — updating a "Student State" value via basic arithmetic (e.g., `skill + 10` )
- Binary-output trigger: when a statement ends in `; b` , the emitted IR/assembler includes logic to convert the final Alignment Score into a binary string printed to the console (e.g., `15`  → `1111` )
- A runnable end-to-end example: compiling and executing a sample `pathway.edu`  source file
### 6.2 Non-Functional Requirements
| Requirement | Description |
| ----- | ----- |
| **Scope** | Implementation must be completable within the 30-hour lab time budget |
| **Curriculum Fit** | Each phase maps to a specific compiler phase (lexing, parsing, AST/RTTI, codegen) |
| **Toolchain** | Must build with standard Flex, Bison, and the LLVM C++ API/toolchain available in the lab environment |
| **Correctness** | Grammar must reject pathways that violate Backward Design ordering (activity before outcome) |
| **Demonstrability** | Every stage (tokens, parse tree, AST, IR, final binary output) must be independently showable to an evaluator, not just the final result |
---

## 7. User Stories & Acceptance Criteria
### Epic 1: Lexical & Syntax Analysis (Flex / Bison)
**As a** lab student, **I want** a scanner and parser for Path-Lang, **so that** curriculum source files can be tokenized and validated against the language grammar.

**Acceptance Criteria:**

- [ ] `scanner.l`  recognizes `SET` , `IF` , `GOTO` , `OUTCOME` , identifiers, numbers, comparators, and `; b` 
- [ ] `parser.y`  defines a CFG covering profile assignment, conditional branches, and the binary terminator
- [ ] Grammar rejects a pathway where an activity references an outcome not yet declared (Backward Design check)
- [ ] Parser produces a syntax tree / parse trace for a sample program
- [ ] Malformed input produces a clear syntax error rather than a crash
### Epic 2: AST Construction & RTTI
**As a** lab student, **I want** an AST with LLVM-style RTTI, **so that** curriculum-stage nodes can be identified and traversed safely during code generation.

**Acceptance Criteria:**

- [ ] AST node hierarchy models profile-set, conditional-branch, and outcome-trigger nodes
- [ ] RTTI pattern (`classof` /`isa` -equivalent) implemented and used during traversal
- [ ] Tree traversal correctly visits every node in a multi-statement pathway
- [ ] AST structure demonstrated with a printed/visualized tree for a sample input
### Epic 3: LLVM IR Code Generation
**As a** lab student, **I want** the AST lowered to LLVM IR, **so that** the "Fusion Function" (student state update) can be simulated and inspected.

**Acceptance Criteria:**

- [ ] IR generated for `SET`  assignments and arithmetic updates (e.g., `skill + 10` )
- [ ] IR generated for `IF ... GOTO`  branching logic using LLVM basic blocks
- [ ] Generated `.ll`  file is valid and inspectable with standard LLVM tools
- [ ] IR correctly reflects the final "Alignment Score" after all statements execute
### Epic 4: Binary Output Trigger & Demonstration
**As a** lab evaluator, **I want** to see the `; b` terminator produce a binary-formatted result, **so that** the unique lab modification requirement is verifiably met.

**Acceptance Criteria:**

- [ ] Compiling `pathway.edu`  end-to-end produces a running executable/assembler output
- [ ] A statement terminated with `; b`  prints the final performance metric in binary (e.g., `15`  → `1111` )
- [ ] `scanner.l`  and `parser.y`  are presented as part of the demonstration
- [ ] Full pipeline (lex → parse → AST/RTTI → IR → binary output) is shown in one run
---

## 8. Technical Considerations
### 8.1 Toolchain
- **Flex** — lexer generator
- **Bison** — parser generator
- **LLVM C++ API** — IR generation and RTTI patterns
- **Standard C/C++ compiler** — final executable build
### 8.2 Integration Points
| File | Purpose |
| ----- | ----- |
| `scanner.l`  | Token definitions, including the `; b` terminator |
| `parser.y`  | CFG + Backward Design ordering checks |
| `ast.h` / `ast.cpp`  | AST node classes with RTTI |
| `codegen.cpp`  | AST → LLVM IR lowering, Fusion Function logic |
| `pathway.edu`  | Sample Path-Lang source file for demonstration |
### 8.3 Curriculum Mapping
| Phase | Implementation Detail |
| ----- | ----- | ----- |
| Lexical Analysis | Tokens for `OUTCOME`, `GOTO`, and the `; b` binary terminator |
| Syntax Analysis | CFG enforcing Backward Design (outcomes before activities) |
| AST | AST & RTTI | AST/RTTI | AST nodes for curriculum stages, traversed via RTTI | RTTI | AST nodes for curriculum stages, traversed via RTTI |
| Code Generation | AST → LLVM IR modeling the Fusion Function; binary output logic |
### 8.4 Deployment / Demo Strategy
No runtime service — this is a lab artifact. The end-to-end compilation workflow diagram shows how `pathway.edu` is compiled and run in one pass, with each stage emitting an inspectable demo artifact:

1. **Token stream** — output from the Lexer
2. **Parse tree / trace** — output from the Parser
3. **AST dump / printed tree** — output from the RTTI traversal
4. `**pathway.ll**`  **IR listing** — output from Codegen
5. **Console binary result** — final executable output
Invalid pathways (Backward Design violations or syntax errors) are rejected with a clear message and no crash.

---

## 9. Success Metrics
| Metric | Target |
| ----- | ----- |
| **Pipeline Completeness** | All four stages (lex, parse, AST/RTTI, IR codegen) implemented and independently demonstrable |
| **Correctness** | Sample `pathway.edu` compiles and runs without errors |
| **Binary Output Accuracy** | `; b`-terminated statements print the correct binary representation of the final score |
| **Grammar Enforcement** | Backward Design ordering violations are correctly rejected at parse time |
| **Time Budget** | Full implementation completed within the 30-hour lab allocation |
| **Demonstration Readiness** | <p>`scanner.l`, `parser.y`, and a full compile-and-run walkthrough are ready to present to the evaluator</p><p></p> |


---

# ALPC 30-Hour Implementation Plan
## Executive Summary
This document provides a detailed 30-hour implementation plan for the Adaptive Learning Pathway Compiler (ALPC), mapping each development phase to the compiler phases. The plan includes current-state and target-state architecture analysis, identifies data and logic gaps, and provides a time-boxed schedule for completing all deliverables.

---

## 1. Current System Architecture
### 1.1 Baseline State
At project start, no compiler infrastructure exists. The current state consists only of:

- **Conceptual artifacts**: The PRD defining Path-Lang syntax and semantics
- **Lab environment**: Standard toolchain (Flex, Bison, LLVM C++ API, g++) available but not configured
- **Sample input**: A notional `pathway.edu`  file structure, not yet authored
### 1.2 Current Data Flow
```
[No data flow — system does not exist]

Input:  (none)
Output: (none)
```
### 1.3 Current Components
| Component | Status | Notes |
| ----- | ----- | ----- |
| `scanner.l`  | ❌ Not created | No lexer definitions |
| `parser.y`  | ❌ Not created | No grammar rules |
| `ast.h` / `ast.cpp`  | ❌ Not created | No AST node hierarchy |
| `codegen.cpp`  | ❌ Not created | No IR generation logic |
| `pathway.edu`  | ❌ Not created | No sample source file |
| Build system | ❌ Not configured | Makefile / CMake not set up |
---

## 2. Target System Architecture
### 2.1 Target State
A fully functional compiler pipeline as depicted in the architecture diagram, consisting of:

- **Front End**: Lexer (`scanner.l` ) and Parser (`parser.y` ) with Backward Design enforcement
- **Middle Layer**: AST Builder (`ast.h` /`ast.cpp` ) with LLVM-style RTTI
- **Back End**: Codegen (`codegen.cpp` ) emitting LLVM IR with binary output support
### 2.2 Target Data Flow
As shown in the end-to-end compilation workflow diagram:

```
pathway.edu → Lexer → Parser → Backward Design Check → AST Builder → RTTI Traversal → Codegen → pathway.ll → Binary Output
                ↓         ↓              ↓                  ↓                              ↓
           [tokens]  [parse tree]   [error/valid]     [AST dump]                      [IR listing]  [console: 1111]
```
### 2.3 Target Components
| Component | Deliverable | Demo Artifact |
| ----- | ----- | ----- | ----- |
| `scanner.l`  | Flex lexer recognizing all Path-Lang tokens | Token stream |
| `parser.y`  | Bison grammar with Backward Design check | Parse tree / trace |
| `ast.h` / `ast.cpp`  | AST nodes: `ProfileSet`, `CondBranch`, `OutcomeTrigger`  | AST dump / printed tree |
| RTTI module | `classof`, `isa<>`, `dyn_cast<>` pattern | Safe traversal demo |
| `codegen.cpp`  | Fusion Function logic, basic blocks, `br` instructions | `pathway.ll` IR listing |
| Binary output | `; b` terminator triggers binary conversion | Console prints `15 = 1111`  |
| `pathway.edu`  | Sample Path-Lang source file | End-to-end input |
| `Makefile`  | Build automation | One-command build |
---

## 3. Current Data & Logic Gaps
### 3.1 Data Gaps
| Gap ID | Description | Impact | Resolution |
| ----- | ----- | ----- | ----- |
| D1 | No token definitions for Path-Lang keywords | Cannot tokenize input | Define in `scanner.l`  |
| D2 | No symbol table for declared outcomes | Cannot enforce Backward Design | Add outcome registry in parser |
| D3 | No AST node schema | Cannot represent parsed programs | Design node hierarchy in `ast.h`  |
| D4 | No student state model | Cannot compute Alignment Score | Define state struct in codegen |
| D5 | No binary conversion routine | Cannot produce `; b` output | Implement int-to-binary in IR |
### 3.2 Logic Gaps
| Gap ID | Description | Impact | Resolution |
| ----- | ----- | ----- | ----- |
| L1 | No lexer rules for `; b` terminator | Custom terminator not recognized | Add regex pattern in `scanner.l`  |
| L2 | No Backward Design ordering check | Invalid pathways accepted | Add semantic check in `parser.y` actions |
| L3 | No RTTI dispatch mechanism | Unsafe AST traversal | Implement `classof`/`isa` pattern |
| L4 | No Fusion Function arithmetic | Student state not updated | Emit `add`/`sub` IR instructions |
| L5 | No conditional branch lowering | `IF...GOTO` not compiled | Generate LLVM `br` with basic blocks |
| L6 | No error recovery in parser | Malformed input causes crash | Add Bison error productions |
---

## 4. Target Data & Logic Design
### 4.1 Token Definitions (scanner.l)
```
Token          Pattern              Example
─────────────────────────────────────────────
SET            "SET"                SET
IF             "IF"                 IF
GOTO           "GOTO"               GOTO
OUTCOME        "OUTCOME"            OUTCOME
IDENT          [a-zA-Z_][a-zA-Z0-9_]*   grade_level
NUMBER         [0-9]+               70
COMPARE        "<"|">"|"=="         <
ASSIGN         "="                  =
SEMI           ";"                  ;
SEMI_B         "; b"                ; b
```
### 4.2 Grammar Productions (parser.y)
```
program       → stmt_list
stmt_list     → stmt_list stmt | stmt
stmt          → profile_stmt | branch_stmt | outcome_stmt
profile_stmt  → SET IDENT ASSIGN NUMBER SEMI
branch_stmt   → IF IDENT COMPARE NUMBER GOTO IDENT SEMI
outcome_stmt  → OUTCOME IDENT terminator
terminator    → SEMI | SEMI_B
```
### 4.3 AST Node Hierarchy (ast.h)
```
ASTNode (abstract base)
├── ProfileSet      { name: string, value: int }
├── CondBranch      { var: string, op: CompareOp, threshold: int, target: string }
└── OutcomeTrigger  { name: string, binaryOutput: bool }
```
### 4.4 RTTI Pattern
```cpp
enum NodeKind { NK_ProfileSet, NK_CondBranch, NK_OutcomeTrigger };

class ASTNode {
public:
  NodeKind getKind() const { return kind; }
protected:
  ASTNode(NodeKind k) : kind(k) {}
private:
  NodeKind kind;
};

class ProfileSet : public ASTNode {
public:
  static bool classof(const ASTNode *n) { return n->getKind() == NK_ProfileSet; }
  // ...
};
```
### 4.5 Codegen Logic (codegen.cpp)
| AST Node | LLVM IR Output |
| ----- | ----- |
| `ProfileSet`  | `%name = alloca i32` → `store i32 value, i32* %name`  |
| `CondBranch`  | `%cmp = icmp slt i32 %var, threshold` → `br i1 %cmp, label %target, label %next`  |
| `OutcomeTrigger`  | Load final score → (if `; b`) call `@print_binary`  |
### 4.6 Binary Output Function
```llvm
define void @print_binary(i32 %val) {
  ; Loop: extract bits, print '0'/'1'
  ; Called only when '; b' terminator is present
}
```
---

## 5. 30-Hour Implementation Schedule
### Phase 1: Environment & Lexer (Hours 1–6)
| Hour | Task | Deliverable | Acceptance Check |
| ----- | ----- | ----- | ----- |
| 1–2 | Set up project structure, Makefile, verify Flex/Bison/LLVM install | `Makefile`, directory layout | `make` runs without error |
| 3–4 | Write `scanner.l` with all token rules including `; b`  | `scanner.l`  | Flex compiles without warnings |
| 5–6 | Test lexer standalone with sample input; produce token stream dump | Token stream artifact | All tokens recognized correctly |
**Milestone**: Lexer complete, Flex demonstrable.

---

### Phase 2: Parser & Backward Design (Hours 7–12)
| Hour | Task | Deliverable | Acceptance Check |
| ----- | ----- | ----- | ----- |
| 7–8 | Write `parser.y` grammar productions for all statement types | `parser.y`  | Bison compiles without conflicts |
| 9–10 | Add semantic actions to build parse tree; add outcome registry | Parse tree output | Tree printed for valid input |
| 11–12 | Implement Backward Design check; test rejection of invalid ordering | Error message on violation | Invalid pathway rejected with clear message |
**Milestone**: Parser complete, Bison demonstrable.

---

### Phase 3: AST & RTTI (Hours 13–18)
| Hour | Task | Deliverable | Acceptance Check |
| ----- | ----- | ----- | ----- |
| 13–14 | Define `ASTNode` base class and `NodeKind` enum in `ast.h`  | `ast.h`  | Compiles cleanly |
| 15–16 | Implement `ProfileSet`, `CondBranch`, `OutcomeTrigger` with RTTI | `ast.cpp`  | `classof`/`isa` tests pass |
| 17–18 | Modify parser actions to construct AST; implement AST dump utility | AST dump artifact | Printed tree matches input structure |
**Milestone**: AST/RTTI complete, RTTI demonstrable.

---

### Phase 4: LLVM IR Codegen (Hours 19–26)
| Hour | Task | Deliverable | Acceptance Check |
| ----- | ----- | ----- | ----- |
| 19–20 | Set up LLVM context, module, builder in `codegen.cpp`  | Codegen skeleton | Empty module emits valid IR |
| 21–22 | Implement codegen for `ProfileSet` (alloca, store) | IR for assignments | `opt -verify` passes |
| 23–24 | Implement codegen for `CondBranch` (icmp, br, basic blocks) | IR for conditionals | Branches visible in `.ll`  |
| 25–26 | Implement codegen for `OutcomeTrigger`; add `@print_binary` function | IR for outcome + binary | Score computed correctly |
**Milestone**: Codegen complete, IR demonstrable.

---

### Phase 5: Integration & Demo (Hours 27–30)
| Hour | Task | Deliverable | Acceptance Check |
| ----- | ----- | ----- | ----- |
| 27–28 | Write final `pathway.edu` sample; end-to-end compile and run | `pathway.edu`, executable | Binary output printed (e.g., `1111`) |
| 29 | Prepare demo script: show each artifact (tokens, parse tree, AST dump, `.ll`, binary) | Demo walkthrough notes | All 5 artifacts shown in sequence |
| 30 | Buffer for fixes, documentation, final cleanup | Polished deliverables | Ready for evaluator presentation |
**Milestone**: Full pipeline demonstrable, binary output complete.

---

## 6. Risk Mitigation
| Risk | Likelihood | Impact | Mitigation |
| ----- | ----- | ----- | ----- |
| Bison shift/reduce conflicts | Medium | Delays Phase 2 | Use explicit precedence rules; simplify grammar if needed |
| LLVM API unfamiliarity | High | Delays Phase 4 | Allocate extra buffer in hours 25–26; use LLVM Kaleidoscope tutorial as reference |
| Binary output edge cases | Low | Minor | Test with known values (0, 1, 15, 255) early |
| Time overrun | Medium | Incomplete demo | Prioritize core path; defer advanced error recovery if needed |
---

## 7. Deliverables Checklist
| # | Artifact | File(s) |
| ----- | ----- | ----- | ----- |
| 1 | Lexer | `scanner.l`  |
| 2 | Parser | `parser.y`  |
| 3 | AST + RTTI | `ast.h`, `ast.cpp`  |
| 4 | Codegen | `codegen.cpp`  |
| 5 | Sample source | `pathway.edu`  |
| 6 | Build system | `Makefile`  |
| 7 | Demo artifacts | Token stream, parse tree, AST dump, `pathway.ll`, binary output | Presentation |
---

## 8. Success Criteria Summary
- ✅ All four pipeline stages implemented and independently demonstrable
- ✅ `pathway.edu`  compiles and runs without errors
- ✅ `; b`  terminator prints correct binary representation
- ✅ Backward Design violations rejected at parse time
- ✅ Implementation completed within 30-hour budget
- ✅ `scanner.l` , `parser.y` , and full walkthrough ready for evaluator


