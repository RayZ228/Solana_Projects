$Host.UI.RawUI.WindowTitle = "Student 1: SPL Token Extensions (Neon)"
$root = "C:\Users\NrgNe\.gemini\antigravity-ide\scratch\solana-spl-token"
Set-Location $root

$wallet2 = "5aZsYAo8iTr4L8tLYrCoQ6tokLeXWrfqfaDvBk6p3QWw"

function Run($cmd) {
    Write-Host ""
    Write-Host "PS $((Get-Location).Path)> " -NoNewline -ForegroundColor DarkGray
    Write-Host $cmd -ForegroundColor Yellow
    Invoke-Expression $cmd
}

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "   SPL Token2022 CLI | Devnet | Student 1        " -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

Run "node dist/cli-neon.js init-coin `"CyberCoin`" `"CYB`" `"https://example.com/cyber.json`""
Run "node dist/cli-neon.js mint-supply 5000"
Run "node dist/cli-neon.js send-coin $wallet2 100"
Run "node dist/cli-neon.js inspect-coin"

Write-Host "`nDone! Make a screenshot of this window." -ForegroundColor Green
