#include "codegen.h"

#include <map>
#include <string>

#include "llvm/IR/BasicBlock.h"
#include "llvm/IR/Function.h"
#include "llvm/IR/IRBuilder.h"
#include "llvm/IR/LLVMContext.h"
#include "llvm/IR/Module.h"
#include "llvm/IR/Verifier.h"
#include "llvm/Support/raw_ostream.h"

// API surface verified against the installed LLVM 22.1.8 headers
// (IRBuilder.h: CreateAlloca/CreateLoad(Type*,...)/CreateStore/CreateICmpS{LT,GT}
//  /CreateICmpEQ/CreateCondBr/CreatePHI; Verifier.h: verifyModule).

namespace alpc {

namespace {

using llvm::BasicBlock;
using llvm::Function;
using llvm::FunctionType;
using llvm::IRBuilder;
using llvm::Type;
using llvm::Value;

// Build @print_binary(i32 %val): print %val in binary, no leading zeros
// (0 prints as "0"), then a newline, via libc @putchar. (PRD 4.6, SPEC 2.5)
Function *build_print_binary(llvm::Module &m, IRBuilder<> &b) {
  llvm::LLVMContext &ctx = m.getContext();
  Type *i32 = b.getInt32Ty();

  Function *putchar_fn =
      Function::Create(FunctionType::get(i32, {i32}, false),
                       Function::ExternalLinkage, "putchar", &m);
  Function *fn = Function::Create(FunctionType::get(b.getVoidTy(), {i32}, false),
                                  Function::InternalLinkage, "print_binary", &m);
  Value *val = fn->getArg(0);
  val->setName("val");

  BasicBlock *entry = BasicBlock::Create(ctx, "entry", fn);
  BasicBlock *zero = BasicBlock::Create(ctx, "zero", fn);
  BasicBlock *scan = BasicBlock::Create(ctx, "scan", fn);
  BasicBlock *scan_next = BasicBlock::Create(ctx, "scan.next", fn);
  BasicBlock *emit = BasicBlock::Create(ctx, "emit", fn);
  BasicBlock *done = BasicBlock::Create(ctx, "done", fn);

  Value *k0 = b.getInt32(0);
  Value *k1 = b.getInt32(1);
  Value *k31 = b.getInt32(31);

  // entry: if val == 0 -> print '0'; else start scanning from bit 31.
  b.SetInsertPoint(entry);
  b.CreateCondBr(b.CreateICmpEQ(val, k0, "is.zero"), zero, scan);

  b.SetInsertPoint(zero);
  b.CreateCall(putchar_fn, {b.getInt32('0')});
  b.CreateBr(done);

  // scan: walk i from bit 31 down to the most-significant set bit. `val != 0`
  // is guaranteed by the entry check, so some bit in [0,31] is set and `i`
  // reaches `emit` before it could go negative.
  b.SetInsertPoint(scan);
  llvm::PHINode *i = b.CreatePHI(i32, 2, "i");
  Value *bit = b.CreateAnd(b.CreateLShr(val, i), k1, "bit");
  b.CreateCondBr(b.CreateICmpNE(bit, k0, "bit.set"), emit, scan_next);

  b.SetInsertPoint(scan_next);
  Value *i_dec = b.CreateSub(i, k1, "i.dec");
  b.CreateBr(scan);
  i->addIncoming(k31, entry);
  i->addIncoming(i_dec, scan_next);

  // emit: print bits j from the MSB down to 0.
  b.SetInsertPoint(emit);
  llvm::PHINode *j = b.CreatePHI(i32, 2, "j");
  Value *jbit = b.CreateAnd(b.CreateLShr(val, j), k1, "j.bit");
  b.CreateCall(putchar_fn, {b.CreateAdd(jbit, b.getInt32('0'), "j.ch")});
  Value *j_dec = b.CreateSub(j, k1, "j.dec");
  b.CreateCondBr(b.CreateICmpSLT(j_dec, k0, "j.done"), done, emit);
  j->addIncoming(i, scan);
  j->addIncoming(j_dec, emit);

  b.SetInsertPoint(done);
  b.CreateCall(putchar_fn, {b.getInt32('\n')});
  b.CreateRetVoid();

  return fn;
}

llvm::CmpInst::Predicate pred_of(RelOp rel) {
  switch (rel) {
    case REL_GT: return llvm::CmpInst::ICMP_SGT;
    case REL_EQ: return llvm::CmpInst::ICMP_EQ;
    default:     return llvm::CmpInst::ICMP_SLT;
  }
}

}  // namespace

std::string emit_ir(const Program &p, const std::string &module_name, bool &ok) {
  llvm::LLVMContext ctx;
  auto module = std::make_unique<llvm::Module>(module_name, ctx);
  IRBuilder<> b(ctx);
  Type *i32 = b.getInt32Ty();
  Type *ptr = b.getPtrTy();

  // The generated program prints the score one of two ways; emit only what it
  // uses so the .ll stays uncluttered.
  Function *print_binary =
      p.binary_output ? build_print_binary(*module, b) : nullptr;

  Function *main_fn =
      Function::Create(FunctionType::get(i32, {}, false),
                       Function::ExternalLinkage, "main", module.get());
  BasicBlock *entry = BasicBlock::Create(ctx, "entry", main_fn);
  BasicBlock *prog_end = BasicBlock::Create(ctx, "prog_end", main_fn);

  // --- collect variables, one alloca each in entry, all zero-initialised ---
  b.SetInsertPoint(entry);
  std::map<std::string, llvm::AllocaInst *> slots;
  auto slot_for = [&](const std::string &name) -> llvm::AllocaInst * {
    auto it = slots.find(name);
    if (it != slots.end()) return it->second;
    // hoist the alloca to the top of entry
    IRBuilder<> top(entry, entry->begin());
    llvm::AllocaInst *a = top.CreateAlloca(i32, nullptr, name);
    b.CreateStore(b.getInt32(0), a);  // SPEC 2.5: state (and everything) starts 0
    slots[name] = a;
    return a;
  };
  slot_for("state");
  for (const auto &s : p.stmts) {
    if (const auto *ps = dyn_cast<ProfileSet>(s.get())) slot_for(ps->name);
    if (const auto *cb = dyn_cast<CondBranch>(s.get())) slot_for(cb->var);
  }

  // --- one basic block per declared OUTCOME; each ends the pathway ---
  std::map<std::string, BasicBlock *> outcome_bb;
  for (const auto &s : p.stmts) {
    if (const auto *o = dyn_cast<Outcome>(s.get())) {
      BasicBlock *bb = BasicBlock::Create(ctx, "outcome." + o->name, main_fn);
      outcome_bb[o->name] = bb;
      b.SetInsertPoint(bb);
      b.CreateBr(prog_end);
    }
  }

  // --- lower statements in source order ---
  // OUTCOME statements are declarations (Backward Design puts them all up top),
  // so they emit no control flow here - their blocks are already created above.
  // SET / IF form one straight-line path; falling off the end reaches prog_end.
  b.SetInsertPoint(entry);
  int cont_ctr = 0;
  for (const auto &s : p.stmts) {
    if (const auto *ps = dyn_cast<ProfileSet>(s.get())) {
      llvm::AllocaInst *a = slots[ps->name];
      Value *n = b.getInt32(ps->value);
      if (ps->op == OP_ASSIGN) {
        b.CreateStore(n, a);
      } else {
        Value *cur = b.CreateLoad(i32, a, ps->name + ".cur");
        Value *next = (ps->op == OP_ADD) ? b.CreateAdd(cur, n, "fusion")
                                         : b.CreateSub(cur, n, "fusion");
        b.CreateStore(next, a);
      }
    } else if (const auto *cb = dyn_cast<CondBranch>(s.get())) {
      Value *v = b.CreateLoad(i32, slots[cb->var], cb->var + ".val");
      Value *cond =
          b.CreateICmp(pred_of(cb->rel), v, b.getInt32(cb->value), "cond");
      BasicBlock *cont =
          BasicBlock::Create(ctx, "after" + std::to_string(cont_ctr++), main_fn);
      b.CreateCondBr(cond, outcome_bb[cb->target], cont);
      b.SetInsertPoint(cont);
    }
    // Outcome: nothing to emit.
  }
  if (!b.GetInsertBlock()->getTerminator()) b.CreateBr(prog_end);

  // --- prog_end: load the Alignment Score, print it, return it ---
  b.SetInsertPoint(prog_end);
  Value *score = b.CreateLoad(i32, slots["state"], "score");
  if (p.binary_output) {
    b.CreateCall(print_binary, {score});
  } else {
    Function *printf_fn = Function::Create(FunctionType::get(i32, {ptr}, true),
                                           Function::ExternalLinkage, "printf",
                                           module.get());
    Value *fmt = b.CreateGlobalString("%d\n", ".dfmt", 0, module.get());
    b.CreateCall(printf_fn, {fmt, score});
  }
  b.CreateRet(score);

  // --- verify, then render ---
  std::string err;
  llvm::raw_string_ostream errs(err);
  if (llvm::verifyModule(*module, &errs)) {
    llvm::errs() << "internal error: generated IR failed verification:\n" << err;
    ok = false;
    return {};
  }
  ok = true;

  std::string out;
  llvm::raw_string_ostream os(out);
  module->print(os, nullptr);
  return out;
}

}  // namespace alpc
