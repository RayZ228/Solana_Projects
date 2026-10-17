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

// Matrix Theme
const t = {
    title: chalk.bold.green,
    key: chalk.green,
    val: chalk.greenBright,
    success: chalk.bgGreen.black,
    border: chalk.green.dim,
};

const cli = new Command();
cli.name('matrix-asset-cli').description('Matrix Interface for SPL Token2022').version('1.0.0');

cli.command('forge-asset')
    .description('Forge a new Token2022 Asset with Metadata')
    .argument('<name>', 'Asset Name')
    .argument('<symbol>', 'Asset Symbol')
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

            console.log(t.val('>> SYSTEM.FORGE_ASSET() INITIATED...'));

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
            console.log(t.success(' [OK] ASSET FORGED '));
            console.log(t.key(' ASSET_ID: ') + t.val(mint.toBase58()));
            console.log(t.key(' TX_HASH:  ') + t.val(`https://explorer.solana.com/tx/${sig}?cluster=devnet`));
            
            fs.writeFileSync('matrix-asset.txt', mint.toBase58());
        } catch (e: any) {
            console.error(chalk.red('[ERROR]'), e.message);
        }
    });

cli.command('generate-supply')
    .description('Generate supply for the asset into your wallet')
    .argument('[amount]', 'Amount to generate', '1000')
    .action(async (amountStr) => {
        try {
            const payer = getWallet();
            const mintStr = fs.readFileSync('matrix-asset.txt', 'utf8');
            const mint = new PublicKey(mintStr);
            const amount = BigInt(amountStr) * BigInt(10 ** 9);

            const ata = getAssociatedTokenAddressSync(mint, payer.publicKey, false, TOKEN_2022_PROGRAM_ID);
            const tx = new Transaction();

            const ataInfo = await connection.getAccountInfo(ata);
            if (!ataInfo) {
                tx.add(createAssociatedTokenAccountInstruction(payer.publicKey, ata, payer.publicKey, mint, TOKEN_2022_PROGRAM_ID));
            }

            tx.add(createMintToInstruction(mint, ata, payer.publicKey, amount, [], TOKEN_2022_PROGRAM_ID));

            console.log(t.val(`>> SYSTEM.GENERATE_SUPPLY( ${amountStr} )...`));
            const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
            console.log(t.success(' [OK] SUPPLY GENERATED '));
            console.log(t.key(' TX_HASH: ') + t.val(`https://explorer.solana.com/tx/${sig}?cluster=devnet`));
        } catch (e: any) {
            console.error(chalk.red('[ERROR]'), e.message);
        }
    });

cli.command('transmit-asset')
    .description('Transmit assets to another node')
    .argument('<target>', 'Target Node Pubkey')
    .argument('<amount>', 'Amount to transmit')
    .action(async (recipientStr, amountStr) => {
        try {
            const payer = getWallet();
            const recipient = new PublicKey(recipientStr);
            const mintStr = fs.readFileSync('matrix-asset.txt', 'utf8');
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

            console.log(t.val(`>> SYSTEM.TRANSMIT( TO: ${recipientStr}, VOL: ${amountStr} )...`));
            const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
            console.log(t.success(' [OK] TRANSMISSION COMPLETE '));
            console.log(t.key(' TX_HASH: ') + t.val(`https://explorer.solana.com/tx/${sig}?cluster=devnet`));
        } catch (e: any) {
            console.error(chalk.red('[ERROR]'), e.message);
        }
    });

cli.command('scan-asset')
    .description('Scan asset metadata and supply level')
    .action(async () => {
        try {
            const mintStr = fs.readFileSync('matrix-asset.txt', 'utf8');
            const mint = new PublicKey(mintStr);

            const metadata = await getTokenMetadata(connection, mint, 'confirmed', TOKEN_2022_PROGRAM_ID);
            const mintInfo = await getMint(connection, mint, 'confirmed', TOKEN_2022_PROGRAM_ID);

            console.log(t.border('──────────────────────────────────────────────────────'));
            console.log(t.title(' >> SYSTEM.ASSET.SCAN()'));
            console.log(t.border('──────────────────────────────────────────────────────'));
            console.log(t.key(' ASSET_ID:   ') + t.val(mint.toBase58()));
            console.log(t.key(' IDENTIFIER: ') + t.val(metadata?.name || 'UNKNOWN'));
            console.log(t.key(' TICKER:     ') + t.val(metadata?.symbol || 'UNKNOWN'));
            console.log(t.key(' CIRC_SUPPLY:') + t.val((Number(mintInfo.supply) / 10**9).toString()));
            console.log(t.border('──────────────────────────────────────────────────────\n'));
        } catch (e: any) {
            console.error(chalk.red('[ERROR]'), e.message);
        }
    });

cli.parse();
