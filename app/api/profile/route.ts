import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile, updateUserProfile } from '@/lib/profiles';

export const dynamic = 'force-dynamic';

/**
 * GET - Get user profile
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const profile = await getUserProfile(walletAddress);

    return NextResponse.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Failed to get profile' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update user profile
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, username, location, socialLinks, bio } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Update profile
    const profile = await updateUserProfile(walletAddress, {
      walletAddress,
      username,
      location,
      socialLinks,
      bio,
    });

    return NextResponse.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
    
    // Check for specific validation errors
    if (errorMessage.includes('already taken') || 
        errorMessage.includes('must be') || 
        errorMessage.includes('Invalid')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

