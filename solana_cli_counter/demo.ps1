$Host.UI.RawUI.WindowTitle = "Solana Counter - Devnet Demo"
$root = "C:\Users\NrgNe\.gemini\antigravity-ide\scratch\solana-cli-counter"
Set-Location $root
$programId = "Em5turTL1juCNwvP522vHSnucHinpoUdjGzJPs2AZK3b"

function Run($cmd) {
    Write-Host ""
    Write-Host "PS $((Get-Location).Path)> " -NoNewline -ForegroundColor DarkGray
    Write-Host $cmd -ForegroundColor Yellow
    Invoke-Expression $cmd
}

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "   Solana Counter Program  |  Devnet Deploy   " -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

Run "solana --version"
Run "solana config get"
Run "solana program show $programId --url devnet"

Set-Location "$root\cli"
Remove-Item counter-address.txt -ErrorAction SilentlyContinue
Run "node dist/index.js --help"
Run "node dist/index.js init"
Run "node dist/index.js inc"
Run "node dist/index.js inc"
Run "node dist/index.js inc"
Run "node dist/index.js dec"
Run "node dist/index.js show"

Write-Host ""
Write-Host "Explorer: https://explorer.solana.com/address/$programId`?cluster=devnet" -ForegroundColor Green
