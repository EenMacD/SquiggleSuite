#!/usr/bin/env bash
set -euo pipefail

# Simple launcher for the Squiggle web app
# Usage: ./run.sh [dev|preview|build|docker]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR"
UI_DIR="$ROOT_DIR/squiggle-ui"

usage() {
  echo "Usage: $0 [dev|preview|build]"
  echo "  dev     - Run Vite dev server (http://localhost:5173)"
  echo "  preview - Build then run Vite preview server (http://localhost:4173)"
  echo "  build   - Build production assets (writes to squiggle-ui/dist)"

  exit 1
}

MODE="${1:-dev}"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: Required command '$1' not found. Please install it." >&2
    exit 1
  fi
}

ensure_node() {
  require_cmd node
  require_cmd npm
  local major
  major="$(node -v | sed -E 's/^v([0-9]+).*$/\1/')"
  if [ "${major:-0}" -lt 18 ]; then
    echo "Error: Node.js >= 18 is required. Found $(node -v)." >&2
    exit 1
  fi
}

ensure_deps() {
  cd "$UI_DIR"
  if [ ! -d node_modules ]; then
    echo "Installing dependencies with npm ci..."
    npm ci
  fi
}

dev() {
  ensure_node
  ensure_deps
  cd "$UI_DIR"
  echo "Starting Vite dev server at http://localhost:5173"
  npm run dev
}

build() {
  ensure_node
  ensure_deps
  cd "$UI_DIR"
  echo "Building production bundle..."
  npm run build
  echo "Copying to extension directory..."
  rm -rf "$ROOT_DIR/extension"
  mkdir -p "$ROOT_DIR/extension"
  cp -r dist/* "$ROOT_DIR/extension/"
}

preview() {
  build
  cd "$UI_DIR"
  echo "Starting Vite preview at http://localhost:4173"
  npm run preview
}



case "$MODE" in
  dev) dev ;;
  preview) preview ;;
  build) build ;;

  -h|--help|help) usage ;;
  *) echo "Unknown mode: $MODE" >&2; usage ;;
esac

