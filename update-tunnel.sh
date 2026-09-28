#!/usr/bin/env bash
set -e

# Export standard environment paths so cron has access to pm2, cloudflared, git, etc.
export HOME="${HOME:-/home/gurukul}"
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node 2>/dev/null | tail -n 1)/bin:$HOME/.npm-global/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================================="
echo "    Cloudflare Tunnel to Vercel Auto-Sync Utility        "
echo "=========================================================="

# 1. Ensure git user identity is configured
if [ -z "$(git config user.email 2>/dev/null)" ]; then
    git config user.email "gurukulvidhyapeethuniversity@gmail.com"
fi
if [ -z "$(git config user.name 2>/dev/null)" ]; then
    git config user.name "Gurukul Vidyapeeth"
fi

# 2. Write permanent stable runner script
RUNNER_SCRIPT="$HOME/run-tunnel.sh"
cat << 'EOF' > "$RUNNER_SCRIPT"
#!/bin/bash
exec cloudflared tunnel --url http://127.0.0.1:5000
EOF
chmod +x "$RUNNER_SCRIPT"

# 3. Ensure PM2 runs ~/run-tunnel.sh directly (prevents crash/restart loop)
PM2_INFO=$(pm2 jlist 2>/dev/null || echo "[]")
if ! echo "$PM2_INFO" | grep -q '"pm_exec_path":".*run-tunnel\.sh"'; then
    echo "Replacing legacy PM2 tunnel with stable runner..."
    pm2 delete tunnel > /dev/null 2>&1 || true
    pm2 delete cloudflared > /dev/null 2>&1 || true
    pm2 start "$RUNNER_SCRIPT" --name "tunnel"
    pm2 save
    echo "Waiting for tunnel connections to establish..."
    sleep 8
fi

PM2_NAME="tunnel"

# 4. Helper to extract real tunnel URL (ignoring api.trycloudflare.com)
get_url() {
    local url=""
    # First priority: live PM2 stream (last 100 lines of current process)
    url=$(pm2 logs "$PM2_NAME" --lines 100 --nostream 2>/dev/null | grep -a -oE 'https://[a-z0-9]+(-[a-z0-9]+)+\.trycloudflare\.com' | grep -v 'api\.trycloudflare\.com' | tail -n 1 | tr -d ' ' || true)
    
    # Second priority: direct error log where cloudflared outputs
    if [ -z "$url" ] && [ -f "$HOME/.pm2/logs/${PM2_NAME}-error.log" ]; then
        url=$(grep -a -oE 'https://[a-z0-9]+(-[a-z0-9]+)+\.trycloudflare\.com' "$HOME/.pm2/logs/${PM2_NAME}-error.log" 2>/dev/null | grep -v 'api\.trycloudflare\.com' | tail -n 1 | tr -d ' ' || true)
    fi
    echo "$url"
}

echo "Searching for active trycloudflare.com URL..."
NEW_URL=$(get_url)

# 5. Check if URL is detected, if not wait a few seconds
if [ -z "$NEW_URL" ]; then
    echo "Waiting for URL in PM2 logs..."
    for i in {1..15}; do
        sleep 2
        NEW_URL=$(get_url)
        if [ -n "$NEW_URL" ]; then
            break
        fi
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

echo "[OK] Active Live Tunnel Detected: $NEW_URL"

# Sync latest changes from remote before updating
git fetch origin main > /dev/null 2>&1 || true
git merge origin/main --ff-only > /dev/null 2>&1 || true

# 6. Read current URL in vercel.json
CURRENT_URL=$(grep -a -oE 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com' vercel.json | head -n 1 || true)

if [ "$NEW_URL" == "$CURRENT_URL" ]; then
    echo "[OK] vercel.json is already up to date with: $NEW_URL"
    echo "No push required."
    exit 0
fi

echo "Updating vercel.json: $CURRENT_URL -> $NEW_URL"

# 7. Replace in vercel.json
sed -i -E "s|https://[a-zA-Z0-9.-]+\.trycloudflare\.com|$NEW_URL|g" vercel.json

# 8. Commit and push
git add vercel.json
git commit -m "chore: auto-sync tunnel url to $NEW_URL [skip ci]"

echo "Pushing changes to GitHub to trigger Vercel auto-deploy..."
git pull --rebase origin main > /dev/null 2>&1 || true
git push origin main

echo ""
echo "=========================================================="
echo " [SUCCESS] Pushed new URL to Vercel!"
echo " Vercel is now deploying your updated backend rewrite."
echo " Domain: https://www.gurukulvidhyapeethuniversity.com/admin/"
echo " Active Backend: $NEW_URL"
echo "=========================================================="
