import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, getAllMods, addMod, removeMod } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const adminWallet = request.headers.get('x-admin-wallet');
    
    if (!adminWallet || !isAdmin(adminWallet)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const mods = await getAllMods();
    
    return NextResponse.json({
      success: true,
      mods
    });
  } catch (error) {
    console.error('Get mods error:', error);
    return NextResponse.json(
      { error: 'Failed to get mods' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminWallet = request.headers.get('x-admin-wallet');
    
    if (!adminWallet || !isAdmin(adminWallet)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, walletAddress } = body;

    if (!action || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: action, walletAddress' },
        { status: 400 }
      );
    }

    if (action === 'add') {
      try {
        const mod = await addMod(walletAddress, adminWallet);
        return NextResponse.json({
          success: true,
          mod
        });
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Failed to add mod' },
          { status: 400 }
        );
      }
    } else if (action === 'remove') {
      try {
        const removed = await removeMod(walletAddress);
        if (removed) {
          return NextResponse.json({
            success: true,
            message: 'Mod removed successfully'
          });
        } else {
          return NextResponse.json(
            { error: 'Mod not found' },
            { status: 404 }
          );
        }
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Failed to remove mod' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be "add" or "remove"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Mod management error:', error);
    return NextResponse.json(
      { error: 'Failed to manage mod' },
      { status: 500 }
    );
  }
}

