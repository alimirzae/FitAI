$ErrorActionPreference = "Stop"
Write-Host "FitAI local setup"

if (!(Test-Path ".venv")) {
  py -3.11 -m venv .venv
}

& .\.venv\Scripts\python.exe -m pip install --upgrade pip
& .\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt

if (!(Test-Path "node_modules")) {
  npm install
}

Write-Host "Starting backend on http://127.0.0.1:8000"
Start-Process powershell -ArgumentList "-NoExit","-Command","& '$PWD\.venv\Scripts\python.exe' -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000"

Write-Host "Starting frontend on http://127.0.0.1:3000"
npm run dev
