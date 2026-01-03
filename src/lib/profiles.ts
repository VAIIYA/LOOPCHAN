import { UserProfile } from './models';
import mongoose from 'mongoose';

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

export interface ProfileData {
  walletAddress: string;
  username?: string | null;
  location?: string | null;
  socialLinks?: {
    x?: string | null;
    youtube?: string | null;
  };
  bio?: string | null;
}

/**
 * Get user profile by wallet address
 */
export async function getUserProfile(walletAddress: string): Promise<ProfileData> {
  await connectDB();
  
  const profile: any = await UserProfile.findOne({ walletAddress }).lean();
  
  if (!profile) {
    // Return default profile
    return {
      walletAddress,
      username: null,
      location: null,
      socialLinks: {
        x: null,
        youtube: null,
      },
      bio: null,
    };
  }
  
  return {
    walletAddress: profile.walletAddress,
    username: profile.username || null,
    location: profile.location || null,
    socialLinks: {
      x: profile.socialLinks?.x || null,
      youtube: profile.socialLinks?.youtube || null,
    },
    bio: profile.bio || null,
  };
}

/**
 * Get multiple user profiles by wallet addresses
 */
export async function getUserProfiles(walletAddresses: string[]): Promise<ProfileData[]> {
  await connectDB();
  
  const profiles: any[] = await UserProfile.find({ 
    walletAddress: { $in: walletAddresses } 
  }).lean();
  
  // Create a map for quick lookup
  const profileMap = new Map<string, ProfileData>();
  profiles.forEach((profile: any) => {
    profileMap.set(profile.walletAddress, {
      walletAddress: profile.walletAddress,
      username: profile.username || null,
      location: profile.location || null,
      socialLinks: {
        x: profile.socialLinks?.x || null,
        youtube: profile.socialLinks?.youtube || null,
      },
      bio: profile.bio || null,
    });
  });
  
  // Return profiles for all requested addresses (with defaults for missing ones)
  return walletAddresses.map(address => {
    const profile = profileMap.get(address);
    return profile || {
      walletAddress: address,
      username: null,
      location: null,
      socialLinks: {
        x: null,
        youtube: null,
      },
      bio: null,
    };
  });
}

/**
 * Update or create user profile
 */
export async function updateUserProfile(walletAddress: string, profileData: Partial<ProfileData>) {
  await connectDB();
  
  // Validate username if provided
  if (profileData.username !== undefined) {
    if (profileData.username && profileData.username.length > 50) {
      throw new Error('Username must be 50 characters or less');
    }
    
    // Check if username is already taken by another wallet
    if (profileData.username) {
      const existing = await UserProfile.findOne({ 
        username: profileData.username,
        walletAddress: { $ne: walletAddress }
      });
      
      if (existing) {
        throw new Error('Username is already taken');
      }
    }
  }
  
  // Validate location if provided
  if (profileData.location !== undefined && profileData.location && profileData.location.length > 100) {
    throw new Error('Location must be 100 characters or less');
  }
  
  // Validate bio if provided
  if (profileData.bio !== undefined && profileData.bio && profileData.bio.length > 500) {
    throw new Error('Bio must be 500 characters or less');
  }
  
  // Validate social links
  if (profileData.socialLinks) {
    if (profileData.socialLinks.x && !isValidUrl(profileData.socialLinks.x, ['x.com', 'twitter.com'])) {
      throw new Error('Invalid X.com URL');
    }
    if (profileData.socialLinks.youtube && !isValidUrl(profileData.socialLinks.youtube, ['youtube.com', 'youtu.be'])) {
      throw new Error('Invalid YouTube URL');
    }
  }
  
  const profile = await UserProfile.findOneAndUpdate(
    { walletAddress },
    {
      ...profileData,
      walletAddress,
      updatedAt: new Date(),
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );
  
  return profile;
}

/**
 * Get display name for a wallet address (username or "Anonymous")
 */
export async function getDisplayName(walletAddress: string): Promise<string> {
  const profile = await getUserProfile(walletAddress);
  return profile.username || 'Anonymous';
}

/**
 * Get display names for multiple wallet addresses
 */
export async function getDisplayNames(walletAddresses: string[]): Promise<Map<string, string>> {
  const profiles = await getUserProfiles(walletAddresses);
  const displayNames = new Map<string, string>();
  
  profiles.forEach(profile => {
    displayNames.set(profile.walletAddress, profile.username || 'Anonymous');
  });
  
  return displayNames;
}

/**
 * Helper function to validate URLs
 */
function isValidUrl(url: string, allowedDomains: string[]): boolean {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    const hostname = urlObj.hostname.toLowerCase();
    
    return allowedDomains.some(domain => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

