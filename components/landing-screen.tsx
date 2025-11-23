"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Settings } from "lucide-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { AVAILABLE_COLORS, AVAILABLE_AVATARS } from "@/lib/auth"
import type { Player } from "@/app/page"

type LandingScreenProps = {
  onStart: () => void
  onJoinRoom?: () => void
  player: Player
  onUpdatePlayer: (updates: Partial<Player>) => void
}

export function LandingScreen({ onStart, onJoinRoom, player, onUpdatePlayer }: LandingScreenProps) {
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-background via-background to-primary/5">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-6 right-6 flex items-center gap-3"
      >
        <div className="text-right">
          <div className="text-sm font-semibold text-foreground">{player.name}</div>
          <div className="text-xs text-muted-foreground">IP: {player.ip}</div>
        </div>
        <div className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center text-xl" style={{ backgroundColor: player.color }}>
          {player.avatar}
        </div>
        <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)} className="text-muted-foreground hover:text-foreground">
          <Settings className="w-5 h-5" />
        </Button>
      </motion.div>

      {showSettings && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-20 right-6 z-50"
        >
          <Card className="p-4 w-80 space-y-4">
            <h3 className="font-bold">Player Settings</h3>
            <div>
              <label className="text-sm font-semibold">Name</label>
              <Input
                value={player.name}
                onChange={(e) => onUpdatePlayer({ name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-semibold">Color</label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {AVAILABLE_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => onUpdatePlayer({ color: color.value })}
                    className={`w-8 h-8 rounded-full ${player.color === color.value ? 'ring-2 ring-primary' : ''}`}
                    style={{ backgroundColor: color.value }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold">Avatar</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {AVAILABLE_AVATARS.map((avatar) => (
                  <button
                    key={avatar}
                    onClick={() => onUpdatePlayer({ avatar })}
                    className={`text-2xl p-1 rounded ${player.avatar === avatar ? 'bg-primary/20' : ''}`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={() => setShowSettings(false)} className="w-full">Done</Button>
          </Card>
        </motion.div>
      )}

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-8"
      >
        {/* Crab Icon */}
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="text-8xl"
        >
          🦀
        </motion.div>

        {/* App Name */}
        <div className="space-y-3">
          <h1 className="text-6xl font-black text-primary tracking-tight">Land Crabber</h1>
          <p className="text-xl font-semibold text-muted-foreground">Run. Race. Flex your speed.</p>
        </div>

        {/* York University Badge */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-full text-sm font-bold"
        >
          <span className="text-lg">🏫</span>
          <span>York University</span>
        </motion.div>

        {/* Start Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="pt-8 space-y-4"
        >
          <div className="space-y-3">
            <Button
              onClick={onStart}
              size="lg"
              className="text-2xl font-black px-12 py-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 pulse-glow w-full"
            >
              Start Race (Local)
            </Button>
            {onJoinRoom && (
              <Button
                onClick={onJoinRoom}
                size="lg"
                variant="outline"
                className="text-xl font-black px-12 py-6 rounded-2xl border-2 w-full"
              >
                Join/Create Room (Multiplayer)
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Play locally or join other players via room code
          </p>
        </motion.div>

        {/* Fun Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="pt-8 flex gap-6 justify-center text-sm text-muted-foreground"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">1-4</div>
            <div>Players</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">∞</div>
            <div>Fun</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">100%</div>
            <div>Vibes</div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
