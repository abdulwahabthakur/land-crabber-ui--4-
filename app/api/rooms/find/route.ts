import { NextRequest, NextResponse } from 'next/server'
import { getRooms } from '@/lib/rooms'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lat, lng, radius = 0.1 } = body // radius in km, default ~100m

    if (!lat || !lng) {
      return NextResponse.json(
        { success: false, error: 'Missing location' },
        { status: 400 }
      )
    }

    // Find rooms within radius
    const nearbyRooms: any[] = []
    const rooms = getRooms()
    
    for (const [id, room] of rooms.entries()) {
      const distance = getDistanceFromLatLonInKm(lat, lng, room.lat, room.lng)
      if (distance <= radius && !room.isActive && room.players.length < 6) {
        nearbyRooms.push({
          id: room.id,
          playerCount: room.players.length,
          distance: distance.toFixed(2),
          lat: room.lat,
          lng: room.lng,
        })
      }
    }

    return NextResponse.json({
      success: true,
      rooms: nearbyRooms,
    })
  } catch (error) {
    console.error('Find rooms error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371 // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180)
}

