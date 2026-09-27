#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================================="
echo "    Cloudflare Tunnel to Vercel Auto-Sync Utility        "
echo "=========================================================="

# 1. Identify PM2 process name (search for tunnel or cloudflared)
PM2_NAME="tunnel"
if ! pm2 describe "$PM2_NAME" > /dev/null 2>&1; then
    if pm2 describe cloudflared > /dev/null 2>&1; then
        PM2_NAME="cloudflared"
    else
        echo "Starting PM2 tunnel process..."
        pm2 start "cloudflared tunnel --url http://localhost:5000" --name "tunnel"
        pm2 save
        sleep 5
    fi
fi

echo "Searching for active trycloudflare.com URL..."

# Helper function to find URL from PM2 log files or command
get_url() {
    local url=""
    # Check ~/.pm2/logs files directly (searches entire log history, both stdout and stderr)
    if compgen -G "$HOME/.pm2/logs/${PM2_NAME}*.log" > /dev/null; then
        url=$(grep -oE 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com' ~/.pm2/logs/${PM2_NAME}*.log 2>/dev/null | tail -n 1 | awk -F: '{print $NF}' | tr -d ' ' || true)
    fi
    # Fallback to pm2 logs command
    if [ -z "$url" ]; then
        url=$(pm2 logs "$PM2_NAME" --lines 300 --nostream 2>/dev/null | grep -oE 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com' | tail -n 1 | tr -d ' ' || true)
    fi
    echo "$url"
}

NEW_URL=$(get_url)

# If no URL found, the logs might have been flushed or tunnel needs a fresh restart
if [ -z "$NEW_URL" ]; then
    echo "URL not found in past logs. Restarting PM2 process '$PM2_NAME' to generate a fresh URL..."
    pm2 restart "$PM2_NAME"
    for i in {1..20}; do
        sleep 2
        NEW_URL=$(get_url)
        if [ -n "$NEW_URL" ]; then
            break
        fi
    done
fi

if [ -z "$NEW_URL" ]; then
    echo ""
    echo "[ERROR] Could not detect a valid trycloudflare.com URL."
    echo "Here is the status of your PM2 processes:"
    pm2 list
    echo ""
    echo "Here are the last 20 lines of your tunnel logs:"
    pm2 logs "$PM2_NAME" --lines 20 --nostream
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
