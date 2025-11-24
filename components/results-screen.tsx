"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { Zap, Clock, Gauge, Trophy } from "lucide-react"
import type { Runner, Player } from "@/app/page"

type ResultsScreenProps = {
  runners: Runner[]
  onRestart: () => void
  player: Player
}

const CONFETTI_COLORS = ["#EF4444", "#3B82F6", "#84CC16", "#F97316", "#EC4899", "#A855F7"]

const HYPE_PHRASES = [
  "You cooked everyone",
  "You zoomed",
  "Absolute speed demon",
  "No one stood a chance",
  "Built different today",
]

export function ResultsScreen({ runners, onRestart, player }: ResultsScreenProps) {
  const [showConfetti, setShowConfetti] = useState(true)
  // Sort by points first (primary), then by distance (secondary)
  const sortedRunners = [...runners].sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points
    }
    return b.distance - a.distance
  })
  const winner = sortedRunners[0]
  const hyePhrase = HYPE_PHRASES[Math.floor(Math.random() * HYPE_PHRASES.length)]

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-background via-background to-primary/5 pb-24 relative overflow-hidden">
      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && (
          <>
            {Array.from({ length: 50 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-${Math.random() * 20}vh`,
                  backgroundColor: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto space-y-6 relative z-10">
        {/* Winner Banner */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: -50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="text-center space-y-4 pt-8"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            className="text-8xl"
          >
            🏆
          </motion.div>

          <div className="space-y-2">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-6xl font-black text-primary"
            >
              WINNER!
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-center gap-3">
                <div
                  className="w-20 h-20 rounded-full shadow-xl flex items-center justify-center text-5xl border-4 border-white"
                  style={{ backgroundColor: winner.color }}
                >
                  {winner.avatar}
                </div>
              </div>
              <div className="text-4xl font-black text-foreground">{winner.name}</div>
              <div className="text-lg font-semibold text-muted-foreground">🔥 Speed Demon of the Day 💨</div>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="pt-4">
            <Card className="inline-block px-6 py-3 bg-gradient-to-r from-primary/20 to-accent/20 border-2 border-primary/50">
              <p className="text-lg font-bold text-foreground italic">&ldquo;{hyePhrase}&rdquo;</p>
            </Card>
          </motion.div>
        </motion.div>

        {/* Rankings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="space-y-4"
        >
          <h2 className="text-3xl font-black text-foreground text-center">Final Rankings</h2>

          <div className="space-y-3">
            {sortedRunners.map((runner, index) => (
              <motion.div
                key={runner.id}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1 + index * 0.15 }}
              >
                <Card
                  className={`p-5 border-2 ${index === 0 ? "border-primary shadow-xl bg-primary/5" : "hover:shadow-lg"} transition-all`}
                >
                  <div className="space-y-4">
                    {/* Rank and Name */}
                    <div className="flex items-center gap-4">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-lg border-2 border-white/20"
                        style={{ backgroundColor: runner.color }}
                      >
                        {runner.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="text-2xl font-black text-foreground">{runner.name}</div>
                        {index === 0 && <div className="text-sm font-bold text-primary">Champion</div>}
                        {index === 1 && <div className="text-sm font-bold text-muted-foreground">Runner Up</div>}
                      </div>
                      {index === 0 && <span className="text-3xl">🔥</span>}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center space-y-1">
                        <div className="flex items-center justify-center text-primary">
                          <Gauge className="w-5 h-5" />
                        </div>
                        <div className="text-2xl font-black text-foreground">{runner.distance.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground font-medium">km</div>
                      </div>
                      <div className="text-center space-y-1">
                        <div className="flex items-center justify-center text-accent">
                          <Zap className="w-5 h-5" />
                        </div>
                        <div className="text-2xl font-black text-foreground">{runner.speed.toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground font-medium">km/h avg</div>
                      </div>
                      <div className="text-center space-y-1">
                        <div className="flex items-center justify-center text-secondary">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div className="text-2xl font-black text-foreground">{formatTime(runner.time)}</div>
                        <div className="text-xs text-muted-foreground font-medium">time</div>
                      </div>
                      <div className="text-center space-y-1">
                        <div className="flex items-center justify-center text-primary">
                          <Trophy className="w-5 h-5" />
                        </div>
                        <div className="text-2xl font-black text-foreground">{runner.points || 0}</div>
                        <div className="text-xs text-muted-foreground font-medium">points</div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Restart Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="pt-6 pb-8"
        >
          <Button
            onClick={onRestart}
            size="lg"
            className="w-full text-2xl font-black py-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Run It Back 🔄
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
