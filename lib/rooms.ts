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
}

export function deleteRoom(roomId: string) {
  rooms.delete(roomId)
}

// Clean up old rooms periodically
setInterval(() => {
  const now = Date.now()
  for (const [id, room] of rooms.entries()) {
    if (now - room.createdAt > 3600000) { // 1 hour
      rooms.delete(id)
    }
  }
}, 60000) // Check every minute

