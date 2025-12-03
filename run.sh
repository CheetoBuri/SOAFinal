#!/bin/bash

echo "╔═══════════════════════════════════════════════╗"
echo "║   ☕ Cafe API Server - Starting...            ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""

# Get script directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Activate virtual environment and run server
cd "$DIR"
.venv/bin/uvicorn app:app --host 0.0.0.0 --port 3000
