"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Trophy, Zap } from "lucide-react"
import { MapComponent } from "@/components/map-component"
import type { Runner } from "@/app/page"

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371 // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c // Distance in km
  return d
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180)
}

const CENTER = { lat: 43.7735, lng: -79.5019 }
const getBotPosition = (distance: number, runnerId: string) => {
  const seed = runnerId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const offsetLat = (seed % 10) * 0.00005 * (seed % 2 === 0 ? 1 : -1)
  const offsetLng = (seed % 8) * 0.00005 * (seed % 2 === 0 ? 1 : -1)
  const lapLength = 2
  const angle = ((distance % lapLength) / lapLength) * Math.PI * 2
  const radLat = 0.0015 + (seed % 3) * 0.0001
  const radLng = 0.002 + (seed % 4) * 0.0001
  return {
    lat: CENTER.lat + Math.sin(angle) * radLat + offsetLat,
    lng: CENTER.lng + Math.cos(angle) * radLng + offsetLng,
  }
}

type RaceScreenProps = {
  initialRunners: Runner[]
  startTime: number
  onEndRace: (runners: Runner[]) => void
  playerId?: string
  roomId?: string | null
}

export function RaceScreen({ initialRunners, startTime, onEndRace, playerId, roomId }: RaceScreenProps) {
  const [runners, setRunners] = useState(
    initialRunners.map((r) => ({
      ...r,
      pathHistory: [],
      location: r.location || undefined,
    })),
  )
  const [elapsedTime, setElapsedTime] = useState(0)

  // Update current player's position via GPS
  useEffect(() => {
    if (!playerId || !("geolocation" in navigator)) {
      console.log("Geolocation not supported or no player ID")
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed } = position.coords

        setRunners((prev) =>
          prev.map((runner) => {
            // Only update the current player based on their ID
            if (runner.id === playerId) {
              const newLocation = { lat: latitude, lng: longitude }
              const prevLocation = runner.location

              let distAdded = 0
              if (prevLocation) {
                distAdded = getDistanceFromLatLonInKm(prevLocation.lat, prevLocation.lng, latitude, longitude)
              }

              // Filter huge jumps (GPS glitches)
              if (distAdded > 0.1) distAdded = 0 // Ignore jumps > 100m in one tick

              const newDistance = runner.distance + distAdded
              const currentSpeed = speed !== null ? speed * 3.6 : distAdded > 0 ? distAdded / (1 / 3600) : 0

              // Update room if in a room
              if (roomId) {
                fetch(`/api/rooms/${roomId}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'update',
                    playerId,
                    lat: latitude,
                    lng: longitude,
                    distance: newDistance,
                    speed: currentSpeed,
                  }),
                }).catch(console.error)
              }

              return {
                ...runner,
                distance: newDistance,
                speed: currentSpeed || 0,
                location: newLocation,
                pathHistory: [...(runner.pathHistory || []), newLocation],
              }
            }
            return runner
          }),
        )
      },
      (error) => console.error("GPS Error:", error),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [playerId, roomId])

  // Sync with room if in a room
  useEffect(() => {
    if (!roomId) return

    const syncRoom = async () => {
      try {
        const response = await fetch(`/api/rooms/${roomId}`)
        const data = await response.json()
        if (data.success && data.room.players) {
          setRunners((prev) =>
            prev.map((runner) => {
              const roomPlayer = data.room.players.find((p: any) => p.id === runner.id)
              if (roomPlayer && runner.id !== playerId) {
                // Update other players from room data
                return {
                  ...runner,
                  distance: roomPlayer.distance || runner.distance,
                  speed: roomPlayer.speed || runner.speed,
                  location: roomPlayer.lat && roomPlayer.lng 
                    ? { lat: roomPlayer.lat, lng: roomPlayer.lng }
                    : runner.location,
                  time: data.room.startTime 
                    ? Math.floor((Date.now() - data.room.startTime) / 1000)
                    : runner.time,
                }
              }
              return runner
            }),
          )
        }
      } catch (error) {
        console.error('Error syncing room:', error)
      }
    }

    const interval = setInterval(syncRoom, 1000) // Sync every second
    return () => clearInterval(interval)
  }, [roomId, playerId])

  // Update elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const elapsed = Math.floor((now - startTime) / 1000)
      setElapsedTime(elapsed)

      // Update time for all runners
      setRunners((prev) =>
        prev.map((runner) => ({
          ...runner,
          time: elapsed,
        })),
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const sortedRunners = [...runners].sort((a, b) => b.distance - a.distance)
  const leader = sortedRunners[0]

  const handleEndRace = () => {
    onEndRace(runners)
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-background via-background to-accent/5 pb-32">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Timer and Stats */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center space-y-4 pt-8"
        >
          <div className="text-7xl font-black text-primary tabular-nums">{formatTime(elapsedTime)}</div>
          <div className="flex justify-center gap-8 text-sm text-muted-foreground">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{leader.distance.toFixed(2)}</div>
              <div>km (leader)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{leader.speed.toFixed(1)}</div>
              <div>km/h (top speed)</div>
            </div>
          </div>
        </motion.div>

        {/* Leader Banner */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="sticky top-4 z-10"
        >
          <Card className="p-4 bg-gradient-to-r from-primary/20 to-accent/20 border-2 border-primary/50 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-primary" />
              <div>
                <div className="text-sm font-semibold text-muted-foreground">Currently Leading</div>
                <div className="text-xl font-black text-foreground flex items-center gap-2">
                  <span className="text-2xl">{leader.avatar}</span>
                  {leader.name}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="h-64 rounded-xl overflow-hidden shadow-inner border-2 border-border">
          <MapComponent runners={runners} />
        </div>

        {/* Runner Progress Bars */}
        <div className="space-y-4">
          {sortedRunners.map((runner, index) => (
            <motion.div
              key={runner.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-4 border-2 hover:shadow-lg transition-shadow">
                <div className="space-y-3">
                  {/* Runner Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-md border-2 border-white/20"
                        style={{ backgroundColor: runner.color }}
                      >
                        {runner.avatar}
                      </div>
                      <div>
                        <div className="font-bold text-lg text-foreground">{runner.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Zap className="w-3 h-3" />
                          {runner.speed.toFixed(1)} km/h
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-foreground">{runner.distance.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">km</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ backgroundColor: runner.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((runner.distance / (leader.distance || 1)) * 100, 100)}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* End Race Button */}
        <div className="fixed bottom-6 left-6 right-6 max-w-2xl mx-auto">
          <Button
            onClick={handleEndRace}
            size="lg"
            className="w-full text-xl font-black py-6 rounded-2xl bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-2xl"
          >
            End Race 🏁
          </Button>
        </div>
      </div>
    </div>
  )
}
