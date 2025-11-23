"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"
import { login } from "@/lib/auth"
import type { User } from "@/lib/auth"

type LoginScreenProps = {
  onLogin: (user: User) => void
  onSwitchToSignup: () => void
}

export function LoginScreen({ onLogin, onSwitchToSignup }: LoginScreenProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    setError("")
    setIsLoading(true)

    try {
      const result = await login(email, password)
      setIsLoading(false)

      if (result.success && result.user) {
        onLogin(result.user)
      } else {
        setError(result.error || "Login failed")
      }
    } catch (err) {
      setIsLoading(false)
      setError("Network error. Please try again.")
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-background via-background to-primary/5">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8"
      >
        {/* Logo */}
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="text-center text-7xl"
        >
          🦀
        </motion.div>

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black text-foreground">Welcome Back!</h1>
          <p className="text-lg text-muted-foreground">Ready to race? Let's go!</p>
        </div>

        {/* Login Form */}
        <Card className="p-6 border-2 shadow-xl">
          <div className="space-y-4">
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
              onClick={handleLogin}
              disabled={isLoading || !email || !password}
              size="lg"
              className="w-full text-xl font-black py-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
            >
              {isLoading ? "Logging In..." : "Login"}
            </Button>
          </div>
        </Card>

        {/* Signup Link */}
        <div className="text-center">
          <p className="text-muted-foreground">
            {"Don't have an account?"}
            <button onClick={onSwitchToSignup} className="ml-2 font-bold text-primary hover:underline">
              Sign Up
            </button>
          </p>
        </div>

        {/* Demo Credentials */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="p-4 bg-muted/50 rounded-lg border border-border"
        >
          <p className="text-xs text-muted-foreground text-center">Demo: demo@yorku.ca / demo123</p>
        </motion.div>
      </motion.div>
    </div>
  )
}
