#ifndef ALPC_TOKENS_H
#define ALPC_TOKENS_H

/*
 * Path-Lang token kinds. Values start at 256 to mirror the Bison convention
 * (below 256 is reserved for single-character tokens / ASCII), which keeps this
 * enum compatible with the parser's generated yytokentype in Phase 3.
 */
enum {
  TK_EOF = 0,
  TK_SET = 256,
  TK_IF,
  TK_GOTO,
  TK_OUTCOME,
  TK_IDENT,
  TK_NUMBER,
  TK_LT,
  TK_GT,
  TK_EQ,
  TK_ASSIGN,
  TK_ADD_ASSIGN,
  TK_SUB_ASSIGN,
  TK_SEMI,
  TK_SEMI_B
};

#ifdef __cplusplus
extern "C" {
#endif

/* Human-readable name for a token kind, e.g. TK_SET -> "SET". */
const char *alpc_token_name(int kind);

#ifdef __cplusplus
}
#endif

#endif /* ALPC_TOKENS_H */
