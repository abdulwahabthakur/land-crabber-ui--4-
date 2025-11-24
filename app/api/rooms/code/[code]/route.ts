import { NextRequest, NextResponse } from 'next/server'
import { getRooms } from '@/lib/rooms'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> | { code: string } }
) {
  try {
    // Handle both Promise and direct params (for Next.js version compatibility)
    let resolvedParams: { code: string }
    if (params instanceof Promise) {
      resolvedParams = await params
    } else {
      resolvedParams = params
    }
    
    let code = resolvedParams?.code
    
    if (!code) {
      console.error('No code parameter found:', { 
        params: resolvedParams,
        paramsType: typeof params,
        isPromise: params instanceof Promise
      })
      return NextResponse.json(
        { success: false, error: 'Room code is required' },
        { status: 400 }
      )
    }
    
    // Decode URL encoding if present and normalize
    try {
      code = decodeURIComponent(code)
    } catch (e) {
      // If decoding fails, use original code
    }
    
    // Normalize: uppercase and trim whitespace
    code = String(code).toUpperCase().trim()
    
    // Validate format - should be exactly 6 alphanumeric characters
    if (!code || code.length !== 6 || !/^[A-Z0-9]{6}$/.test(code)) {
      console.error('Invalid room code format:', { 
        original: resolvedParams?.code,
        processed: code, 
        length: code?.length,
        isValid: /^[A-Z0-9]{6}$/.test(code)
      })
      return NextResponse.json(
        { success: false, error: `Invalid room code format. Code must be exactly 6 alphanumeric characters. Received: "${resolvedParams?.code || 'nothing'}"` },
        { status: 400 }
      )
    }
    
    const rooms = getRooms()
    
    // Debug: Log all rooms and their codes
    console.log('Looking for room code:', code)
    console.log('Total rooms:', rooms.size)
    const allRoomCodes = Array.from(rooms.values()).map((r: any) => ({
      id: r.id,
      code: r.code,
      codeUpper: r.code?.toUpperCase(),
      playerCount: r.players?.length || 0
    }))
    console.log('All rooms with codes:', JSON.stringify(allRoomCodes, null, 2))
    
    // Find room by code - try exact match first, then case-insensitive
    for (const [id, room] of rooms.entries()) {
      const roomCodeUpper = room.code ? String(room.code).toUpperCase().trim() : null
      if (roomCodeUpper === code) {
        // Check if room is full
        if (room.players.length >= 6) {
          return NextResponse.json(
            { success: false, error: 'Room is full' },
            { status: 400 }
          )
        }
        // Check if room is active (race in progress)
        if (room.isActive) {
          return NextResponse.json(
            { success: false, error: 'Race is already in progress' },
            { status: 400 }
          )
        }
        
        return NextResponse.json({
          success: true,
          room: {
            id: room.id,
            code: room.code,
            playerCount: room.players.length,
            players: room.players,
          },
        })
      }
    }
    
    console.error('Room not found for code:', code, 'Available codes:', allRoomCodes)
    return NextResponse.json(
      { success: false, error: 'Room not found. Please check the code.' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Get room by code error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}


