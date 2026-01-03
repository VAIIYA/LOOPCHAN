import { Mod } from './models';
import mongoose from 'mongoose';

// Admin wallet address
export const ADMIN_WALLET = '2Z9eW3nwa2GZUM1JzXdfBK1MN57RPA2PrhuTREEZ31VY';

// Treasury wallet for receiving payments
export const TREASURY_WALLET = '2sRhKuPffCwT2uuGVu3DXDsLFmjv78uKkEMd9UYrF5jv';

// Posting fee in USDC
export const POSTING_FEE = 0.01;

// Connect to MongoDB
async function connectDB() {
  if (mongoose.connections[0].readyState) {
    return;
  }
  
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined');
  }
  
  await mongoose.connect(process.env.MONGODB_URI);
}

/**
 * Check if a wallet is an admin
 */
export function isAdmin(walletAddress: string): boolean {
  return walletAddress === ADMIN_WALLET;
}

/**
 * Check if a wallet is a mod
 */
export async function isMod(walletAddress: string): Promise<boolean> {
  if (isAdmin(walletAddress)) {
    return true; // Admins are also mods
  }
  
  try {
    await connectDB();
    const mod = await Mod.findOne({ walletAddress }).lean();
    return !!mod;
  } catch (error) {
    console.error('Error checking if wallet is mod:', error);
    return false;
  }
}

/**
 * Check if a wallet is exempt from fees (admin or mod)
 */
export async function isExemptFromFees(walletAddress: string): Promise<boolean> {
  return isAdmin(walletAddress) || await isMod(walletAddress);
}

/**
 * Get all mods
 */
export async function getAllMods() {
  await connectDB();
  return await Mod.find({}).sort({ addedAt: -1 }).lean();
}

/**
 * Add a mod
 */
export async function addMod(walletAddress: string, addedBy: string) {
  await connectDB();
  
  // Check if already exists
  const existing = await Mod.findOne({ walletAddress });
  if (existing) {
    throw new Error('Wallet is already a mod');
  }
  
  const mod = new Mod({
    walletAddress,
    addedBy,
  });
  
  await mod.save();
  return mod;
}

/**
 * Remove a mod
 */
export async function removeMod(walletAddress: string) {
  await connectDB();
  
  // Don't allow removing the admin
  if (isAdmin(walletAddress)) {
    throw new Error('Cannot remove admin');
  }
  
  const result = await Mod.deleteOne({ walletAddress });
  return result.deletedCount > 0;
}

