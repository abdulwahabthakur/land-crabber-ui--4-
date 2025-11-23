// Setup database using Supabase API
const SUPABASE_URL = 'https://dajmfxysmulqlvznftym.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRham1meHlzbXVscWx2em5mdHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NTIxMTIsImV4cCI6MjA3OTQyODExMn0.n9LGU88zBXrWlwxamsODTuCL6VV3tCKlhceqReNKn64';

const SQL = `
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

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

CREATE POLICY "Users can read all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_color_idx ON users(color);
`;

async function setupDatabase() {
  console.log('🚀 Attempting to set up database via API...\n');
  
  try {
    // Try using the Supabase Management API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql: SQL }),
    });

    if (response.ok) {
      console.log('✅ Database set up successfully via API!');
      return;
    } else {
      const error = await response.text();
      console.log('⚠️  API setup not available (this is normal).');
      console.log('   Error:', error.substring(0, 200));
    }
  } catch (error) {
    console.log('⚠️  Direct API setup not available.');
  }

  // Fallback: Provide manual instructions
  console.log('\n📋 Please set up the database manually:\n');
  console.log('1. Open this link in your browser:');
  console.log('   https://supabase.com/dashboard/project/dajmfxysmulqlvznftym/sql/new\n');
  console.log('2. Copy and paste this SQL:\n');
  console.log('─'.repeat(70));
  console.log(SQL);
  console.log('─'.repeat(70));
  console.log('\n3. Click "Run" (or press Ctrl+Enter)');
  console.log('\n✅ After running the SQL, your database will be ready!\n');
}

setupDatabase().catch(console.error);

