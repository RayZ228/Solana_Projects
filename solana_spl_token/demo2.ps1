$Host.UI.RawUI.WindowTitle = "Student 2: SPL Token Extensions (Matrix)"
$root = "C:\Users\NrgNe\.gemini\antigravity-ide\scratch\solana-spl-token"
Set-Location $root

$wallet1 = "HHTM3GRdLevwbbKhiV25BHy4f1H9UzqvSoMiJY9UX9uw"

function Run($cmd) {
    Write-Host ""
    Write-Host "PS $((Get-Location).Path)> " -NoNewline -ForegroundColor DarkGray
    Write-Host $cmd -ForegroundColor Yellow
    Invoke-Expression $cmd
}

Write-Host "=================================================" -ForegroundColor Green
Write-Host "   SPL Token2022 CLI | Devnet | Student 2        " -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

Run "node dist/cli-matrix.js forge-asset `"MatrixNode`" `"MTRX`" `"https://example.com/matrix.json`""
Run "node dist/cli-matrix.js generate-supply 9999"
Run "node dist/cli-matrix.js transmit-asset $wallet1 1337"
Run "node dist/cli-matrix.js scan-asset"

Write-Host "`nDone! Make a screenshot of this window." -ForegroundColor Green
