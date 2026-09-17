// RTTI + traversal unit tests for the Path-Lang AST (Exp 8).
// assert-based, no framework. Built with -fsanitize=address,undefined by
// `make test-asan` (CONSTRAINTS F7).

#include <cassert>
#include <cstdio>
#include <memory>
#include <sstream>

#include "ast.h"
#include "semantics.h"

using namespace alpc;

static int checks = 0;
#define CHECK(cond)                                                       \
  do {                                                                    \
    ++checks;                                                             \
    if (!(cond)) {                                                        \
      std::fprintf(stderr, "FAIL %s:%d  %s\n", __FILE__, __LINE__, #cond); \
      return 1;                                                           \
    }                                                                     \
  } while (0)

static std::unique_ptr<ASTNode> mkProfile() {
  return std::make_unique<ProfileSet>(1, "perf", OP_ASSIGN, 60);
}
static std::unique_ptr<ASTNode> mkBranch() {
  return std::make_unique<CondBranch>(2, "perf", REL_LT, 70, "remedial");
}
static std::unique_ptr<ASTNode> mkOutcome() {
  return std::make_unique<Outcome>(3, "remedial");
}

int main() {
  // --- isa<> is positive for the right kind, negative for others ---
  auto p = mkProfile();
  auto b = mkBranch();
  auto o = mkOutcome();

  CHECK(isa<ProfileSet>(p.get()));
  CHECK(!isa<CondBranch>(p.get()));
  CHECK(!isa<Outcome>(p.get()));

  CHECK(isa<CondBranch>(b.get()));
  CHECK(!isa<ProfileSet>(b.get()));

  CHECK(isa<Outcome>(o.get()));
  CHECK(!isa<CondBranch>(o.get()));

  // --- isa<> on nullptr is false, never a deref ---
  CHECK(!isa<ProfileSet>(nullptr));

  // --- dyn_cast<> narrows or returns null ---
  const ProfileSet *ps = dyn_cast<ProfileSet>(p.get());
  CHECK(ps != nullptr);
  CHECK(ps->op == OP_ASSIGN && ps->value == 60 && ps->name == "perf");
  CHECK(dyn_cast<Outcome>(p.get()) == nullptr);

  // --- cast<> returns the derived pointer for a correct kind ---
  const CondBranch *cb = cast<CondBranch>(b.get());
  CHECK(cb->rel == REL_LT && cb->target == "remedial" && cb->line() == 2);

  // --- base accessors ---
  CHECK(p->kind() == NK_ProfileSet && p->line() == 1);
  CHECK(o->kind() == NK_Outcome);

  // --- a traversal visits every node exactly once ---
  Program prog;
  prog.stmts.push_back(mkOutcome());
  prog.stmts.push_back(mkProfile());
  prog.stmts.push_back(mkBranch());
  prog.binary_output = true;

  int seen_profile = 0, seen_branch = 0, seen_outcome = 0, total = 0;
  for (const auto &n : prog.stmts) {
    ++total;
    if (isa<ProfileSet>(n.get())) ++seen_profile;
    else if (isa<CondBranch>(n.get())) ++seen_branch;
    else if (isa<Outcome>(n.get())) ++seen_outcome;
  }
  CHECK(total == 3 && seen_profile == 1 && seen_branch == 1 && seen_outcome == 1);

  // --- print_ast emits Program header + one line per statement ---
  std::ostringstream os;
  print_ast(os, prog);
  const std::string dump = os.str();
  int lines = 0;
  for (char c : dump) if (c == '\n') ++lines;
  CHECK(lines == 1 + static_cast<int>(prog.stmts.size()));
  CHECK(dump.find("binary_output=1") != std::string::npos);

  // --- semantic pass: this program is valid (outcome precedes the branch) ---
  CHECK(check_program(prog) == 0);

  // --- and a Backward Design violation is caught ---
  Program bad;
  bad.stmts.push_back(std::make_unique<CondBranch>(1, "x", REL_LT, 1, "late"));
  bad.stmts.push_back(std::make_unique<ProfileSet>(1, "x", OP_ASSIGN, 0));
  CHECK(check_program(bad) >= 1);  // 'x' used before set AND 'late' undeclared

  // --- outcome adjustments: default 0, stored signed, state rule enforced ---
  CHECK(cast<Outcome>(o.get())->adjust == 0);
  Program adj;
  adj.stmts.push_back(std::make_unique<Outcome>(1, "boost", 10));
  adj.stmts.push_back(std::make_unique<ProfileSet>(2, "x", OP_ASSIGN, 1));
  adj.stmts.push_back(std::make_unique<CondBranch>(3, "x", REL_EQ, 1, "boost"));
  CHECK(cast<Outcome>(adj.stmts[0].get())->adjust == 10);
  CHECK(check_program(adj) == 1);  // 'state' not set before the branch
  adj.stmts.insert(adj.stmts.begin() + 1,
                   std::make_unique<ProfileSet>(2, "state", OP_ASSIGN, 0));
  CHECK(check_program(adj) == 0);

  std::printf("unit_ast: %d checks passed\n", checks);
  return 0;
}
