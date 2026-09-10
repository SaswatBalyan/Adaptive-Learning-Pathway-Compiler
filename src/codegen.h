#ifndef ALPC_CODEGEN_H
#define ALPC_CODEGEN_H

#include <string>

#include "ast.h"

// LLVM IR code generation (Exp 9 & 10). Lowers a validated Program to the
// "Fusion Function" over the Student State (SPEC.md 2.5):
//   * one i32 alloca per variable, `state` starts at 0
//   * SET / += / -= -> store / load+add+store
//   * IF v REL n GOTO L -> icmp + conditional br to a per-outcome basic block
//   * every OUTCOME block branches to prog_end, which loads the Alignment Score
//   * `; b` anywhere -> prog_end calls @print_binary (bit loop, SPEC 2.5),
//     otherwise it prints the score in decimal via @printf
//
// `p` must already have passed alpc::check_program(). Returns the textual .ll;
// sets `ok` false (and writes to stderr) if the module fails LLVM verification.

namespace alpc {

std::string emit_ir(const Program &p, const std::string &module_name, bool &ok);

}  // namespace alpc

#endif  // ALPC_CODEGEN_H
