#!/usr/bin/env bash

# Export standard environment paths so PM2/cron has access to git, node, pm2, cloudflared
export HOME="${HOME:-/home/gurukul}"
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node 2>/dev/null | tail -n 1)/bin:$HOME/.npm-global/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================================="
echo "  Gurukul Tunnel & Vercel Automated Watcher Daemon (PM2)  "
echo "=========================================================="
echo "Daemon initialized at: $(date)"
echo "Monitoring interval: every 60 seconds"
echo ""

while true; do
    echo "--- [$(date '+%Y-%m-%d %H:%M:%S')] Checking Gurukul tunnel health & Vercel sync ---"
    ./update-tunnel.sh || echo "[Warning] Tunnel check completed with notice. Retrying next cycle."
    echo ""
    sleep 60
done
