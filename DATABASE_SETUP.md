# Supabase Database Setup Guide

Follow these steps to set up your Supabase database:

## Step 1: Open Supabase SQL Editor

1. Go to your Supabase project dashboard:
   https://supabase.com/dashboard/project/dajmfxysmulqlvznftym

2. Click on **"SQL Editor"** in the left sidebar

3. Click **"New query"** button

## Step 2: Run the Database Schema

1. Open the file `supabase-schema.sql` in this project
2. Copy **ALL** the SQL code from that file
3. Paste it into the Supabase SQL Editor
4. Click **"Run"** or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

## Step 3: Verify Setup

After running the SQL, you should see:
- ✅ Table `users` created
- ✅ Row Level Security enabled
- ✅ Policies created
- ✅ Indexes created

## What This Does

The SQL script creates:
- **users table**: Stores user profiles (name, email, color, avatar, race history)
- **Security policies**: Allows users to read all users, but only update their own profile
- **Indexes**: Makes queries faster

## Troubleshooting

If you get an error:
- Make sure you're running the SQL in the correct project
- Check that all SQL statements are copied correctly
- Try running each section separately if needed

## Next Steps

Once the database is set up:
1. Run `npm run dev` to start the app
2. Try signing up a new user
3. The app should work fully!

