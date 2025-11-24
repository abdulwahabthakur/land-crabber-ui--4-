"use client"

import { useState, useEffect } from "react"
import { LandingScreen } from "@/components/landing-screen"
import { RoomScreen } from "@/components/room-screen"
import { SetupScreen } from "@/components/setup-screen"
import { RaceScreen } from "@/components/race-screen"
import { ResultsScreen } from "@/components/results-screen"
import { AVAILABLE_COLORS, AVAILABLE_AVATARS } from "@/lib/auth"

export type Runner = {
  id: string
  name: string
  color: string
  avatar: string
  distance: number
  speed: number
  time: number
  points: number
  location?: { lat: number; lng: number }
  pathHistory?: { lat: number; lng: number }[]
}

export type RaceData = {
  runners: Runner[]
  startTime: number
  isActive: boolean
}

export type Player = {
  id: string
  ip: string
  name: string
  color: string
  avatar: string
}

export default function Page() {
  const [player, setPlayer] = useState<Player | null>(null)
  const [screen, setScreen] = useState<"landing" | "room" | "setup" | "race" | "results">("landing")
  const [runners, setRunners] = useState<Runner[]>([])
  const [raceData, setRaceData] = useState<RaceData | null>(null)
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null)
  const [raceDuration, setRaceDuration] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Get player info based on IP on mount
  useEffect(() => {
    let isMounted = true
    
    const getPlayerInfo = async () => {
      // Set a timeout to ensure we don't wait forever
      const timeoutId = setTimeout(() => {
        if (isMounted) {
          // Fallback if API takes too long
          const fallbackPlayer: Player = {
            id: `player-${Date.now()}`,
            ip: 'unknown',
            name: 'Player 1',
            color: AVAILABLE_COLORS[0].value,
            avatar: AVAILABLE_AVATARS[0],
          }
          
          // Try to load from localStorage
          if (typeof window !== 'undefined') {
            const savedPlayer = localStorage.getItem('land-crabber-player')
            if (savedPlayer) {
              try {
                const parsed = JSON.parse(savedPlayer)
                setPlayer({ ...fallbackPlayer, ...parsed })
              } catch {
                setPlayer(fallbackPlayer)
              }
            } else {
              setPlayer(fallbackPlayer)
            }
          } else {
            setPlayer(fallbackPlayer)
          }
          setIsLoading(false)
        }
      }, 2000) // 2 second timeout

      try {
        const controller = new AbortController()
        const fetchTimeout = setTimeout(() => controller.abort(), 3000)
        
        const response = await fetch('/api/ip', { 
          signal: controller.signal
        })
        clearTimeout(fetchTimeout)
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          throw new Error('Failed to fetch IP')
        }
        const data = await response.json()
        
        if (data.success) {
          // Create a player object with default values
          const ipParts = data.ip.split('.')
          const defaultPlayer: Player = {
            id: data.playerId,
            ip: data.ip,
            name: `Player ${ipParts[ipParts.length - 1] || '1'}`,
            color: AVAILABLE_COLORS[0].value,
            avatar: AVAILABLE_AVATARS[0],
          }
          
          // Try to load from localStorage if exists
          if (typeof window !== 'undefined') {
            const savedPlayer = localStorage.getItem('land-crabber-player')
            if (savedPlayer) {
              try {
                const parsed = JSON.parse(savedPlayer)
                setPlayer({ ...defaultPlayer, ...parsed, id: data.playerId, ip: data.ip })
              } catch {
                setPlayer(defaultPlayer)
              }
            } else {
              setPlayer(defaultPlayer)
            }
          } else {
            setPlayer(defaultPlayer)
          }
        } else {
          throw new Error('API returned unsuccessful response')
        }
      } catch (err) {
        clearTimeout(timeoutId)
        console.error('Error getting player info:', err)
        // Fallback player - always set something so page doesn't stay loading
        const fallbackPlayer: Player = {
          id: `player-${Date.now()}`,
          ip: 'unknown',
          name: 'Player 1',
          color: AVAILABLE_COLORS[0].value,
          avatar: AVAILABLE_AVATARS[0],
        }
        
        // Try to load from localStorage
        if (typeof window !== 'undefined') {
          const savedPlayer = localStorage.getItem('land-crabber-player')
          if (savedPlayer) {
            try {
              const parsed = JSON.parse(savedPlayer)
              setPlayer({ ...fallbackPlayer, ...parsed })
            } catch {
              setPlayer(fallbackPlayer)
            }
          } else {
            setPlayer(fallbackPlayer)
          }
        } else {
          setPlayer(fallbackPlayer)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }
    getPlayerInfo()
    
    return () => {
      isMounted = false
    }
  }, [])

  // Save player to localStorage when it changes
  useEffect(() => {
    if (player && typeof window !== 'undefined') {
      localStorage.setItem('land-crabber-player', JSON.stringify({
        name: player.name,
        color: player.color,
        avatar: player.avatar,
      }))
    }
  }, [player])

  // Show loading state
  if (isLoading || !player) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-spin">🦀</div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const handleStartRace = () => {
    // Direct setup for local play
    setScreen("setup")
  }

  const handleJoinRoomScreen = () => {
    setScreen("room")
  }

  const handleJoinRoom = (roomId: string) => {
    setCurrentRoomId(roomId)
    setScreen("setup")
  }

  const handleCreateRoom = (roomId: string) => {
    setCurrentRoomId(roomId)
    setScreen("setup")
  }

  const handleBeginRace = async (
    setupRunners: Omit<Runner, "distance" | "speed" | "time" | "points" | "location" | "pathHistory">[],
  ) => {
    const initialRunners = setupRunners.map((r) => ({
      ...r,
      distance: 0,
      speed: 0,
      time: 0,
      points: 0,
      location: undefined,
      pathHistory: [],
    }))
    setRunners(initialRunners)
    
    // If in a room, fetch the room data to get duration
    let duration: number | null = null
    if (currentRoomId) {
      try {
        const response = await fetch(`/api/rooms/${currentRoomId}`)
        const data = await response.json()
        if (data.success && data.room) {
          duration = data.room.duration || null
        }
      } catch (error) {
        console.error('Error fetching room duration:', error)
      }
    }
    
    setRaceDuration(duration)
    setRaceData({
      runners: initialRunners,
      startTime: Date.now(),
      isActive: true,
    })
    setScreen("race")
  }

  const handleEndRace = (finalRunners: Runner[]) => {
    setRunners(finalRunners)
    setScreen("results")
  }

  const handleRestart = () => {
    setRunners([])
    setRaceData(null)
    setScreen("landing")
  }

  const updatePlayer = (updates: Partial<Player>) => {
    setPlayer((prev) => prev ? { ...prev, ...updates } : null)
  }

  const handleLeaveRoom = () => {
    setCurrentRoomId(null)
    setScreen("landing")
  }

  return (
    <div className="min-h-screen bg-background">
      {screen === "landing" && player && (
        <LandingScreen onStart={handleStartRace} onJoinRoom={handleJoinRoomScreen} player={player} onUpdatePlayer={updatePlayer} />
      )}
      {screen === "room" && player && (
        <RoomScreen
          player={player}
          onJoinRoom={handleJoinRoom}
          onCreateRoom={handleCreateRoom}
          onBack={() => setScreen("landing")}
        />
      )}
      {screen === "setup" && player && (
        <SetupScreen 
          onBegin={handleBeginRace} 
          player={player} 
          roomId={currentRoomId} 
          onLeave={handleLeaveRoom}
          onRaceStart={async () => {
            // When race starts from room, fetch room data and begin race
            if (currentRoomId) {
              try {
                const response = await fetch(`/api/rooms/${currentRoomId}`)
                const data = await response.json()
                if (data.success && data.room && data.room.players) {
                  const roomRunners = data.room.players.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    color: p.color,
                    avatar: p.avatar,
                  }))
                  await handleBeginRace(roomRunners)
                }
              } catch (error) {
                console.error('Error starting race from room:', error)
              }
            }
          }}
        />
      )}
      {screen === "race" && raceData && player && (
        <RaceScreen 
          initialRunners={runners} 
          startTime={raceData.startTime} 
          onEndRace={handleEndRace} 
          playerId={player.id} 
          roomId={currentRoomId}
          duration={raceDuration}
        />
      )}
      {screen === "results" && player && (
        <ResultsScreen runners={runners} onRestart={handleRestart} player={player} />
      )}
    </div>
  )
}
