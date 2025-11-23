import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get session from cookies first - return early if no cookies
    const accessToken = request.cookies.get('sb-access-token')?.value
    const refreshToken = request.cookies.get('sb-refresh-token')?.value

    if (!accessToken || !refreshToken) {
      return NextResponse.json({ success: false, user: null })
    }

    const supabase = createServerClient()

    // Set the session
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (sessionError || !sessionData.session || !sessionData.user) {
      return NextResponse.json({ success: false, user: null })
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', sessionData.user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ success: false, user: null })
    }

    // Return user data
    const user = {
      id: userProfile.id,
      email: userProfile.email,
      name: userProfile.name,
      color: userProfile.color,
      avatar: userProfile.avatar,
      raceHistory: userProfile.race_history || [],
    }

    const response = NextResponse.json({ success: true, user })

    // Update cookies if session was refreshed
    if (sessionData.session) {
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
    }

    return response
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ success: false, user: null })
  }
}

