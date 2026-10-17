$Host.UI.RawUI.WindowTitle = "Student 2: Matrix Profile (PDA)"
$root = "C:\Users\NrgNe\.gemini\antigravity-ide\scratch\solana-profile-pda"
Set-Location "$root\cli"

$programId = "99kG1uzN8NxctagzPbNYrnHAQNgGk68eaP6FpuBq6sTs"
$wallet = "5aZsYAo8iTr4L8tLYrCoQ6tokLeXWrfqfaDvBk6p3QWw"

function Run($cmd) {
    Write-Host ""
    Write-Host "PS $((Get-Location).Path)> " -NoNewline -ForegroundColor DarkGray
    Write-Host $cmd -ForegroundColor Yellow
    Invoke-Expression $cmd
}

Write-Host "=================================================" -ForegroundColor Green
Write-Host "   Solana PDA Profiles | Devnet | Student 2      " -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

Run "solana program show $programId --url devnet"
Run "node dist/index.js show $wallet"
Run "node dist/index.js update $wallet `"Follow the white rabbit... (Updated!)`""
Run "node dist/index.js show $wallet"

Write-Host "`nDone! Make a screenshot of this window." -ForegroundColor Green
