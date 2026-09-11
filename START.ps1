param([int]$Port = 8765, [string]$Database = '.runtime/web-demo.sqlite')
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$bundledPython = 'C:\Users\Tahir\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
if (Test-Path -LiteralPath $bundledPython) {
    & $bundledPython -m shared.server --port $Port --db $Database
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    python -m shared.server --port $Port --db $Database
} else {
    throw 'Python 3.11+ benötigt. Installieren und requirements-dev.txt verwenden.'
}
