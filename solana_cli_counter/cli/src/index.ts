#!/usr/bin/env node
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';

// Load IDL dynamically
const idlPath = path.resolve(__dirname, '../../target/idl/counter.json');

// We use the ID dynamically if it changed after `anchor keys sync`
// Default one is the one we put in lib.rs
let programIdStr = 'EnssHFNqSn4XVze1rh13XBTXbjopMNXrrfM6azNNdhoH';
try {
  if (fs.existsSync(idlPath)) {
    const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
    if (idl.address) {
      programIdStr = idl.address; // Anchor 0.30+ IDL spec
    } else if (idl.metadata && idl.metadata.address) {
      programIdStr = idl.metadata.address; // legacy IDL spec
    }
  }
} catch (e) {}

const programId = new PublicKey(programIdStr);

function getProvider() {
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    
    // Check for wallet
    const walletPath = path.join(require('os').homedir(), '.config', 'solana', 'id.json');
    if (!fs.existsSync(walletPath)) {
        console.error('Wallet not found at ~/.config/solana/id.json.');
        console.error('Please create one using: solana-keygen new');
        process.exit(1);
    }
    
    const secretKeyString = fs.readFileSync(walletPath, 'utf8');
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    const wallet = new anchor.Wallet(Keypair.fromSecretKey(secretKey));
    
    return new anchor.AnchorProvider(connection, wallet, { preflightCommitment: 'confirmed' });
}

async function getProgram(): Promise<any> {
    if (!fs.existsSync(idlPath)) {
        console.error('IDL not found at ' + idlPath);
        console.error('Please build the Anchor program first using: anchor build');
        process.exit(1);
    }
    const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
    const provider = getProvider();
    anchor.setProvider(provider);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Program(idl as any, provider);
}

const programCli = new Command();

programCli
  .name('counter-cli')
  .description('CLI to interact with the Counter Solana Program')
  .version('1.0.0');

programCli.command('init')
  .description('Initialize a new counter account')
  .action(async () => {
      try {
          const program = await getProgram();
          const counterKeypair = Keypair.generate();
          
          console.log('Initializing counter...');
          const tx = await program.methods.initialize()
              .accounts({
                  counter: counterKeypair.publicKey,
                  user: program.provider.publicKey,
                  systemProgram: anchor.web3.SystemProgram.programId,
              })
              .signers([counterKeypair])
              .rpc();
              
          console.log(`Success! Transaction signature: \nhttps://explorer.solana.com/tx/${tx}?cluster=devnet`);
          console.log(`Counter Account Address: ${counterKeypair.publicKey.toBase58()}`);
          
          fs.writeFileSync('counter-address.txt', counterKeypair.publicKey.toBase58());
          console.log('Address saved to counter-address.txt');
      } catch (err: any) {
          console.error('Error initializing counter:');
          if (err.message.includes('insufficient funds')) {
              console.error('Insufficient funds! Please airdrop some SOL to your wallet using: solana airdrop 2');
          } else {
              console.error(err);
          }
      }
  });

programCli.command('show')
  .description('Show the current count')
  .argument('[address]', 'Address of the counter account')
  .action(async (address) => {
      try {
          if (!address && fs.existsSync('counter-address.txt')) {
              address = fs.readFileSync('counter-address.txt', 'utf8').trim();
          }
          if (!address) {
              console.error('Please provide a counter address or run init first.');
              process.exit(1);
          }
          const program = await getProgram();
          const counterPubkey = new PublicKey(address);
          
          const counterAccount = await (program.account as any)['counter'].fetch(counterPubkey);
          console.log(`\n============================`);
          console.log(`Counter Address: ${address}`);
          console.log(`Current Value:   ${counterAccount.count.toString()}`);
          console.log(`============================\n`);
      } catch (err) {
          console.error('Error fetching counter:', err);
      }
  });

programCli.command('inc')
  .description('Increment the counter')
  .argument('[address]', 'Address of the counter account')
  .action(async (address) => {
      try {
          if (!address && fs.existsSync('counter-address.txt')) {
              address = fs.readFileSync('counter-address.txt', 'utf8').trim();
          }
          if (!address) {
              console.error('Please provide a counter address or run init first.');
              process.exit(1);
          }
          const program = await getProgram();
          const counterPubkey = new PublicKey(address);
          
          console.log('Incrementing counter...');
          const tx = await program.methods.increment()
              .accounts({
                  counter: counterPubkey,
              })
              .rpc();
              
          console.log(`Success! Transaction signature: \nhttps://explorer.solana.com/tx/${tx}?cluster=devnet`);
      } catch (err) {
          console.error('Error incrementing counter:', err);
      }
  });

programCli.command('dec')
  .description('Decrement the counter')
  .argument('[address]', 'Address of the counter account')
  .action(async (address) => {
      try {
          if (!address && fs.existsSync('counter-address.txt')) {
              address = fs.readFileSync('counter-address.txt', 'utf8').trim();
          }
          if (!address) {
              console.error('Please provide a counter address or run init first.');
              process.exit(1);
          }
          const program = await getProgram();
          const counterPubkey = new PublicKey(address);
          
          console.log('Decrementing counter...');
          const tx = await program.methods.decrement()
              .accounts({
                  counter: counterPubkey,
              })
              .rpc();
              
          console.log(`Success! Transaction signature: \nhttps://explorer.solana.com/tx/${tx}?cluster=devnet`);
      } catch (err) {
          console.error('Error decrementing counter:', err);
      }
  });

programCli.parse();
