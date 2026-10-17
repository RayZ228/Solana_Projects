use comfy_table::{modifiers::UTF8_ROUND_CORNERS, presets::UTF8_FULL, Cell, Color, Table};
use colored::Colorize;
use crate::ledger::TxRecord;

pub fn print_banner() {
    println!("\n  {}\n", "◎ SolVault — Solana Wallet Simulator".cyan().bold());
}

pub fn print_history(txs: &[TxRecord]) {
    if txs.is_empty() {
        println!("  {}", "История транзакций пуста.".yellow());
        return;
    }

    let mut table = Table::new();
    table.load_preset(UTF8_FULL)
         .apply_modifier(UTF8_ROUND_CORNERS)
         .set_header(vec![
             Cell::new("Signature").fg(Color::Cyan),
             Cell::new("Instruction").fg(Color::Yellow),
             Cell::new("Amount (SOL)").fg(Color::Green),
             Cell::new("To Address").fg(Color::Magenta),
             Cell::new("Memo").fg(Color::White),
         ]);

    // Показываем последние 10 транзакций (с конца)
    for tx in txs.iter().rev().take(10) {
        let sig_short = if tx.signature.len() > 16 {
            format!("{}..{}", &tx.signature[..8], &tx.signature[tx.signature.len()-8..])
        } else {
            tx.signature.clone()
        };

        let to_short = if tx.to.len() > 10 {
            format!("{}..", &tx.to[..8])
        } else {
            tx.to.clone()
        };

        let memo = tx.memo.as_deref().unwrap_or("-");
        let amount_sol = tx.lamports as f64 / 1_000_000_000.0;

        table.add_row(vec![
            Cell::new(sig_short),
            Cell::new(&tx.instruction),
            Cell::new(format!("{:.4}", amount_sol)),
            Cell::new(to_short),
            Cell::new(memo),
        ]);
    }

    println!("  {}", "Последние транзакции:".cyan());
    println!("{}", table);
    println!();
}
