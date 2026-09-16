#include "semantics.h"

#include <map>
#include <set>
#include <string>

#include "diagnostics.h"

namespace alpc {

namespace {
const char *const kStateVar = "state";
}

int check_program(const Program &p) {
  std::map<std::string, int> outcomes;  // declared outcome name -> adjust
  std::set<std::string> vars;      // profile vars + `state`, once SET
  const int before = error_count();

  for (const auto &node : p.stmts) {
    if (const auto *o = dyn_cast<Outcome>(node.get())) {
      if (o->name == kStateVar) {
        reportf(o->line(), "'%s' is reserved and cannot be an outcome name",
                kStateVar);
      } else if (!outcomes.emplace(o->name, o->adjust).second) {
        reportf(o->line(), "outcome '%s' is already declared", o->name.c_str());
      }
    } else if (const auto *s = dyn_cast<ProfileSet>(node.get())) {
      if (s->op != OP_ASSIGN && vars.find(s->name) == vars.end()) {
        reportf(s->line(), "'%s' is updated before it is set", s->name.c_str());
      }
      vars.insert(s->name);
    } else if (const auto *b = dyn_cast<CondBranch>(node.get())) {
      if (vars.find(b->var) == vars.end()) {
        reportf(b->line(), "'%s' is used in a condition before it is set",
                b->var.c_str());
      }
      auto target = outcomes.find(b->target);
      if (target == outcomes.end()) {
        reportf(b->line(),
                "Backward Design violation: '%s' is referenced before it is "
                "declared as an OUTCOME",
                b->target.c_str());
      } else if (target->second != 0 && vars.find(kStateVar) == vars.end()) {
        // Same rule as update-before-declare, applied at the jump site.
        reportf(b->line(),
                "outcome '%s' adjusts '%s', but '%s' is not set before this "
                "branch",
                b->target.c_str(), kStateVar, kStateVar);
      }
    }
  }

  return error_count() - before;
}

}  // namespace alpc
