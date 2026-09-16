#ifndef ALPC_AST_H
#define ALPC_AST_H

// Path-Lang AST (Exp 8). Three node kinds, one per curriculum stage
// (SPEC.md 2). Type identification uses the LLVM-style RTTI idiom
// (llvm.org/docs/HowToSetUpLLVMStyleRTTI.html): a NodeKind tag set by the
// base constructor, a static classof() per class, and free isa<>/cast<>/
// dyn_cast<>. No dynamic_cast, no -frtti (that is the point of Exp 8).

#include <cassert>
#include <memory>
#include <ostream>
#include <string>
#include <vector>

namespace alpc {

enum SetOp { OP_ASSIGN = 0, OP_ADD = 1, OP_SUB = 2 };
enum RelOp { REL_LT = 0, REL_GT = 1, REL_EQ = 2 };

const char *set_op_str(SetOp op);  // "=", "+=", "-="
const char *rel_op_str(RelOp op);  // "<", ">", "=="

// Enum order is a preorder walk of the hierarchy so classof() range checks
// stay valid if a kind ever gains children.
enum NodeKind {
  NK_ProfileSet,
  NK_CondBranch,
  NK_Outcome,
};

class ASTNode {
 public:
  virtual ~ASTNode() = default;
  ASTNode(const ASTNode &) = delete;
  ASTNode &operator=(const ASTNode &) = delete;

  NodeKind kind() const { return kind_; }
  int line() const { return line_; }

  // RTTI-driven pretty-print of this node (no trailing newline).
  virtual void print(std::ostream &os) const = 0;

 protected:
  ASTNode(NodeKind k, int line) : kind_(k), line_(line) {}

 private:
  const NodeKind kind_;
  const int line_;
};

// SET <name> = / += / -= <value>
class ProfileSet final : public ASTNode {
 public:
  ProfileSet(int line, std::string name, SetOp op, int value)
      : ASTNode(NK_ProfileSet, line),
        name(std::move(name)),
        op(op),
        value(value) {}

  static bool classof(const ASTNode *n) { return n->kind() == NK_ProfileSet; }
  void print(std::ostream &os) const override;

  const std::string name;
  const SetOp op;
  const int value;
};

// IF <var> <rel> <value> GOTO <target>
class CondBranch final : public ASTNode {
 public:
  CondBranch(int line, std::string var, RelOp rel, int value, std::string target)
      : ASTNode(NK_CondBranch, line),
        var(std::move(var)),
        rel(rel),
        value(value),
        target(std::move(target)) {}

  static bool classof(const ASTNode *n) { return n->kind() == NK_CondBranch; }
  void print(std::ostream &os) const override;

  const std::string var;
  const RelOp rel;
  const int value;
  const std::string target;
};

// OUTCOME <name> [ += n | -= n ]
// `adjust` is the signed amount applied to `state` when a GOTO reaches this
// outcome (SPEC 2.5); 0 for a plain declaration.
class Outcome final : public ASTNode {
 public:
  Outcome(int line, std::string name, int adjust = 0)
      : ASTNode(NK_Outcome, line), name(std::move(name)), adjust(adjust) {}

  static bool classof(const ASTNode *n) { return n->kind() == NK_Outcome; }
  void print(std::ostream &os) const override;

  const std::string name;
  const int adjust;
};

// LLVM-style free functions. T must expose `static bool classof(const ASTNode*)`.
template <class T>
bool isa(const ASTNode *n) {
  return n != nullptr && T::classof(n);
}

template <class T>
const T *dyn_cast(const ASTNode *n) {
  return isa<T>(n) ? static_cast<const T *>(n) : nullptr;
}

template <class T>
const T *cast(const ASTNode *n) {
  assert(isa<T>(n) && "alpc::cast<> on the wrong NodeKind");
  return static_cast<const T *>(n);
}

// The whole compiled program. Owns its statements; no cross-links, so no cycles.
struct Program {
  std::vector<std::unique_ptr<ASTNode>> stmts;
  bool binary_output = false;  // any statement ended with "; b" (SPEC 2.5)
};

// `--dump-ast` (Exp 8) and `--parse-trace` (Exp 7) renderings.
void print_ast(std::ostream &os, const Program &p);
void print_trace(std::ostream &os, const Program &p);

}  // namespace alpc

#endif  // ALPC_AST_H
