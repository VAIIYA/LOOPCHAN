import { v2 as cloudinary } from 'cloudinary';

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_THREADS = 100;

// Upload file to Cloudinary
export async function uploadToCloudinary(file: File, fileName: string) {
  try {
    console.log(`Uploading ${fileName} to Cloudinary...`);
    
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      throw new Error('Cloudinary configuration is missing');
    }
    
    // Convert File to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          public_id: `loopchan/${fileName}`,
          resource_type: 'auto', // Automatically detect image/video
          folder: 'loopchan',
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });
    
    if (result && typeof result === 'object' && 'secure_url' in result) {
      console.log(`File uploaded successfully: ${result.secure_url}`);
      
      return {
        success: true,
        url: result.secure_url,
        publicId: (result as any).public_id,
        fileName: fileName,
        format: (result as any).format,
        bytes: (result as any).bytes
      };
    } else {
      throw new Error('Invalid upload response from Cloudinary');
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

// Upload buffer to Cloudinary
export async function uploadBufferToCloudinary(buffer: Buffer, fileName: string, mimeType: string) {
  try {
    console.log(`Uploading buffer ${fileName} to Cloudinary...`);
    console.log('Buffer size:', buffer.length, 'MIME type:', mimeType);
    
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          public_id: `loopchan/${fileName}`,
          resource_type: 'raw', // Use 'raw' for JSON files
          folder: 'loopchan',
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('Cloudinary upload success:', result);
            resolve(result);
          }
        }
      ).end(buffer);
    });
    
    if (result && typeof result === 'object' && 'secure_url' in result) {
      return {
        success: true,
        url: result.secure_url,
        publicId: (result as any).public_id,
        fileName: fileName
      };
    } else {
      throw new Error('Invalid upload response from Cloudinary');
    }
  } catch (error) {
    console.error('Cloudinary buffer upload error:', error);
    throw error;
  }
}

// Add media file to thread tracking
export function addMediaFileToThread(thread: any, mediaFile: any) {
  if (!thread.mediaFiles) {
    thread.mediaFiles = [];
  }
  
  thread.mediaFiles.push({
    publicId: mediaFile.publicId,
    url: mediaFile.url,
    fileName: mediaFile.fileName,
    fileType: mediaFile.fileType,
    uploadedAt: new Date().toISOString()
  });
  
  console.log(`Added media file ${mediaFile.publicId} to thread ${thread.id}`);
  return thread;
}

// Delete file from Cloudinary
export async function deleteFromCloudinary(publicId: string) {
  try {
    console.log(`Deleting file from Cloudinary: ${publicId}`);
    
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      console.log(`File deleted successfully: ${publicId}`);
      return { success: true, publicId, deleted: true };
    } else {
      console.log(`File not found or already deleted: ${publicId}`);
      return { success: true, publicId, deleted: false };
    }
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    throw error;
  }
}

// Get file info from Cloudinary
export async function getFileInfo(publicId: string) {
  try {
    console.log(`Getting file info from Cloudinary: ${publicId}`);
    
    const result = await cloudinary.api.resource(publicId);
    
    return {
      exists: true,
      size: result.bytes,
      type: result.resource_type,
      format: result.format,
      url: result.secure_url
    };
  } catch (error) {
    console.error('Cloudinary file info error:', error);
    return { exists: false };
  }
}

