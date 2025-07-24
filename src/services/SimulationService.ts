import { LatLng } from '@/types/google-maps'
import { directionsService } from '@/services/directions'

export interface SimulationShipment {
  id: string
  shipment_number: string
  status: string
  progress_percentage: number
  origin_lat: number
  origin_lng: number
  dest_lat: number
  dest_lng: number
  current_lat?: number
  current_lng?: number
  route_encoded?: string
  distance_km?: number
}

export interface SimulationUpdate {
  shipmentId: string
  current_lat: number
  current_lng: number
  progress_percentage: number
  status: string
  estimated_eta?: string
}

class SimulationService {
  private shipments: Map<string, SimulationShipment> = new Map()
  private routes: Map<string, LatLng[]> = new Map()
  private interval: NodeJS.Timeout | null = null
  private onUpdate: ((updates: SimulationUpdate[]) => void) | null = null
  private isRunning = false
  private speed = 1 // Speed multiplier
  
  // 🚀 JOURNEY MODE SETTINGS
  private journeyMode = false
  private journeyShipmentId: string | null = null
  private journeyDuration = 60000 // ✅ FIXED: 60 seconds for full journey (slower)
  private cameraFollowEnabled = false // ✅ FIXED: Disable camera following

  // ✅ INITIALIZE JOURNEY MODE (Single shipment focus)
  async initializeJourney(
    shipments: SimulationShipment[], 
    updateCallback: (updates: SimulationUpdate[]) => void
  ): Promise<void> {
    console.log('🚛 [JourneyMode] Initializing journey simulation with', shipments.length, 'shipments')
    
    this.journeyMode = true
    this.journeyShipmentId = shipments[0]?.id || null
    this.onUpdate = updateCallback
    this.shipments.clear()
    this.routes.clear()

    // Wait for Google Maps to load
    const mapsLoaded = await this.waitForGoogleMaps()
    if (!mapsLoaded) {
      console.warn('⚠️ Google Maps not loaded, using fallback routes')
    }

    // Process only the selected shipment
    for (const shipment of shipments) {
      await this.prepareJourneyRoute(shipment)
    }

    console.log('✅ [JourneyMode] Journey initialization complete')
  }

  // ✅ PREPARE ROUTE FOR JOURNEY (More detailed route points)
  private async prepareJourneyRoute(shipment: SimulationShipment): Promise<void> {
    try {
      console.log(`🗺️ [JourneyMode] Preparing route for ${shipment.shipment_number}`)

      if (this.isGoogleMapsLoaded()) {
        // Use Google Directions API for real route
        const route = await directionsService.getRoute({
          origin: { lat: shipment.origin_lat, lng: shipment.origin_lng },
          destination: { lat: shipment.dest_lat, lng: shipment.dest_lng },
          travelMode: google.maps.TravelMode.DRIVING
        })

        if (route?.polyline) {
          const decodedPath = directionsService.decodePolyline(route.polyline)
          // ✅ FIXED: More points for smoother movement but not too many
          const detailedPath = this.interpolateRoutePoints(decodedPath, 100) // 100 points for smooth movement
          this.routes.set(shipment.id, detailedPath)
          console.log(`✅ [JourneyMode] Real route loaded: ${detailedPath.length} points`)
        } else {
          throw new Error('No route returned from Google')
        }
      } else {
        // Fallback: Create smooth curved route
        const fallbackRoute = this.createSmoothFallbackRoute(shipment, 50) // 50 points
        this.routes.set(shipment.id, fallbackRoute)
        console.log(`⚠️ [JourneyMode] Fallback route created: ${fallbackRoute.length} points`)
      }

      // Store shipment with journey settings
      const journeyShipment: SimulationShipment = {
        ...shipment,
        current_lat: shipment.origin_lat,
        current_lng: shipment.origin_lng,
        progress_percentage: 0,
        status: 'in_transit' // Force in_transit for journey
      }

      this.shipments.set(shipment.id, journeyShipment)

    } catch (error) {
      console.error(`❌ [JourneyMode] Route preparation failed for ${shipment.shipment_number}:`, error)
      // Still create a basic route so journey can proceed
      const basicRoute = this.createSmoothFallbackRoute(shipment, 30)
      this.routes.set(shipment.id, basicRoute)
      this.shipments.set(shipment.id, {
        ...shipment,
        current_lat: shipment.origin_lat,
        current_lng: shipment.origin_lng,
        progress_percentage: 0,
        status: 'in_transit'
      })
    }
  }

