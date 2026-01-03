# Environment Variables Setup for LoopChan

## Required Environment Variables

### ✅ Already Configured
- `MONGODB_URI` - Your MongoDB Atlas connection string (already set in Vercel)

### 🔴 Required for Authentication
Add these to your Vercel environment variables:

1. **NEXTAUTH_SECRET** (Required)
   - Generate a random secret key
   - Run: `openssl rand -base64 32`
   - Or use: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
   - Example: `your-generated-secret-key-here`

2. **NEXTAUTH_URL** (Required)
   - Set to: `https://loopchan.vercel.app`
   - For local development: `http://localhost:3000`

### 🟡 Optional (for Email Provider)
If you want to enable email-based sign in (magic links), configure SMTP:

3. **SMTP_HOST** (Optional)
   - Your SMTP server hostname
   - Example: `smtp.gmail.com` or `smtp.sendgrid.net`

4. **SMTP_PORT** (Optional)
   - SMTP port (usually 587 for TLS)
   - Example: `587`

5. **SMTP_USER** (Optional)
   - Your SMTP username/email
   - Example: `noreply@loopchan.vercel.app`

6. **SMTP_PASSWORD** (Optional)
   - Your SMTP password
   - Example: `your-smtp-password`

7. **SMTP_FROM** (Optional)
   - Email address to send from
   - Defaults to: `noreply@loopchan.vercel.app`

### 🟡 Optional (for Cleanup Job)
8. **CLEANUP_SECRET** (Optional)
   - Secret key to protect the cleanup endpoint
   - Generate similar to NEXTAUTH_SECRET
   - Used when calling `/api/cleanup` via cron job

## Quick Setup Steps

1. **Generate NEXTAUTH_SECRET:**
   ```bash
   openssl rand -base64 32
   ```

2. **Add to Vercel:**
   - Go to your Vercel project settings
   - Navigate to "Environment Variables"
   - Add:
     - `NEXTAUTH_SECRET` = (generated secret)
     - `NEXTAUTH_URL` = `https://loopchan.vercel.app`

3. **Redeploy:**
   - After adding environment variables, redeploy your application
   - Vercel will automatically use the new variables

## Current Status

✅ MongoDB connection configured
🔴 NextAuth configuration needed (NEXTAUTH_SECRET, NEXTAUTH_URL)
🟡 Email provider optional (can use credentials-only for MVP)
🟡 Cleanup job optional (can be set up later)

## Testing

After deployment:
1. Visit `https://loopchan.vercel.app/auth/signup`
2. Create an account with email/password
3. Sign in and create threads/posts
4. Files will be stored in MongoDB GridFS

