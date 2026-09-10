/* Path-Lang grammar (Exp 7 / Bison). See SPEC.md 2.3-2.4.
 * Non-reentrant C parser: yylex / yylval / yylloc / yyerror are globals
 * (Bison 3.8.2 manual, "Calling Convention", "Token Values"). Reduce
 * actions build the AST (SPEC 2); static-semantic checks run afterward
 * as a source-order pass (semantics.cpp). */
%{
#include <cstdlib>
#include <memory>

#include "ast.h"
#include "diagnostics.h"

int yylex(void);
extern int yylineno;
void yyerror(const char *msg);

extern alpc::Program *g_program;  // set by the driver before yyparse()
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

/* IDENT carries a strdup'd string; free it if error recovery discards the token
 * (Bison manual, "Destructor Decl"). Rule actions free the ones they consume;
 * the destructor only runs for tokens the parser drops before a reduce. */
%destructor { free($$); } <sval>

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
      { g_program->stmts.push_back(
            std::make_unique<alpc::Outcome>(@2.first_line, $2));
        free($2); }
  ;

set_stmt
  : SET IDENT set_op NUMBER term
      { g_program->stmts.push_back(
            std::make_unique<alpc::ProfileSet>(
                @2.first_line, $2, static_cast<alpc::SetOp>($3), $4));
        free($2); }
  ;

set_op
  : ASSIGN      { $$ = alpc::OP_ASSIGN; }
  | ADD_ASSIGN  { $$ = alpc::OP_ADD; }
  | SUB_ASSIGN  { $$ = alpc::OP_SUB; }
  ;

branch_stmt
  : IF IDENT rel NUMBER GOTO IDENT term
      { g_program->stmts.push_back(
            std::make_unique<alpc::CondBranch>(
                @2.first_line, $2, static_cast<alpc::RelOp>($3), $4, $6));
        free($2); free($6); }
  ;

rel
  : LT  { $$ = alpc::REL_LT; }
  | GT  { $$ = alpc::REL_GT; }
  | EQ  { $$ = alpc::REL_EQ; }
  ;

term
  : SEMI
  | SEMI_B    { g_program->binary_output = true; }
  ;

%%

void yyerror(const char *msg) {
  alpc::report(yylloc.first_line, msg);
}
