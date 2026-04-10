/**
 * LeafletPolygonMap Component
 *
 * Interactive map component using Leaflet with programmatic polygon drawing.
 * Features:
 * - Esri World Imagery satellite tiles
 * - Programmatic polygon drawing with Leaflet Draw API
 * - Area and perimeter calculation using Turf.js
 * - Touch-optimized for mobile browsers
 * - Custom UI controls (no EditControl)
 * - 20-vertex limit with auto-complete
 */

import { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react'
import {
  MapContainer,
  TileLayer,
  FeatureGroup,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import 'leaflet-draw'
import area from '@turf/area'
import length from '@turf/length'
import { polygon as turfPolygon, lineString } from '@turf/helpers'
import { useI18n } from '../i18n/context'

// Fix for Leaflet marker icons in Vite
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

L.Icon.Default.mergeOptions({
  iconUrl: icon,
  shadowUrl: iconShadow,
})

// Custom teardrop marker icon for polygon vertices
const teardropIcon = L.divIcon({
  className: 'custom-polygon-marker',
  iconSize: [20, 28],
  iconAnchor: [10, 28],
})


export interface PolygonData {
  type: 'Polygon'
  coordinates: [number, number][][]  // [lng, lat] format
}

export interface PolygonMetrics {
  area: number        // Square meters
  perimeter: number   // Meters
  vertices: number    // Number of vertices
}

export interface GeographicBounds {
  north: number
  south: number
  east: number
  west: number
}

interface LeafletPolygonMapProps {
  value?: PolygonData | null
  onChange?: (polygon: PolygonData | null, metrics: PolygonMetrics | null) => void
  center?: [number, number]  // [lat, lng] format
  zoom?: number
  minArea?: number  // Minimum area in square meters (default: 100)
  required?: boolean
  readonly?: boolean
  className?: string
  bounds?: GeographicBounds  // Geographic bounds for validation
  enforceGeoBounds?: boolean  // Whether to enforce geographic bounds (default: true)
}

// Default bounds removed - allowing global polygon drawing
// const DEFAULT_BOUNDS: GeographicBounds = {
//   north: 33.5,
//   south: 29.3,  // Includes Eilat
//   east: 35.9,
//   west: 34.2,
// }

/**
 * Calculate polygon metrics using Turf.js
 */
function calculateMetrics(coordinates: [number, number][][]): PolygonMetrics {
  // Validate input
  if (!coordinates || !coordinates[0] || coordinates[0].length < 4) {
    throw new Error('Invalid polygon coordinates')
  }

  try {
    const turfPoly = turfPolygon(coordinates)

    // Calculate area in square meters
    const areaM2 = area(turfPoly)

    // Calculate perimeter in meters
    const ring = coordinates[0]
    const line = lineString(ring)
    const perimeterKm = length(line, { units: 'kilometers' })
    const perimeterM = perimeterKm * 1000

    // Count vertices (excluding the closing vertex)
    const vertices = ring.length - 1

    return {
      area: Math.round(areaM2),
      perimeter: Math.round(perimeterM),
      vertices,
    }
  } catch (error) {
    console.error('Failed to calculate polygon metrics:', error)
    throw new Error('Unable to calculate polygon metrics')
  }
}

/**
 * Validate polygon coordinates
 * Returns error keys for i18n translation
 */
function validatePolygon(
  coordinates: [number, number][][],
  _minArea: number,
  _bounds?: GeographicBounds,
  _enforceGeoBounds = true
): { valid: boolean; errorKey?: string } {
  // Check if polygon has at least 3 vertices
  if (coordinates[0].length < 4) {
    // 4 because last point closes the polygon
    return { valid: false, errorKey: 'polygon.validation.minVertices' }
  }

  // Geographic bounds validation disabled - allowing global polygon drawing
  // if (enforceGeoBounds && bounds) {
  //   for (const [lng, lat] of coordinates[0]) {
  //     if (
  //       lat < bounds.south ||
  //       lat > bounds.north ||
  //       lng < bounds.west ||
  //       lng > bounds.east
  //     ) {
  //       return {
  //         valid: false,
  //         errorKey: 'polygon.validation.geoBounds',
  //       }
  //     }
  //   }
  // }

  // Check area calculation (but don't enforce minimum)
  try {
    calculateMetrics(coordinates)
  } catch (error) {
    return {
      valid: false,
      errorKey: 'polygon.validation.invalidGeometry',
    }
  }

  return { valid: true }
}

/**
 * Component to re-center map when center prop changes
 */
function MapCenterUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()

  useEffect(() => {
    map.setView(center, zoom, { animate: true })
  }, [center, zoom, map])

  return null
}

/**
 * Custom control buttons for polygon drawing
 */
function PolygonControls({
  hasPolygon,
  isDrawing,
  vertexCount,
  onStartDrawing,
  onCompleteDrawing,
  onDeleteLastVertex,
  onEdit,
  onDelete,
}: {
  hasPolygon: boolean
  isDrawing: boolean
  vertexCount: number
  onStartDrawing: () => void
  onCompleteDrawing: () => void
  onDeleteLastVertex: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { messages } = useI18n()
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex gap-3">
      {!hasPolygon && !isDrawing ? (
        // Initial state: Show "Draw Polygon" button
        <button
          onClick={() => {
            console.log('🟡 [CONTROLS] Draw button clicked')
            onStartDrawing()
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg shadow-lg font-semibold text-lg transition-colors active:bg-blue-700 min-w-[200px]"
        >
          {messages.controls.draw}
        </button>
      ) : isDrawing ? (
        // Drawing mode: Show "Delete Last Point" and "Complete Polygon" buttons
        <>
          <button
            onClick={() => {
              console.log('🟡 [CONTROLS] Delete last vertex button clicked')
              onDeleteLastVertex()
            }}
            disabled={vertexCount === 0}
            className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 md:px-6 md:py-4 rounded-lg shadow-lg font-semibold text-sm md:text-lg transition-colors active:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {messages.controls.deleteLastPoint}
          </button>
          <button
            onClick={() => {
              console.log('🟡 [CONTROLS] Complete polygon button clicked')
              onCompleteDrawing()
            }}
            disabled={vertexCount < 3}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 md:px-6 md:py-4 rounded-lg shadow-lg font-semibold text-sm md:text-lg transition-colors active:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {messages.controls.complete} ({vertexCount})
          </button>
        </>
      ) : (
        // Polygon exists: Show "Edit" and "Delete" buttons
        <>
          <button
            onClick={() => {
              console.log('🟡 [CONTROLS] Edit button clicked')
              onEdit()
            }}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg font-semibold text-lg transition-colors active:bg-green-700"
          >
            {messages.controls.edit}
          </button>
          <button
            onClick={() => {
              console.log('🟡 [CONTROLS] Delete button clicked')
              onDelete()
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-4 rounded-lg shadow-lg font-semibold text-lg transition-colors active:bg-red-700"
          >
            {messages.controls.delete}
          </button>
        </>
      )}
    </div>
  )
}

interface PolygonEditorRef {
  enableEditing: () => void
}

interface PolygonEditorProps {
  value?: PolygonData | null
  onChange?: (polygon: PolygonData | null, metrics: PolygonMetrics | null) => void
  minArea?: number
  readonly?: boolean
  bounds?: GeographicBounds
  enforceGeoBounds?: boolean
  validationError: string | null
  setValidationError: (error: string | null) => void
  onDrawHandlerReady?: (handler: L.Draw.Polygon | null) => void
  onDrawingStateChange?: (isDrawing: boolean, vertexCount: number) => void
}

/**
 * Component to handle polygon editing and emit changes
 */
const PolygonEditor = forwardRef<PolygonEditorRef, PolygonEditorProps>(({
  value,
  onChange,
  minArea = 100,
  readonly = false,
  bounds,
  enforceGeoBounds = true,
  validationError: _validationError,
  setValidationError,
  onDrawHandlerReady,
  onDrawingStateChange,
}, ref) => {
  const { messages, validationMessage } = useI18n()
  const featureGroupRef = useRef<L.FeatureGroup>(null)
  const map = useMap()
  const drawHandlerRef = useRef<L.Draw.Polygon | null>(null)
  const MAX_VERTICES = 20

  // Touch tracking for mobile drag detection
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const touchMovedRef = useRef(false)
  const isDraggingRef = useRef(false)
  const TOUCH_MOVE_THRESHOLD = 10 // pixels
  const DRAG_TIME_THRESHOLD = 150 // milliseconds - taps are usually < 150ms

  // Time-based tap debouncing to prevent duplicate markers
  const lastTapTimeRef = useRef<number>(0)
  const TAP_DEBOUNCE_TIME = 500 // milliseconds - ignore taps within 0.5s of previous tap

  // Initialize draw handler
  useEffect(() => {
    if (!map || readonly) return

    console.log('🔧 [EDITOR] Initializing draw handler')

    const handler = new L.Draw.Polygon(
      // react-leaflet Map is compatible at runtime; @types/leaflet-draw expects DrawMap
      map as never,
      {
      allowIntersection: false,
      showArea: false,  // Disabled due to Leaflet Draw bug causing "type is not defined" error
      metric: true,
      shapeOptions: {
        color: '#3b82f6',
        weight: 2,
        fillOpacity: 0.2,
      },
      drawError: {
        color: '#ef4444',
        message: messages.validation.noIntersecting,
      },
      guidelineDistance: 20,  // FIX: 0 causes infinite loop in _drawGuide. Use default value to prevent freeze
      icon: teardropIcon,
      touchIcon: teardropIcon,  // Ensure touch uses same icon
    })

    console.log('🔧 [EDITOR] Draw handler created:', handler)

    drawHandlerRef.current = handler
    onDrawHandlerReady?.(handler)

    console.log('🔧 [EDITOR] Draw handler ready callback called')

    // FIX: Disable Leaflet Draw's broken _onTouch handler
    // It processes on touchstart (not touchend), so drag distance is always 0
    // We override addHooks to remove the touchstart listener right after it's registered
    const handlerAny = handler as any
    const originalAddHooks = handlerAny.addHooks?.bind(handlerAny)

    if (originalAddHooks && handlerAny._onTouch) {
      handlerAny.addHooks = function() {
        // Call original addHooks (registers all Leaflet listeners including touchstart)
        originalAddHooks()

        // Immediately remove Leaflet's broken touchstart listener
        map.off('touchstart', handlerAny._onTouch, handlerAny)
        console.log('✅ [FIX] Disabled Leaflet _onTouch in addHooks override')
      }
    }

    // Debug: Listen for draw events
    map.on('draw:drawstart', () => console.log('🎯 [MAP] draw:drawstart'))
    map.on('draw:drawstop', () => console.log('🎯 [MAP] draw:drawstop'))

    // Touch event handling for mobile drag detection
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        console.log('👆 [TOUCH] touchstart')
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          time: Date.now(),
        }
        touchMovedRef.current = false
        isDraggingRef.current = false
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current || e.touches.length !== 1) return

      const deltaX = Math.abs(e.touches[0].clientX - touchStartRef.current.x)
      const deltaY = Math.abs(e.touches[0].clientY - touchStartRef.current.y)

      if (deltaX > TOUCH_MOVE_THRESHOLD || deltaY > TOUCH_MOVE_THRESHOLD) {
        console.log('👆 [TOUCH] Movement detected, marking as drag')
        touchMovedRef.current = true
        isDraggingRef.current = true
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      console.log('👆 [TOUCH] touchend, touchMoved:', touchMovedRef.current)

      if (!touchStartRef.current) {
        console.log('⚠️ [TOUCH] No touchStart recorded, skipping')
        return
      }

      // Check if this was a drag based on movement OR duration
      const duration = Date.now() - touchStartRef.current.time
      const wasDrag = touchMovedRef.current || duration > DRAG_TIME_THRESHOLD

      if (wasDrag) {
        isDraggingRef.current = true
        console.log('👆 [TOUCH] Classified as drag (movement or duration > 150ms) - NOT adding vertex')
      } else {
        // NOT a drag - this was a tap, so add vertex manually
        console.log('✅ [TOUCH] Classified as TAP - adding vertex manually')

        const touch = e.changedTouches[0]
        if (touch && handlerAny.addVertex) {
          // Time-based debouncing to prevent duplicate markers
          const currentTime = Date.now()
          const timeSinceLastTap = currentTime - lastTapTimeRef.current

          if (timeSinceLastTap < TAP_DEBOUNCE_TIME) {
            console.log(`⏱️ [TOUCH] Duplicate tap detected (${timeSinceLastTap}ms since last) - IGNORING`)
            return
          }

          // Update last tap time
          lastTapTimeRef.current = currentTime

          // Convert touch coordinates to map latlng
          const point = map.mouseEventToContainerPoint({ clientX: touch.clientX, clientY: touch.clientY } as any)
          const latlng = map.containerPointToLatLng(point)

          console.log('✅ [TOUCH] Adding vertex at:', latlng)
          handlerAny.addVertex(latlng)

          // CRITICAL: Prevent synthetic mouse/click events that would cause Leaflet Draw
          // to process the same tap again, creating duplicate markers
          e.preventDefault()
          console.log('🚫 [TOUCH] Prevented synthetic mouse events')
        } else {
          console.warn('⚠️ [TOUCH] Cannot add vertex - handler not available')
        }
      }

      touchStartRef.current = null

      // Keep the drag flag set until AFTER any synthetic events process
      if (isDraggingRef.current) {
        // Schedule reset for after event processing completes
        Promise.resolve().then(() => {
          setTimeout(() => {
            console.log('👆 [TOUCH] Resetting drag flags')
            touchMovedRef.current = false
            isDraggingRef.current = false
          }, 200)  // FIX: Increased from 50ms to 200ms for slower devices
        })
      }
    }

    // Get the map container element and add touch listeners
    const mapContainer = map.getContainer()
    mapContainer.addEventListener('touchstart', handleTouchStart, { passive: true })
    mapContainer.addEventListener('touchmove', handleTouchMove, { passive: true })
    mapContainer.addEventListener('touchend', handleTouchEnd, { passive: false })  // Non-passive for preventDefault

    return () => {
      console.log('🔧 [EDITOR] Cleaning up draw handler')
      handler.disable()
      drawHandlerRef.current = null
      map.off('draw:drawstart')
      map.off('draw:drawstop')

      // Clean up touch listeners
      mapContainer.removeEventListener('touchstart', handleTouchStart)
      mapContainer.removeEventListener('touchmove', handleTouchMove)
      mapContainer.removeEventListener('touchend', handleTouchEnd)
    }
  }, [map, readonly, onDrawHandlerReady, messages.validation.noIntersecting])

  // Load existing polygon on mount with cleanup
  useEffect(() => {
    if (!value || !featureGroupRef.current) return

    let mounted = true
    const featureGroup = featureGroupRef.current

    // Clear existing layers
    featureGroup.clearLayers()

    // Add polygon to map
    const leafletPolygon = L.polygon(
      value.coordinates[0].map(([lng, lat]) => [lat, lng])
    )
    featureGroup.addLayer(leafletPolygon)

    // Fit map to polygon bounds (only if still mounted)
    if (mounted) {
      const polygonBounds = leafletPolygon.getBounds()
      map.fitBounds(polygonBounds, { padding: [50, 50] })
    }

    return () => {
      mounted = false
      featureGroup.clearLayers()
    }
  }, [value, map])

  // Listen for polygon creation and vertex limiting
  useEffect(() => {
    if (!map) return

    const handleCreated = (e: L.LeafletEvent) => {
      const ev = e as L.DrawEvents.Created
      console.log('🟢 [CREATED] Polygon created event fired:', ev)
      const layer = ev.layer as L.Polygon
      const latLngs = layer.getLatLngs()[0] as L.LatLng[]

      console.log('🟢 [CREATED] LatLngs:', latLngs)
      console.log('🟢 [CREATED] Number of vertices:', latLngs.length)

      // Convert to GeoJSON format [lng, lat]
      const coordinates: [number, number][] = latLngs.map((latLng) => [
        latLng.lng,
        latLng.lat,
      ])

      // Close the polygon
      coordinates.push(coordinates[0])

      const polygonData: PolygonData = {
        type: 'Polygon',
        coordinates: [coordinates],
      }

      console.log('🟢 [CREATED] Polygon data:', polygonData)

      // Validate polygon
      const validation = validatePolygon(
        polygonData.coordinates,
        minArea,
        bounds,
        enforceGeoBounds
      )

      console.log('🟢 [CREATED] Validation result:', validation)

      if (!validation.valid) {
        // Don't add invalid polygon to map
        console.log('❌ [CREATED] Validation failed:', validation.errorKey)
        setValidationError(
          validation.errorKey ? validationMessage(validation.errorKey) : messages.errors.validationFallback
        )
        setTimeout(() => setValidationError(null), 5000)
        return
      }

      // Add to feature group
      featureGroupRef.current?.clearLayers()
      featureGroupRef.current?.addLayer(layer)

      // Calculate metrics
      const metrics = calculateMetrics(polygonData.coordinates)
      console.log('🟢 [CREATED] Calculated metrics:', metrics)

      // Emit change
      console.log('🟢 [CREATED] Calling onChange with polygon and metrics')
      onChange?.(polygonData, metrics)
      console.log('🟢 [CREATED] onChange called successfully')

      // Reset drawing state via callback
      onDrawingStateChange?.(false, 0)
    }

    const handleDrawVertex = (e: any) => {
      console.log('🔵 [DRAWVERTEX] Event fired:', e)

      // Access vertices from the draw handler's internal markers array
      if (!drawHandlerRef.current) {
        console.log('⚠️ [DRAWVERTEX] No draw handler ref')
        return
      }

      const handler = drawHandlerRef.current as any
      const markers = handler._markers || []
      const currentVertexCount = markers.length

      console.log('🔵 [DRAWVERTEX] Vertex markers count:', currentVertexCount)
      console.log('🔵 [DRAWVERTEX] Markers array:', markers)

      // Update drawing state via callback
      onDrawingStateChange?.(true, currentVertexCount)

      if (currentVertexCount >= MAX_VERTICES) {
        console.log('✅ [DRAWVERTEX] Max vertices reached, auto-completing polygon')

        // Try to complete the shape
        const completeMethod = handler.completeShape
        console.log('🔵 [DRAWVERTEX] completeShape method exists?', typeof completeMethod)

        if (typeof completeMethod === 'function') {
          completeMethod.call(handler)
          console.log('🔵 [DRAWVERTEX] completeShape() called successfully')
        } else {
          console.log('⚠️ [DRAWVERTEX] completeShape not available, trying _finishShape()')
          // Alternative method names in Leaflet Draw
          const finishMethod = handler._finishShape || handler.disable
          if (typeof finishMethod === 'function') {
            finishMethod.call(handler)
          }
        }

        setValidationError(messages.validation.maxVertices(MAX_VERTICES))
        setTimeout(() => setValidationError(null), 3000)
      }
    }

    map.on(L.Draw.Event.CREATED, handleCreated)
    map.on('draw:drawvertex', handleDrawVertex)

    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated)
      map.off('draw:drawvertex', handleDrawVertex)
    }
  }, [
    map,
    onChange,
    minArea,
    bounds,
    enforceGeoBounds,
    setValidationError,
    MAX_VERTICES,
    validationMessage,
    messages.errors.validationFallback,
    messages.validation.maxVertices,
  ])

  // Enable editing on polygon
  const enableEditing = () => {
    const featureGroup = featureGroupRef.current
    if (!featureGroup) return

    const layers = featureGroup.getLayers()
    if (layers.length === 0) return

    const layer = layers[0] as L.Polygon & {
      editing?: { enable: () => void; disable: () => void }
    }
    if (layer.editing) {
      layer.editing.enable()

      // Listen for edit completion
      layer.once('edit', () => {
        const latLngs = layer.getLatLngs()[0] as L.LatLng[]
        const coordinates: [number, number][] = latLngs.map((latLng) => [
          latLng.lng,
          latLng.lat,
        ])
        coordinates.push(coordinates[0])

        const polygonData: PolygonData = {
          type: 'Polygon',
          coordinates: [coordinates],
        }

        const validation = validatePolygon(
          polygonData.coordinates,
          minArea,
          bounds,
          enforceGeoBounds
        )

        if (validation.valid) {
          const metrics = calculateMetrics(polygonData.coordinates)
          onChange?.(polygonData, metrics)
          layer.editing!.disable()
        } else {
          setValidationError(
            validation.errorKey ? validationMessage(validation.errorKey) : messages.errors.validationFallback
          )
          setTimeout(() => setValidationError(null), 5000)
          // Reload original
          if (value) {
            featureGroup.clearLayers()
            const original = L.polygon(
              value.coordinates[0].map(([lng, lat]) => [lat, lng])
            )
            featureGroup.addLayer(original)
          }
        }
      })
    }
  }

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    enableEditing,
  }), [enableEditing])

  return <FeatureGroup ref={featureGroupRef} />
})

