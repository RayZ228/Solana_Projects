import {
    Connection, Keypair, PublicKey, clusterApiUrl, Transaction, sendAndConfirmTransaction, SystemProgram
} from '@solana/web3.js';
import {
    ExtensionType, TOKEN_2022_PROGRAM_ID, createInitializeMintInstruction, getMintLen,
    createInitializeMetadataPointerInstruction, getMint, getTokenMetadata, TYPE_SIZE, LENGTH_SIZE,
    createMintToInstruction, createAssociatedTokenAccountInstruction, getAssociatedTokenAddressSync,
    createTransferInstruction, getAccount
} from '@solana/spl-token';
import { createInitializeInstruction, pack } from '@solana/spl-token-metadata';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

function getWallet(): Keypair {
    const walletPath = path.join(require('os').homedir(), '.config', 'solana', 'id.json');
    const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, 'utf8')));
    return Keypair.fromSecretKey(secretKey);
}

// Neon Theme
const t = {
    title: chalk.bold.cyanBright,
    key: chalk.magenta,
    val: chalk.yellowBright,
    success: chalk.bold.greenBright,
    border: chalk.cyan,
};

const cli = new Command();
cli.name('neon-coin-cli').description('Neon Interface for SPL Token2022').version('1.0.0');

cli.command('init-coin')
    .description('Create a new Token2022 Mint with Metadata')
    .argument('<name>', 'Token Name')
    .argument('<symbol>', 'Token Symbol')
    .argument('<uri>', 'Metadata URI')
    .action(async (name, symbol, uri) => {
        try {
            const payer = getWallet();
            const mintKeypair = Keypair.generate();
            const mint = mintKeypair.publicKey;
            const decimals = 9;

            const metadata = {
                mint: mint,
                name: name,
                symbol: symbol,
                uri: uri,
                additionalMetadata: []
            };

            const mintLen = getMintLen([ExtensionType.MetadataPointer]);
            const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;
            const lamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);

            console.log(t.val('Initializing Neon Coin Mint...'));

            const transaction = new Transaction().add(
                SystemProgram.createAccount({
                    fromPubkey: payer.publicKey,
                    newAccountPubkey: mint,
                    space: mintLen,
                    lamports,
                    programId: TOKEN_2022_PROGRAM_ID,
                }),
                createInitializeMetadataPointerInstruction(
                    mint, payer.publicKey, mint, TOKEN_2022_PROGRAM_ID
                ),
                createInitializeMintInstruction(
                    mint, decimals, payer.publicKey, payer.publicKey, TOKEN_2022_PROGRAM_ID
                ),
                createInitializeInstruction({
                    programId: TOKEN_2022_PROGRAM_ID,
                    mint: mint,
                    metadata: mint,
                    name: metadata.name,
                    symbol: metadata.symbol,
                    uri: metadata.uri,
                    mintAuthority: payer.publicKey,
                    updateAuthority: payer.publicKey,
                })
            );

            const sig = await sendAndConfirmTransaction(connection, transaction, [payer, mintKeypair]);
            console.log(t.success('✔ Coin Created!'));
            console.log(t.key('Mint Address: ') + t.val(mint.toBase58()));
            console.log(t.key('Tx: ') + t.val(`https://explorer.solana.com/tx/${sig}?cluster=devnet`));
            
            // Save mint for easy access
            fs.writeFileSync('neon-mint.txt', mint.toBase58());
        } catch (e: any) {
            console.error(chalk.red('Error:'), e.message);
        }
    });

