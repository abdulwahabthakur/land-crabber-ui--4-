# Backend Implementation Guide

This document describes the backend implementation for the Land Crabber UI app.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
GEMINI_API_KEY=your_gemini_api_key
```

## Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Go to the SQL Editor in your Supabase dashboard
3. Run the SQL from `supabase-schema.sql` to create the required tables and policies
4. Copy your project URL and anon key from Settings > API
5. Add them to your `.env.local` file

## Database Schema

The app uses a single `users` table that stores:
- `id` (UUID, references auth.users)
- `email` (TEXT, unique)
- `name` (TEXT)
- `color` (TEXT) - The user's selected color
- `avatar` (TEXT) - The user's selected emoji avatar
- `race_history` (JSONB) - Array of race results

## API Routes

### Authentication Routes

- `POST /api/auth/signup` - Create a new user account
- `POST /api/auth/login` - Sign in an existing user
- `GET /api/auth/session` - Get the current user session
- `POST /api/auth/logout` - Sign out the current user

### User Routes

- `GET /api/users` - Get all users (for race setup)
- `POST /api/users/race-history` - Update a user's race history

### AI Routes

- `POST /api/gemini` - Generate AI responses using Google's Gemini API

## Installation

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables (see above)

3. Set up Supabase database (see above)

4. Run the development server:
```bash
pnpm dev
```

## Security Notes

- All API routes use Supabase Row Level Security (RLS) policies
- Session tokens are stored in httpOnly cookies
- Passwords are never stored in plain text (handled by Supabase Auth)
- The Gemini API key is server-side only and never exposed to the client

