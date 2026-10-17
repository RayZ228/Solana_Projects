import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';

// Chalk for terminal styling
import chalk from 'chalk';

const idlPath = path.resolve(__dirname, '../../target/idl/sol_profile.json');
let programIdStr = '99kG1uzN8NxctagzPbNYrnHAQNgGk68eaP6FpuBq6sTs';

try {
  if (fs.existsSync(idlPath)) {
    const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
    if (idl.address) programIdStr = idl.address;
  }
} catch (e) {}

const programId = new PublicKey(programIdStr);

// Different styles based on target wallet (for the demo requirement)
const THEMES = {
  // Wallet 1: HHTM3GRdLevwbbKhiV25BHy4f1H9UzqvSoMiJY9UX9uw
  NEON: {
    title: chalk.bold.cyanBright,
    key: chalk.magenta,
    val: chalk.yellowBright,
    success: chalk.bold.greenBright,
    border: chalk.cyan,
  },
  // Wallet 2: 5aZsYAo8iTr4L8tLYrCoQ6tokLeXWrfqfaDvBk6p3QWw
  MATRIX: {
    title: chalk.bold.green,
    key: chalk.green,
    val: chalk.greenBright,
    success: chalk.bgGreen.black,
    border: chalk.green.dim,
  },
  DEFAULT: {
    title: chalk.bold.white,
    key: chalk.gray,
    val: chalk.white,
    success: chalk.green,
    border: chalk.gray,
  }
};

function getTheme(walletPubkey: string) {
  if (walletPubkey === 'HHTM3GRdLevwbbKhiV25BHy4f1H9UzqvSoMiJY9UX9uw') return THEMES.NEON;
  if (walletPubkey === '5aZsYAo8iTr4L8tLYrCoQ6tokLeXWrfqfaDvBk6p3QWw') return THEMES.MATRIX;
  return THEMES.DEFAULT;
}

function getProvider() {
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  const walletPath = path.join(require('os').homedir(), '.config', 'solana', 'id.json');
  if (!fs.existsSync(walletPath)) {
    console.error('Wallet not found. Need ~/.config/solana/id.json');
    process.exit(1);
  }
  
  const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, 'utf8')));
  const wallet = new anchor.Wallet(Keypair.fromSecretKey(secretKey));
  return new anchor.AnchorProvider(connection, wallet, { preflightCommitment: 'confirmed' });
}

async function getProgram(): Promise<any> {
  const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
  const provider = getProvider();
  anchor.setProvider(provider);
  return new Program(idl as any, provider);
}

function printProfileCard(account: any, pda: PublicKey, owner: string, t: any, isMatrix: boolean) {
  const dateStr = new Date(account.createdAt.toNumber() * 1000).toLocaleString();
  
  if (isMatrix) {
    // Completely different layout for Student 2
    console.log(t.border('──────────────────────────────────────────────────────'));
    console.log(t.title(' >> SYSTEM.PROFILE.READ( PDA )'));
    console.log(t.border('──────────────────────────────────────────────────────'));
    console.log(t.key(' ID:       ') + t.val(account.username));
    console.log(t.key(' STATUS:   ') + t.val(account.bio));
    console.log(t.key(' IMG_REF:  ') + t.val(account.avatarUrl));
    console.log(t.border(' · · · · · · · · · · · · · · · · · · · · · · · · · · ·'));
    console.log(t.key(' PUBKEY:   ') + t.val(owner));
    console.log(t.key(' PDA_HASH: ') + t.val(pda.toBase58()));
    console.log(t.key(' TS_INIT:  ') + t.val(dateStr));
    console.log(t.key(' REVS:     ') + t.val(account.updateCount.toString()));
    console.log(t.border('──────────────────────────────────────────────────────\n'));
  } else {
    // Original layout for Student 1
    console.log(t.border('╔════════════════════════════════════════════════════════════╗'));
    console.log(t.border('║ ') + t.title(' DECENTRALIZED ON-CHAIN PROFILE PDA '.padEnd(58)) + t.border(' ║'));
    console.log(t.border('╠════════════════════════════════════════════════════════════╣'));
    console.log(t.border('║ ') + t.key('Username:  ') + t.val(account.username.padEnd(46)) + t.border('║'));
    console.log(t.border('║ ') + t.key('Bio:       ') + t.val(account.bio.substring(0, 46).padEnd(46)) + t.border('║'));
    console.log(t.border('║ ') + t.key('Avatar:    ') + t.val(account.avatarUrl.substring(0, 46).padEnd(46)) + t.border('║'));
    console.log(t.border('╠════════════════════════════════════════════════════════════╣'));
    console.log(t.border('║ ') + t.key('Owner:     ') + t.val(owner.substring(0, 46).padEnd(46)) + t.border('║'));
    console.log(t.border('║ ') + t.key('PDA Addr:  ') + t.val(pda.toBase58().padEnd(46)) + t.border('║'));
    console.log(t.border('║ ') + t.key('Joined:    ') + t.val(dateStr.padEnd(46)) + t.border('║'));
    console.log(t.border('║ ') + t.key('Updates:   ') + t.val(account.updateCount.toString().padEnd(46)) + t.border('║'));
    console.log(t.border('╚════════════════════════════════════════════════════════════╝\n'));
  }
}

