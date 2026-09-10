/* Path-Lang lexer (Exp 7 / Flex). See SPEC.md 2.2. */
%{
#include "tokens.h"
#include "diagnostics.h"
%}

%option noyywrap yylineno nounput noinput

%%

[ \t\r]+          { /* whitespace: ignore */ }
\n                { /* newline: yylineno advances automatically */ }
#[^\n]*           { /* comment to end of line: ignore */ }

"SET"             { return TK_SET; }
"IF"              { return TK_IF; }
"GOTO"            { return TK_GOTO; }
"OUTCOME"         { return TK_OUTCOME; }

[A-Za-z_][A-Za-z0-9_]*  { return TK_IDENT; }
[0-9]+            { return TK_NUMBER; }

"=="              { return TK_EQ; }
"<"               { return TK_LT; }
">"               { return TK_GT; }
"+="              { return TK_ADD_ASSIGN; }
"-="              { return TK_SUB_ASSIGN; }
"="               { return TK_ASSIGN; }

";"[ \t]*"b"      { return TK_SEMI_B; }
";"               { return TK_SEMI; }

.                 { alpc::report_lex_error(yylineno, yytext[0]); }

%%
