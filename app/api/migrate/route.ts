import { NextRequest, NextResponse } from 'next/server';
import { loadThreadsDataFromCloudinary } from '@/lib/cloudinaryStorage';
import { createThread, addCommentToThread } from '@/lib/mongodbStorage';
import { User } from '@/lib/models';
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

// Migration endpoint to move old data from Cloudinary to MongoDB
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication/authorization check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.MIGRATION_SECRET || 'migration-secret'}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    console.log('Starting migration from Cloudinary to MongoDB...');

    // Try to load old data from Cloudinary
    const oldData = await loadThreadsDataFromCloudinary();
    
    if (!oldData || !oldData.threads || oldData.threads.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No old data found in Cloudinary to migrate',
        migrated: 0
      });
    }

    console.log(`Found ${oldData.threads.length} threads in Cloudinary`);

    // Create a default user for migrated threads (or use existing)
    let defaultUser = await User.findOne({ email: 'migrated@loopchan.vercel.app' });
    if (!defaultUser) {
      const bcrypt = require('bcryptjs');
      defaultUser = new User({
        email: 'migrated@loopchan.vercel.app',
        password: await bcrypt.hash('migrated-' + Date.now(), 10),
        name: 'Migrated User',
      });
      await defaultUser.save();
    }

    const userId = defaultUser._id.toString();
    let migratedCount = 0;
    let errorCount = 0;

    // Migrate each thread
    for (const oldThread of oldData.threads) {
      try {
        // Check if thread already exists in MongoDB
        const { Thread } = require('@/lib/models');
        const existingThread = await Thread.findOne({ id: oldThread.id });
        
        if (existingThread) {
          console.log(`Thread ${oldThread.id} already exists, skipping...`);
          continue;
        }

        // Create thread in MongoDB
        // Note: Images/videos from Cloudinary URLs won't be migrated to GridFS automatically
        // The content will be preserved, but images/videos will be lost (they're in Cloudinary)
        const threadData = {
          id: oldThread.id,
          slug: oldThread.slug || `thread-${oldThread.id}`,
          title: oldThread.title,
          op: {
            content: oldThread.op?.content || null,
            image: null, // Cloudinary URLs can't be used as file IDs
            video: null, // Cloudinary URLs can't be used as file IDs
            authorId: userId,
            timestamp: oldThread.op?.timestamp ? new Date(oldThread.op.timestamp) : (oldThread.createdAt ? new Date(oldThread.createdAt) : new Date()),
          },
          authorId: userId,
        };
        
        // Migrate replies/comments if they exist
        // Note: This assumes old data structure has replies/comments
        // You may need to adjust based on your actual old data structure

        await createThread(threadData);
        migratedCount++;

        console.log(`Migrated thread: ${oldThread.id} - ${oldThread.title}`);
      } catch (error) {
        console.error(`Failed to migrate thread ${oldThread.id}:`, error);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Migration completed`,
      migrated: migratedCount,
      errors: errorCount,
      total: oldData.threads.length
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { 
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Also allow GET for manual triggers
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Try to load old data from Cloudinary to see what's available
    const oldData = await loadThreadsDataFromCloudinary();
    
    // Check MongoDB for existing threads
    const { Thread } = require('@/lib/models');
    const mongoThreadCount = await Thread.countDocuments({});

    return NextResponse.json({
      cloudinary: {
        threads: oldData?.threads?.length || 0,
        hasData: !!(oldData && oldData.threads && oldData.threads.length > 0)
      },
      mongodb: {
        threads: mongoThreadCount
      },
      message: 'Use POST /api/migrate with authorization header to perform migration'
    });
  } catch (error) {
    console.error('Migration check error:', error);
    return NextResponse.json(
      { error: 'Failed to check migration status' },
      { status: 500 }
    );
  }
}

