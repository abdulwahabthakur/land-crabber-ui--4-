"use client"

import { useJsApiLoader } from "@react-google-maps/api"
import { useMapsKey } from "@/components/maps-key-provider"

export function useGoogleMaps() {
  const apiKey = useMapsKey()

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    enabled: !!apiKey,
  })

  return { isLoaded, loadError, apiKey }
}
