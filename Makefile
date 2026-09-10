# ALPC — Adaptive Learning Pathway Compiler
# Self-contained: bakes the MSYS2 toolchain onto PATH so `make` works from any shell.

export PATH := C:/msys64/mingw64/bin:C:/msys64/usr/bin:$(PATH)

CXX      := g++
CXXFLAGS := -std=c++17 -Wall -Wextra -Werror -g -O1
# Warnings-exempt flags for Flex/Bison generated C/C++ units:
GENFLAGS := -std=c++17 -g -O1

LLVM_CONFIG := llvm-config
LLVM_CXXFLAGS := $(shell $(LLVM_CONFIG) --cxxflags 2>/dev/null)
LLVM_LDFLAGS  := $(shell $(LLVM_CONFIG) --ldflags --libs core 2>/dev/null)

FLEX  := flex
BISON := bison

SRC   := src
BUILD := build
BIN   := alpc

# Hand-written sources (subject to -Werror). Populated as phases land.
HAND_SRCS :=
# Generated sources (warning-exempt). Populated in Phase 2/3.
GEN_SRCS  :=

.DEFAULT_GOAL := help

.PHONY: help
help:
	@echo "ALPC build targets:"
	@echo "  make build       - build ./$(BIN)  (nothing to build yet: Phase 0)"
	@echo "  make check       - build + run tests/run.sh   (task-end gate)"
	@echo "  make check-full  - test-asan + cppcheck + demo + coverage report"
	@echo "  make demo        - compile & run examples/pathway.edu, diff .expected"
	@echo "  make tools       - print detected toolchain versions"
	@echo "  make clean       - remove build/ and generated Flex/Bison sources"

.PHONY: tools
tools:
	@$(FLEX) --version
	@$(BISON) --version | head -1
	@$(CXX) --version | head -1
	@$(LLVM_CONFIG) --version | sed 's/^/LLVM /'
	@$(MAKE) --version | head -1

.PHONY: build
build:
ifeq ($(strip $(HAND_SRCS)$(GEN_SRCS)),)
	@echo "Phase 0: no compiler sources yet. Scaffold is in place."
else
	@echo "build wiring lands with the lexer in Phase 2"
endif

.PHONY: check
check: build
	@if [ -x tests/run.sh ]; then bash tests/run.sh; else echo "no tests yet (Phase 2+)"; fi

.PHONY: check-full
check-full: check
	@echo "check-full wiring lands in Phase 7"

.PHONY: demo
demo:
	@echo "demo wiring lands in Phase 6"

.PHONY: clean
clean:
	rm -rf $(BUILD) $(BIN) $(BIN).exe
	rm -f $(SRC)/lex.yy.c $(SRC)/parser.tab.c $(SRC)/parser.tab.h $(SRC)/parser.output
