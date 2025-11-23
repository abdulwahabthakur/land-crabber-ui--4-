"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"
import { signup, AVAILABLE_COLORS, getTakenColors, AVAILABLE_AVATARS } from "@/lib/auth"
import type { User } from "@/lib/auth"

type SignupScreenProps = {
  onSignup: (user: User) => void
  onSwitchToLogin: () => void
}

export function SignupScreen({ onSignup, onSwitchToLogin }: SignupScreenProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [selectedColor, setSelectedColor] = useState(AVAILABLE_COLORS[0].value)
  const [selectedAvatar, setSelectedAvatar] = useState(AVAILABLE_AVATARS[0])
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const [takenColors, setTakenColors] = useState<Set<string>>(new Set())

  // Load taken colors on mount
  useEffect(() => {
    const loadTakenColors = async () => {
      const colors = await getTakenColors()
      setTakenColors(colors)
    }
    loadTakenColors()
  }, [])

  const handleSignup = async () => {
    setError("")
    setIsLoading(true)

    try {
      const result = await signup(name, email, password, selectedColor, selectedAvatar)
      setIsLoading(false)

      if (result.success && result.user) {
        onSignup(result.user)
      } else {
        setError(result.error || "Signup failed")
      }
    } catch (err) {
      setIsLoading(false)
      setError("Network error. Please try again.")
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-background via-background to-accent/5">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8"
      >
        {/* Logo */}
        <motion.div
          animate={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="text-center text-7xl"
        >
          🦀
        </motion.div>

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black text-foreground">Join the Crew!</h1>
          <p className="text-lg text-muted-foreground">Create your Crabby account</p>
        </div>

        {/* Signup Form */}
        <Card className="p-6 border-2 shadow-xl">
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-muted-foreground">Pick Your Avatar</label>
              <div className="flex flex-wrap gap-2 justify-center p-2 bg-muted/30 rounded-xl">
                {AVAILABLE_AVATARS.map((avatar) => (
                  <button
                    key={avatar}
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`w-10 h-10 text-2xl flex items-center justify-center rounded-full transition-all ${
                      selectedAvatar === avatar
                        ? "bg-background shadow-md scale-110 ring-2 ring-primary"
                        : "hover:scale-110 opacity-70 hover:opacity-100"
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">Name</label>
              <Input
                type="text"
                placeholder="Your awesome name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-lg border-2 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">Email</label>
              <Input
                type="email"
                placeholder="your.email@yorku.ca"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-lg border-2 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-lg border-2 focus:border-primary"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-muted-foreground">Pick Your Color</label>
              <div className="grid grid-cols-4 gap-2">
                {AVAILABLE_COLORS.map((color) => {
                  const isTaken = takenColors.has(color.value)
                  const isSelected = selectedColor === color.value

                  return (
                    <button
                      key={color.value}
                      onClick={() => !isTaken && setSelectedColor(color.value)}
                      disabled={isTaken}
                      className={`relative p-2 rounded-xl border-2 transition-all duration-200 ${
                        isSelected
                          ? "border-ring ring-2 ring-ring/50 scale-105"
                          : isTaken
                            ? "opacity-40 cursor-not-allowed"
                            : "border-border hover:border-primary hover:scale-105"
                      }`}
                    >
                      <div
                        className="w-full aspect-square rounded-lg shadow-sm mb-1"
                        style={{ backgroundColor: color.value }}
                      />
                      {isTaken && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-xl">
                          <span className="text-sm">🔒</span>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
              >
                <p className="text-sm text-destructive font-semibold">{error}</p>
              </motion.div>
            )}

            <Button
              onClick={handleSignup}
              disabled={isLoading || !name || !email || !password}
              size="lg"
              className="w-full text-xl font-black py-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
            >
              {isLoading ? "Creating Account..." : "Create Crabby Account"}
            </Button>
          </div>
        </Card>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-muted-foreground">
            Already have an account?
            <button onClick={onSwitchToLogin} className="ml-2 font-bold text-primary hover:underline">
              Login
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
