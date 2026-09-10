#!/usr/bin/env bash
# ALPC fixture runner.
#   Phase 2: --dump-tokens goldens (*.tokens) + invalid-input checks (*.err).
# Later phases add *.parsetrace, *.ast, *.expected and IR property checks.
set -u
export PATH="C:/msys64/mingw64/bin:C:/msys64/usr/bin:$PATH"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ALPC="$ROOT/alpc"
[ -x "$ROOT/alpc.exe" ] && ALPC="$ROOT/alpc.exe"
VALID="$ROOT/tests/fixtures/valid"
INVALID="$ROOT/tests/fixtures/invalid"

pass=0
fail=0

if [ ! -x "$ALPC" ]; then
  echo "FAIL: alpc binary not built ($ALPC)"
  exit 1
fi

golden_check() { # label  golden-file  mode  edu
  local label="$1" golden="$2" mode="$3" edu="$4"
  local actual
  # alpc is a native Windows binary: stdout is text-mode, so strip CR before
  # diffing against the LF golden files.
  actual="$(timeout 5 "$ALPC" "$mode" "$edu" 2>/dev/null | tr -d '\r')"
  if diff -u "$golden" <(printf '%s\n' "$actual") >/tmp/alpc_diff.$$; then
    echo "  ok   $label"
    pass=$((pass + 1))
  else
    echo "  FAIL $label"
    sed 's/^/       /' /tmp/alpc_diff.$$
    fail=$((fail + 1))
  fi
  rm -f /tmp/alpc_diff.$$
}

invalid_check() { # label  err-file  edu
  local label="$1" errfile="$2" edu="$3"
  local out rc want
  out="$(timeout 5 "$ALPC" "$edu" 2>&1)"
  rc=$?
  want="$(cat "$errfile")"
  if [ "$rc" -eq 0 ]; then
    echo "  FAIL $label (expected non-zero exit, got 0)"
    fail=$((fail + 1))
  elif [ "$rc" -ge 124 ]; then
    echo "  FAIL $label (timeout/crash, rc=$rc)"
    fail=$((fail + 1))
  elif printf '%s' "$out" | grep -qF -- "$want"; then
    echo "  ok   $label"
    pass=$((pass + 1))
  else
    echo "  FAIL $label (want stderr substring: $want)"
    printf '%s\n' "$out" | sed 's/^/       /'
    fail=$((fail + 1))
  fi
}

echo "== valid fixtures =="
for edu in "$VALID"/*.edu; do
  [ -e "$edu" ] || continue
  base="${edu%.edu}"
  name="$(basename "$base")"
  [ -f "$base.tokens" ] && golden_check "tokens/$name" "$base.tokens" --dump-tokens "$edu"
done

echo "== invalid fixtures =="
for edu in "$INVALID"/*.edu; do
  [ -e "$edu" ] || continue
  base="${edu%.edu}"
  name="$(basename "$base")"
  [ -f "$base.err" ] && invalid_check "invalid/$name" "$base.err" "$edu"
done

echo "---"
echo "pass=$pass fail=$fail"
[ "$fail" -eq 0 ]
