import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinaryStorage';

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/webm', 'video/mp4', 'video/quicktime'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

// File size limits (in bytes)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB for images
const MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10MB for videos

export async function POST(request: NextRequest) {
  try {
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

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(file, filename);
    
    if (!uploadResult.success) {
      throw new Error('Failed to upload to Cloudinary');
    }

    return NextResponse.json({
      url: uploadResult.url,
      blobId: uploadResult.publicId, // Use Cloudinary public ID as blobId
      filename,
      fileType: file.type,
      isVideo,
      publicId: uploadResult.publicId
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
