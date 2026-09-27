#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================================="
echo "    Cloudflare Tunnel to Vercel Auto-Sync Utility        "
echo "=========================================================="

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

# Function to extract latest URL
get_url() {
    local url=""
    if compgen -G "$HOME/.pm2/logs/${PM2_NAME}*.log" > /dev/null; then
        url=$(grep -a -oE 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com' ~/.pm2/logs/${PM2_NAME}*.log 2>/dev/null | tail -n 1 | awk -F: '{print $NF}' | tr -d ' ' || true)
    fi
    if [ -z "$url" ]; then
        url=$(pm2 logs "$PM2_NAME" --lines 100 --nostream 2>/dev/null | grep -a -oE 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com' | tail -n 1 | tr -d ' ' || true)
    fi
    echo "$url"
}

echo "Searching for active trycloudflare.com URL..."
NEW_URL=$(get_url)

# Test if the found URL is actually online and responding
is_alive=false
if [ -n "$NEW_URL" ]; then
    echo "Checking if detected URL is currently active: $NEW_URL"
    if curl -s --connect-timeout 4 -I "$NEW_URL" > /dev/null 2>&1; then
        is_alive=true
    fi
fi

# If no URL or the URL is dead, restart tunnel with fresh logs
if [ -z "$NEW_URL" ] || [ "$is_alive" = false ]; then
    echo "[!] Tunnel is offline or URL has expired ($NEW_URL)."
    echo "Flushing old logs and generating a fresh Cloudflare Tunnel..."
    pm2 flush "$PM2_NAME"
    pm2 restart "$PM2_NAME"
    
    for i in {1..20}; do
        sleep 2
        NEW_URL=$(get_url)
        if [ -n "$NEW_URL" ]; then
            if curl -s --connect-timeout 4 -I "$NEW_URL" > /dev/null 2>&1; then
                is_alive=true
                break
            fi
        fi
        echo "Waiting for tunnel connection ($i/20)..."
    done
fi

if [ -z "$NEW_URL" ]; then
    echo ""
    echo "[ERROR] Could not obtain an active trycloudflare.com URL."
    echo "Status of PM2 processes:"
    pm2 list
    echo "Last logs:"
    pm2 logs "$PM2_NAME" --lines 20 --nostream
    exit 1
fi

echo "[OK] Active Live Tunnel Verified: $NEW_URL"

# Read current URL in vercel.json
CURRENT_URL=$(grep -a -oE 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com' vercel.json | head -n 1 || true)

if [ "$NEW_URL" == "$CURRENT_URL" ]; then
    echo "[OK] vercel.json is already up to date with: $NEW_URL"
    echo "No push required."
    exit 0
fi

echo "Updating vercel.json: $CURRENT_URL -> $NEW_URL"

# Replace in vercel.json
sed -i -E "s|https://[a-zA-Z0-9.-]+\.trycloudflare\.com|$NEW_URL|g" vercel.json

# Commit and push
git add vercel.json
git commit -m "chore: auto-sync tunnel url to $NEW_URL [skip ci]"

echo "Pushing changes to GitHub to trigger Vercel auto-deploy..."
git push origin main

echo ""
echo "=========================================================="
echo " [SUCCESS] Pushed new URL to Vercel!"
echo " Vercel is now deploying your updated backend rewrite."
echo " Domain: https://www.gurukulvidhyapeethuniversity.com/admin/"
echo " Active Backend: $NEW_URL"
echo "=========================================================="
