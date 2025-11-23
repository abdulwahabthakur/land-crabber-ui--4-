"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"
import { MapPin, Users, Loader2 } from "lucide-react"
import type { Player } from "@/app/page"

type Room = {
  id: string
  playerCount: number
  distance: string
  lat: number
  lng: number
}

type RoomScreenProps = {
  player: Player
  onJoinRoom: (roomId: string) => void
  onCreateRoom: (roomId: string) => void
  onBack: () => void
}

export function RoomScreen({ player, onJoinRoom, onCreateRoom, onBack }: RoomScreenProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [roomCode, setRoomCode] = useState("")
  const [isJoiningByCode, setIsJoiningByCode] = useState(false)
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null)

  useEffect(() => {
    // Get GPS location
    if (!navigator.geolocation) {
      alert('GPS not supported on this device')
      setIsLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setLocation({ lat: latitude, lng: longitude })
        findRooms(latitude, longitude)
      },
      (error) => {
        console.error('GPS error:', error)
        alert('Could not get your location. Please enable GPS.')
        setIsLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  const findRooms = async (lat: number, lng: number) => {
    try {
      const response = await fetch('/api/rooms/find', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, radius: 0.1 }), // 100m radius
      })
      const data = await response.json()
      if (data.success) {
        setRooms(data.rooms || [])
      }
    } catch (error) {
      console.error('Error finding rooms:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateRoom = async () => {
    if (!location) return
    
    setIsCreating(true)
    try {
      const response = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: player.id,
          playerName: player.name,
          playerColor: player.color,
          playerAvatar: player.avatar,
          lat: location.lat,
          lng: location.lng,
        }),
      })
      const data = await response.json()
      if (data.success) {
        setCreatedRoomCode(data.room.code)
        onCreateRoom(data.room.id)
      }
    } catch (error) {
      console.error('Error creating room:', error)
      alert('Failed to create room')
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoinByCode = async () => {
    if (!roomCode || roomCode.length !== 6) {
      alert('Please enter a valid 6-character room code')
      return
    }
    
    if (!location) {
      alert('Please allow GPS access first')
      return
    }
    
    setIsJoiningByCode(true)
    try {
      const response = await fetch(`/api/rooms/code/${roomCode.toUpperCase()}`)
      const data = await response.json()
      
      if (data.success && data.room) {
        // Join the room
        const joinResponse = await fetch(`/api/rooms/${data.room.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'join',
            playerId: player.id,
            playerName: player.name,
            playerColor: player.color,
            playerAvatar: player.avatar,
            lat: location.lat,
            lng: location.lng,
          }),
        })
        const joinData = await joinResponse.json()
        if (joinData.success) {
          onJoinRoom(data.room.id)
        } else {
          alert(joinData.error || 'Failed to join room')
        }
      } else {
        alert('Room not found. Please check the code.')
      }
    } catch (error) {
      console.error('Error joining by code:', error)
      alert('Failed to join room')
    } finally {
      setIsJoiningByCode(false)
    }
  }

  const handleJoinRoom = async (roomId: string) => {
    if (!location) return
    
    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join',
          playerId: player.id,
          playerName: player.name,
          playerColor: player.color,
          playerAvatar: player.avatar,
          lat: location.lat,
          lng: location.lng,
        }),
      })
      const data = await response.json()
      if (data.success) {
        onJoinRoom(roomId)
      } else {
        alert(data.error || 'Failed to join room')
      }
    } catch (error) {
      console.error('Error joining room:', error)
      alert('Failed to join room')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Finding nearby races...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center space-y-2 pt-8"
        >
          <h1 className="text-5xl font-black text-foreground">Find a Race</h1>
          <p className="text-lg text-muted-foreground">Join nearby players or start your own</p>
          {location && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
            </div>
          )}
        </motion.div>

        {/* Available Rooms */}
        {rooms.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold">Nearby Races</h2>
            {rooms.map((room) => (
              <motion.div
                key={room.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
              >
                <Card className="p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-bold">{room.playerCount} / 6 players</div>
                        <div className="text-sm text-muted-foreground">
                          {room.distance} km away
                        </div>
                      </div>
                    </div>
                    <Button onClick={() => handleJoinRoom(room.id)}>
                      Join
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Join by Code */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <Card className="p-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-center">Join by Room Code</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  className="flex-1 px-4 py-2 border-2 rounded-lg text-center text-2xl font-bold tracking-widest uppercase"
                  maxLength={6}
                />
                <Button
                  onClick={handleJoinByCode}
                  disabled={isJoiningByCode || !roomCode || roomCode.length !== 6}
                  size="lg"
                >
                  {isJoiningByCode ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Join"
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Create Room */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="pt-4"
        >
          <Card className="p-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Start New Race</h2>
              <p className="text-muted-foreground">
                Create a new race room. Share the code with friends!
              </p>
              {createdRoomCode && (
                <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary">
                  <p className="text-sm text-muted-foreground mb-2">Room Code:</p>
                  <p className="text-4xl font-black text-primary tracking-widest">{createdRoomCode}</p>
                  <p className="text-xs text-muted-foreground mt-2">Share this code with other players</p>
                </div>
              )}
              <Button
                onClick={handleCreateRoom}
                disabled={isCreating || !location}
                size="lg"
                className="w-full"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Race Room"
                )}
              </Button>
            </div>
          </Card>
        </motion.div>

        <Button variant="outline" onClick={onBack} className="w-full">
          Back
        </Button>
      </div>
    </div>
  )
}

