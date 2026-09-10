#include "tokens.h"

#include "parser.tab.h"  // Bison token codes (SET, IF, IDENT, ...)

const char *alpc_token_name(int kind) {
  switch (kind) {
    case 0:          return "EOF";  // YYEOF
    case SET:        return "SET";
    case IF:         return "IF";
    case GOTO:       return "GOTO";
    case OUTCOME:    return "OUTCOME";
    case IDENT:      return "IDENT";
    case NUMBER:     return "NUMBER";
    case LT:         return "LT";
    case GT:         return "GT";
    case EQ:         return "EQ";
    case ASSIGN:     return "ASSIGN";
    case ADD_ASSIGN: return "ADD_ASSIGN";
    case SUB_ASSIGN: return "SUB_ASSIGN";
    case SEMI:       return "SEMI";
    case SEMI_B:     return "SEMI_B";
    default:         return "?";
  }
}
