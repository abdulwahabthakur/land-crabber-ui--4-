import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, result } = body

    if (!userId || !result) {
      return NextResponse.json(
        { success: false, error: 'User ID and result are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Get session from cookies
    const accessToken = request.cookies.get('sb-access-token')?.value
    const refreshToken = request.cookies.get('sb-refresh-token')?.value

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify session
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (sessionError || !sessionData.session || sessionData.user.id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current user
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('race_history')
      .eq('id', userId)
      .single()

    if (userError || !userProfile) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Update race history
    const currentHistory = userProfile.race_history || []
    const updatedHistory = [result, ...currentHistory]

    const { error: updateError } = await supabase
      .from('users')
      .update({ race_history: updatedHistory })
      .eq('id', userId)

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Failed to update race history' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update race history error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

