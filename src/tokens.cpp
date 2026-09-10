#include "tokens.h"

const char *alpc_token_name(int kind) {
  switch (kind) {
    case TK_EOF:        return "EOF";
    case TK_SET:        return "SET";
    case TK_IF:         return "IF";
    case TK_GOTO:       return "GOTO";
    case TK_OUTCOME:    return "OUTCOME";
    case TK_IDENT:      return "IDENT";
    case TK_NUMBER:     return "NUMBER";
    case TK_LT:         return "LT";
    case TK_GT:         return "GT";
    case TK_EQ:         return "EQ";
    case TK_ASSIGN:     return "ASSIGN";
    case TK_ADD_ASSIGN: return "ADD_ASSIGN";
    case TK_SUB_ASSIGN: return "SUB_ASSIGN";
    case TK_SEMI:       return "SEMI";
    case TK_SEMI_B:     return "SEMI_B";
    default:            return "?";
  }
}
