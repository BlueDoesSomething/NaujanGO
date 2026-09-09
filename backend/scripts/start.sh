#!/usr/bin/env sh
set -e

echo "Starting chatbot model server on port 8000..."
PORT=8000 python /app/MULTILINGUAL_CHATBOT/server.py &
MODEL_PID=$!

cd /app
echo "Starting backend..."
CHATBOT_MODEL_URL=http://127.0.0.1:8000 exec node server.js