/* Path-Lang grammar (Exp 7 / Bison). See SPEC.md 2.3-2.4.
 * Non-reentrant C parser: yylex / yylval / yylloc / yyerror are globals
 * (Bison 3.8.2 manual, "Calling Convention", "Token Values"). */
%{
#include <cstdio>
#include <cstdlib>

#include "diagnostics.h"
#include "semantics.h"

int yylex(void);
extern int yylineno;
void yyerror(const char *msg);
%}

%locations
%define parse.error detailed   /* report unexpected + expected tokens (>= 3.6) */
%define parse.lac full         /* make those reports accurate (manual, "LAC") */

%union {
  int   ival;
  char *sval;
}

%token SET IF GOTO OUTCOME
%token <sval> IDENT
%token <ival> NUMBER
%token LT GT EQ ASSIGN ADD_ASSIGN SUB_ASSIGN SEMI SEMI_B

%type <ival> set_op rel

%%

program
  : %empty
  | stmt_list
  ;

stmt_list
  : stmt_list stmt
  | stmt
  ;

stmt
  : outcome_stmt
  | set_stmt
  | branch_stmt
  | error term        { yyerrok; }
  ;

outcome_stmt
  : OUTCOME IDENT term
      { alpc::sema_declare_outcome(@2.first_line, $2); free($2); }
  ;

set_stmt
  : SET IDENT set_op NUMBER term
      { alpc::sema_set(@2.first_line, $2, $3, $4); free($2); }
  ;

set_op
  : ASSIGN      { $$ = alpc::OP_ASSIGN; }
  | ADD_ASSIGN  { $$ = alpc::OP_ADD; }
  | SUB_ASSIGN  { $$ = alpc::OP_SUB; }
  ;

branch_stmt
  : IF IDENT rel NUMBER GOTO IDENT term
      { alpc::sema_branch(@2.first_line, $2, $3, $4, $6); free($2); free($6); }
  ;

rel
  : LT  { $$ = alpc::REL_LT; }
  | GT  { $$ = alpc::REL_GT; }
  | EQ  { $$ = alpc::REL_EQ; }
  ;

term
  : SEMI
  | SEMI_B    { alpc::sema_mark_binary_output(); }
  ;

%%

void yyerror(const char *msg) {
  alpc::report(yylloc.first_line, msg);
}
