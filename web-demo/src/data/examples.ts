export interface Example {
  id: string
  name: string
  kind: 'valid' | 'invalid'
  description: string
  source: string
}

export const examples: Example[] = [
  {
    id: 'pathway-demo',
    name: 'Adaptive Pathway',
    kind: 'valid',
    description: 'Three outcomes, a profile, and the Fusion Function — the canonical walkthrough.',
    source: `# ALPC demonstration pathway (SPEC.md 2.1).
# Backward Design: every learning outcome is declared before any rule targets it.
OUTCOME remedial;
OUTCOME core;
OUTCOME advanced;

# Student profile.
SET grade_level = 5;
SET performance = 60;

# Fusion Function: the Student State / Alignment Score.
SET state = 0;
SET state += 15;

# Adaptive logic.
IF performance < 70 GOTO remedial;
IF performance > 85 GOTO advanced;
IF performance < 1000 GOTO core; b`,
  },
  {
    id: 'outcome-adjust',
    name: 'Outcome Adjustments',
    kind: 'valid',
    description: 'Each OUTCOME can add or subtract from the score — the branch taken changes the result.',
    source: `# Outcome adjustments: the pathway taken changes the Alignment Score.
OUTCOME remedial -= 5;
OUTCOME core;
OUTCOME advanced += 10;

SET performance = 90;

SET state = 0;
SET state += 15;

IF performance < 70 GOTO remedial;
IF performance > 85 GOTO advanced;
IF performance < 1000 GOTO core; b`,
  },
  {
    id: 'all-relops',
    name: 'All Comparisons',
    kind: 'valid',
    description: 'Every relational operator Path-Lang supports: <, >, ==.',
    source: `OUTCOME a;
OUTCOME b;
OUTCOME c;
SET x = 5;
IF x < 10 GOTO a;
IF x > 1 GOTO b;
IF x == 5 GOTO c;`,
  },
  {
    id: 'binary-255',
    name: 'Binary 255',
    kind: 'valid',
    description: 'A single SET and a binary-output terminator — the shortest program that prints something.',
    source: `SET state = 255; b`,
  },
  {
    id: 'backward-design',
    name: 'Backward Design Violation',
    kind: 'invalid',
    description: 'GOTO targets an outcome before it is declared — caught during parsing.',
    source: `OUTCOME core;
SET performance = 90;
IF performance < 70 GOTO remedial;`,
  },
  {
    id: 'dup-outcome',
    name: 'Duplicate Outcome',
    kind: 'invalid',
    description: 'The same outcome name declared twice.',
    source: `OUTCOME core;
OUTCOME core;`,
  },
  {
    id: 'missing-semi',
    name: 'Missing Semicolon',
    kind: 'invalid',
    description: 'A dropped statement terminator — a plain syntax error.',
    source: `SET x = 5
OUTCOME done;`,
  },
  {
    id: 'number-overflow',
    name: 'Numeric Overflow',
    kind: 'invalid',
    description: 'A literal outside the 32-bit range — caught by the lexer, before parsing even starts.',
    source: `SET state = 9999999999;`,
  },
]

export const defaultExample = examples[0]
