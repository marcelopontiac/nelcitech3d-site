#!/bin/bash
set -e

echo "=== NelciTech3D Deploy ==="

# Build frontend
echo "Building frontend..."
cd "$(dirname "$0")/frontend"
npm install --silent
npm run build

# Copy to web root
echo "Copying frontend to /var/www/nelcitech3d/..."
sudo cp -r dist/* /var/www/nelcitech3d/

# Stop old server
echo "Stopping old server..."
sudo pkill -f nelcitech3d-server.py 2>/dev/null || true
sudo pkill -f "uvicorn app.main" 2>/dev/null || true

# Start new backend
echo "Starting backend..."
cd "$(dirname "$0")/backend"
sudo -u marcelotech nohup python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8080 > /tmp/nelci-api.log 2>&1 &

echo "Done! API running on port 8080"
echo "Frontend at /var/www/nelcitech3d/"
