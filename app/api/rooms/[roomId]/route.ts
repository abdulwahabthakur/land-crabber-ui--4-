import { NextRequest, NextResponse } from 'next/server'
import { getRoom, setRoom } from '@/lib/rooms'

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId
    const room = getRoom(roomId)

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
        players: room.players,
        isActive: room.isActive,
        startTime: room.startTime,
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
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId
    const body = await request.json()
    const { action, playerId, lat, lng, distance, speed, points } = body

    const room = getRoom(roomId)
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
      }
    } else if (action === 'start') {
      if (room.players.length < 2) {
        return NextResponse.json(
          { success: false, error: 'Need at least 2 players' },
          { status: 400 }
        )
      }
      room.isActive = true
      room.startTime = Date.now()
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
    }

    setRoom(roomId, room)

    return NextResponse.json({
      success: true,
      room: {
        id: room.id,
        players: room.players,
        isActive: room.isActive,
        startTime: room.startTime,
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

