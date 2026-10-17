# Builds and deploys the counter program on Windows without admin rights
# (bypasses cargo-build-sbf, which requires symlink privileges).
$ErrorActionPreference = "Continue"
$pt = "$env:USERPROFILE\.local\share\solana\install\releases\1.18.26\solana-release\bin\sdk\sbf\dependencies\platform-tools"
$x  = "$env:USERPROFILE\xwin"

$env:LIB = "$x\crt\lib\x86_64;$x\sdk\lib\um\x86_64;$x\sdk\lib\ucrt\x86_64"
$env:CARGO_TARGET_X86_64_PC_WINDOWS_MSVC_LINKER = "$pt\llvm\bin\lld-link.exe"
$env:CC_sbf_solana_solana = "$pt\llvm\bin\clang.exe"
$env:AR_sbf_solana_solana = "$pt\llvm\bin\llvm-ar.exe"
$env:CARGO_TARGET_SBF_SOLANA_SOLANA_RUSTFLAGS = "-C lto=no"
$env:RUSTUP_TOOLCHAIN = "solana"

cargo build --release --target sbf-solana-solana --manifest-path programs/counter/Cargo.toml
& "$pt\llvm\bin\llvm-objcopy.exe" --strip-all target/sbf-solana-solana/release/counter.so target/deploy/counter.so
node scripts/gen-idl.js

if ($args -contains "deploy") {
    solana program deploy target/deploy/counter.so --program-id target/deploy/counter-keypair.json --url devnet
}
