# Environment Variables Setup

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
# Get these from your Supabase project: Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google Maps API Key
# Get this from Google Cloud Console: APIs & Services > Credentials
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Gemini API Key (server-side only, never exposed to client)
# Get this from Google AI Studio: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here
```

## How to Get Each API Key:

### 1. Supabase Keys
1. Go to https://supabase.com and create a project
2. Navigate to Settings > API
3. Copy the "Project URL" → `NEXT_PUBLIC_SUPABASE_URL`
4. Copy the "anon public" key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Google Maps API Key
1. Go to https://console.cloud.google.com
2. Create a project or select an existing one
3. Enable the "Maps JavaScript API"
4. Go to APIs & Services > Credentials
5. Create an API key
6. Copy the key → `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

### 3. Gemini API Key
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key → `GEMINI_API_KEY`

## Important Notes:

- **DO NOT** commit `.env.local` to git - it contains sensitive information
- The `.env.local` file is automatically ignored by Next.js
- Restart your development server after creating/updating `.env.local`
- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- Variables without `NEXT_PUBLIC_` are server-side only (like `GEMINI_API_KEY`)

