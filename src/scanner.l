/* Path-Lang lexer (Exp 7 / Flex). See SPEC.md 2.2. */
%{
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
[0-9]+            { yylval.ival = atoi(yytext); return NUMBER; }

"=="              { return EQ; }
"<"               { return LT; }
">"               { return GT; }
"+="              { return ADD_ASSIGN; }
"-="              { return SUB_ASSIGN; }
"="               { return ASSIGN; }

";"[ \t]*"b"      { return SEMI_B; }
";"               { return SEMI; }

.                 { alpc::report_lex_error(yylineno, yytext[0]); }

%%
