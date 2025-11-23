// Direct database setup using Supabase API
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dajmfxysmulqlvznftym.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRham1meHlzbXVscWx2em5mdHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NTIxMTIsImV4cCI6MjA3OTQyODExMn0.n9LGU88zBXrWlwxamsODTuCL6VV3tCKlhceqReNKn64';

async function checkAndSetup() {
  console.log('🔍 Checking database status...\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  // Try to query the users table
  const { data, error } = await supabase
    .from('users')
    .select('count')
    .limit(1);
  
  if (error) {
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      console.log('❌ Database table does not exist yet.\n');
      console.log('📋 To set up the database, please:\n');
      console.log('1. Open: https://supabase.com/dashboard/project/dajmfxysmulqlvznftym/sql/new');
      console.log('2. Copy the SQL from supabase-schema.sql file');
      console.log('3. Paste it into the SQL Editor');
      console.log('4. Click "Run" (or press Ctrl+Enter)\n');
      console.log('The SQL file is located at: supabase-schema.sql\n');
    } else {
      console.log('⚠️  Error checking database:', error.message);
    }
  } else {
    console.log('✅ Database is already set up! Users table exists.\n');
  }
}

checkAndSetup().catch(console.error);

