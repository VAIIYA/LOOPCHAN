# Data Migration Guide

## Problem
Threads disappear after each Vercel deployment because:
1. Old data was stored in Cloudinary/memory storage
2. New code uses MongoDB for persistent storage
3. No automatic migration between storage systems

## Solution

### Step 1: Check if old data exists
Visit: `https://loopchan.vercel.app/api/migrate`

This will show:
- How many threads exist in Cloudinary (old storage)
- How many threads exist in MongoDB (new storage)

### Step 2: Migrate old data (if available)
If old data exists in Cloudinary, you can migrate it:

```bash
curl -X POST https://loopchan.vercel.app/api/migrate \
  -H "Authorization: Bearer YOUR_MIGRATION_SECRET"
```

Or set `MIGRATION_SECRET` in Vercel environment variables and visit the endpoint.

**Note:** 
- Text content will be migrated
- Images/videos from Cloudinary URLs will NOT be migrated (they need to be downloaded and re-uploaded to GridFS)
- Only threads, not individual replies, will be migrated in the basic migration

### Step 3: Verify migration
After migration, check MongoDB to see if threads were migrated:
- Visit `/api/migrate` again to see the new counts
- Check your MongoDB Atlas dashboard

## Important Notes

1. **Data Loss Prevention:**
   - All new threads/posts are now stored in MongoDB (persistent)
   - Old threads in Cloudinary/memory are NOT automatically accessible
   - Migration must be run manually if you want to recover old data

2. **Going Forward:**
   - All new data is stored in MongoDB and will persist across deployments
   - MongoDB connection is configured via `MONGODB_URI` environment variable
   - Files are stored in MongoDB GridFS and will persist

3. **If Migration Fails:**
   - Check Vercel logs for errors
   - Verify `MONGODB_URI` is set correctly
   - Verify Cloudinary credentials are still available (if migrating from Cloudinary)

## Environment Variables Needed

- `MONGODB_URI` - Already set ✅
- `NEXTAUTH_SECRET` - Required for authentication
- `NEXTAUTH_URL` - Required for authentication
- `MIGRATION_SECRET` (optional) - For protecting migration endpoint