const programCli = new Command();
programCli.name('profile-cli').description('Solana PDA Profile CLI').version('1.0.0');

programCli.command('create')
  .description('Create a profile for a target wallet')
  .argument('<target-wallet>', 'Pubkey of the wallet this profile belongs to')
  .argument('<username>', 'Username (max 32 chars)')
  .argument('<bio>', 'Short bio (max 160 chars)')
  .argument('<avatarUrl>', 'Avatar image URL')
  .action(async (targetWallet, username, bio, avatarUrl) => {
    try {
      const program = await getProgram();
      const ownerPubkey = new PublicKey(targetWallet);
      const t = getTheme(targetWallet);
      
      const [profilePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('profile'), ownerPubkey.toBuffer()],
        program.programId
      );

      console.log(t.val(`Creating profile PDA for ${targetWallet}...`));
      
      const tx = await program.methods.createProfile(username, bio, avatarUrl)
        .accounts({
          profile: profilePda,
          owner: ownerPubkey,
          authority: program.provider.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log(t.success(`\n✔ Success! Profile created.`));
      console.log(t.val(`Tx: https://explorer.solana.com/tx/${tx}?cluster=devnet\n`));
      
    } catch (err: any) {
      console.error(chalk.red('Error creating profile:'), err.message || err);
    }
  });

programCli.command('show')
  .description('Display a wallet\'s profile')
  .argument('<target-wallet>', 'Pubkey of the wallet to lookup')
  .action(async (targetWallet) => {
    try {
      const program = await getProgram();
      const ownerPubkey = new PublicKey(targetWallet);
      const t = getTheme(targetWallet);
      
      const [profilePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('profile'), ownerPubkey.toBuffer()],
        program.programId
      );

      const account = await program.account.profile.fetch(profilePda);
      const isMatrix = targetWallet === '5aZsYAo8iTr4L8tLYrCoQ6tokLeXWrfqfaDvBk6p3QWw';
      printProfileCard(account, profilePda, targetWallet, t, isMatrix);
      
    } catch (err: any) {
      if (err.message.includes('Account does not exist')) {
        console.error(chalk.red(`No profile found for wallet ${targetWallet}`));
      } else {
        console.error(chalk.red('Error reading profile:'), err.message || err);
      }
    }
  });

programCli.command('update')
  .description('Update a profile bio')
  .argument('<target-wallet>', 'Pubkey of the wallet')
  .argument('<new-bio>', 'New bio string')
  .action(async (targetWallet, newBio) => {
    try {
      const program = await getProgram();
      const ownerPubkey = new PublicKey(targetWallet);
      const t = getTheme(targetWallet);
      
      const [profilePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('profile'), ownerPubkey.toBuffer()],
        program.programId
      );

      console.log(t.val(`Updating profile PDA for ${targetWallet}...`));
      
      const tx = await program.methods.updateProfile(null, newBio, null)
        .accounts({
          profile: profilePda,
          authority: program.provider.publicKey,
        })
        .rpc();

      console.log(t.success(`\n✔ Success! Profile updated.`));
      console.log(t.val(`Tx: https://explorer.solana.com/tx/${tx}?cluster=devnet\n`));
      
    } catch (err: any) {
      console.error(chalk.red('Error updating profile:'), err.message || err);
    }
  });

programCli.parse();
