#include <cstdio>
#include <cstring>

#include "diagnostics.h"
#include "tokens.h"

// Provided by the Flex-generated scanner (lex.yy.c is compiled as C++).
int yylex(void);
extern int yylineno;
extern char *yytext;
extern FILE *yyin;

namespace {

int run_dump_tokens() {
  int kind;
  while ((kind = yylex()) != 0) {
    std::printf("line %d: %s \"%s\"\n", yylineno, alpc_token_name(kind), yytext);
  }
  std::printf("EOF\n");
  return alpc::error_count() ? 1 : 0;
}

void usage(FILE *out) {
  std::fprintf(out,
               "usage: alpc [--dump-tokens] FILE\n"
               "  --dump-tokens   print the Path-Lang token stream (Exp 7)\n");
}

}  // namespace

int main(int argc, char **argv) {
  const char *mode = "--dump-tokens";
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
  } else {
    std::fprintf(stderr, "unknown mode: %s\n", mode);
    usage(stderr);
    rc = 2;
  }

  std::fclose(yyin);
  return rc;
}
