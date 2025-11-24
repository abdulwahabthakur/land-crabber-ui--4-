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
  if (!room) {
    console.error('Cannot assign code: room not found:', roomId)
    return ''
  }
  
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
    
    if (attempts >= 100) {
      console.error('Failed to generate unique room code after 100 attempts')
      return ''
    }
    
    room.code = code
    setRoom(roomId, room)
    
    // Verify it was saved
    const verifyRoom = getRoom(roomId)
    if (!verifyRoom || !verifyRoom.code) {
      console.error('Room code was not saved properly:', { roomId, code, verifyRoom })
      return ''
    }
    
    console.log('Room code assigned successfully:', { roomId, code })
  }
  
  return room.code || ''
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
    // Use a format that handles negative coordinates properly
    const latRounded = Math.round(lat * 1000)
    const lngRounded = Math.round(lng * 1000)
    // Use 'n' for negative and 'p' for positive to avoid double dashes
    const latSign = latRounded >= 0 ? 'p' : 'n'
    const lngSign = lngRounded >= 0 ? 'p' : 'n'
    const roomId = `room-${latSign}${Math.abs(latRounded)}-${lngSign}${Math.abs(lngRounded)}`
    
    console.log('Creating room with ID:', roomId, 'from coords:', { lat, lng, latRounded, lngRounded })

    const rooms = getRooms()
    // Get or create room
    let room = getRoom(roomId)
    
    if (!room) {
      room = {
        id: roomId,
        lat,
        lng,
        hostId: playerId, // Track who created the room
        players: [],
        startTime: null,
        isActive: false,
        duration: null, // Race duration in seconds (null = no auto-stop)
        createdAt: Date.now(),
      }
    } else {
      // If room exists but doesn't have a hostId, set it to the first player or current player
      if (!room.hostId) {
        room.hostId = room.players.length > 0 ? room.players[0].id : playerId
        console.log('Setting hostId for existing room:', { roomId, hostId: room.hostId })
      }
    }

    // Check if player already in room
    const existingPlayer = room.players.find((p: any) => p.id === playerId)
    if (existingPlayer) {
      // Generate room code if it doesn't exist
      const code = assignRoomCode(roomId)
      const updatedRoom = getRoom(roomId)
      if (!updatedRoom) {
        return NextResponse.json(
          { success: false, error: 'Room not found' },
          { status: 500 }
        )
      }
      return NextResponse.json({
        success: true,
        room: {
          id: updatedRoom.id,
          code: updatedRoom.code || code || null,
          players: updatedRoom.players,
          isActive: updatedRoom.isActive,
          hostId: updatedRoom.hostId,
          duration: updatedRoom.duration,
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
      points: 0,
      joinedAt: Date.now(),
    })

    // Save room first (before generating code)
    setRoom(roomId, room)
    
    // Generate room code - ensure it's always generated
    // This will modify the room and save it again with the code
    const code = assignRoomCode(roomId)
    
    if (!code) {
      console.error('Failed to generate room code for room:', roomId)
      return NextResponse.json(
        { success: false, error: 'Failed to generate room code' },
        { status: 500 }
      )
    }

    // Get the updated room to ensure we have the latest data with code
    const updatedRoom = getRoom(roomId)
    if (!updatedRoom) {
      console.error('Room not found after code assignment:', roomId)
      return NextResponse.json(
        { success: false, error: 'Room not found after creation' },
        { status: 500 }
      )
    }

    // Verify the code was actually saved
    if (!updatedRoom.code) {
      console.error('Room code was not saved properly:', { roomId, code, updatedRoom })
      // Try to set it directly as a fallback
      updatedRoom.code = code
      setRoom(roomId, updatedRoom)
    }

    console.log('Room created successfully:', { 
      roomId, 
      code: updatedRoom.code || code, 
      playerCount: updatedRoom.players.length 
    })

    return NextResponse.json({
      success: true,
      room: {
        id: updatedRoom.id,
        code: updatedRoom.code || code,
        players: updatedRoom.players,
        isActive: updatedRoom.isActive,
        hostId: updatedRoom.hostId,
        duration: updatedRoom.duration,
      },
    })
  } catch (error) {
    console.error('Create room error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

