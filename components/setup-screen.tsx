"use client"

import { useState, useEffect } from "react"
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
}

export function SetupScreen({ onBegin, player, roomId }: SetupScreenProps) {
  const [runners, setRunners] = useState<Runner[]>([
    { id: player.id, name: player.name, color: player.color, avatar: player.avatar },
  ])
  const [isLoadingRoom, setIsLoadingRoom] = useState(!!roomId)

  // Load players from room if roomId exists
  useEffect(() => {
    if (!roomId) return

    const loadRoom = async () => {
      try {
        const response = await fetch(`/api/rooms/${roomId}`)
        const data = await response.json()
        if (data.success && data.room.players) {
          const roomRunners = data.room.players.map((p: any) => ({
            id: p.id,
            name: p.name,
            color: p.color,
            avatar: p.avatar,
          }))
          setRunners(roomRunners)
        }
      } catch (error) {
        console.error('Error loading room:', error)
      } finally {
        setIsLoadingRoom(false)
      }
    }

    loadRoom()

    // Poll for room updates
    const interval = setInterval(loadRoom, 2000)
    return () => clearInterval(interval)
  }, [roomId])

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
    setRunners(runners.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  const canStart = runners.every((r) => r.name.trim() !== "")

  const handleBegin = async () => {
    if (!canStart) return
    
    // If in a room, start the race for everyone
    if (roomId) {
      try {
        const response = await fetch(`/api/rooms/${roomId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start' }),
        })
        const data = await response.json()
        if (data.success) {
          // Convert room players to runners
          const roomRunners = data.room.players.map((p: any) => ({
            id: p.id,
            name: p.name,
            color: p.color,
            avatar: p.avatar,
          }))
          onBegin(roomRunners)
        }
      } catch (error) {
        console.error('Error starting race:', error)
        // Fallback to local race
        onBegin(runners)
      }
    } else {
      // Local race without room
      if (runners.length >= 2) {
        onBegin(runners)
      } else {
        alert('Need at least 2 players to start')
      }
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
          {roomId && (
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

        {/* Start Race Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="pt-4"
        >
          <Button
            onClick={handleBegin}
            disabled={!canStart}
            size="lg"
            className="w-full text-2xl font-black py-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {"Let's Crab! 🦀"}
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