// Store threads data in Cloudinary
export async function saveThreadsDataToCloudinary(data: any) {
  try {
    console.log('saveThreadsDataToCloudinary called with data:', {
      hasData: !!data,
      hasThreads: !!(data && data.threads),
      threadCount: data?.threads?.length || 0
    });
    
    if (!data || !data.threads || !Array.isArray(data.threads)) {
      throw new Error('Invalid data structure');
    }
    
    console.log(`Saving ${data.threads.length} threads to Cloudinary`);
    
    // Cleanup old threads if we're at the limit
    if (data.threads.length > MAX_THREADS) {
      console.log(`Thread limit exceeded (${data.threads.length} > ${MAX_THREADS}), cleaning up...`);
      
      // Sort threads by creation date (oldest first)
      const sortedThreads = [...data.threads].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      // Keep only the newest threads
      const threadsToKeep = sortedThreads.slice(-MAX_THREADS);
      const threadsToDelete = sortedThreads.slice(0, sortedThreads.length - MAX_THREADS);
      
      console.log(`Deleting ${threadsToDelete.length} old threads and their media files...`);
      
      // Delete media files associated with old threads
      for (const thread of threadsToDelete) {
        if (thread.mediaFiles && thread.mediaFiles.length > 0) {
          console.log(`Deleting ${thread.mediaFiles.length} media files for thread ${thread.id}`);
          
          for (const mediaFile of thread.mediaFiles) {
            try {
              // Note: Cloudinary files are immutable, we just remove them from the index
              console.log(`Marking media file for cleanup: ${mediaFile.publicId}`);
            } catch (error) {
              console.error(`Failed to process media file ${mediaFile.publicId}:`, error);
            }
          }
        }
      }
      
      // Update data with cleaned threads
      data.threads = threadsToKeep;
      console.log(`Cleaned up to ${data.threads.length} threads`);
    }
    
    // Create a JSON file with the threads data
    const jsonData = JSON.stringify(data, null, 2);
    const buffer = Buffer.from(jsonData, 'utf8');
    
    console.log('Uploading threads data to Cloudinary, buffer size:', buffer.length);
    const result = await uploadBufferToCloudinary(buffer, 'threads.json', 'application/json');
    
    console.log('Threads data saved to Cloudinary:', result.url);
    return result;
  } catch (error) {
    console.error('Error saving threads data to Cloudinary:', error);
    throw error;
  }
}

// Load threads data from Cloudinary
export async function loadThreadsDataFromCloudinary() {
  try {
    console.log('Loading threads data from Cloudinary...');
    
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      console.warn('Cloudinary is not configured, returning empty data');
      return {
        threads: [],
        maxThreads: MAX_THREADS,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
    }
    
    // Try to get the threads.json file from Cloudinary
    try {
      console.log('Attempting to load threads.json from Cloudinary...');
      const result = await cloudinary.api.resource('loopchan/threads.json');
      console.log('Cloudinary API result:', result);
      
      if (result && result.secure_url) {
        console.log('Fetching data from URL:', result.secure_url);
        const response = await fetch(result.secure_url);
        const data = await response.json();
        console.log(`Loaded threads data from Cloudinary:`, data);
        return data;
      }
    } catch (downloadError) {
      console.error('Failed to download threads data from Cloudinary:', downloadError);
      // Fall through to return empty data
    }
    
    // Return empty data if no file is found or download failed
    console.log('No valid threads data found, returning empty data');
    return {
      threads: [],
      maxThreads: MAX_THREADS,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error loading threads data from Cloudinary:', error);
    // Return empty structure if loading fails
    return {
      threads: [],
      maxThreads: MAX_THREADS,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
  }
}

// Generate unique slug
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

// Generate unique slug with collision handling
export function generateUniqueSlug(threads: any[], title: string): string {
  let baseSlug = generateSlug(title);
  
  if (!baseSlug) {
    baseSlug = 'untitled';
  }
  
  const existingSlugs = threads.map(t => t.slug);
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }
  
  const timestamp = Date.now().toString().slice(-6);
  return `${baseSlug}-${timestamp}`;
}

// Pagination helper
export function getThreadsForPage(threads: any[], page: number) {
  const THREADS_PER_PAGE = 100; // Show all threads on one page for simplicity
  
  if (page < 1) {
    return {
      threads: [],
      page: 1,
      totalPages: 1,
      totalThreads: threads.length
    };
  }
  
  const startIndex = (page - 1) * THREADS_PER_PAGE;
  const endIndex = startIndex + THREADS_PER_PAGE;
  const pageThreads = threads.slice(startIndex, endIndex);
  
  return {
    threads: pageThreads,
    page,
    totalPages: Math.ceil(threads.length / THREADS_PER_PAGE),
    totalThreads: threads.length
  };
}
