use chrono::Utc;
use ed25519_dalek::Signer;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::path::PathBuf;
use crate::wallet::Keypair;

#[derive(Serialize, Deserialize, Default, Clone)]
pub struct AccountInfo {
    pub lamports: u64,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct TxRecord {
    pub signature: String,
    pub instruction: String,
    pub to: String,
    pub lamports: u64,
    pub fee: u64,
    pub memo: Option<String>,
    pub timestamp: String,
}

impl TxRecord {
    pub fn new(kp: &Keypair, inst: &str, to: &str, lamports: u64, fee: u64, memo: Option<String>) -> Result<Self, String> {
        let ts = Utc::now().timestamp_nanos_opt().unwrap_or(0);
        let blockhash = Sha256::digest(ts.to_le_bytes());
        let msg = format!("{}|{}|{}|{}|{}", bs58::encode(blockhash).into_string(), inst, to, lamports, fee);
        
        let sig = kp.to_signer()?.sign(msg.as_bytes());
        Ok(Self {
            signature: bs58::encode(sig.to_bytes()).into_string(),
            instruction: inst.to_string(),
            to: to.to_string(),
            lamports,
            fee,
            memo,
            timestamp: Utc::now().to_rfc3339(),
        })
    }
}

#[derive(Serialize, Deserialize, Default)]
pub struct Ledger {
    pub accounts: HashMap<String, AccountInfo>,
    pub transactions: Vec<TxRecord>,
}

impl Ledger {
    pub fn load(db: &PathBuf) -> Result<Self, String> {
        let path = db.join("ledger.json");
        if path.exists() {
            let data = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
            Ok(serde_json::from_str(&data).unwrap_or_default())
        } else {
            Ok(Self::default())
        }
    }

    pub fn save(&self, db: &PathBuf) -> Result<(), String> {
        let json = serde_json::to_string_pretty(self).unwrap();
        std::fs::write(db.join("ledger.json"), json).map_err(|e| e.to_string())
    }

    pub fn get_balance(&self, address: &str) -> u64 {
        self.accounts.get(address).map(|a| a.lamports).unwrap_or(0)
    }

    pub fn credit(&mut self, address: &str, amount: u64) {
        self.accounts.entry(address.to_string()).or_default().lamports += amount;
    }

    pub fn debit(&mut self, address: &str, amount: u64) {
        if let Some(acc) = self.accounts.get_mut(address) {
            acc.lamports = acc.lamports.saturating_sub(amount);
        }
    }

    pub fn record_tx(&mut self, tx: TxRecord) {
        self.transactions.push(tx);
    }
}
