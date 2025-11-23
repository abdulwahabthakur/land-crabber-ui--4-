# Quick Start Guide

## ✅ Step 1: Dependencies Installed
Dependencies are already installed! ✓

## ⚠️ Step 2: Set Up Supabase Database (REQUIRED)

**This is the most important step!** Without it, signup/login won't work.

### Quick Steps:
1. Go to: https://supabase.com/dashboard/project/dajmfxysmulqlvznftym
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"**
4. Open `supabase-schema.sql` in this project folder
5. Copy ALL the SQL code
6. Paste into Supabase SQL Editor
7. Click **"Run"** (or press Ctrl+Enter)

See `DATABASE_SETUP.md` for detailed instructions.

## ✅ Step 3: Environment Variables
Your `.env.local` file is already configured with:
- ✓ Supabase URL
- ✓ Supabase API Key  
- ✓ Google Maps API Key
- ⚠️ Gemini API Key (optional - only needed for AI features)

## 🚀 Step 4: Run the App

```bash
npm run dev
```

Then open: http://localhost:3000

## 🧪 Step 5: Test the App

1. **Sign Up**: Create a new account
2. **Login**: Sign in with your credentials
3. **Start Race**: Create a race and test the Google Maps integration

## 📝 Notes

- The app won't work for signup/login until Step 2 (database setup) is complete
- Google Maps should work immediately
- Gemini API is optional - the app works without it

## 🆘 Troubleshooting

**Can't sign up?**
- Make sure you ran the SQL schema in Supabase (Step 2)

**Maps not loading?**
- Check that `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is correct in `.env.local`
- Make sure the Maps JavaScript API is enabled in Google Cloud Console

**App won't start?**
- Make sure all dependencies are installed: `npm install`
- Check that `.env.local` exists and has all required variables

