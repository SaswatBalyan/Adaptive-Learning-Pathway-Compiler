# ALPC — Adaptive Learning Pathway Compiler
# Self-contained: bakes the MSYS2 toolchain onto PATH so `make` works from any shell.

export PATH := C:/msys64/mingw64/bin:C:/msys64/usr/bin:$(PATH)

SRC := src
OBJ := obj
BIN := alpc

# GCC/Clang need a writable temp dir; some shells leave TMP pointing at C:\WINDOWS.
TMPROOT := $(CURDIR)/$(OBJ)/tmp
export TMP    := $(TMPROOT)
export TEMP   := $(TMPROOT)
export TMPDIR := $(TMPROOT)
_ := $(shell mkdir -p "$(TMPROOT)")

CXX := g++
# -Werror applies to hand-written sources only (F1). Flex/Bison output is built
# with GENFLAGS (warnings tolerated, they are not our code).
CXXFLAGS := -std=c++17 -Wall -Wextra -Werror -g -O1 -I$(SRC) -I$(OBJ)
GENFLAGS := -std=c++17 -g -O1 -I$(SRC) -I$(OBJ)

FLEX  := flex
BISON := bison
# Any shift/reduce or reduce/reduce conflict is a hard failure (CONSTRAINTS F2).
BISONFLAGS := -Wcounterexamples -Werror=conflicts-sr -Werror=conflicts-rr

LLVM_CONFIG    := llvm-config
LLVM_CXXFLAGS  := $(shell $(LLVM_CONFIG) --cxxflags)
LLVM_CXXFLAGS_SYS := $(subst -I,-isystem,$(LLVM_CXXFLAGS))
LLVM_LDFLAGS   := $(shell $(LLVM_CONFIG) --ldflags)
LLVM_LIBS      := $(shell $(LLVM_CONFIG) --libs core) $(shell $(LLVM_CONFIG) --system-libs)

# Hand-written sources (subject to -Werror).
HAND_SRCS := $(SRC)/main.cpp $(SRC)/diagnostics.cpp $(SRC)/tokens.cpp \
             $(SRC)/semantics.cpp $(SRC)/ast.cpp $(SRC)/codegen.cpp
HAND_OBJS := $(patsubst $(SRC)/%.cpp,$(OBJ)/%.o,$(HAND_SRCS))
HAND_HDRS := $(SRC)/tokens.h $(SRC)/diagnostics.h $(SRC)/semantics.h \
             $(SRC)/ast.h $(SRC)/codegen.h

# Generated sources (warning-exempt).
GEN_OBJS := $(OBJ)/parser.tab.o $(OBJ)/lex.yy.o

.DEFAULT_GOAL := build

.PHONY: build
build: $(BIN)

$(BIN): $(HAND_OBJS) $(GEN_OBJS)
	$(CXX) $(CXXFLAGS) -o $@ $^ $(LLVM_LDFLAGS) $(LLVM_LIBS)

$(OBJ)/%.o: $(SRC)/%.cpp $(HAND_HDRS) $(OBJ)/parser.tab.h | $(OBJ)
	$(CXX) $(CXXFLAGS) -c -o $@ $<

# codegen.cpp pulls in LLVM headers -> needs llvm-config cxxflags.
$(OBJ)/codegen.o: $(SRC)/codegen.cpp $(SRC)/codegen.h $(SRC)/ast.h | $(OBJ)
	$(CXX) $(CXXFLAGS) $(LLVM_CXXFLAGS_SYS) -c -o $@ $<

$(OBJ)/parser.tab.c $(OBJ)/parser.tab.h &: $(SRC)/parser.y | $(OBJ)
	$(BISON) $(BISONFLAGS) -d -o $(OBJ)/parser.tab.c $<

$(OBJ)/parser.tab.o: $(OBJ)/parser.tab.c $(OBJ)/parser.tab.h | $(OBJ)
	$(CXX) $(GENFLAGS) -c -o $@ $<

$(OBJ)/lex.yy.c: $(SRC)/scanner.l | $(OBJ)
	$(FLEX) --outfile=$@ $<

$(OBJ)/lex.yy.o: $(OBJ)/lex.yy.c $(OBJ)/parser.tab.h | $(OBJ)
	$(CXX) $(GENFLAGS) -c -o $@ $<

$(OBJ):
	mkdir -p $(OBJ)

.PHONY: check
check: build
	bash tests/run.sh

.PHONY: check-full
check-full: check test-asan cppcheck demo
	@echo "check-full: ok"

