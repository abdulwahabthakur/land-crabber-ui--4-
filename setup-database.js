// Database Setup Script
// This script will set up the Supabase database schema
// Run with: node setup-database.js

const SUPABASE_URL = 'https://dajmfxysmulqlvznftym.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRham1meHlzbXVscWx2em5mdHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NTIxMTIsImV4cCI6MjA3OTQyODExMn0.n9LGU88zBXrWlwxamsODTuCL6VV3tCKlhceqReNKn64';

const SQL_SCHEMA = `
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create policies for users table
CREATE POLICY "Users can read all users" ON users
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

-- Create index on color for faster lookups
CREATE INDEX IF NOT EXISTS users_color_idx ON users(color);
`;

async function setupDatabase() {
  console.log('Setting up Supabase database...');
  console.log('Note: This requires running SQL in the Supabase dashboard.');
  console.log('\nPlease follow these steps:');
  console.log('1. Go to: https://supabase.com/dashboard/project/dajmfxysmulqlvznftym');
  console.log('2. Click "SQL Editor" in the left sidebar');
  console.log('3. Click "New query"');
  console.log('4. Copy and paste the SQL below:');
  console.log('\n' + '='.repeat(60));
  console.log(SQL_SCHEMA);
  console.log('='.repeat(60));
  console.log('\n5. Click "Run" (or press Ctrl+Enter)');
  console.log('\nAlternatively, the SQL is saved in supabase-schema.sql file.');
}

setupDatabase().catch(console.error);

