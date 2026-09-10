#!/bin/zsh
set -euo pipefail
ROOT="$HOME/sovereign-pipeline"
STAMP=$(date -u +%Y-%m-%dT%H%MZ)
OUT="$ROOT/logs/drill-$STAMP.txt"
mkdir -p "$ROOT/logs" "$ROOT/bin"
echo "PLANE=ollama  ts=$STAMP  LIVE_TRADING=false" | tee "$OUT"
echo "Type /bye when done. Then:  pbpaste >> $OUT" | tee -a "$OUT"
exec ollama run qwen2.5:latest
