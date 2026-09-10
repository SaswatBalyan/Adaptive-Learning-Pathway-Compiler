#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <iostream>

#include "ast.h"
#include "codegen.h"
#include "diagnostics.h"
#include "parser.tab.h"  // yyparse, YYSTYPE (yylval)
#include "semantics.h"
#include "tokens.h"

// Provided by the Flex-generated scanner (lex.yy.c is compiled as C++).
int yylex(void);
extern int yylineno;
extern char *yytext;
extern FILE *yyin;
int yyparse(void);

// Shared with the parser's reduce actions.
alpc::Program *g_program = nullptr;

namespace {

int run_dump_tokens() {
  int kind;
  while ((kind = yylex()) != 0) {
    std::printf("line %d: %s \"%s\"\n", yylineno, alpc_token_name(kind), yytext);
    if (kind == IDENT) std::free(yylval.sval);
  }
  std::printf("EOF\n");
  return alpc::error_count() ? 1 : 0;
}

// Parse into `program`. Returns the Bison return code (0 == syntactically ok).
int parse_into(alpc::Program &program) {
  g_program = &program;
  int prc = yyparse();
  g_program = nullptr;
  return prc;
}

void usage(FILE *out) {
  std::fprintf(out,
               "usage: alpc [MODE] FILE\n"
               "  --emit-ir       emit LLVM IR to stdout       (Exp 9, default)\n"
               "  --parse         parse + static-semantic checks\n"
               "  --parse-trace   print the reduction trace    (Exp 7)\n"
               "  --dump-tokens   print the token stream        (Exp 7)\n"
               "  --dump-ast      print the AST (RTTI-driven)   (Exp 8)\n");
}

}  // namespace

int main(int argc, char **argv) {
  const char *mode = "--emit-ir";
  const char *path = nullptr;

  for (int i = 1; i < argc; ++i) {
    if (std::strcmp(argv[i], "--help") == 0) {
      usage(stdout);
      return 0;
    }
    if (std::strncmp(argv[i], "--", 2) == 0) {
      mode = argv[i];
    } else {
      path = argv[i];
    }
  }

  if (!path) {
    usage(stderr);
    return 2;
  }

  yyin = std::fopen(path, "r");
  if (!yyin) {
    std::fprintf(stderr, "cannot open %s\n", path);
    return 2;
  }

  int rc = 0;
  if (std::strcmp(mode, "--dump-tokens") == 0) {
    rc = run_dump_tokens();
  } else if (std::strcmp(mode, "--parse") == 0) {
    alpc::Program program;
    int prc = parse_into(program);
    alpc::check_program(program);
    rc = (prc != 0 || alpc::error_count()) ? 1 : 0;
  } else if (std::strcmp(mode, "--parse-trace") == 0) {
    alpc::Program program;
    int prc = parse_into(program);
    alpc::print_trace(std::cout, program);
    rc = (prc != 0 || alpc::error_count()) ? 1 : 0;
  } else if (std::strcmp(mode, "--dump-ast") == 0) {
    alpc::Program program;
    int prc = parse_into(program);
    alpc::print_ast(std::cout, program);
    rc = prc ? 1 : 0;  // structural only; --parse validates semantics
  } else if (std::strcmp(mode, "--emit-ir") == 0) {
    alpc::Program program;
    int prc = parse_into(program);
    alpc::check_program(program);
    if (prc != 0 || alpc::error_count() != 0) {
      rc = 1;  // do not lower invalid input
    } else {
      bool ok = false;
      std::string ir = alpc::emit_ir(program, path, ok);
      if (!ok) {
        rc = 3;
      } else {
        std::cout << ir;
        rc = 0;
      }
    }
  } else {
    std::fprintf(stderr, "unknown mode: %s\n", mode);
    usage(stderr);
    rc = 2;
  }

  std::fclose(yyin);
  return rc;
}