/**
 * Main map component
 */
export function LeafletPolygonMap({
  value,
  onChange,
  center = [0, 0], // Global center (Gulf of Guinea)
  zoom = 2,
  minArea = 100,
  required = false,
  readonly = false,
  className = '',
  bounds = undefined,  // Removed DEFAULT_BOUNDS to allow global drawing
  enforceGeoBounds = false,  // Disabled geographic bounds enforcement
}: LeafletPolygonMapProps) {
  const { messages } = useI18n()
  const [currentMetrics, setCurrentMetrics] = useState<PolygonMetrics | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [vertexCount, setVertexCount] = useState(0)
  const drawHandlerRef = useRef<L.Draw.Polygon | null>(null)
  const editorRef = useRef<{ enableEditing: () => void } | null>(null)

  // Log value prop changes
  useEffect(() => {
    console.log('🟣 [MAIN] value prop changed:', value)
    console.log('🟣 [MAIN] hasPolygon will be:', !!value)
  }, [value])

  // Log drawing state changes
  useEffect(() => {
    console.log('🟣 [MAIN] Drawing state changed: isDrawing =', isDrawing, ', vertexCount =', vertexCount)
  }, [isDrawing, vertexCount])

  useEffect(() => {
    if (value) {
      try {
        const metrics = calculateMetrics(value.coordinates)
        setCurrentMetrics(metrics)
      } catch (error) {
        console.error('Error calculating metrics for existing polygon:', error)
        setCurrentMetrics(null)
      }
    } else {
      setCurrentMetrics(null)
    }
  }, [value])

  const handlePolygonChange = (
    polygon: PolygonData | null,
    metrics: PolygonMetrics | null
  ) => {
    console.log('🟣 [MAIN] handlePolygonChange called with:', { polygon, metrics })
    setCurrentMetrics(metrics)
    console.log('🟣 [MAIN] Calling parent onChange')
    onChange?.(polygon, metrics)
    console.log('🟣 [MAIN] Parent onChange called')
  }

  const handleDrawHandlerReady = useCallback((handler: L.Draw.Polygon | null) => {
    drawHandlerRef.current = handler
  }, [])

  const handleStartDrawing = () => {
    // Enable polygon drawing programmatically
    console.log('🟣 [MAIN] handleStartDrawing called')
    console.log('🟣 [MAIN] Draw handler exists?', !!drawHandlerRef.current)
    console.log('🟣 [MAIN] Draw handler:', drawHandlerRef.current)

    if (!drawHandlerRef.current) {
      console.error('❌ [MAIN] Draw handler not available!')
      return
    }

    // Enter drawing mode
    setIsDrawing(true)  // Fixed: was false, should be true when starting to draw
    setVertexCount(0)

    const handler = drawHandlerRef.current as any
    console.log('🟣 [MAIN] Handler enabled status before:', handler._enabled)

    drawHandlerRef.current.enable()

    console.log('🟣 [MAIN] Handler enabled status after:', handler._enabled)
    console.log('🟣 [MAIN] Draw handler enabled successfully')
  }

  const handleEdit = () => {
    // Enable edit mode programmatically
    editorRef.current?.enableEditing()
  }

  const handleDelete = () => {
    // Clear the polygon
    onChange?.(null, null)
  }

  const handleCompleteDrawing = () => {
    console.log('🟣 [MAIN] handleCompleteDrawing called')
    if (!drawHandlerRef.current) {
      console.log('⚠️ [MAIN] No draw handler ref')
      return
    }

    const handler = drawHandlerRef.current as any
    const completeMethod = handler.completeShape

    if (typeof completeMethod === 'function') {
      console.log('🟣 [MAIN] Calling completeShape()')
      completeMethod.call(handler)
    } else {
      console.log('⚠️ [MAIN] completeShape not available, trying _finishShape()')
      const finishMethod = handler._finishShape || handler.disable
      if (typeof finishMethod === 'function') {
        finishMethod.call(handler)
      }
    }
  }

  const handleDeleteLastVertex = () => {
    console.log('🟣 [MAIN] handleDeleteLastVertex called')
    if (!drawHandlerRef.current) {
      console.log('⚠️ [MAIN] No draw handler ref')
      return
    }

    const handler = drawHandlerRef.current as any
    const deleteMethod = handler.deleteLastVertex

    if (typeof deleteMethod === 'function') {
      const markersBefore = handler._markers || []

      console.log('🟣 [MAIN] Markers before deletion:', markersBefore.length)

      // FIX: Leaflet Draw's deleteLastVertex() returns early if only 1 marker exists
      // We need to manually handle this case
      if (markersBefore.length === 1) {
        console.log('🔧 [DELETE] Only 1 marker - manually clearing')

        // Clear the marker group
        if (handler._markerGroup) {
          handler._markerGroup.clearLayers()
        }

        // Clear the markers array
        handler._markers = []

        // Remove the polygon layer from map
        if (handler._poly && handler._map) {
          handler._map.removeLayer(handler._poly)
        }

        // Update vertex count
        setVertexCount(0)
        console.log('✅ [DELETE] Last marker cleared')
      } else {
        // Let Leaflet handle multiple markers
        console.log('🟣 [MAIN] Calling deleteLastVertex()')
        deleteMethod.call(handler)

        // Update vertex count
        const markersAfter = handler._markers || []
        setVertexCount(markersAfter.length)
        console.log('✅ [DELETE] Marker removed, remaining:', markersAfter.length)
      }

      // Don't exit drawing mode when no vertices remain
      // User should be able to continue drawing after deleting all points
      // The "Complete Polygon" button is already disabled via vertexCount < 3 check
    } else {
      console.log('⚠️ [MAIN] deleteLastVertex not available')
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Metrics Display */}
      {currentMetrics && (
        <div className="absolute top-4 right-4 z-[1000] bg-white p-3 rounded-lg shadow-lg text-sm">
          <div className="font-semibold mb-2">{messages.labels.area}</div>
          <div className="font-mono text-lg">{currentMetrics.area.toLocaleString()} m²</div>
        </div>
      )}

      {/* Map Container */}
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '500px', width: '100%' }}
        className="rounded-lg"
      >
        {/* Hybrid-style stack: satellite + roads + place names (Esri; labels often English globally) */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics &mdash; imagery; reference layers &copy; Esri, HERE, Garmin, (c) OpenStreetMap contributors, and the GIS user community'
          maxZoom={18}
        />
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"
          attribution=""
          maxZoom={18}
          maxNativeZoom={19}
        />
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          attribution=""
          maxZoom={18}
          maxNativeZoom={19}
        />

        {/* Map Center Updater */}
        <MapCenterUpdater center={center} zoom={zoom} />

        {/* Polygon Editor */}
        <PolygonEditor
          ref={editorRef}
          value={value}
          onChange={handlePolygonChange}
          minArea={minArea}
          readonly={readonly}
          bounds={bounds}
          enforceGeoBounds={enforceGeoBounds}
          validationError={validationError}
          setValidationError={setValidationError}
          onDrawHandlerReady={handleDrawHandlerReady}
          onDrawingStateChange={(isDrawing, vertexCount) => {
            setIsDrawing(isDrawing)
            setVertexCount(vertexCount)
          }}
        />
      </MapContainer>

      {/* Custom Control Buttons */}
      {!readonly && (
        <PolygonControls
          hasPolygon={!!value}
          isDrawing={isDrawing}
          vertexCount={vertexCount}
          onStartDrawing={handleStartDrawing}
          onCompleteDrawing={handleCompleteDrawing}
          onDeleteLastVertex={handleDeleteLastVertex}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Drawing mode cursor - add crosshair cursor when drawing */}
      {isDrawing && (
        <style>{`
          .leaflet-container {
            cursor: crosshair !important;
          }
          .leaflet-interactive {
            cursor: crosshair !important;
          }
          /* Hide Leaflet Draw tooltips to prevent "click to continue drawing" message */
          .leaflet-draw-tooltip {
            display: none !important;
          }
        `}</style>
      )}

      {/* Validation Error Display */}
      {validationError && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000] bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg max-w-md text-center">
          {validationError}
        </div>
      )}

      {/* Required Field Message */}
      {required && !value && (
        <p className="mt-2 text-sm text-red-600">{messages.errors.required}</p>
      )}
    </div>
  )
}
