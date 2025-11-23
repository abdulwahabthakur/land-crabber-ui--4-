"use client"

import { useState, useCallback, memo, useMemo } from "react"
import { GoogleMap, OverlayView, Polyline } from "@react-google-maps/api"
import { motion, AnimatePresence } from "framer-motion"
import { Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useGoogleMaps } from "@/hooks/use-google-maps"
import { RunnerMarker3D } from "./RunnerMarker3D" // Import RunnerMarker3D

type MapRunner = {
  id: string
  name: string
  color: string
  distance: number
  avatar: string
  location?: { lat: number; lng: number }
  pathHistory?: { lat: number; lng: number }[]
}

type MapComponentProps = {
  runners: MapRunner[]
}

const MapComponentInternal = ({ runners }: MapComponentProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const { isLoaded, loadError, apiKey } = useGoogleMaps()

  const [map, setMap] = useState(null)

  // York University Keele Campus Bounds
  const YORK_BOUNDS = {
    north: 43.778,
    south: 43.769,
    east: -79.496,
    west: -79.508,
  }

  const CENTER = {
    lat: 43.7735,
    lng: -79.5019,
  }

  const onLoad = useCallback(function callback(map) {
    setMap(map)
  }, [])

  const onUnmount = useCallback(function callback(map) {
    setMap(null)
  }, [])

  const containerStyle = {
    width: "100%",
    height: "100%",
  }

  const mapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    gestureHandling: "cooperative",
    tilt: 45,
    heading: 0,
    restriction: {
      latLngBounds: YORK_BOUNDS,
      strictBounds: false, // Relaxed bounds slightly for better UX
    },
    styles: [
      {
        featureType: "poi.school",
        elementType: "geometry",
        stylers: [{ color: "#f5f5f5" }],
      },
      {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#e6f4ea" }],
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#c9ebf2" }],
      },
    ],
  }

  const MapContent = (
    <div className="relative w-full h-full">
      {!apiKey || loadError || !isLoaded ? (
        <FallbackMap runners={runners} />
      ) : (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={CENTER}
          zoom={16}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={mapOptions}
        >
          {runners.map(
            (runner) =>
              runner.pathHistory &&
              runner.pathHistory.length > 1 && (
                <Polyline
                  key={`path-${runner.id}`}
                  path={runner.pathHistory}
                  options={{
                    strokeColor: runner.color,
                    strokeOpacity: 0.8,
                    strokeWeight: 3, // Thin track as requested
                    clickable: false,
                    draggable: false,
                    editable: false,
                    visible: true,
                    geodesic: true,
                  }}
                />
              ),
          )}

          {runners.map((runner, index) => {
            const position = runner.location || { lat: 43.7735, lng: -79.5019 } // Fallback to center if undefined

            return (
              <OverlayView key={runner.id} position={position} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                <RunnerMarker3D runner={runner} isLeader={index === 0} />
              </OverlayView>
            )
          })}
        </GoogleMap>
      )}

      {/* Expand/Collapse Button */}
      <Button
        size="icon"
        variant="secondary"
        className="absolute top-4 right-4 z-50 shadow-lg bg-white hover:bg-gray-100 text-black rounded-full"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </Button>
    </div>
  )

  return (
    <>
      {/* Normal View */}
      <div className="w-full h-full rounded-xl overflow-hidden relative">{MapContent}</div>

      {/* Expanded View Modal */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 p-4 md:p-8 bg-black/60 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="w-full h-full max-w-6xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl relative border-4 border-white">
              {MapContent}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

const FallbackMap = ({ runners }: { runners: MapRunner[] }) => {
  const getFallbackPosition = (distance: number, runnerId: string) => {
    const seed = runnerId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const laneOffset = (seed % 10) - 5 // -5 to +5% offset

    // 2km lap length
    const angle = (distance % 2) * Math.PI * 2 - Math.PI / 2

    // Calculate x/y percentages (50 is center)
    // We adjust the radii to match the CSS positioning below
    const radiusX = 45 + laneOffset / 2
    const radiusY = 35 + laneOffset / 2

    const x = 50 + Math.cos(angle) * radiusX
    const y = 50 + Math.sin(angle) * radiusY

    return { x, y }
  }

  const trails = useMemo(() => {
    return runners.map((runner) => {
      const points = []
      // Generate history points
      for (let d = 0; d <= runner.distance; d += 0.05) {
        // 50m steps for SVG
        const pos = getFallbackPosition(d, runner.id)
        points.push(`${pos.x},${pos.y}`)
      }
      // Add current position
      const current = getFallbackPosition(runner.distance, runner.id)
      points.push(`${current.x},${current.y}`)

      return {
        id: runner.id,
        color: runner.color,
        pathData: `M ${points.join(" L ")}`,
      }
    })
  }, [runners])

  return (
    <div className="w-full h-full bg-blue-50/50 relative overflow-hidden flex items-center justify-center bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
      <div className="text-center p-4 z-10">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg border-2 border-blue-100">
          <span className="text-3xl">🏟️</span>
        </div>
        <h3 className="font-bold text-slate-800 mb-2">Simulated Track Mode</h3>
        <p className="text-xs text-slate-500 max-w-[200px] mx-auto">
          Add a Google Maps API key to see the real York University campus.
        </p>
      </div>

      {/* Simulated Runners on a simple track */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ perspective: "1000px" }}
      >
        <div
          className="w-[80%] h-[60%] border-[6px] border-white bg-red-50/30 rounded-[100px] shadow-2xl relative"
          style={{ transform: "rotateX(40deg) scale(0.9)" }}
        >
          <div className="absolute inset-0 border-2 border-dashed border-red-200 rounded-[94px] m-1" />

          <svg className="absolute inset-0 w-full h-full overflow-visible rounded-[100px]" style={{ zIndex: 10 }}>
            {trails.map((trail) => (
              <path
                key={trail.id}
                d={trail.pathData}
                fill="none"
                stroke={trail.color}
                strokeWidth="2"
                strokeOpacity="0.8"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          {runners.map((runner, i) => {
            const pos = getFallbackPosition(runner.distance, runner.id)
            const rx = pos.x
            const ry = pos.y

            return (
              <motion.div
                key={runner.id}
                className="absolute z-20"
                style={{
                  left: `${rx}%`,
                  top: `${ry}%`,
                }}
                animate={{ left: `${rx}%`, top: `${ry}%` }}
                transition={{ type: "spring", stiffness: 50 }}
              >
                <div className="-ml-6 -mt-12" style={{ transform: "rotateX(-40deg)" }}>
                  <RunnerMarker3D runner={runner} isLeader={i === 0} />
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export const MapComponent = memo(MapComponentInternal)
