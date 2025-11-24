import { NextRequest, NextResponse } from 'next/server'
import { getRoom, setRoom, getRooms } from '@/lib/rooms'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> | { roomId: string } }
) {
  try {
    // Handle both Promise and direct params (for Next.js version compatibility)
    const resolvedParams = params instanceof Promise ? await params : params
    const roomId = resolvedParams.roomId
    
    console.log('GET room request for ID:', roomId)
    const room = getRoom(roomId)
    
    if (!room) {
      const allRoomIds = Array.from(getRooms().keys())
      console.error('Room not found:', roomId, 'Available rooms:', allRoomIds)
    }

    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      room: {
        id: room.id,
        code: room.code || null,
        players: room.players,
        isActive: room.isActive,
        startTime: room.startTime,
        hostId: room.hostId || null,
        duration: room.duration || null,
      },
    })
  } catch (error) {
    console.error('Get room error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> | { roomId: string } }
) {
  try {
    // Handle both Promise and direct params (for Next.js version compatibility)
    const resolvedParams = params instanceof Promise ? await params : params
    const roomId = resolvedParams.roomId
    
    // Handle both JSON and Blob (from sendBeacon) requests
    let body: any
    const contentType = request.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      body = await request.json()
    } else {
      // Handle blob from sendBeacon
      try {
        const blob = await request.blob()
        const text = await blob.text()
        body = JSON.parse(text)
      } catch (error) {
        // If blob parsing fails, try JSON
        body = await request.json()
      }
    }
    const { action, playerId, lat, lng, distance, speed, points, duration } = body

    console.log('POST room request for ID:', roomId, 'action:', action)
    const room = getRoom(roomId)
    
    if (!room) {
      const allRoomIds = Array.from(getRooms().keys())
      console.error('Room not found in POST:', roomId, 'Available rooms:', allRoomIds)
    }
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      )
    }

    if (action === 'join') {
      const { playerName, playerColor, playerAvatar } = body
      const existingPlayer = room.players.find((p: any) => p.id === playerId)
      
      if (!existingPlayer) {
        if (room.players.length >= 6) {
          return NextResponse.json(
            { success: false, error: 'Room is full' },
            { status: 400 }
          )
        }
        
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
      } else {
        // Update existing player info if they're rejoining
        existingPlayer.name = playerName || existingPlayer.name
        existingPlayer.color = playerColor || existingPlayer.color
        existingPlayer.avatar = playerAvatar || existingPlayer.avatar
        if (lat !== undefined) existingPlayer.lat = lat
        if (lng !== undefined) existingPlayer.lng = lng
        existingPlayer.lastUpdate = Date.now()
      }
    } else if (action === 'updatePlayer') {
      // Update player info (name, color, avatar)
      const { playerName, playerColor, playerAvatar } = body
      const existingPlayer = room.players.find((p: any) => p.id === playerId)
      if (existingPlayer) {
        if (playerName !== undefined) existingPlayer.name = playerName
        if (playerColor !== undefined) existingPlayer.color = playerColor
        if (playerAvatar !== undefined) existingPlayer.avatar = playerAvatar
        if (lat !== undefined) existingPlayer.lat = lat
        if (lng !== undefined) existingPlayer.lng = lng
        existingPlayer.lastUpdate = Date.now()
      }
    } else if (action === 'start') {
      // Only host can start the game
      // If room doesn't have a hostId, set it to the first player or current player
      if (!room.hostId) {
        room.hostId = room.players.length > 0 ? room.players[0].id : playerId
        console.log('Setting hostId for room without host:', { roomId, hostId: room.hostId })
      }
      
      if (room.hostId && room.hostId !== playerId) {
        console.log('Start denied - not host:', { roomId, hostId: room.hostId, playerId })
        return NextResponse.json(
          { success: false, error: 'Only the host can start the game' },
          { status: 403 }
        )
      }
      
      console.log('Start allowed - is host:', { roomId, hostId: room.hostId, playerId })
      
      if (room.players.length < 2) {
        return NextResponse.json(
          { success: false, error: 'Need at least 2 players' },
          { status: 400 }
        )
      }
      
      // Duration in seconds (optional) - already extracted from body above
      room.isActive = true
      room.startTime = Date.now()
      if (duration !== undefined && duration !== null) {
        room.duration = duration // Store duration for auto-stop
      }
      
      console.log('Race started:', { roomId, playerCount: room.players.length, duration: room.duration })
    } else if (action === 'update') {
      const player = room.players.find((p: any) => p.id === playerId)
      if (player) {
        if (lat !== undefined) player.lat = lat
        if (lng !== undefined) player.lng = lng
        if (distance !== undefined) player.distance = distance
        if (speed !== undefined) player.speed = speed
        if (points !== undefined) player.points = points
        player.lastUpdate = Date.now()
      }
    } else if (action === 'leave') {
      // Remove player from room
      room.players = room.players.filter((p: any) => p.id !== playerId)
      
      // If room becomes empty and not active, we could delete it, but let's keep it for now
      // If race is active and only 1 player left, we might want to handle that
      if (room.isActive && room.players.length < 2) {
        // Race can continue with 1 player, but we could end it if needed
        // For now, just let it continue
      }
    }

    setRoom(roomId, room)

    // Get the updated room to ensure we have the latest data
    const updatedRoom = getRoom(roomId)
    if (!updatedRoom) {
      return NextResponse.json(
        { success: false, error: 'Room not found after update' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      room: {
        id: updatedRoom.id,
        code: updatedRoom.code || null,
        players: updatedRoom.players,
        isActive: updatedRoom.isActive,
        startTime: updatedRoom.startTime,
        hostId: updatedRoom.hostId || null,
        duration: updatedRoom.duration || null,
      },
    })
  } catch (error) {
    console.error('Update room error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

