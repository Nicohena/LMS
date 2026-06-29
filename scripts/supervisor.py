#!/usr/bin/env python3
"""Persistent supervisor for LMS backend — survives parent death by ignoring HUP."""
import os
import sys
import subprocess
import time
import signal

BACKEND_DIR = "/home/z/my-project/lms-backend"
LOG_FILE = "/tmp/lms-backend.log"

def main():
    # Ignore hangup signal so we don't die when parent shell exits
    signal.signal(signal.SIGHUP, signal.SIG_IGN)
    signal.signal(signal.SIGTERM, signal.SIG_IGN)
    signal.signal(signal.SIGINT, signal.SIG_IGN)
    
    log = open(LOG_FILE, "ab", buffering=0)
    log.write(f"\n[supervisor] Starting at {time.strftime('%Y-%m-%d %H:%M:%S')}, pid={os.getpid()}\n".encode())
    log.flush()
    
    while True:
        log.write(f"[supervisor] Launching backend at {time.strftime('%H:%M:%S')}\n".encode())
        log.flush()
        try:
            proc = subprocess.Popen(
                ["node", "dist/server.js"],
                cwd=BACKEND_DIR,
                stdout=log,
                stderr=subprocess.STDOUT,
                stdin=subprocess.DEVNULL,
                # Don't use start_new_session — child will inherit SIGHUP-ignoring
                preexec_fn=lambda: signal.signal(signal.SIGHUP, signal.SIG_IGN),
            )
            ret = proc.wait()
            log.write(f"[supervisor] Backend exited with {ret}\n".encode())
            log.flush()
        except Exception as e:
            log.write(f"[supervisor] Exception: {e}\n".encode())
            log.flush()
        time.sleep(1)

if __name__ == "__main__":
    main()
