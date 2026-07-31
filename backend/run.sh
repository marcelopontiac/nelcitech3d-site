#!/bin/bash
cd "$(dirname "$0")"
echo "Starting NelciTech3D API on port 8080..."
exec python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8080
