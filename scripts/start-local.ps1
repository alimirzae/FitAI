$ErrorActionPreference = "Stop"
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $ProjectRoot

Write-Host "FitAI local setup" -ForegroundColor Cyan
Write-Host "Project root: $ProjectRoot"

function Find-Python {
    $candidates = @(
        @{ Cmd = "py"; Args = @("-3.11") },
        @{ Cmd = "py"; Args = @("-3.12") },
        @{ Cmd = "python"; Args = @() },
        @{ Cmd = "python3"; Args = @() }
    )
    foreach ($candidate in $candidates) {
        if (Get-Command $candidate.Cmd -ErrorAction SilentlyContinue) {
            try {
                $version = & $candidate.Cmd @($candidate.Args) -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')" 2>$null
                if ($LASTEXITCODE -eq 0 -and ($version -eq "3.11" -or $version -eq "3.12")) {
                    return $candidate
                }
            } catch {}
        }
    }
    return $null
}

$python = Find-Python
if ($null -eq $python) {
    Write-Host ""
    Write-Host "Python 3.11 or 3.12 was not found." -ForegroundColor Red
    Write-Host "FitAI currently requires Python 3.11/3.12 for MediaPipe compatibility." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Install Python 3.11, then open a NEW PowerShell window and run this script again." -ForegroundColor Yellow
    Write-Host "With the modern Python Install Manager you can use:  py install 3.11"
    Write-Host "You can inspect installed runtimes with:           py --list"
    Write-Host ""
    throw "Compatible Python runtime not found. Virtual environment was not created."
}

$venvPython = Join-Path $ProjectRoot ".venv\Scripts\python.exe"
if (!(Test-Path $venvPython)) {
    Write-Host "Creating .venv..." -ForegroundColor Cyan
    & $python.Cmd @($python.Args) -m venv (Join-Path $ProjectRoot ".venv")
    if ($LASTEXITCODE -ne 0 -or !(Test-Path $venvPython)) {
        throw "Failed to create .venv with the detected Python runtime."
    }
}

Write-Host "Installing/updating backend dependencies..." -ForegroundColor Cyan
& $venvPython -m pip install --upgrade pip
if ($LASTEXITCODE -ne 0) { throw "pip upgrade failed." }
& $venvPython -m pip install -r (Join-Path $ProjectRoot "backend\requirements.txt")
if ($LASTEXITCODE -ne 0) { throw "Backend dependency installation failed." }

if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "Node.js/npm was not found. Install Node.js 20+ and rerun this script."
}
if (!(Test-Path (Join-Path $ProjectRoot "node_modules"))) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) { throw "npm install failed." }
}

$backendCommand = '$env:PYTHONUNBUFFERED="1"; & "' + $venvPython + '" -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --log-level debug --access-log'
Write-Host "Starting backend: http://127.0.0.1:8000" -ForegroundColor Green
Start-Process powershell -WorkingDirectory $ProjectRoot -ArgumentList "-NoExit","-Command",$backendCommand

Start-Sleep -Seconds 2
Write-Host "Starting frontend..." -ForegroundColor Green
npm run dev
