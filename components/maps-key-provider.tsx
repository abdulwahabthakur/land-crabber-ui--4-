"use client"

import type React from "react"
import { createContext, useContext } from "react"

const MapsKeyContext = createContext<string>("")

export function MapsKeyProvider({
  apiKey,
  children,
}: {
  apiKey: string
  children: React.ReactNode
}) {
  return <MapsKeyContext.Provider value={apiKey}>{children}</MapsKeyContext.Provider>
}

export function useMapsKey() {
  return useContext(MapsKeyContext)
}
