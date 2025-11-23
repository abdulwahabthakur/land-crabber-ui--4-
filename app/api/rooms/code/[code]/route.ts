import { NextRequest, NextResponse } from 'next/server'
import { getRooms, getRoom, setRoom } from '@/lib/rooms'

// Generate a simple 6-character room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed confusing chars
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code.toUpperCase()
    const rooms = getRooms()
    
    // Find room by code
    for (const [id, room] of rooms.entries()) {
      if (room.code === code && !room.isActive && room.players.length < 6) {
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
    
    return NextResponse.json(
      { success: false, error: 'Room not found or full' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Get room by code error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper to generate and assign code to room
export function assignRoomCode(roomId: string): string {
  const room = getRoom(roomId)
  if (!room) return ''
  
  if (!room.code) {
    const rooms = getRooms()
    let code: string
    let attempts = 0
    
    // Ensure unique code
    do {
      code = generateRoomCode()
      attempts++
    } while (
      Array.from(rooms.values()).some((r: any) => r.code === code) &&
      attempts < 100
    )
    
    room.code = code
    setRoom(roomId, room)
  }
  
  return room.code
}

