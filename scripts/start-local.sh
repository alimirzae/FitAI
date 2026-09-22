#!/usr/bin/env bash
set -e
python3 -m venv .venv
. .venv/bin/activate
python -m pip install --upgrade pip
pip install -r backend/requirements.txt
[ -d node_modules ] || npm install
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 &
npm run dev
