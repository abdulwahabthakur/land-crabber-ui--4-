// Database Setup Script
// This will attempt to set up the database via Supabase API

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://dajmfxysmulqlvznftym.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRham1meHlzbXVscWx2em5mdHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NTIxMTIsImV4cCI6MjA3OTQyODExMn0.n9LGU88zBXrWlwxamsODTuCL6VV3tCKlhceqReNKn64';

async function setupDatabase() {
  console.log('🔧 Setting up Supabase database...\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  // Check if users table exists
  console.log('Checking if users table exists...');
  const { data, error } = await supabase
    .from('users')
    .select('count')
    .limit(1);
  
  if (!error && data !== null) {
    console.log('✅ Users table already exists!');
    return;
  }
  
  if (error && error.code === '42P01') {
    console.log('❌ Users table does not exist.');
    console.log('\n📋 Please run the SQL schema manually:\n');
    console.log('1. Go to: https://supabase.com/dashboard/project/dajmfxysmulqlvznftym');
    console.log('2. Click "SQL Editor" in the left sidebar');
    console.log('3. Click "New query"');
    console.log('4. Copy the SQL from supabase-schema.sql');
    console.log('5. Paste and click "Run"\n');
    
    // Read and display the SQL
    const sqlPath = path.join(__dirname, '..', 'supabase-schema.sql');
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      console.log('SQL to run:');
      console.log('─'.repeat(60));
      console.log(sql);
      console.log('─'.repeat(60));
    }
  } else {
    console.log('⚠️  Could not check table status:', error?.message);
  }
}

setupDatabase().catch(console.error);

