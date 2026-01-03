import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, getAccount } from '@solana/spl-token';
import { TREASURY_WALLET, POSTING_FEE } from '@/lib/admin';

// USDC mint address on Solana mainnet
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

// RPC endpoint
const RPC_ENDPOINT = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

/**
 * Create a USDC transfer transaction for posting fees
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromWallet } = body;

    if (!fromWallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const connection = new Connection(RPC_ENDPOINT, 'confirmed');
    const fromPublicKey = new PublicKey(fromWallet);
    const treasuryPublicKey = new PublicKey(TREASURY_WALLET);

    // Get the associated token accounts
    const fromTokenAccount = await getAssociatedTokenAddress(
      USDC_MINT,
      fromPublicKey
    );

    const treasuryTokenAccount = await getAssociatedTokenAddress(
      USDC_MINT,
      treasuryPublicKey
    );

    // Check if the user has a USDC token account
    try {
      await getAccount(connection, fromTokenAccount);
    } catch (error) {
      return NextResponse.json(
        {
          error: 'USDC token account not found. Please ensure you have USDC in your wallet.',
          code: 'NO_TOKEN_ACCOUNT'
        },
        { status: 400 }
      );
    }

    // Check if treasury has a USDC token account
    try {
      await getAccount(connection, treasuryTokenAccount);
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Treasury USDC account not configured. Please contact support.',
          code: 'TREASURY_NOT_CONFIGURED'
        },
        { status: 500 }
      );
    }

    // Check balance
    const accountInfo = await getAccount(connection, fromTokenAccount);
    const balance = Number(accountInfo.amount) / 1_000_000; // USDC has 6 decimals
    
    if (balance < POSTING_FEE) {
      return NextResponse.json(
        {
          error: `Insufficient USDC balance. Required: ${POSTING_FEE} USDC, Available: ${balance.toFixed(6)} USDC`,
          code: 'INSUFFICIENT_BALANCE',
          required: POSTING_FEE,
          available: balance
        },
        { status: 400 }
      );
    }

    // Convert USDC amount to smallest unit (USDC has 6 decimals)
    const amountInSmallestUnit = Math.floor(POSTING_FEE * 1_000_000);

    // Create the transfer instruction
    const transferInstruction = createTransferInstruction(
      fromTokenAccount,
      treasuryTokenAccount,
      fromPublicKey,
      amountInSmallestUnit
    );

    // Create transaction
    const transaction = new Transaction().add(transferInstruction);
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash('finalized');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPublicKey;

    // Serialize transaction for client to sign
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    });

    return NextResponse.json({
      success: true,
      transaction: Buffer.from(serializedTransaction).toString('base64'),
      amount: POSTING_FEE,
      treasury: TREASURY_WALLET,
      message: 'Transaction created. Please sign and send it with your wallet.'
    });

  } catch (error) {
    console.error('Posting fee transaction creation error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create transaction',
        code: 'TRANSACTION_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * Verify a posting fee payment
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const signature = searchParams.get('signature');
    const fromWallet = searchParams.get('fromWallet');

    if (!signature || !fromWallet) {
      return NextResponse.json(
        { error: 'Signature and fromWallet are required' },
        { status: 400 }
      );
    }

    const connection = new Connection(RPC_ENDPOINT, 'confirmed');
    
    // Wait a bit for transaction to be confirmed
    await new Promise(resolve => setTimeout(resolve, 2000));

    const transaction = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0
    });

    if (!transaction) {
      return NextResponse.json(
        { verified: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    if (transaction.meta?.err) {
      return NextResponse.json(
        { verified: false, error: 'Transaction failed' },
        { status: 400 }
      );
    }

    // Verify the transaction includes a USDC transfer to our treasury
    const treasuryPublicKey = new PublicKey(TREASURY_WALLET);
    const treasuryTokenAccount = await getAssociatedTokenAddress(
      USDC_MINT,
      treasuryPublicKey
    );

    // Check if the transaction includes a transfer to our treasury
    const postTokenBalances = transaction.meta?.postTokenBalances || [];
    const hasTransferToTreasury = postTokenBalances.some(
      balance => balance.mint === USDC_MINT.toString() && 
                 balance.owner === treasuryTokenAccount.toString() &&
                 (Number(balance.uiTokenAmount?.uiAmount) || 0) >= POSTING_FEE
    );

    if (hasTransferToTreasury) {
      return NextResponse.json({
        verified: true,
        signature,
        amount: POSTING_FEE
      });
    } else {
      return NextResponse.json(
        { verified: false, error: 'Transaction does not include required payment' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { verified: false, error: error instanceof Error ? error.message : 'Verification failed' },
      { status: 500 }
    );
  }
}

