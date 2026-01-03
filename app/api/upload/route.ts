import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadFileToGridFS } from '@/lib/mongodbStorage';

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/webm', 'video/mp4', 'video/quicktime'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

// File size limits (in bytes)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB for images
const MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10MB for videos

export async function POST(request: NextRequest) {
  try {
    // Check if NEXTAUTH_SECRET is configured
    if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === 'production') {
      console.error('NEXTAUTH_SECRET is not configured');
      return NextResponse.json({ 
        error: 'Server configuration error: NEXTAUTH_SECRET is missing' 
      }, { status: 500 });
    }

    // Check authentication
    let session;
    try {
      session = await auth();
    } catch (authError) {
      console.error('Auth error:', authError);
      const errorMessage = authError instanceof Error ? authError.message : 'Unknown auth error';
      console.error('Auth error details:', errorMessage);
      return NextResponse.json({ 
        error: 'Authentication failed',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      }, { status: 401 });
    }
    
    if (!session || !session.user?.id) {
      console.warn('Upload attempted without authentication');
      return NextResponse.json({ 
        error: 'Authentication required. Please sign in with email/password.',
        hint: 'The system now uses email/password authentication instead of wallet connection.'
      }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: `File type not allowed. Allowed types: ${ALLOWED_TYPES.join(', ')}` 
      }, { status: 400 });
    }

    // Validate file size
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return NextResponse.json({ 
        error: `File too large. Maximum size for ${isVideo ? 'videos' : 'images'}: ${maxSizeMB}MB` 
      }, { status: 400 });
    }

    // Generate unique filename with proper extension
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    // Validate extension matches file type
    const expectedExtensions = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg', 
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'video/webm': 'webm',
      'video/mp4': 'mp4',
      'video/quicktime': 'mov'
    };
    
    const expectedExt = expectedExtensions[file.type as keyof typeof expectedExtensions];
    const finalExtension = extension === expectedExt ? extension : expectedExt;
    const filename = `${timestamp}-${randomId}.${finalExtension}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to MongoDB GridFS
    const fileId = await uploadFileToGridFS(
      buffer,
      filename,
      file.type,
      session.user.id
    );

    return NextResponse.json({
      url: `/api/files/${fileId}`,
      blobId: fileId,
      fileId: fileId,
      filename,
      fileType: file.type,
      isVideo,
    });
  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Upload error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { 
        error: 'Failed to upload file',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
