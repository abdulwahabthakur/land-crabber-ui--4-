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

function assignRoomCode(roomId: string): string {
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { playerId, playerName, playerColor, playerAvatar, lat, lng } = body

    if (!playerId || !lat || !lng) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create a room ID based on location (round to ~100m precision)
    const roomId = `room-${Math.round(lat * 1000)}-${Math.round(lng * 1000)}`

    const rooms = getRooms()
    // Get or create room
    let room = getRoom(roomId)
    
    if (!room) {
      room = {
        id: roomId,
        lat,
        lng,
        players: [],
        startTime: null,
        isActive: false,
        createdAt: Date.now(),
      }
    }

    // Check if player already in room
    const existingPlayer = room.players.find((p: any) => p.id === playerId)
    if (existingPlayer) {
      return NextResponse.json({
        success: true,
        room: {
          id: room.id,
          players: room.players,
          isActive: room.isActive,
        },
      })
    }

    // Add player to room
    room.players.push({
      id: playerId,
      name: playerName,
      color: playerColor,
      avatar: playerAvatar,
      lat,
      lng,
      distance: 0,
      speed: 0,
      time: 0,
      joinedAt: Date.now(),
    })

    setRoom(roomId, room)
    
    // Generate room code
    const code = assignRoomCode(roomId)

    return NextResponse.json({
      success: true,
      room: {
        id: room.id,
        code: code,
        players: room.players,
        isActive: room.isActive,
      },
    })
  } catch (error) {
    console.error('Create room error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