  // ✅ CREATE SMOOTH FALLBACK ROUTE (Curved path instead of straight line)
  private createSmoothFallbackRoute(shipment: SimulationShipment, points: number): LatLng[] {
    const route: LatLng[] = []
    const { origin_lat, origin_lng, dest_lat, dest_lng } = shipment

    for (let i = 0; i <= points; i++) {
      const t = i / points
      
      // Add some curve to make it more realistic
      const curveFactor = Math.sin(t * Math.PI) * 0.1 // Slight curve
      
      const lat = origin_lat + (dest_lat - origin_lat) * t + curveFactor * (dest_lat - origin_lat)
      const lng = origin_lng + (dest_lng - origin_lng) * t + curveFactor * (dest_lng - origin_lng)
      
      route.push({ lat, lng })
    }

    return route
  }

  // ✅ INTERPOLATE ROUTE POINTS (Add more points between existing ones)
  private interpolateRoutePoints(route: LatLng[], targetPoints: number): LatLng[] {
    if (route.length >= targetPoints) return route

    const interpolated: LatLng[] = []
    const segmentSize = route.length - 1
    const pointsPerSegment = Math.floor(targetPoints / segmentSize)

    for (let i = 0; i < route.length - 1; i++) {
      const start = route[i]
      const end = route[i + 1]
      
      // Add start point
      interpolated.push(start)
      
      // Add interpolated points between start and end
      for (let j = 1; j < pointsPerSegment; j++) {
        const t = j / pointsPerSegment
        const lat = start.lat + (end.lat - start.lat) * t
        const lng = start.lng + (end.lng - start.lng) * t
        interpolated.push({ lat, lng })
      }
    }
    
    // Add final point
    interpolated.push(route[route.length - 1])
    return interpolated
  }

  // ✅ START JOURNEY
  start(): void {
    if (this.isRunning) return

    console.log('🚀 [JourneyMode] Starting journey simulation')
    this.isRunning = true

    // ✅ FIXED: Better timing for smooth movement
    const updateInterval = this.journeyMode ? 1000 : 2000 // 1s for journey, 2s for normal
    
    this.interval = setInterval(() => {
      this.updateJourneyPositions()
    }, updateInterval)
  }

  // ✅ UPDATE JOURNEY POSITIONS (Smooth movement)
  private updateJourneyPositions(): void {
    if (!this.onUpdate) return

    const updates: SimulationUpdate[] = []

    this.shipments.forEach((shipment) => {
      const route = this.routes.get(shipment.id)
      if (!route || route.length === 0) return

      // ✅ FIXED: Better progress calculation
      const progressIncrement = this.journeyMode 
        ? (1000 / this.journeyDuration) * 100 * this.speed // Smooth progress for journey
        : 0.8 * this.speed // Normal speed

      const newProgress = Math.min(shipment.progress_percentage + progressIncrement, 100)
      
      // Get position along route
      const position = this.getPositionAtProgress(route, newProgress)
      
      // Determine status
      let newStatus = shipment.status
      if (newProgress >= 100) {
        newStatus = 'delivered'
      } else if (newProgress > 0 && shipment.status === 'pending') {
        newStatus = 'in_transit'
      }

      // Update shipment
      const updatedShipment: SimulationShipment = {
        ...shipment,
        current_lat: position.lat,
        current_lng: position.lng,
        progress_percentage: newProgress,
        status: newStatus
      }
      
      this.shipments.set(shipment.id, updatedShipment)

      // Create update
      updates.push({
        shipmentId: shipment.id,
        current_lat: position.lat,
        current_lng: position.lng,
        progress_percentage: newProgress,
        status: newStatus,
        estimated_eta: this.calculateETA(newProgress)
      })

      // Stop simulation if journey complete
      if (this.journeyMode && newProgress >= 100) {
        console.log('🎉 [JourneyMode] Journey completed!')
        this.pause()
      }
    })

    if (updates.length > 0) {
      this.onUpdate(updates)
    }
  }

