#!/bin/bash
cd "$(dirname "$0")" || exit 1
PORT=8080
python3 -m http.server "$PORT" --bind 127.0.0.1 >/tmp/rally-house-v16-server.log 2>&1 &
PID=$!
sleep 1
if ! kill -0 "$PID" 2>/dev/null; then
  echo "Rally House could not start on port $PORT. Close the server using that port, or run python3 -m http.server 8081 --bind 127.0.0.1 in this folder."
  cat /tmp/rally-house-v16-server.log
  exit 1
fi
if command -v open >/dev/null 2>&1; then
  open "http://127.0.0.1:$PORT/"
else
  echo "Open http://127.0.0.1:$PORT/ in your browser."
fi
trap 'kill "$PID" 2>/dev/null' EXIT INT TERM
wait "$PID"
