#include "semantics.h"

#include <cstdio>
#include <set>
#include <string>

#include "diagnostics.h"

namespace alpc {

namespace {

const char *const kStateVar = "state";

std::set<std::string> g_outcomes;  // declared, in source order of appearance
std::set<std::string> g_vars;      // profile vars + `state`, once SET
bool g_binary_output = false;
bool g_trace = false;

const char *op_str(int op) {
  switch (op) {
    case OP_ADD: return "+=";
    case OP_SUB: return "-=";
    default:     return "=";
  }
}

const char *rel_str(int rel) {
  switch (rel) {
    case REL_GT: return ">";
    case REL_EQ: return "==";
    default:     return "<";
  }
}

}  // namespace

void sema_reset() {
  g_outcomes.clear();
  g_vars.clear();
  g_binary_output = false;
  g_trace = false;
}

void sema_set_trace(bool on) { g_trace = on; }

bool sema_binary_output() { return g_binary_output; }

void sema_declare_outcome(int line, const char *name) {
  if (name == std::string(kStateVar)) {
    reportf(line, "'%s' is reserved and cannot be an outcome name", name);
    return;
  }
  if (!g_outcomes.insert(name).second) {
    reportf(line, "outcome '%s' is already declared", name);
    return;
  }
  if (g_trace) std::printf("outcome %s\n", name);
}

void sema_set(int line, const char *name, int op, int value) {
  if (op != OP_ASSIGN && g_vars.find(name) == g_vars.end()) {
    reportf(line, "'%s' is updated before it is set", name);
  }
  g_vars.insert(name);
  if (g_trace) std::printf("set %s %s %d\n", name, op_str(op), value);
}

void sema_branch(int line, const char *var, int rel, int value,
                 const char *target) {
  if (g_vars.find(var) == g_vars.end()) {
    reportf(line, "'%s' is used in a condition before it is set", var);
  }
  if (g_outcomes.find(target) == g_outcomes.end()) {
    reportf(line,
            "Backward Design violation: '%s' is referenced before it is "
            "declared as an OUTCOME",
            target);
  }
  if (g_trace) {
    std::printf("branch %s %s %d -> %s\n", var, rel_str(rel), value, target);
  }
}

void sema_mark_binary_output() {
  if (!g_binary_output) {
    g_binary_output = true;
    if (g_trace) std::printf("binary-output\n");
  }
}

}  // namespace alpc
