# Solana Projects

Коллекция учебных проектов под Solana.

| Проект | Описание | Стек |
|---|---|---|
| [solana_spl_token](./solana_spl_token) | CLI для создания и управления SPL-токенами | TypeScript, @solana/spl-token |
| [solana_profile_pda](./solana_profile_pda) | On-chain профиль пользователя на PDA + CLI-клиент | Rust, Anchor, TypeScript |
| [solana_cli_counter](./solana_cli_counter) | Программа-счётчик + CLI-клиент | Rust, Anchor, TypeScript |
| [SolVault](./SolVault) | Консольный симулятор Solana-кошелька | Rust |

> Кошельки/keypair-файлы в репозиторий не входят — CLI читают их из локальной конфигурации Solana (`~/.config/solana/id.json`).
