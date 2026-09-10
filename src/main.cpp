#include <cstdio>
#include <cstdlib>
#include <cstring>

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

int run_parse(bool trace) {
  alpc::sema_reset();
  alpc::sema_set_trace(trace);
  int prc = yyparse();
  return (prc != 0 || alpc::error_count()) ? 1 : 0;
}

void usage(FILE *out) {
  std::fprintf(out,
               "usage: alpc [MODE] FILE\n"
               "  --parse         parse + static-semantic checks (default)\n"
               "  --parse-trace   print the reduction trace (Exp 7)\n"
               "  --dump-tokens   print the token stream (Exp 7)\n");
}

}  // namespace

int main(int argc, char **argv) {
  const char *mode = "--parse";
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

  int rc;
  if (std::strcmp(mode, "--dump-tokens") == 0) {
    rc = run_dump_tokens();
  } else if (std::strcmp(mode, "--parse") == 0) {
    rc = run_parse(/*trace=*/false);
  } else if (std::strcmp(mode, "--parse-trace") == 0) {
    rc = run_parse(/*trace=*/true);
  } else {
    std::fprintf(stderr, "unknown mode: %s\n", mode);
    usage(stderr);
    rc = 2;
  }

  std::fclose(yyin);
  return rc;
}
