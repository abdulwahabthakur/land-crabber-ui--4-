// Shared room storage (in production, use a database like Redis or Supabase)
const rooms = new Map<string, any>()

export function getRooms() {
  return rooms
}

export function getRoom(roomId: string) {
  return rooms.get(roomId)
}

export function setRoom(roomId: string, room: any) {
  rooms.set(roomId, room)
  console.log('Room saved:', { roomId, code: room.code, playerCount: room.players?.length || 0, totalRooms: rooms.size })
}

export function deleteRoom(roomId: string) {
  rooms.delete(roomId)
}

// Clean up inactive players and old rooms periodically
setInterval(() => {
  const now = Date.now()
  for (const [id, room] of rooms.entries()) {
    // Remove inactive players (no update for 30 seconds during race, 2 minutes during setup)
    const inactiveThreshold = room.isActive ? 30000 : 120000 // 30s for active race, 2min for setup
    room.players = room.players.filter((player: any) => {
      const lastUpdate = player.lastUpdate || player.joinedAt
      return (now - lastUpdate) < inactiveThreshold
    })
    
    // Delete empty rooms that are older than 5 minutes
    if (room.players.length === 0 && (now - room.createdAt) > 300000) {
      rooms.delete(id)
    }
    
    // Delete old rooms (1 hour)
    if (now - room.createdAt > 3600000) {
      rooms.delete(id)
    }
  }
}, 10000) // Check every 10 seconds

