-- Supabase Database Schema for Land Crabber UI
-- Run this SQL in your Supabase SQL Editor to create the required tables

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  avatar TEXT NOT NULL,
  race_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
-- Allow users to read all users (for race setup)
CREATE POLICY "Users can read all users" ON users
  FOR SELECT
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Allow users to insert their own profile (during signup)
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create a function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Note: The profile will be created by the API route, but this function
  -- can be used as a backup or for automatic profile creation
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function on new user signup
-- (Optional - the API route handles this, but this is a backup)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

-- Create index on color for faster lookups
CREATE INDEX IF NOT EXISTS users_color_idx ON users(color);

-- Create rooms table for multiplayer functionality
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  is_active BOOLEAN DEFAULT false,
  start_time BIGINT,
  players JSONB DEFAULT '[]'::jsonb,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- Enable Row Level Security for rooms
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read rooms (for finding and joining)
CREATE POLICY "Anyone can read rooms" ON rooms
  FOR SELECT
  USING (true);

-- Allow anyone to insert rooms (for creating)
CREATE POLICY "Anyone can create rooms" ON rooms
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update rooms (for joining, leaving, starting)
CREATE POLICY "Anyone can update rooms" ON rooms
  FOR UPDATE
  USING (true);

-- Allow anyone to delete rooms (for cleanup)
CREATE POLICY "Anyone can delete rooms" ON rooms
  FOR DELETE
  USING (true);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS rooms_code_idx ON rooms(code);
CREATE INDEX IF NOT EXISTS rooms_is_active_idx ON rooms(is_active);
CREATE INDEX IF NOT EXISTS rooms_created_at_idx ON rooms(created_at);

-- Create a GIN index on players JSONB for faster queries
CREATE INDEX IF NOT EXISTS rooms_players_idx ON rooms USING GIN (players);

