# Deployment Setup Guide

This guide will help you set up the multiplayer functionality for deployment using Supabase.

## Prerequisites

1. A Supabase account (free tier works fine)
2. Your Supabase project URL and anon key

## Step 1: Set Up Supabase Database

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Open the file `supabase-schema.sql` in this project
4. Copy the entire contents and paste it into the SQL Editor
5. Click **Run** (or press Ctrl+Enter)

This will create:
- The `users` table (if not already created)
- The `rooms` table for multiplayer functionality
- All necessary indexes and security policies

## Step 2: Configure Environment Variables

1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy your **Project URL** and **anon public** key
3. Create or update `.env.local` in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

4. **Important**: Restart your development server after updating environment variables

## Step 3: Verify Database Setup

After running the SQL, verify the tables were created:

1. Go to **Table Editor** in Supabase dashboard
2. You should see both `users` and `rooms` tables
3. The `rooms` table should have these columns:
   - `id` (text, primary key)
   - `code` (text, unique)
   - `lat` (double precision)
   - `lng` (double precision)
   - `is_active` (boolean)
   - `start_time` (bigint)
   - `players` (jsonb)
   - `created_at` (bigint)
   - `updated_at` (bigint)

## Step 4: Test Locally

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Create a room and verify it appears in the Supabase `rooms` table
3. Try joining from another device/browser using the room code
4. Verify players can see each other in real-time

## Step 5: Deploy

### Vercel Deployment

1. Push your code to GitHub
2. Import your project in Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

### Other Platforms

Make sure to set the same environment variables in your hosting platform's configuration.

## Troubleshooting

### "Missing Supabase environment variables" error

- Make sure `.env.local` exists and has the correct variable names
- Restart your development server after creating/updating `.env.local`
- For production, verify environment variables are set in your hosting platform

### Rooms not persisting

- Verify the `rooms` table was created in Supabase
- Check that Row Level Security (RLS) policies are enabled and allow public access
- Check browser console and server logs for errors

### "Room not found" errors

- Verify the database connection is working
- Check that rooms are being saved to the database (check Supabase table editor)
- Ensure the room code lookup is working (check API logs)

### Multiplayer not working across devices

- Verify both devices are using the same deployed URL (not localhost)
- Check that environment variables are set correctly in production
- Verify Supabase allows connections from your domain (check Supabase dashboard settings)

## Security Notes

- The current RLS policies allow public read/write access to rooms for simplicity
- For production, you may want to add authentication and restrict access
- The anon key is safe to expose in client-side code (it's designed for this)
- Never expose your service role key in client-side code

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check server logs for API errors
3. Verify database tables and policies in Supabase dashboard
4. Ensure environment variables are correctly set

