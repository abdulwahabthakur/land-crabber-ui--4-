import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, color, avatar } = body

    // Validation
    if (!email || !password || !name || !color || !avatar) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Check if color is already taken (before creating account)
    const { data: colorTaken } = await supabase
      .from('users')
      .select('id')
      .eq('color', color)
      .single()

    if (colorTaken) {
      return NextResponse.json(
        { success: false, error: 'This color is already taken' },
        { status: 400 }
      )
    }

    // Sign up the user with Supabase Auth
    // Supabase will automatically check if email already exists
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Create user profile in the users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name,
        color,
        avatar,
        race_history: [],
      })
      .select()
      .single()

    if (profileError) {
      // Note: Auth user will remain but profile creation failed
      // In production, you might want to handle this with a service role key
      return NextResponse.json(
        { success: false, error: 'Failed to create user profile: ' + profileError.message },
        { status: 500 }
      )
    }

    // Sign in the user
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (sessionError || !sessionData.session) {
      return NextResponse.json(
        { success: false, error: 'Account created but login failed. Please try logging in.' },
        { status: 500 }
      )
    }

    // Return user data (without password)
    const user = {
      id: userProfile.id,
      email: userProfile.email,
      name: userProfile.name,
      color: userProfile.color,
      avatar: userProfile.avatar,
      raceHistory: userProfile.race_history || [],
    }

    const response = NextResponse.json({ success: true, user })

    // Set session cookie
    response.cookies.set('sb-access-token', sessionData.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    response.cookies.set('sb-refresh-token', sessionData.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

