// Database-backed room storage using Supabase
import { createServerClient } from './supabase'

export interface RoomPlayer {
  id: string
  name: string
  color: string
  avatar: string
  lat?: number
  lng?: number
  distance: number
  speed: number
  time: number
  points: number
  joinedAt: number
  lastUpdate?: number
}

export interface Room {
  id: string
  code?: string | null
  lat: number
  lng: number
  isActive: boolean
  startTime?: number | null
  players: RoomPlayer[]
  createdAt: number
  updatedAt: number
}

// Get all rooms
export async function getRooms(): Promise<Map<string, Room>> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching rooms:', error)
    return new Map()
  }

  const roomsMap = new Map<string, Room>()
  if (data) {
    for (const row of data) {
      roomsMap.set(row.id, {
        id: row.id,
        code: row.code || null,
        lat: row.lat,
        lng: row.lng,
        isActive: row.is_active || false,
        startTime: row.start_time || null,
        players: (row.players as RoomPlayer[]) || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })
    }
  }

  return roomsMap
}

// Get a single room by ID
export async function getRoom(roomId: string): Promise<Room | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single()

  if (error || !data) {
    if (error?.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error fetching room:', error)
    }
    return null
  }

  return {
    id: data.id,
    code: data.code || null,
    lat: data.lat,
    lng: data.lng,
    isActive: data.is_active || false,
    startTime: data.start_time || null,
    players: (data.players as RoomPlayer[]) || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

// Get a room by code
export async function getRoomByCode(code: string): Promise<Room | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .single()

  if (error || !data) {
    if (error?.code !== 'PGRST116') {
      console.error('Error fetching room by code:', error)
    }
    return null
  }

  return {
    id: data.id,
    code: data.code || null,
    lat: data.lat,
    lng: data.lng,
    isActive: data.is_active || false,
    startTime: data.start_time || null,
    players: (data.players as RoomPlayer[]) || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

// Save or update a room
export async function setRoom(roomId: string, room: Room): Promise<void> {
  const supabase = createServerClient()
  const now = Date.now()

  const roomData = {
    id: room.id,
    code: room.code || null,
    lat: room.lat,
    lng: room.lng,
    is_active: room.isActive,
    start_time: room.startTime || null,
    players: room.players,
    created_at: room.createdAt || now,
    updated_at: now,
  }

  const { error } = await supabase
    .from('rooms')
    .upsert(roomData, { onConflict: 'id' })

  if (error) {
    console.error('Error saving room:', error)
    throw error
  }

  console.log('Room saved to database:', { 
    roomId, 
    code: room.code, 
    playerCount: room.players?.length || 0 
  })
}

// Delete a room
export async function deleteRoom(roomId: string): Promise<void> {
  const supabase = createServerClient()
  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', roomId)

  if (error) {
    console.error('Error deleting room:', error)
    throw error
  }
}

// Clean up inactive players and old rooms
export async function cleanupRooms(): Promise<void> {
  const supabase = createServerClient()
  const now = Date.now()

  // Get all rooms
  const { data: rooms, error } = await supabase
    .from('rooms')
    .select('*')

  if (error || !rooms) {
    console.error('Error fetching rooms for cleanup:', error)
    return
  }

  for (const roomRow of rooms) {
    const room: Room = {
      id: roomRow.id,
      code: roomRow.code || null,
      lat: roomRow.lat,
      lng: roomRow.lng,
      isActive: roomRow.is_active || false,
      startTime: roomRow.start_time || null,
      players: (roomRow.players as RoomPlayer[]) || [],
      createdAt: roomRow.created_at,
      updatedAt: roomRow.updated_at,
    }

    let updated = false

    // Remove inactive players
    const inactiveThreshold = room.isActive ? 30000 : 120000 // 30s for active race, 2min for setup
    const activePlayers = room.players.filter((player: RoomPlayer) => {
      const lastUpdate = player.lastUpdate || player.joinedAt
      return (now - lastUpdate) < inactiveThreshold
    })

    if (activePlayers.length !== room.players.length) {
      room.players = activePlayers
      updated = true
    }

    // Delete empty rooms older than 5 minutes
    if (room.players.length === 0 && (now - room.createdAt) > 300000) {
      await deleteRoom(room.id)
      continue
    }

    // Delete old rooms (1 hour)
    if (now - room.createdAt > 3600000) {
      await deleteRoom(room.id)
      continue
    }

    // Update room if players were removed
    if (updated) {
      await setRoom(room.id, room)
    }
  }
}

// Run cleanup every 10 seconds
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cleanupRooms().catch(console.error)
  }, 10000)
}