# CONSTRAINTS F7: sanitized build must pass every fixture, plus RTTI unit tests.
# The mingw-w64 toolchain ships no libasan/libubsan, so on Windows this uses
# UBSan in trap mode (UB -> SIGILL, no runtime needed) + libstdc++ assertions
# + stack protector. On a Linux lab box, override:  make test-asan SAN='-fsanitize=address,undefined'
SAN ?= -fsanitize=undefined -fsanitize-trap=undefined -D_GLIBCXX_ASSERTIONS \
       -fstack-protector-all -fno-omit-frame-pointer
SANOBJ := $(OBJ)/san
.PHONY: test-asan
test-asan: $(OBJ)/parser.tab.c $(OBJ)/parser.tab.h $(OBJ)/lex.yy.c | $(OBJ)
	@mkdir -p $(SANOBJ)
	$(CXX) $(CXXFLAGS) $(SAN) -o $(SANOBJ)/unit_ast tests/unit_ast.cpp $(SRC)/ast.cpp $(SRC)/diagnostics.cpp $(SRC)/semantics.cpp
	$(SANOBJ)/unit_ast
	$(CXX) $(CXXFLAGS) $(SAN) -c -o $(SANOBJ)/main.o   $(SRC)/main.cpp
	$(CXX) $(CXXFLAGS) $(SAN) -c -o $(SANOBJ)/diag.o   $(SRC)/diagnostics.cpp
	$(CXX) $(CXXFLAGS) $(SAN) -c -o $(SANOBJ)/tok.o    $(SRC)/tokens.cpp
	$(CXX) $(CXXFLAGS) $(SAN) -c -o $(SANOBJ)/sema.o   $(SRC)/semantics.cpp
	$(CXX) $(CXXFLAGS) $(SAN) -c -o $(SANOBJ)/ast.o    $(SRC)/ast.cpp
	$(CXX) $(CXXFLAGS) $(LLVM_CXXFLAGS_SYS) $(SAN) -c -o $(SANOBJ)/codegen.o $(SRC)/codegen.cpp
	$(CXX) $(GENFLAGS) $(SAN) -c -o $(SANOBJ)/parser.o $(OBJ)/parser.tab.c
	$(CXX) $(GENFLAGS) $(SAN) -c -o $(SANOBJ)/lex.o    $(OBJ)/lex.yy.c
	$(CXX) $(CXXFLAGS) $(SAN) -o $(SANOBJ)/alpc $(SANOBJ)/main.o $(SANOBJ)/diag.o \
	  $(SANOBJ)/tok.o $(SANOBJ)/sema.o $(SANOBJ)/ast.o $(SANOBJ)/codegen.o \
	  $(SANOBJ)/parser.o $(SANOBJ)/lex.o $(LLVM_LDFLAGS) $(LLVM_LIBS)
	ALPC_BIN=$(SANOBJ)/alpc bash tests/run.sh

.PHONY: cppcheck
cppcheck:
	cppcheck --enable=warning,style --quiet --error-exitcode=1 -I$(SRC) -I$(OBJ) $(HAND_SRCS)

.PHONY: demo
demo: build
	./$(BIN) --emit-ir examples/pathway.edu > $(OBJ)/pathway.ll
	opt -passes=verify $(OBJ)/pathway.ll -o /dev/null
	lli $(OBJ)/pathway.ll | tr -d '\r' > $(OBJ)/pathway.out
	diff -u examples/pathway.expected $(OBJ)/pathway.out
	@echo "demo: examples/pathway.edu compiles, verifies, runs -> $$(cat $(OBJ)/pathway.out)"

.PHONY: tools
tools:
	@$(FLEX) --version
	@$(BISON) --version | head -1
	@$(CXX) --version | head -1
	@$(LLVM_CONFIG) --version | sed 's/^/LLVM /'
	@$(MAKE) --version | head -1

.PHONY: help
help:
	@echo "ALPC build targets:"
	@echo "  make build       - build ./$(BIN)"
	@echo "  make check       - build + run tests/run.sh   (task-end gate)"
	@echo "  make check-full  - test-asan + cppcheck + demo + coverage (Phase 7)"
	@echo "  make demo        - compile & run examples/pathway.edu     (Phase 6)"
	@echo "  make tools       - print detected toolchain versions"
	@echo "  make clean       - remove $(OBJ)/ and the binary"

.PHONY: clean
clean:
	rm -rf $(OBJ) $(BIN) $(BIN).exe
