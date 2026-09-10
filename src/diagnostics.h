#ifndef ALPC_DIAGNOSTICS_H
#define ALPC_DIAGNOSTICS_H

namespace alpc {

// Emit "line N: msg" to stderr (or just "msg" when line <= 0) and bump the
// error counter. Every lexical / syntax / semantic error in ALPC goes through
// here so the diagnostic format stays uniform (CONSTRAINTS.md F4).
void report(int line, const char *msg);

// printf-style variant.
void reportf(int line, const char *fmt, ...)
#if defined(__GNUC__)
    __attribute__((format(printf, 2, 3)))
#endif
    ;

// Convenience for the scanner's catch-all rule.
void report_lex_error(int line, char bad);

int error_count();
void reset_errors();

}  // namespace alpc

#endif  // ALPC_DIAGNOSTICS_H
