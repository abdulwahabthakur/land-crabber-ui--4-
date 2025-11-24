"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus } from "lucide-react"
import { AVAILABLE_COLORS, AVAILABLE_AVATARS } from "@/lib/auth"
import type { Player } from "@/app/page"

type Runner = {
  id: string
  name: string
  color: string
  avatar: string
}

type SetupScreenProps = {
  onBegin: (runners: Runner[]) => void
  player: Player
  roomId: string | null
  onLeave?: () => void
  onRaceStart?: () => void // Callback when race starts from room
}

export function SetupScreen({ onBegin, player, roomId, onLeave, onRaceStart }: SetupScreenProps) {
  const [runners, setRunners] = useState<Runner[]>([
    { id: player.id, name: player.name, color: player.color, avatar: player.avatar },
  ])
  const [isLoadingRoom, setIsLoadingRoom] = useState(!!roomId)
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [isHost, setIsHost] = useState(false)
  const [raceDuration, setRaceDuration] = useState<number>(300) // Default 5 minutes in seconds
  const hasJoinedRef = useRef(false)

  // Load players from room if roomId exists and join if needed
  useEffect(() => {
    if (!roomId) {
      setIsLoadingRoom(false)
      return
    }

    // Reset join status when roomId changes
    hasJoinedRef.current = false

    const playerId = player.id
    const playerName = player.name
    const playerColor = player.color
    const playerAvatar = player.avatar

    const joinRoom = async () => {
      if (hasJoinedRef.current) return
      
      try {
        // Get current location for joining
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            enableHighAccuracy: true,
          })
        })

        const joinResponse = await fetch(`/api/rooms/${roomId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'join',
            playerId: playerId,
            playerName: playerName,
            playerColor: playerColor,
            playerAvatar: playerAvatar,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }),
        })

        const joinData = await joinResponse.json()
        if (joinData.success) {
          hasJoinedRef.current = true
          console.log('Successfully joined room:', roomId)
        }
      } catch (error) {
        console.error('Error joining room:', error)
        // Continue anyway - might already be in room
      }
    }

    const loadRoom = async () => {
      try {
        const response = await fetch(`/api/rooms/${roomId}`)
        const data = await response.json()
        if (data.success && data.room) {
          // Get room code if available
          if (data.room.code) {
            setRoomCode(data.room.code)
          }
          
          // Check if current player is the host
          setIsHost(data.room.hostId === playerId)
          
          // Set race duration if host has set it
          if (data.room.duration) {
            setRaceDuration(data.room.duration)
          }
          
          // Check if race has started - if so, transition to race screen
          if (data.room.isActive && data.room.startTime && data.room.players && data.room.players.length >= 2) {
            // Race has started! Convert room players to runners and begin
            const roomRunners = data.room.players.map((p: any) => ({
              id: p.id,
              name: p.name,
              color: p.color,
              avatar: p.avatar,
            }))
            // Call onRaceStart if provided, otherwise use onBegin
            if (onRaceStart) {
              onRaceStart()
            } else {
              onBegin(roomRunners)
            }
            return // Don't continue loading
          }
          
          // Check if current player is in the room
          const playerInRoom = data.room.players?.some((p: any) => p.id === playerId)
          
          // If not in room and haven't tried joining yet, join now
          if (!playerInRoom && !hasJoinedRef.current) {
            await joinRoom()
            // Reload room after joining
            const reloadResponse = await fetch(`/api/rooms/${roomId}`)
            const reloadData = await reloadResponse.json()
            if (reloadData.success && reloadData.room?.players) {
              const roomRunners = reloadData.room.players.map((p: any) => ({
                id: p.id,
                name: p.name,
                color: p.color,
                avatar: p.avatar,
              }))
              setRunners(roomRunners)
            }
            return
          }
          
          if (data.room.players) {
            const roomRunners = data.room.players.map((p: any) => ({
              id: p.id,
              name: p.name,
              color: p.color,
              avatar: p.avatar,
            }))
            setRunners(roomRunners)
          }
        }
      } catch (error) {
        console.error('Error loading room:', error)
      } finally {
        setIsLoadingRoom(false)
      }
    }

    // First load - join if needed, then start polling
    loadRoom()

    // Poll for room updates every 2 seconds
    const interval = setInterval(loadRoom, 2000)
    return () => clearInterval(interval)
  }, [roomId, player.id])

  // Leave room when component unmounts or page closes
  useEffect(() => {
    if (!roomId || !player.id) return

    const handleLeave = async () => {
      try {
        await fetch(`/api/rooms/${roomId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'leave',
            playerId: player.id,
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
          playerId: player.id,
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
  }, [roomId, player.id])

  const addRunner = () => {
    if (runners.length < 6) {
      // Find first available color that isn't taken by current runners
      const currentRunnerColors = new Set(runners.map((r) => r.color))

      const availableColor =
        AVAILABLE_COLORS.find((c) => !currentRunnerColors.has(c.value))?.value ||
        AVAILABLE_COLORS[0].value

      setRunners([
        ...runners,
        {
          id: Date.now().toString(),
          name: "",
          color: availableColor,
          avatar: AVAILABLE_AVATARS[Math.floor(Math.random() * AVAILABLE_AVATARS.length)],
        },
      ])
    }
  }

  const removeRunner = (id: string) => {
    if (runners.length > 1 && id !== player.id) {
      setRunners(runners.filter((r) => r.id !== id))
    }
  }

  const updateRunner = (id: string, field: keyof Runner, value: string) => {
    const updatedRunners = runners.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    setRunners(updatedRunners)
    
    // If updating current player in a room, update the room
    if (roomId && id === player.id) {
      // Get current location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const updatedRunner = updatedRunners.find(r => r.id === id)
          if (updatedRunner) {
            fetch(`/api/rooms/${roomId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'updatePlayer',
                playerId: player.id,
                playerName: updatedRunner.name,
                playerColor: updatedRunner.color,
                playerAvatar: updatedRunner.avatar,
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              }),
            }).catch(console.error)
          }
        },
        (error) => console.error('GPS error:', error)
      )
    }
  }

  const canStart = runners.every((r) => r.name.trim() !== "")

  const handleBegin = async () => {
    if (!canStart) {
      alert('Please fill in all player names')
      return
    }
    
    // Check minimum players
    if (runners.length < 2) {
      alert('Need at least 2 players to start a race')
      return
    }
    
    // If in a room, check if user is host
    if (roomId) {
      if (!isHost) {
        alert('Only the host can start the race')
        return
      }
      
      try {
        const response = await fetch(`/api/rooms/${roomId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'start',
            duration: raceDuration, // Send duration to server
          }),
        })
        const data = await response.json()
        if (data.success && data.room.players.length >= 2) {
          // Convert room players to runners
          const roomRunners = data.room.players.map((p: any) => ({
            id: p.id,
            name: p.name,
            color: p.color,
            avatar: p.avatar,
          }))
          onBegin(roomRunners)
        } else {
          alert(data.error || 'Need at least 2 players in the room to start')
        }
      } catch (error) {
        console.error('Error starting race:', error)
        alert('Failed to start race. Please try again.')
      }
    } else {
      // Local race without room - just start with current runners
      onBegin(runners)
    }
  }

  if (isLoadingRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-spin">🦀</div>
          <p className="text-muted-foreground">Loading room...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-background via-background to-accent/5">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center space-y-2 pt-8"
        >
          <h1 className="text-5xl font-black text-foreground">{"Who's Racing?"}</h1>
          <p className="text-lg text-muted-foreground">
            {roomId ? "Waiting for players to join..." : "Add 2-6 speed demons 🏃‍♂️💨"}
          </p>
          {roomId && roomCode && (
            <div className="p-3 bg-primary/10 rounded-lg border-2 border-primary">
              <p className="text-sm text-muted-foreground mb-1">Room Code:</p>
              <p className="text-3xl font-black text-primary tracking-widest">{roomCode}</p>
              <p className="text-xs text-muted-foreground mt-1">Share this code with other players</p>
            </div>
          )}
          {roomId && !roomCode && (
            <p className="text-sm text-muted-foreground">
              Players will join automatically based on GPS location
            </p>
          )}
        </motion.div>

        {/* Runner Cards */}
        <div className="space-y-4">
          <AnimatePresence>
            {runners.map((runner, index) => (
              <motion.div
                key={runner.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-4 border-2 hover:shadow-lg transition-shadow duration-300">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      {/* Runner Number & Avatar */}
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-md border-2 border-white"
                        style={{ backgroundColor: runner.color }}
                      >
                        {runner.avatar}
                      </div>

                      {/* Name Input */}
                      <div className="flex-1">
                        <Input
                          placeholder={`Runner ${index + 1} name`}
                          value={runner.name}
                          onChange={(e) => updateRunner(runner.id, "name", e.target.value)}
                          className="text-lg font-semibold border-2 focus:border-primary"
                        />
                      </div>

                      {/* Remove Button */}
                      {runners.length > 1 && runner.id !== player.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRunner(runner.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="w-5 h-5" />
                        </Button>
                      )}
                    </div>

                    {/* Avatar Selection (Only for added runners) */}
                    {runner.id !== player.id && (
                      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {AVAILABLE_AVATARS.map((avatar) => (
                          <button
                            key={avatar}
                            onClick={() => updateRunner(runner.id, "avatar", avatar)}
                            className={`text-xl p-1 rounded-full transition-transform ${runner.avatar === avatar ? "bg-accent/20 scale-125" : "hover:scale-110 opacity-60"}`}
                          >
                            {avatar}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Color Selector */}
                    <div className="flex gap-2 flex-wrap">
                      {AVAILABLE_COLORS.map((color) => {
                        // Strict check: Color is taken if ANY other runner in this current setup has it
                        // OR if a global user (other than current user) has it
                        const isTakenByOtherRunner = runners.some((r) => r.id !== runner.id && r.color === color.value)

                        // We NO LONGER check globalUserColors here.
                        // This allows Player 2 to pick "Blue" even if an offline user has "Blue".
                        const isTaken = isTakenByOtherRunner

                        return (
                          <button
                            key={color.value}
                            onClick={() => !isTaken && updateRunner(runner.id, "color", color.value)}
                            disabled={isTaken || runner.id === player.id}
                            className={`w-8 h-8 rounded-full transition-all duration-200 ${
                              runner.color === color.value
                                ? "ring-2 ring-ring ring-offset-2 scale-110"
                                  : isTaken || runner.id === player.id
                                  ? "opacity-20 cursor-not-allowed"
                                  : "hover:scale-105"
                            }`}
                            style={{ backgroundColor: color.value }}
                            title={isTaken ? `${color.name} (Taken)` : color.name}
                          />
                        )
                      })}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Add Runner Button - Only show if not in a room */}
        {!roomId && runners.length < 6 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Button
              onClick={addRunner}
              variant="outline"
              className="w-full py-6 text-lg font-bold border-2 border-dashed hover:border-primary hover:bg-primary/5 bg-transparent"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Another Runner
            </Button>
          </motion.div>
        )}

        {/* Race Duration Input (Host Only) */}
        {roomId && isHost && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-4 border-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground">
                    Race Duration (Auto-Stop Timer)
                  </label>
                  <span className="text-sm text-muted-foreground">
                    {Math.floor(raceDuration / 60)}:{(raceDuration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="60"
                    max="3600"
                    step="60"
                    value={raceDuration}
                    onChange={(e) => setRaceDuration(Math.max(60, Math.min(3600, parseInt(e.target.value) || 300)))}
                    className="flex-1"
                    placeholder="Duration in seconds"
                  />
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRaceDuration(300)}
                      className="text-xs"
                    >
                      5 min
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRaceDuration(600)}
                      className="text-xs"
                    >
                      10 min
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  The race will automatically end after this duration. Only you (the host) can set this.
                </p>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Start Race Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="pt-4 space-y-3"
        >
          {roomId && !isHost && (
            <Card className="p-4 bg-muted/50 border-2 border-muted">
              <p className="text-sm text-center text-muted-foreground">
                ⏳ Waiting for host to start the race...
              </p>
            </Card>
          )}
          <Button
            onClick={handleBegin}
            disabled={!canStart || (roomId && !isHost)}
            size="lg"
            className="w-full text-2xl font-black py-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {roomId && !isHost ? "Waiting for Host..." : "Let's Crab! 🦀"}
          </Button>
          {roomId && onLeave && (
            <Button
              onClick={async () => {
                try {
                  await fetch(`/api/rooms/${roomId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      action: 'leave',
                      playerId: player.id,
                    }),
                  })
                  onLeave()
                } catch (error) {
                  console.error('Error leaving room:', error)
                  onLeave() // Still navigate even if API call fails
                }
              }}
              variant="outline"
              size="lg"
              className="w-full"
            >
              Leave Room
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  )
}
