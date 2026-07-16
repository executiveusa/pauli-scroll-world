#!/usr/bin/env bash
# ============================================================================
# COSMOS Studio — stage 03: Hugging Face fallback
# Called by fal-pipeline.sh when fal.ai fails for a scene (or budget forces a
# downgrade). Produces a FLUX.1-dev still; video falls back to a warm i2v model
# via shared/hf-client.js. Cold models are waited out (503 warm-up handled in
# the client).
# Usage: ./hf-fallback.sh <scene-id> <prompt>
# ============================================================================
set -euo pipefail
cd "$(dirname "$0")"

SCENE="${1:?scene id}" ; PROMPT="${2:?prompt}"
OUT=output
mkdir -p "$OUT/stills"

node - "$SCENE" "$PROMPT" <<'EOF'
const fs = require('fs');
const path = require('path');
const hf = require('../../shared/hf-client');

(async () => {
  const [scene, prompt] = process.argv.slice(2);
  const out = path.join('output', 'stills', `${scene}.webp`);
  const res = await hf.generate('black-forest-labs/FLUX.1-dev', prompt);
  fs.writeFileSync(out, res.buffer);
  const entry = {
    ts: new Date().toISOString(), model: (res.stub ? 'stub:' : '') + res.model,
    cost: 0.01, durationMs: 0, url: 'hf://' + res.model, scene, pass: 'fallback',
  };
  fs.appendFileSync(path.join('output', 'generation-log.jsonl'), JSON.stringify(entry) + '\n');
  console.log(`hf-fallback: ${scene} → ${out}${res.stub ? ' (stub — HF_TOKEN not set)' : ''}`);
})().catch(e => { console.error('hf-fallback failed:', e.message); process.exit(1); });
EOF
