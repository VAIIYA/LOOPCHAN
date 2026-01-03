import { NextRequest, NextResponse } from 'next/server';
import { getAllThreads, createThread, ThreadData } from '@/lib/memoryStorage';
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
    console.log('POST /api/threads called');
    const body = await request.json();
    const { title, content, image, video, authorWallet } = body;
    
    console.log('Request body:', { title, hasContent: !!content, hasImage: !!image, hasVideo: !!video, authorWallet });

    // Validate required fields
    if (!title || !authorWallet) {
      return NextResponse.json(
        { error: 'Title and wallet connection are required' },
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

    // Load existing threads index
    let threadsIndex = null;
    try {
      threadsIndex = await getAllThreads();
    } catch (error) {
      console.error('Failed to load threads index from Lighthouse:', error);
    }
    
    if (!threadsIndex) {
      console.error('CRITICAL: Failed to load threads index after retries');
      return NextResponse.json(
        { success: false, error: 'Failed to load existing threads data' },
        { status: 500 }
      );
    }
    
    console.log(`Loaded ${threadsIndex.threads.length} existing threads`);
    
    // Check if we're at capacity (will handle cleanup automatically)
    if (threadsIndex.threads.length >= 100) {
      console.log(`Threads at capacity (${threadsIndex.threads.length} threads), will clean up old threads`);
    }

    // Create new thread
    const threadId = `thread_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Generate unique slug for the thread
    const slug = generateUniqueSlug(threadsIndex.threads, title);
    console.log(`Generated slug for thread "${title}": ${slug}`);
    console.log(`Slug details: length=${slug.length}, type=${typeof slug}, value="${slug}"`);
    
    // Create thread data structure
    const newThreadData: ThreadData = {
      id: threadId,
      slug,
      title,
      op: {
        content: content || undefined,
        image: image || undefined,
        video: video || undefined,
        authorWallet,
        timestamp: new Date()
      },
      replyCount: 0,
      imageCount: image ? 1 : 0,
      videoCount: video ? 1 : 0,
      createdAt: new Date(),
      lastActivity: new Date(),
      authorWallet
    };

    // Create the thread using the new folder-based storage
    console.log(`Creating new thread with folder-based storage`);
    console.log(`New thread will be added to TOP of board (pushes all other threads down)`);
    try {
      await createThread(newThreadData);
      console.log(`Thread created successfully with slug "${newThreadData.slug}" (ID: ${newThreadData.id})`);
      console.log(`Thread is now at position 0 (top of board)`);
    } catch (createError) {
      console.error(`CRITICAL: Failed to create thread:`, createError);
      return NextResponse.json(
        { success: false, error: 'Failed to create thread' },
        { status: 500 }
      );
    }

    // Revalidate the homepage to ensure fresh data
    revalidatePath('/');

    console.log('Thread created successfully:', threadId);
    console.log('New thread details:', {
      id: newThreadData.id,
      title: newThreadData.title,
      slug: newThreadData.slug,
      hasContent: !!newThreadData.op.content,
      hasImage: !!newThreadData.op.image,
      hasVideo: !!newThreadData.op.video
    });

    return NextResponse.json({
      success: true,
      thread: {
        id: newThreadData.id,
        slug: newThreadData.slug,
        title: newThreadData.title,
        op: newThreadData.op,
        replyCount: newThreadData.replyCount,
        imageCount: newThreadData.imageCount,
        videoCount: newThreadData.videoCount,
        createdAt: newThreadData.createdAt,
        lastActivity: newThreadData.lastActivity,
        authorWallet: newThreadData.authorWallet
      }
    });

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

    // Load threads index from Lighthouse Storage
    let threadsIndex = null;
    try {
      threadsIndex = await getAllThreads();
    } catch (error) {
      console.error('Thread list API: Failed to load threads index from Lighthouse:', error);
      // IMPORTANT: Don't fall back to empty data - this causes data loss
      // Return a proper error response instead
      return NextResponse.json(
        { error: 'Failed to load threads data from storage' },
        { status: 500 }
      );
    }
    
    console.log(`Thread list API: Loaded ${threadsIndex?.threads?.length || 0} threads from Lighthouse Storage`);
    console.log(`Thread list API: Thread IDs in storage:`, threadsIndex?.threads?.map((t: any) => t.id) || []);
    console.log(`Thread list API: Storage timestamp:`, threadsIndex?.lastUpdated);
    console.log(`Thread list API: Data structure check:`, {
      hasData: !!threadsIndex,
      hasThreads: !!threadsIndex?.threads,
      threadCount: threadsIndex?.threads?.length || 0,
      lastUpdated: threadsIndex?.lastUpdated
    });
    
    if (!threadsIndex || !threadsIndex.threads) {
      console.log('No threads data found after retries');
      return NextResponse.json(
        { error: 'No threads found' },
        { status: 404 }
      );
    }

    // If looking for a specific thread by slug, return just that thread
    if (slug) {
      const thread = threadsIndex.threads.find((t: any) => t.slug === slug);
      if (!thread) {
        console.log(`Thread with slug "${slug}" not found. Available slugs:`, 
          threadsIndex.threads.map((t: any) => t.slug || 'no-slug'));
        return NextResponse.json(
          { error: 'Thread not found' },
          { status: 404 }
        );
      }
      
      console.log(`Found thread by slug: ${thread.title} (${thread.id})`);
      return NextResponse.json({
        threads: [thread],
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