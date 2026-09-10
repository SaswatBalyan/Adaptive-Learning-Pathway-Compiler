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

LLVM_CONFIG := llvm-config

# Hand-written sources (subject to -Werror).
HAND_SRCS := $(SRC)/main.cpp $(SRC)/diagnostics.cpp $(SRC)/tokens.cpp $(SRC)/semantics.cpp
HAND_OBJS := $(patsubst $(SRC)/%.cpp,$(OBJ)/%.o,$(HAND_SRCS))

# Generated sources (warning-exempt).
GEN_OBJS := $(OBJ)/parser.tab.o $(OBJ)/lex.yy.o

.DEFAULT_GOAL := build

.PHONY: build
build: $(BIN)

$(BIN): $(HAND_OBJS) $(GEN_OBJS)
	$(CXX) $(CXXFLAGS) -o $@ $^

$(OBJ)/%.o: $(SRC)/%.cpp $(SRC)/tokens.h $(SRC)/diagnostics.h $(SRC)/semantics.h $(OBJ)/parser.tab.h | $(OBJ)
	$(CXX) $(CXXFLAGS) -c -o $@ $<

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
check-full: check
	@echo "check-full wiring lands in Phase 7"

.PHONY: demo
demo:
	@echo "demo wiring lands in Phase 6"

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
