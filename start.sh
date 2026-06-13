#!/bin/bash
set -e

echo "Starting Gunicorn..."
gunicorn web_overlay.wsgi:application --bind 0.0.0.0:$PORT --chdir web --daemon

echo "Starting Discord Bot..."
exec node src/index.js