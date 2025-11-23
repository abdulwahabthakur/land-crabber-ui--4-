import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// This endpoint helps verify the database setup
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Try to query the users table to see if it exists
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (error) {
      // Check if it's a "relation does not exist" error
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        return NextResponse.json({
          success: false,
          error: 'Database table does not exist. Please run the SQL schema in Supabase dashboard.',
          needsSetup: true,
        })
      }
      return NextResponse.json({
        success: false,
        error: error.message,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Database is set up correctly!',
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
    })
  }
}

