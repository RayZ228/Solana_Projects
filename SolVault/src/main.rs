mod wallet;
mod ledger;
mod display;

use clap::{Parser, Subcommand};
use colored::Colorize;
use std::path::PathBuf;

#[derive(Parser)]
#[command(name = "solvault", version = "1.0", about = "Solana Wallet Simulator CLI")]
struct Cli {
    #[command(subcommand)]
    pub cmd: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Сгенерировать новый кошелек (Ed25519)
    Keygen,
    /// Проверить баланс
    Balance,
    /// Запросить тестовые токены
    Airdrop {
        #[arg(long, short)]
        amount: f64,
    },
    /// Перевести токены на другой кошелек
    Transfer {
        #[arg(long, short)]
        to: String,
        #[arg(long, short)]
        amount: f64,
        #[arg(long, short)]
        memo: Option<String>,
    },
    /// Посмотреть историю транзакций
    History,
}

fn main() {
    display::print_banner();

    let cli = Cli::parse();
    // Все данные сохраняем в папку пользователя ~/.solvault
    let db_path = dirs_next::home_dir().unwrap_or_else(|| PathBuf::from(".")).join(".solvault");
    std::fs::create_dir_all(&db_path).unwrap();

    let res = match cli.cmd {
        Command::Keygen => cmd_keygen(&db_path),
        Command::Balance => cmd_balance(&db_path),
        Command::Airdrop { amount } => cmd_airdrop(&db_path, amount),
        Command::Transfer { to, amount, memo } => cmd_transfer(&db_path, &to, amount, memo),
        Command::History => cmd_history(&db_path),
    };

    if let Err(e) = res {
        eprintln!("\n  {} {}", "ОШИБКА:".red().bold(), e.to_string().white());
        std::process::exit(1);
    }
}

fn cmd_keygen(db: &PathBuf) -> Result<(), String> {
    if wallet::exists(db) {
        let key = wallet::load(db)?;
        println!("  {} Кошелек уже существует!", "ℹ".yellow());
        println!("  {} {}", "Адрес:".cyan(), key.pubkey_b58.bright_white());
        return Ok(());
    }

    let key = wallet::create(db)?;
    println!("  {} Кошелек успешно создан!", "✔".green());
    println!("  {} {}", "Адрес:".cyan(), key.pubkey_b58.bright_white().bold());
    Ok(())
}

fn cmd_balance(db: &PathBuf) -> Result<(), String> {
    let key = wallet::load(db)?;
    let ledger = ledger::Ledger::load(db)?;
    let acc = ledger.accounts.get(&key.pubkey_b58).cloned().unwrap_or_default();
    
    let sol = acc.lamports as f64 / 1_000_000_000.0;
    println!("  {} {}", "Адрес: ".cyan(), key.pubkey_b58.white());
    println!("  {} {} SOL", "Баланс:".cyan(), format!("{:.9}", sol).bright_green().bold());
    println!("  {} {} lamports", "В лампортах:".cyan(), acc.lamports.to_string().dimmed());
    Ok(())
}

fn cmd_airdrop(db: &PathBuf, amount: f64) -> Result<(), String> {
    if amount <= 0.0 || amount > 10.0 {
        return Err("Допустимая сумма для airdrop от 0.001 до 10 SOL".into());
    }
    let key = wallet::load(db)?;
    let lamports = (amount * 1_000_000_000.0) as u64;

    let mut ledger = ledger::Ledger::load(db)?;
    ledger.credit(&key.pubkey_b58, lamports);

    let tx = ledger::TxRecord::new(&key, "Airdrop", &key.pubkey_b58, lamports, 0, Some("Test Tokens".into()))?;
    let sig = tx.signature.clone();
    ledger.record_tx(tx);
    ledger.save(db)?;

    println!("  {} Запрошен airdrop на {} SOL", "✔".green(), amount);
    println!("  {} {}", "Сигнатура TX:".cyan(), sig.dimmed());
    Ok(())
}

fn cmd_transfer(db: &PathBuf, to: &str, amount: f64, memo: Option<String>) -> Result<(), String> {
    let key = wallet::load(db)?;
    let lamports = (amount * 1_000_000_000.0) as u64;
    let fee = 5000;

    let mut ledger = ledger::Ledger::load(db)?;
    let sender_bal = ledger.get_balance(&key.pubkey_b58);

    if sender_bal < lamports + fee {
        return Err(format!("Недостаточно средств. Ваш баланс: {} lamports", sender_bal));
    }

    ledger.debit(&key.pubkey_b58, lamports + fee);
    ledger.credit(to, lamports);

    let tx = ledger::TxRecord::new(&key, "Transfer", to, lamports, fee, memo)?;
    let sig = tx.signature.clone();
    ledger.record_tx(tx);
    ledger.save(db)?;

    println!("  {} Перевод успешно выполнен!", "✔".green());
    println!("  {} {} SOL", "Сумма:".cyan(), amount);
    println!("  {} {}", "Получатель:".cyan(), to);
    println!("  {} {}", "Сигнатура TX:".cyan(), sig.dimmed());
    Ok(())
}

fn cmd_history(db: &PathBuf) -> Result<(), String> {
    let ledger = ledger::Ledger::load(db)?;
    display::print_history(&ledger.transactions);
    Ok(())
}
