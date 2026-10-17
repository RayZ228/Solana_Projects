$Host.UI.RawUI.WindowTitle = "Student 1: Neon Profile (PDA)"
$root = "C:\Users\NrgNe\.gemini\antigravity-ide\scratch\solana-profile-pda"
Set-Location "$root\cli"

$programId = "99kG1uzN8NxctagzPbNYrnHAQNgGk68eaP6FpuBq6sTs"
$wallet = "HHTM3GRdLevwbbKhiV25BHy4f1H9UzqvSoMiJY9UX9uw"

function Run($cmd) {
    Write-Host ""
    Write-Host "PS $((Get-Location).Path)> " -NoNewline -ForegroundColor DarkGray
    Write-Host $cmd -ForegroundColor Yellow
    Invoke-Expression $cmd
}

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "   Solana PDA Profiles | Devnet | Student 1      " -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

Run "solana program show $programId --url devnet"
Run "node dist/index.js show $wallet"
Run "node dist/index.js update $wallet `"Learning Solana at Superteams (Updated!)`""
Run "node dist/index.js show $wallet"

Write-Host "`nDone! Make a screenshot of this window." -ForegroundColor Green
