#include "diagnostics.h"

#include <cstdarg>
#include <cstdio>

namespace alpc {

namespace {
int g_errors = 0;
}

void reset_errors() { g_errors = 0; }

int error_count() { return g_errors; }

void report(int line, const char *msg) {
  if (line > 0) {
    std::fprintf(stderr, "line %d: %s\n", line, msg);
  } else {
    std::fprintf(stderr, "%s\n", msg);
  }
  ++g_errors;
}

void reportf(int line, const char *fmt, ...) {
  char buf[512];
  va_list ap;
  va_start(ap, fmt);
  std::vsnprintf(buf, sizeof buf, fmt, ap);
  va_end(ap);
  report(line, buf);
}

void report_lex_error(int line, char bad) {
  reportf(line, "unexpected character '%c'", bad);
}

}  // namespace alpc
