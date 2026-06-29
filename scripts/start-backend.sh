#!/bin/bash
# Respawn the LMS backend if it exits
cd /home/z/my-project/lms-backend
trap 'echo "[wrapper] Got signal at $(date)"' TERM INT HUP
while true; do
  echo "[wrapper] Starting backend at $(date) PID=$$"
  node dist/server.js 2>&1
  EXIT=$?
  echo "[wrapper] Backend exited with $EXIT at $(date). Respawning in 1s..."
  sleep 1
done
