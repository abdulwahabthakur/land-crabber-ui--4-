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
  duration?: number | null // Race duration in seconds (null = no auto-stop)
}

export function RaceScreen({ initialRunners, startTime, onEndRace, playerId, roomId, duration }: RaceScreenProps) {
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

              // Calculate points: 1 point per 100m, bonus for speed
              const pointsGained = Math.floor(distAdded * 10) // 1 point per 100m
              const speedBonus = currentSpeed > 10 ? Math.floor(currentSpeed / 10) : 0 // Bonus for speed
              const newPoints = (runner.points || 0) + pointsGained + speedBonus

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
                    points: newPoints,
                  }),
                }).catch(console.error)
              }

              return {
                ...runner,
                distance: newDistance,
                speed: currentSpeed || 0,
                points: newPoints,
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

  // Sync with room if in a room - update all players' positions
  useEffect(() => {
    if (!roomId) return

    const syncRoom = async () => {
      try {
        const response = await fetch(`/api/rooms/${roomId}`)
        const data = await response.json()
        if (data.success && data.room && data.room.players) {
          setRunners((prev) => {
            const roomPlayers = data.room.players as any[]
            const roomPlayerIds = new Set(roomPlayers.map((p: any) => p.id))
            
            // Create a map of current runners for quick lookup
            const currentRunnersMap = new Map(prev.map(r => [r.id, r]))
            
            // Build updated runners list from room data
            const updatedRunners = roomPlayers.map((roomPlayer: any) => {
              const existingRunner = currentRunnersMap.get(roomPlayer.id)
              
              // If this is the current player, preserve their local state (GPS updates are more accurate)
              if (roomPlayer.id === playerId && existingRunner) {
                return existingRunner
              }
              
              // For other players, use room data
              const newLocation = roomPlayer.lat && roomPlayer.lng 
                ? { lat: roomPlayer.lat, lng: roomPlayer.lng }
                : existingRunner?.location
              
              // Update path history if location changed
              let pathHistory = existingRunner?.pathHistory || []
              if (newLocation && existingRunner?.location) {
                const locChanged = 
                  Math.abs(newLocation.lat - existingRunner.location.lat) > 0.00001 ||
                  Math.abs(newLocation.lng - existingRunner.location.lng) > 0.00001
                if (locChanged) {
                  pathHistory = [...(pathHistory || []), newLocation]
                }
              } else if (newLocation && !existingRunner?.location) {
                pathHistory = [newLocation]
              }
              
              return {
                id: roomPlayer.id,
                name: roomPlayer.name,
                color: roomPlayer.color,
                avatar: roomPlayer.avatar,
                distance: roomPlayer.distance || 0,
                speed: roomPlayer.speed || 0,
                time: data.room.startTime 
                  ? Math.floor((Date.now() - data.room.startTime) / 1000)
                  : existingRunner?.time || 0,
                points: roomPlayer.points || 0,
                location: newLocation,
                pathHistory: pathHistory,
              }
            })

            // If current player is not in room players (shouldn't happen, but handle it)
            if (!roomPlayerIds.has(playerId || '')) {
              const currentPlayer = prev.find(r => r.id === playerId)
              if (currentPlayer) {
                updatedRunners.push(currentPlayer)
              }
            }

            return updatedRunners
          })
        }
      } catch (error) {
        console.error('Error syncing room:', error)
      }
    }

    const interval = setInterval(syncRoom, 1000) // Sync every second
    return () => clearInterval(interval)
  }, [roomId, playerId])

  // Leave room when component unmounts or page closes
  useEffect(() => {
    if (!roomId || !playerId) return

    const handleLeave = async () => {
      try {
        await fetch(`/api/rooms/${roomId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'leave',
            playerId,
          }),
        })
      } catch (error) {
        console.error('Error leaving room:', error)
      }
    }

    const handleBeforeUnload = () => {
      // Use sendBeacon for more reliable delivery on page close
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify({
          action: 'leave',
          playerId,
        })], { type: 'application/json' })
        navigator.sendBeacon(`/api/rooms/${roomId}`, blob)
      } else {
        handleLeave()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      handleLeave()
    }
  }, [roomId, playerId])

  // Update elapsed time and check for auto-stop
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const elapsed = Math.floor((now - startTime) / 1000)
      setElapsedTime(elapsed)

      // Check if duration has been reached (auto-stop)
      if (duration && elapsed >= duration) {
        // Auto-end the race
        setRunners((prev) => {
          const finalRunners = prev.map((runner) => ({
            ...runner,
            time: elapsed,
          }))
          // End race with final runners
          setTimeout(() => onEndRace(finalRunners), 100)
          return finalRunners
        })
        return
      }

      // Update time for all runners
      setRunners((prev) =>
        prev.map((runner) => ({
          ...runner,
          time: elapsed,
        })),
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime, duration, onEndRace])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Sort by points first (primary), then by distance (secondary)
  const sortedRunners = [...runners].sort((a, b) => {
    // Primary sort: points (higher is better)
    if (b.points !== a.points) {
      return b.points - a.points
    }
    // Secondary sort: distance (higher is better)
    return b.distance - a.distance
  })
  const leader = sortedRunners[0] || runners[0]

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
          <div className="space-y-2">
            <div className="text-7xl font-black text-primary tabular-nums">{formatTime(elapsedTime)}</div>
            {duration && (
              <div className="text-sm text-muted-foreground">
                Auto-stop: {formatTime(duration - elapsedTime)} remaining
              </div>
            )}
          </div>
          <div className="flex justify-center gap-8 text-sm text-muted-foreground">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{leader?.points || 0}</div>
              <div>points (leader)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{leader?.distance.toFixed(2) || '0.00'}</div>
              <div>km</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{leader?.speed.toFixed(1) || '0.0'}</div>
              <div>km/h (top speed)</div>
            </div>
          </div>
        </motion.div>

        {/* Leader Banner */}
        {leader && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="sticky top-4 z-10"
          >
            <Card className="p-4 bg-gradient-to-r from-primary/20 to-accent/20 border-2 border-primary/50 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-primary" />
                <div>
                  <div className="text-sm font-semibold text-muted-foreground">Currently Leading (Points)</div>
                  <div className="text-xl font-black text-foreground flex items-center gap-2">
                    <span className="text-2xl">{leader.avatar}</span>
                    {leader.name} - {leader.points || 0} pts
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        <div className="h-64 rounded-xl overflow-hidden shadow-inner border-2 border-border">
          <MapComponent key={`map-${runners.map(r => r.id).join('-')}-${runners.map(r => r.location?.lat + r.location?.lng).join('-')}`} runners={runners} />
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
              <Card className="p-4 border-2 hover:shadow-lg transition-shadow relative">
                <div className="space-y-3">
                  {/* Runner Info */}
                  <div className="flex items-center justify-between pr-10">
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
                          {runner.speed.toFixed(1)} km/h • {runner.points || 0} pts
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-foreground">{runner.distance.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">km</div>
                    </div>
                  </div>

                  {/* Progress Bar - based on points */}
                  <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ backgroundColor: runner.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((runner.points / (leader?.points || 1)) * 100, 100)}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  {/* Rank Badge */}
                  <div className="absolute top-2 right-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                      #{index + 1}
                    </div>
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
