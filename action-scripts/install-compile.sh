#!/bin/bash
# ============================================
# Copyright 2026 SoTeen Studio
# Domloo Release Action
# ============================================
set -euo pipefail

echo "=== [Domloo Engine] Perubahan terdeteksi atau cache kosong. Nge-build ulang... ==="
cd $GITHUB_ACTION_PATH
npm ci
npm run build