$Host.UI.RawUI.WindowTitle = "Solana PDA Profiles - Devnet Demo"
$root = "C:\Users\NrgNe\.gemini\antigravity-ide\scratch\solana-profile-pda"
Set-Location "$root\cli"

function Run($cmd) {
    Write-Host ""
    Write-Host "PS $((Get-Location).Path)> " -NoNewline -ForegroundColor DarkGray
    Write-Host $cmd -ForegroundColor Yellow
    Invoke-Expression $cmd
}

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "   Solana PDA Profiles  |  Devnet Deploy      " -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# Show neon style
Run "node dist/index.js show HHTM3GRdLevwbbKhiV25BHy4f1H9UzqvSoMiJY9UX9uw"

# Show matrix style
Run "node dist/index.js show 5aZsYAo8iTr4L8tLYrCoQ6tokLeXWrfqfaDvBk6p3QWw"

Write-Host "Explorer (Neon): https://explorer.solana.com/address/3DXY6ioYmoim12QYdA74AasGQCgW6vjP4NGJmeuhKY6k?cluster=devnet" -ForegroundColor Green
Write-Host "Explorer (Matrix): https://explorer.solana.com/address/EeESfaS2hLPbX3dhDFXdn3DF6Q9jFLdhMLo2SZ1svYsN?cluster=devnet" -ForegroundColor Green
