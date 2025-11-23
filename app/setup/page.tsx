"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const SQL_SCHEMA = `CREATE TABLE IF NOT EXISTS users (
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
CREATE INDEX IF NOT EXISTS users_color_idx ON users(color);`

export default function SetupPage() {
  const [copied, setCopied] = useState(false)

  const copySQL = () => {
    navigator.clipboard.writeText(SQL_SCHEMA)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black text-foreground">Database Setup</h1>
          <p className="text-muted-foreground">Set up your Supabase database to enable authentication</p>
        </div>

        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Step 1: Open Supabase SQL Editor</h2>
            <Button
              onClick={() => window.open('https://supabase.com/dashboard/project/dajmfxysmulqlvznftym/sql/new', '_blank')}
              className="w-full"
            >
              Open SQL Editor in New Tab
            </Button>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Step 2: Copy the SQL</h2>
            <div className="relative">
              <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
                <code>{SQL_SCHEMA}</code>
              </pre>
              <Button
                onClick={copySQL}
                variant="outline"
                className="absolute top-2 right-2"
              >
                {copied ? "✓ Copied!" : "Copy SQL"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Step 3: Run the SQL</h2>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Paste the SQL into the SQL Editor</li>
              <li>Click "Run" button (or press Ctrl+Enter)</li>
              <li>Wait for the success message</li>
            </ol>
          </div>

          <div className="pt-4">
            <Button
              onClick={() => window.location.href = '/'}
              className="w-full"
              size="lg"
            >
              Done! Go to App
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

