#ifndef ALPC_SEMANTICS_H
#define ALPC_SEMANTICS_H

// Static-semantic checks run from the parser's reduce actions (SPEC.md 2.4).
// Source order is what matters: outcomes must be declared before a GOTO
// targets them (Backward Design), variables before they are used in a
// condition, and `state` before it is `+=`/`-=`d.
//
// Phase 3 also keeps a compact reduction trace for `--parse-trace`; Phase 4
// swaps the trace for AST construction while keeping these checks.

namespace alpc {

enum SetOp { OP_ASSIGN = 0, OP_ADD = 1, OP_SUB = 2 };
enum RelOp { REL_LT = 0, REL_GT = 1, REL_EQ = 2 };

void sema_reset();
void sema_set_trace(bool on);

void sema_declare_outcome(int line, const char *name);
void sema_set(int line, const char *name, int op, int value);
void sema_branch(int line, const char *var, int rel, int value,
                 const char *target);
void sema_mark_binary_output();

bool sema_binary_output();

}  // namespace alpc

#endif  // ALPC_SEMANTICS_H
