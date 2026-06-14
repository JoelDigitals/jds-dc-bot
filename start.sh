#!/bin/bash
echo "==> Starting Gunicorn (Django)..."
cd web && gunicorn web_overlay.wsgi:application --bind 0.0.0.0:$PORT --workers 2 &
echo "==> Starting Discord Bot..."
cd /opt/render/project/src && exec node src/index.js