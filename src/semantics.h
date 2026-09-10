#ifndef ALPC_SEMANTICS_H
#define ALPC_SEMANTICS_H

#include "ast.h"

// Static-semantic checks (SPEC.md 2.4), run as a single source-order pass over
// the AST. Because outcomes and variables are introduced in document order,
// a linear walk reproduces the "declared before referenced" rules:
//   * Backward Design  - GOTO target must be an earlier OUTCOME
//   * outcome uniqueness
//   * variable-before-use in an IF condition
//   * update-before-declare for `+=` / `-=`
//   * `state` is reserved and cannot name an OUTCOME
//
// Every violation is reported through alpc::report. Returns the number of
// errors found (0 == the program is valid).

namespace alpc {

int check_program(const Program &p);

}  // namespace alpc

#endif  // ALPC_SEMANTICS_H
