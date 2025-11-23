import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Sign in with Supabase Auth
    const { data: sessionData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !sessionData.session) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', sessionData.user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
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

    // Set session cookies
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
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

