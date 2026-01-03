import { NextRequest, NextResponse } from 'next/server';
import { getAllThreads, createThread } from '@/lib/mongodbStorage';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

// Helper functions
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
    .substring(0, 50); // Limit length
}

function generateUniqueSlug(existingThreads: any[], title: string): string {
  let baseSlug = generateSlug(title);
  let slug = baseSlug;
  let counter = 1;
  
  // Check if slug already exists
  while (existingThreads.some(thread => thread.slug === slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}

export async function POST(request: NextRequest) {
  try {
    // Check wallet authentication
    const body = await request.json();
    const { title, content, image, video, authorWallet } = body;
    
    if (!authorWallet) {
      return NextResponse.json(
        { error: 'Wallet connection required. Please connect your Solana wallet.' },
        { status: 401 }
      );
    }

    console.log('POST /api/threads called');
    
    console.log('Request body:', { title, hasContent: !!content, hasImage: !!image, hasVideo: !!video });

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // At least one of content, image, or video must be provided
    if (!content && !image && !video) {
      return NextResponse.json(
        { error: 'Please provide either a comment, image, or video' },
        { status: 400 }
      );
    }

    // Extract file IDs from URLs if they are URLs
    // URLs come in format: /api/files/{fileId}
    const extractFileId = (urlOrId: string | undefined): string | undefined => {
      if (!urlOrId) return undefined;
      if (urlOrId.startsWith('/api/files/')) {
        return urlOrId.replace('/api/files/', '');
      }
      // If it's already an ID, return as is
      return urlOrId;
    };

    const imageFileId = extractFileId(image);
    const videoFileId = extractFileId(video);

    // Load existing threads to check for slug uniqueness
    let threadsIndex = null;
    try {
      threadsIndex = await getAllThreads();
    } catch (error) {
      console.error('Failed to load threads index:', error);
    }
    
    if (!threadsIndex) {
      threadsIndex = { threads: [], totalThreads: 0, lastUpdated: new Date().toISOString() };
    }
    
    console.log(`Loaded ${threadsIndex.threads.length} existing threads`);

    // Create new thread
    const threadId = `thread_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Generate unique slug for the thread
    const slug = generateUniqueSlug(threadsIndex.threads, title);
    console.log(`Generated slug for thread "${title}": ${slug}`);
    
    // Create thread data structure
    const newThreadData = {
      id: threadId,
      slug,
      title,
      op: {
        content: content || undefined,
        image: imageFileId || undefined,
        video: videoFileId || undefined,
        authorId: authorWallet,
        timestamp: new Date()
      },
      authorId: authorWallet,
    };

    // Create the thread using MongoDB storage
    console.log(`Creating new thread with MongoDB storage`, {
      threadId,
      slug,
      title,
      hasContent: !!content,
      imageFileId,
      videoFileId,
      authorWallet
    });
    try {
      const thread = await createThread(newThreadData);
      console.log(`Thread created successfully with slug "${slug}" (ID: ${threadId})`);
      
      // Revalidate the homepage to ensure fresh data
      revalidatePath('/');

      return NextResponse.json({
        success: true,
        thread: {
          id: thread.id,
          slug: thread.slug,
          title: thread.title,
          replyCount: thread.replyCount || 0,
          imageCount: thread.imageCount || 0,
          videoCount: thread.videoCount || 0,
          createdAt: thread.createdAt,
          lastActivity: thread.lastActivity,
        }
      });
    } catch (createError) {
      console.error(`CRITICAL: Failed to create thread:`, createError);
      const errorMessage = createError instanceof Error ? createError.message : 'Unknown error';
      const errorStack = createError instanceof Error ? createError.stack : undefined;
      console.error('Error details:', { errorMessage, errorStack, newThreadData });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create thread',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Create thread error:', error);
    return NextResponse.json(
      { error: 'Failed to create thread' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const slug = searchParams.get('slug');

    console.log('Fetching threads, page:', page, 'slug:', slug);

    // Load threads from MongoDB
    let threadsIndex = null;
    try {
      threadsIndex = await getAllThreads();
    } catch (error) {
      console.error('Thread list API: Failed to load threads from MongoDB:', error);
      return NextResponse.json(
        { error: 'Failed to load threads data from storage' },
        { status: 500 }
      );
    }
    
    console.log(`Thread list API: Loaded ${threadsIndex?.threads?.length || 0} threads from MongoDB`);
    
    if (!threadsIndex || !threadsIndex.threads) {
      console.log('No threads data found');
      return NextResponse.json(
        { threads: [], page: 1, totalPages: 0, totalThreads: 0 }
      );
    }

    // If looking for a specific thread by slug, return just that thread
    if (slug) {
      const threadData = threadsIndex.threads.find((t: any) => t.slug === slug);
      if (!threadData) {
        console.log(`Thread with slug "${slug}" not found. Available slugs:`, 
          threadsIndex.threads.map((t: any) => t.slug || 'no-slug'));
        return NextResponse.json(
          { error: 'Thread not found' },
          { status: 404 }
        );
      }
      
      console.log(`Found thread by slug: ${(threadData as any).title} (${(threadData as any).id})`);
      return NextResponse.json({
        threads: [threadData],
        page: 1,
        totalPages: 1,
        totalThreads: 1
      });
    }

    // Pagination
    const threadsPerPage = 20;
    const totalThreads = threadsIndex.threads.length;
    const totalPages = Math.ceil(totalThreads / threadsPerPage);
    const startIndex = (page - 1) * threadsPerPage;
    const endIndex = startIndex + threadsPerPage;
    const paginatedThreads = threadsIndex.threads.slice(startIndex, endIndex);

    console.log(`Returning page ${page} of ${totalPages} (${paginatedThreads.length} threads)`);
    console.log(`Thread IDs on this page:`, paginatedThreads.map((t: any) => t.id));

    return NextResponse.json({
      threads: paginatedThreads,
      page,
      totalPages,
      totalThreads
    });

  } catch (error) {
    console.error('Get threads error:', error);
    return NextResponse.json(
      { error: 'Failed to get threads' },
      { status: 500 }
    );
  }
}