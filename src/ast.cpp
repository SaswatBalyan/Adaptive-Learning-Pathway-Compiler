#include "ast.h"

namespace alpc {

const char *set_op_str(SetOp op) {
  switch (op) {
    case OP_ADD: return "+=";
    case OP_SUB: return "-=";
    default:     return "=";
  }
}

const char *rel_op_str(RelOp op) {
  switch (op) {
    case REL_GT: return ">";
    case REL_EQ: return "==";
    default:     return "<";
  }
}

void ProfileSet::print(std::ostream &os) const {
  os << "ProfileSet  line=" << line() << "  name=\"" << name << "\" op=\""
     << set_op_str(op) << "\" value=" << value;
}

void CondBranch::print(std::ostream &os) const {
  os << "CondBranch  line=" << line() << "  var=\"" << var << "\" rel=\""
     << rel_op_str(rel) << "\" value=" << value << " target=\"" << target
     << "\"";
}

void Outcome::print(std::ostream &os) const {
  os << "Outcome     line=" << line() << "  name=\"" << name << "\"";
}

void print_ast(std::ostream &os, const Program &p) {
  os << "Program binary_output=" << (p.binary_output ? 1 : 0) << "\n";
  for (const auto &stmt : p.stmts) {
    os << "  ";
    stmt->print(os);  // virtual dispatch; the node's own RTTI kind picks the form
    os << "\n";
  }
}

void print_trace(std::ostream &os, const Program &p) {
  // Walk in source order via RTTI, mirroring the bottom-up reduction sequence.
  for (const auto &stmt : p.stmts) {
    if (const auto *s = dyn_cast<ProfileSet>(stmt.get())) {
      os << "set " << s->name << " " << set_op_str(s->op) << " " << s->value
         << "\n";
    } else if (const auto *b = dyn_cast<CondBranch>(stmt.get())) {
      os << "branch " << b->var << " " << rel_op_str(b->rel) << " " << b->value
         << " -> " << b->target << "\n";
    } else if (const auto *o = dyn_cast<Outcome>(stmt.get())) {
      os << "outcome " << o->name << "\n";
    }
  }
  if (p.binary_output) os << "binary-output\n";
}

}  // namespace alpc
