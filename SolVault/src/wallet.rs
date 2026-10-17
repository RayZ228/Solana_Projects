use ed25519_dalek::SigningKey;
use rand::rngs::OsRng;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Serialize, Deserialize)]
pub struct Keypair {
    pub pubkey_b58: String,
    pub secret_b58: String,
}

impl Keypair {
    pub fn to_signer(&self) -> Result<SigningKey, String> {
        let bytes = bs58::decode(&self.secret_b58).into_vec().map_err(|e| e.to_string())?;
        let mut secret = [0u8; 32];
        secret.copy_from_slice(&bytes[..32]);
        Ok(SigningKey::from_bytes(&secret))
    }
}

pub fn exists(db: &PathBuf) -> bool {
    db.join("keypair.json").exists()
}

pub fn create(db: &PathBuf) -> Result<Keypair, String> {
    let mut csprng = OsRng;
    let sk = SigningKey::generate(&mut csprng);
    let pk = sk.verifying_key().to_bytes();
    
    // Solana хранит 64 байта (32 secret + 32 pub), сделаем похоже, но проще
    let mut full_secret = [0u8; 64];
    full_secret[..32].copy_from_slice(&sk.to_bytes());
    full_secret[32..].copy_from_slice(&pk);

    let keypair = Keypair {
        pubkey_b58: bs58::encode(&pk).into_string(),
        secret_b58: bs58::encode(&full_secret).into_string(),
    };

    let json = serde_json::to_string_pretty(&keypair).unwrap();
    std::fs::write(db.join("keypair.json"), json).map_err(|e| e.to_string())?;
    
    Ok(keypair)
}

pub fn load(db: &PathBuf) -> Result<Keypair, String> {
    let path = db.join("keypair.json");
    if !path.exists() {
        return Err("Файл ключей не найден. Сначала выполните 'solvault keygen'".into());
    }
    let data = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&data).map_err(|e| e.to_string())
}
