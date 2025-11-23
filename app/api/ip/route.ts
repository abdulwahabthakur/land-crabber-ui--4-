import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get IP address from request
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = forwarded?.split(',')[0] || realIp || request.ip || 'unknown'

    // Generate a simple player ID based on IP
    // In a real scenario, you might want to hash this or use a more sophisticated approach
    const playerId = `player-${ip.replace(/\./g, '-')}-${Date.now()}`

    return NextResponse.json({
      success: true,
      ip,
      playerId,
    })
  } catch (error) {
    console.error('IP detection error:', error)
    // Fallback to a random ID if IP detection fails
    const fallbackId = `player-${Math.random().toString(36).substring(7)}-${Date.now()}`
    return NextResponse.json({
      success: true,
      ip: 'unknown',
      playerId: fallbackId,
    })
  }
}

