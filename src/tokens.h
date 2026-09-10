#ifndef ALPC_TOKENS_H
#define ALPC_TOKENS_H

/*
 * Token kinds come from the Bison-generated header (obj/parser.tab.h) as of
 * Phase 3 — Bison owns the numbering. This header just exposes a name lookup
 * used by `--dump-tokens`.
 */

#ifdef __cplusplus
extern "C" {
#endif

/* Human-readable name for a Bison token code, e.g. SET -> "SET". */
const char *alpc_token_name(int kind);

#ifdef __cplusplus
}
#endif

#endif /* ALPC_TOKENS_H */
