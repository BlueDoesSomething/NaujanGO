#!/usr/bin/env sh
set -e

if [ "$ENABLE_CHATBOT_MODEL" = "true" ]; then
  echo "Starting chatbot model server on port 8000..."
  PORT=8000 python /app/MULTILINGUAL_CHATBOT/server.py &
  MODEL_PID=$!
  export CHATBOT_MODEL_URL=http://127.0.0.1:8000
else
  echo "Chatbot model disabled (set ENABLE_CHATBOT_MODEL=true to enable)"
  export CHATBOT_MODEL_URL=http://127.0.0.1:1
fi

cd /app
echo "Starting backend..."
exec node server.js