  // ✅ GET POSITION AT PROGRESS (Interpolate along route)
  private getPositionAtProgress(route: LatLng[], progress: number): LatLng {
    if (progress <= 0) return route[0]
    if (progress >= 100) return route[route.length - 1]

    const routeIndex = (progress / 100) * (route.length - 1)
    const lowerIndex = Math.floor(routeIndex)
    const upperIndex = Math.min(lowerIndex + 1, route.length - 1)
    const fraction = routeIndex - lowerIndex

    if (lowerIndex === upperIndex) {
      return route[lowerIndex]
    }

    const start = route[lowerIndex]
    const end = route[upperIndex]

    return {
      lat: start.lat + (end.lat - start.lat) * fraction,
      lng: start.lng + (end.lng - start.lng) * fraction
    }
  }

  // ✅ CALCULATE ETA
  private calculateETA(progress: number): string {
    if (progress >= 100) return 'Delivered'
    if (progress <= 0) return 'Starting...'
    
    const remaining = 100 - progress
    const timeRemaining = this.journeyMode 
      ? (remaining / 100) * (this.journeyDuration / 1000) // seconds
      : (remaining / 100) * 3600 // 1 hour for normal mode

    if (timeRemaining < 60) {
      return `${Math.round(timeRemaining)}s`
    } else {
      return `${Math.round(timeRemaining / 60)}m`
    }
  }

  // ✅ JOURNEY CONTROLS
  pause(): void {
    this.isRunning = false
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
    console.log('⏸️ [JourneyMode] Journey paused')
  }

  resume(): void {
    if (!this.isRunning) {
      this.start()
      console.log('▶️ [JourneyMode] Journey resumed')
    }
  }

  setSpeed(newSpeed: number): void {
    this.speed = Math.max(0.1, Math.min(10, newSpeed))
    console.log(`🚀 [JourneyMode] Speed set to ${this.speed}x`)
  }

  // ✅ JOURNEY STATUS
  getJourneyStatus() {
    if (!this.journeyShipmentId) return null
    
    const shipment = this.shipments.get(this.journeyShipmentId)
    return {
      shipmentId: this.journeyShipmentId,
      progress: shipment?.progress_percentage || 0,
      status: shipment?.status || 'unknown',
      isRunning: this.isRunning,
      currentSpeed: this.speed
    }
  }

  // ✅ HELPER METHODS
  private isGoogleMapsLoaded(): boolean {
    return typeof window !== 'undefined' && 
           window.google?.maps?.DirectionsService !== undefined &&
           window.google?.maps?.geometry?.encoding?.decodePath !== undefined
  }

  private async waitForGoogleMaps(maxWait: number = 10000): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isGoogleMapsLoaded()) {
        resolve(true)
        return
      }

      const startTime = Date.now()
      const checkInterval = setInterval(() => {
        if (this.isGoogleMapsLoaded()) {
          clearInterval(checkInterval)
          resolve(true)
        } else if (Date.now() - startTime > maxWait) {
          clearInterval(checkInterval)
          console.warn('⚠️ Google Maps loading timeout')
          resolve(false)
        }
      }, 500)
    })
  }

  // ✅ CLEANUP
  destroy(): void {
    console.log('🚛 [JourneyMode] Destroying simulation service')
    this.pause()
    this.shipments.clear()
    this.routes.clear()
    this.onUpdate = null
    this.journeyMode = false
    this.journeyShipmentId = null
  }

  // ✅ LEGACY METHODS (For backward compatibility)
  async initialize(shipments: SimulationShipment[], updateCallback: (updates: SimulationUpdate[]) => void): Promise<void> {
    return this.initializeJourney(shipments, updateCallback)
  }

  isActive(): boolean {
    return this.isRunning
  }

  getActiveShipmentCount(): number {
    return this.shipments.size
  }
}

export const simulationService = new SimulationService()
export default simulationService