cli.command('mint-supply')
    .description('Mint tokens to your associated token account')
    .argument('[amount]', 'Amount to mint', '1000')
    .action(async (amountStr) => {
        try {
            const payer = getWallet();
            const mintStr = fs.readFileSync('neon-mint.txt', 'utf8');
            const mint = new PublicKey(mintStr);
            const amount = BigInt(amountStr) * BigInt(10 ** 9);

            const ata = getAssociatedTokenAddressSync(mint, payer.publicKey, false, TOKEN_2022_PROGRAM_ID);
            const tx = new Transaction();

            // Check if ATA exists
            const ataInfo = await connection.getAccountInfo(ata);
            if (!ataInfo) {
                tx.add(createAssociatedTokenAccountInstruction(payer.publicKey, ata, payer.publicKey, mint, TOKEN_2022_PROGRAM_ID));
            }

            tx.add(createMintToInstruction(mint, ata, payer.publicKey, amount, [], TOKEN_2022_PROGRAM_ID));

            console.log(t.val(`Minting ${amountStr} coins to your wallet...`));
            const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
            console.log(t.success('✔ Minting Successful!'));
            console.log(t.key('Tx: ') + t.val(`https://explorer.solana.com/tx/${sig}?cluster=devnet`));
        } catch (e: any) {
            console.error(chalk.red('Error:'), e.message);
        }
    });

cli.command('send-coin')
    .description('Transfer tokens to another wallet')
    .argument('<recipient>', 'Recipient Pubkey')
    .argument('<amount>', 'Amount to send')
    .action(async (recipientStr, amountStr) => {
        try {
            const payer = getWallet();
            const recipient = new PublicKey(recipientStr);
            const mintStr = fs.readFileSync('neon-mint.txt', 'utf8');
            const mint = new PublicKey(mintStr);
            const amount = BigInt(amountStr) * BigInt(10 ** 9);

            const sourceAta = getAssociatedTokenAddressSync(mint, payer.publicKey, false, TOKEN_2022_PROGRAM_ID);
            const destAta = getAssociatedTokenAddressSync(mint, recipient, false, TOKEN_2022_PROGRAM_ID);

            const tx = new Transaction();
            const destAtaInfo = await connection.getAccountInfo(destAta);
            if (!destAtaInfo) {
                tx.add(createAssociatedTokenAccountInstruction(payer.publicKey, destAta, recipient, mint, TOKEN_2022_PROGRAM_ID));
            }

            tx.add(createTransferInstruction(sourceAta, destAta, payer.publicKey, amount, [], TOKEN_2022_PROGRAM_ID));

            console.log(t.val(`Sending ${amountStr} coins to ${recipientStr}...`));
            const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
            console.log(t.success('✔ Transfer Successful!'));
            console.log(t.key('Tx: ') + t.val(`https://explorer.solana.com/tx/${sig}?cluster=devnet`));
        } catch (e: any) {
            console.error(chalk.red('Error:'), e.message);
        }
    });

cli.command('inspect-coin')
    .description('Show metadata and supply of the coin')
    .action(async () => {
        try {
            const mintStr = fs.readFileSync('neon-mint.txt', 'utf8');
            const mint = new PublicKey(mintStr);

            const metadata = await getTokenMetadata(connection, mint, 'confirmed', TOKEN_2022_PROGRAM_ID);
            const mintInfo = await getMint(connection, mint, 'confirmed', TOKEN_2022_PROGRAM_ID);

            console.log(t.border('╔════════════════════════════════════════════════════════════╗'));
            console.log(t.border('║ ') + t.title(' NEON COIN SCANNER '.padEnd(58)) + t.border(' ║'));
            console.log(t.border('╠════════════════════════════════════════════════════════════╣'));
            console.log(t.border('║ ') + t.key('Address:   ') + t.val(mint.toBase58().padEnd(46)) + t.border('║'));
            console.log(t.border('║ ') + t.key('Name:      ') + t.val((metadata?.name || 'Unknown').padEnd(46)) + t.border('║'));
            console.log(t.border('║ ') + t.key('Symbol:    ') + t.val((metadata?.symbol || 'Unknown').padEnd(46)) + t.border('║'));
            console.log(t.border('║ ') + t.key('Supply:    ') + t.val((Number(mintInfo.supply) / 10**9).toString().padEnd(46)) + t.border('║'));
            console.log(t.border('╚════════════════════════════════════════════════════════════╝\n'));
        } catch (e: any) {
            console.error(chalk.red('Error:'), e.message);
        }
    });

cli.parse();
