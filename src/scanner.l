/* Path-Lang lexer (Exp 7 / Flex). See SPEC.md 2.2. */
%{
#include <cerrno>
#include <climits>
#include <cstdlib>
#include <cstring>

#include "diagnostics.h"
#include "parser.tab.h"

/* Non-reentrant parser: keep yylloc's line in sync with the scanner
 * (Bison manual 3.5, "Tracking Locations"; flex has no automatic update
 * for the shared global yylloc). Runs before every rule action. */
#define YY_USER_ACTION  yylloc.first_line = yylloc.last_line = yylineno;
%}

%option noyywrap yylineno nounput noinput

%%

[ \t\r]+          { /* whitespace: ignore */ }
\n                { /* newline: yylineno advances automatically */ }
#[^\n]*           { /* comment to end of line: ignore */ }

"SET"             { return SET; }
"IF"              { return IF; }
"GOTO"            { return GOTO; }
"OUTCOME"         { return OUTCOME; }

[A-Za-z_][A-Za-z0-9_]*  { yylval.sval = strdup(yytext); return IDENT; }

[0-9]+  {
    errno = 0;
    long v = strtol(yytext, nullptr, 10);
    if (errno == ERANGE || v > INT_MAX) {
      alpc::reportf(yylineno, "numeric literal '%s' is out of range (max %d)",
                    yytext, INT_MAX);
      v = INT_MAX;
    }
    yylval.ival = static_cast<int>(v);
    return NUMBER;
  }

"=="              { return EQ; }
"<"               { return LT; }
">"               { return GT; }
"+="              { return ADD_ASSIGN; }
"-="              { return SUB_ASSIGN; }
"="               { return ASSIGN; }

  /* Binary-output terminator "; b". If a letter/digit/_ follows the 'b' it is an
   * identifier, not the marker: keep only ';' and rescan from the 'b'. */
";"[ \t]*"b"[A-Za-z0-9_]  { yyless(1); return SEMI; }
";"[ \t]*"b"              { return SEMI_B; }
";"                       { return SEMI; }

.                 { alpc::report_lex_error(yylineno, yytext[0]); }

%%
