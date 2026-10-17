# SolVault — Rust для Solana-разработчика

CLI-симулятор Solana-кошелька, написанный на чистом Rust.
Изучай ключевые паттерны Solana SDK на практике.

## Быстрый старт

```bash
cargo build --release

# Или без сборки:
cargo run -- <command>
```

## Команды

```bash
# Создать кошелёк (генерирует Ed25519 keypair)
cargo run -- wallet new alice
cargo run -- wallet new bob

# Получить тестовые SOL (devnet-стиль airdrop)
cargo run -- airdrop alice 2.0

# Баланс
cargo run -- balance alice
cargo run -- wallet list

# Перевод SOL
cargo run -- transfer --from alice --to bob --amount 0.3 --memo "pizza"

# Сжечь (как SPL Token Burn)
cargo run -- burn alice 0.1 --reason "testing burn"

# Делегировать (стейкинг)
cargo run -- delegate alice bob 1.0 --epochs 3

# История транзакций
cargo run -- transactions list
cargo run -- transactions show <signature>

# Верифицировать Ed25519 подпись
cargo run -- verify <signature_prefix>

# Экспорт keypair в формате Solana
cargo run -- export-keypair alice

# Статус ledger
cargo run -- status
```

## Solana-паттерны в коде

| Концепция                            | Файл            |
|--------------------------------------|-----------------|
| Ed25519 keypair (как в Solana)       | keypair.rs      |
| Borsh-сериализация                   | account.rs      |
| Custom errors (ProgramError)         | error.rs        |
| Instruction enum + discriminator     | instruction.rs  |
| Account model (AccountInfo)          | account.rs      |
| AccountSerialize/Deserialize traits  | account.rs      |
| Pubkey + Base58                      | types.rs        |
| Transaction + Ed25519 signature      | transaction.rs  |
| Blockhash / Compute Units / Fees     | transaction.rs  |
| clap derive API (как в anchor-cli)   | cli.rs          |

## Маппинг на реальный Solana SDK

| SolVault                    | Реальный Solana                            |
|-----------------------------|--------------------------------------------|
| StoredKeypair::generate()   | Keypair::new()                             |
| Pubkey (32 bytes, base58)   | solana_program::pubkey::Pubkey             |
| VaultInstruction::pack()    | Instruction::data (Borsh bytes)            |
| discriminator()             | anchor_lang::Discriminator                 |
| generate_blockhash()        | rpc_client.get_latest_blockhash()          |
| TX_FEE_LAMPORTS = 5000      | Реальная комиссия mainnet                  |
| VaultResult<T>              | solana_program::program_error::ProgramResult |

## Следующие шаги

1. anchor-lang — те же паттерны с макросами
2. solana-program — базовая библиотека программ
3. spl-token — SPL Token инструкции
4. solana-client — подключение к RPC
