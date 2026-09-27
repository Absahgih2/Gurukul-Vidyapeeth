#!/usr/bin/env bash
set -e

# Resolve repository directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================================="
echo "    Cloudflare Tunnel to Vercel Auto-Sync Utility        "
echo "=========================================================="

# 1. Ensure PM2 tunnel process is running
if ! pm2 describe tunnel > /dev/null 2>&1; then
    echo "PM2 process 'tunnel' is not running. Starting it..."
    pm2 start "cloudflared tunnel --url http://localhost:5000" --name "tunnel"
    pm2 save
fi

# 2. Poll PM2 logs for active trycloudflare.com URL (up to 60s)
echo "Waiting for Cloudflare Tunnel URL to appear in logs..."
NEW_URL=""
for i in {1..30}; do
    NEW_URL=$(pm2 logs tunnel --lines 60 --nostream 2>/dev/null | grep -oE 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com' | tail -n 1 || true)
    if [ -n "$NEW_URL" ]; then
        break
    fi
    sleep 2
done

if [ -z "$NEW_URL" ]; then
    echo "[ERROR] Could not detect a valid trycloudflare.com URL from PM2 logs."
    echo "Please check 'pm2 logs tunnel' manually."
    exit 1
fi

echo "[OK] Detected Active Tunnel: $NEW_URL"

# 3. Read current URL configured in vercel.json
CURRENT_URL=$(grep -oE 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com' vercel.json | head -n 1 || true)

if [ "$NEW_URL" == "$CURRENT_URL" ]; then
    echo "[OK] vercel.json is already up to date with: $NEW_URL"
    echo "No push required."
    exit 0
fi

echo "Updating vercel.json: $CURRENT_URL -> $NEW_URL"

# 4. Replace tunnel URL inside vercel.json
sed -i -E "s|https://[a-zA-Z0-9.-]+\.trycloudflare\.com|$NEW_URL|g" vercel.json

# 5. Commit and push to trigger Vercel deployment
git add vercel.json
git commit -m "chore: auto-sync tunnel url to $NEW_URL [skip ci]"

echo "Pushing changes to GitHub to trigger Vercel auto-deploy..."
git push origin main

echo ""
echo "=========================================================="
echo " [SUCCESS] Pushed new URL to Vercel!"
echo " Vercel is deploying the updated rewrite."
echo " Domain: https://www.gurukulvidhyapeethuniversity.com/admin/"
echo " Active Backend: $NEW_URL"
echo "=========================================================="
