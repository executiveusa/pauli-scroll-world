#!/usr/bin/env bash
# ============================================================================
# COSMOS Studio — stage 03: generalized fal.ai generation pipeline
# (generalized from the yappyverse pipeline; see skills/scroll-world/references/pipeline.md)
# ----------------------------------------------------------------------------
# Usage:
#   ./fal-pipeline.sh --draft  <scene-list.json> <style-preamble.txt>   # 480p seedance-2.0-mini
#   ./fal-pipeline.sh --final  <scene-list.json> <style-preamble.txt>   # 720p seedance-2.0 (hero 1080p)
#   ./fal-pipeline.sh --extract-frames                                  # seam-lock frames for connectors
#   ./fal-pipeline.sh --encode                                          # GOP 8, faststart, no audio, crf 20
#
# Cost gates run BEFORE any call (cost-guard.js). FAL_KEY absent → stub assets
# are produced so the pipeline stays runnable end-to-end.
# ============================================================================
set -euo pipefail
cd "$(dirname "$0")"

OUT=output
DRAFT_MODEL="fal-ai/bytedance/seedance-2.0-mini"   # ~25% of standard cost — always first
FINAL_MODEL="fal-ai/bytedance/seedance-2.0"
DRAFT_COST=0.15 ; FINAL_COST=0.60

mkdir -p "$OUT/stills" "$OUT/vid" "$OUT/frames"

log_generation() { # model cost duration url scene pass
  printf '{"ts":"%s","model":"%s","cost":%s,"durationMs":%s,"url":"%s","scene":"%s","pass":"%s"}\n' \
    "$(date -u +%FT%TZ)" "$1" "$2" "$3" "$4" "$5" "$6" >> "$OUT/generation-log.jsonl"
}

generate_pass() { # pass(draft|final) scene-list style-preamble
  local pass="$1" scenes="$2" preamble_file="$3"
  local model cost res
  if [ "$pass" = draft ]; then model=$DRAFT_MODEL cost=$DRAFT_COST res=480; else model=$FINAL_MODEL cost=$FINAL_COST res=720; fi
  local preamble; preamble=$(cat "$preamble_file")
  local n; n=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$scenes','utf8')).length)")

  # Circuit breaker BEFORE any spend: dives + connectors estimate.
  local est; est=$(node -e "console.log((($n*2-1)*$cost).toFixed(2))")
  node cost-guard.js check "$est" || { echo "COST GATE (exit $?): see message above"; exit 1; }

  for i in $(seq 0 $((n-1))); do
    local id prompt started
    id=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$scenes','utf8'))[$i].id)")
    prompt="$preamble Scene: $(node -e "console.log(JSON.parse(require('fs').readFileSync('$scenes','utf8'))[$i].name)") — slow forward camera dive into the scene interior, ${res}p."
    started=$(date +%s%3N)
    if [ -n "${FAL_KEY:-}" ]; then
      local resp url
      resp=$(curl -sS -X POST "https://fal.run/$model" \
        -H "Authorization: Key $FAL_KEY" -H "Content-Type: application/json" \
        -d "{\"prompt\": $(node -e "console.log(JSON.stringify(process.argv[1]))" "$prompt"), \"resolution\": \"${res}p\"}")
      url=$(node -e "const r=JSON.parse(process.argv[1]);console.log(r.video?.url||r.url||'')" "$resp")
      [ -n "$url" ] || { echo "fal.ai gave no URL for $id — falling back"; ./hf-fallback.sh "$id" "$prompt" || true; continue; }
      curl -sS "$url" -o "$OUT/vid/${id}_${pass}.mp4"
      log_generation "$model" "$cost" "$(( $(date +%s%3N) - started ))" "$url" "$id" "$pass"
    else
      # STUB: replace with live call after .env is configured
      ffmpeg -v error -f lavfi -i "testsrc2=duration=3:size=854x480:rate=24" \
        -c:v libx264 -pix_fmt yuv420p -g 8 -crf 20 -movflags +faststart -an -y "$OUT/vid/${id}_${pass}.mp4"
      log_generation "stub:$model" 0 "$(( $(date +%s%3N) - started ))" "stub://local-testsrc" "$id" "$pass"
    fi
    node cost-guard.js record "$([ -n "${FAL_KEY:-}" ] && echo "$cost" || echo 0)" "$model" "$id" > /dev/null
  done
  echo "$pass pass complete: $n scenes → $OUT/vid/"
}

extract_frames() {
  # Seam lock: last frame of each dive + first frame of the next dive.
  # Connectors are generated FROM THESE (never from original stills).
  for v in "$OUT"/vid/*_final.mp4 "$OUT"/vid/*_draft.mp4; do
    [ -e "$v" ] || continue
    local base; base=$(basename "$v" .mp4)
    ffmpeg -v error -sseof -0.05 -i "$v" -frames:v 1 -q:v 2 -y "$OUT/frames/${base}_last.png"
    ffmpeg -v error -i "$v" -frames:v 1 -q:v 2 -y "$OUT/frames/${base}_first.png"
  done
  echo "frames extracted → $OUT/frames/ (use as start/end images for connector generation)"
}

encode_all() {
  # Delivery encode: GOP 8, faststart, strip audio, crf 20. Mobile: 720p, GOP 4.
  for v in "$OUT"/vid/*.mp4; do
    case "$v" in *_enc.mp4|*_mobile.mp4) continue;; esac
    local base; base=${v%.mp4}
    ffmpeg -v error -i "$v" -c:v libx264 -g 8 -crf 20 -pix_fmt yuv420p -movflags +faststart -an -y "${base}_enc.mp4"
    ffmpeg -v error -i "$v" -vf "scale=-2:720" -c:v libx264 -g 4 -crf 23 -pix_fmt yuv420p -movflags +faststart -an -y "${base}_mobile.mp4"
  done
  echo "encodes complete (desktop GOP8 + mobile 720p GOP4)"
}

case "${1:-}" in
  --draft)          generate_pass draft "${2:?scene-list.json}" "${3:?style-preamble.txt}";;
  --final)          generate_pass final "${2:?scene-list.json}" "${3:?style-preamble.txt}";;
  --extract-frames) extract_frames;;
  --encode)         encode_all;;
  *) echo "usage: $0 --draft|--final <scene-list.json> <style-preamble.txt> | --extract-frames | --encode"; exit 1;;
esac
