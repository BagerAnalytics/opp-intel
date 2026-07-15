#!/bin/sh
# Start Tailscale daemon in the background
tailscaled --tun=userspace-networking --socks5-server=localhost:1055 --outbound-http-proxy-listen=localhost:1055 &

# Wait a few seconds for daemon to start
sleep 3

# Authenticate with Tailscale using the provided Auth Key
if [ -z "${TAILSCALE_AUTHKEY}" ]; then
  echo "Warning: TAILSCALE_AUTHKEY is not set. NAS uploads over Tailscale may fail."
else
  tailscale up --authkey="${TAILSCALE_AUTHKEY}" --hostname="railway-backend" --accept-routes
fi

# Run database migrations (if any are added in the future) or seed data
# python seed_demo_data.py # Optional, perhaps not on every boot

# Start the FastAPI server
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
