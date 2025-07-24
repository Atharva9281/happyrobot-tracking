'use client'

import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react'
import { useGoogleMaps } from '@/hooks/useGoogleMaps'
import { googleMapsService } from '@/services/googleMaps'
import { Shipment } from '@/types/shipment'
import { LatLng } from '@/types/google-maps'
import ShipmentMarker from './ShipmentMarker'
import RoutePolyline from './RoutePolyline'
import { MAP_CONFIG } from '@/utils/constants'

interface MapViewProps {
  shipments: Shipment[]
  selectedShipment: Shipment | null
  onSelectShipment: (shipment: Shipment | null) => void
  className?: string
}

export default function MapView({
  shipments,
  selectedShipment,
  onSelectShipment,
  className = ''
}: MapViewProps) {
  const { isLoaded, isLoading, loadError } = useGoogleMaps()
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<google.maps.Map | null>(null)
  const [mapCenter, setMapCenter] = useState<LatLng>(MAP_CONFIG.defaultCenter)
  const [mapZoom, setMapZoom] = useState(MAP_CONFIG.defaultZoom)
  const [markersLoaded, setMarkersLoaded] = useState(false)

  // Check if we have a valid Google Maps API key
  const hasValidApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && 
                        process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY !== 'your_google_maps_api_key'

  // ✅ OPTIMIZED: Memoize handleMarkerClick to prevent unnecessary re-renders
  const handleMarkerClick = useCallback((shipment: Shipment) => {
    console.log(`🖱️ Marker clicked: ${shipment.shipment_number}`)
    onSelectShipment(selectedShipment?.id === shipment.id ? null : shipment)
  }, [selectedShipment?.id, onSelectShipment])

  // ✅ DEBUG: Log when MapView receives new shipments
  useEffect(() => {
    console.log('🗺️ MapView received shipments:', shipments.map(s => ({
      id: s.id,
      number: s.shipment_number,
      status: s.status,
      current_lat: s.current_lat,
      current_lng: s.current_lng
    })))
  }, [shipments])

  // Initialize map when Google Maps is loaded
  useEffect(() => {
    if (isLoaded && mapRef.current && !googleMapRef.current && hasValidApiKey) {
      initializeMap()
    }
  }, [isLoaded, hasValidApiKey])

  // ✅ FIXED: Better bounds fitting with proper timing and zoom level
  useEffect(() => {
    if (googleMapRef.current && shipments.length > 0 && isLoaded) {
      // ✅ FIXED: Only fit bounds on initial load, not every update
      if (!markersLoaded) {
        const timer = setTimeout(() => {
          fitMapToShipments()
          setMarkersLoaded(true)
        }, 300)
        
        return () => clearTimeout(timer)
      }
    }
  }, [shipments.length, isLoaded]) // ✅ Only trigger on shipment count change

  // ✅ REMOVED: Focus on selected shipment (no more camera jumping)
  // This was causing the map to jump every time the truck moved

  const initializeMap = useCallback(() => {
    if (!mapRef.current || !isLoaded || !hasValidApiKey) return

    try {
      const mapOptions = {
        center: mapCenter,
        zoom: 4, // ✅ FIXED: Start with lower zoom to see more area
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        scrollwheel: true,           // ✅ ENABLE: Scrolling
        draggable: true,             // ✅ ENABLE: Dragging
        disableDoubleClickZoom: false,
        gestureHandling: 'auto',     // ✅ ENABLE: All gestures
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }] // Hide POI labels for cleaner look
          }
        ]
      }

      const map = googleMapsService.createMap(mapRef.current, mapOptions)
      googleMapRef.current = map

      // ✅ FIXED: Force resize event to ensure proper rendering
      setTimeout(() => {
        if (googleMapRef.current) {
          google.maps.event.trigger(googleMapRef.current, 'resize')
        }
      }, 100)

      // Add map click handler to deselect shipments
      map.addListener('click', () => {
        onSelectShipment(null)
      })

      console.log('✅ Google Map initialized successfully with gestures enabled')
    } catch (error) {
      console.error('❌ Failed to initialize map:', error)
    }
  }, [isLoaded, mapCenter, mapZoom, onSelectShipment, hasValidApiKey])

  // ✅ IMPROVED: Better bounds calculation with closer zoom
  const fitMapToShipments = useCallback(() => {
    if (!googleMapRef.current || shipments.length === 0) return

    try {
      const bounds = new google.maps.LatLngBounds()
      let hasValidCoordinates = false
      
      shipments.forEach(shipment => {
        // ✅ FIXED: Check for valid coordinates before adding to bounds
        if (shipment.origin_lat && shipment.origin_lng) {
          bounds.extend({ lat: shipment.origin_lat, lng: shipment.origin_lng })
          hasValidCoordinates = true
        }
        
        if (shipment.dest_lat && shipment.dest_lng) {
          bounds.extend({ lat: shipment.dest_lat, lng: shipment.dest_lng })
          hasValidCoordinates = true
        }
        
        // Add current position if different from origin
        if (shipment.current_lat && shipment.current_lng) {
          bounds.extend({ lat: shipment.current_lat, lng: shipment.current_lng })
          hasValidCoordinates = true
        }
      })

      if (!hasValidCoordinates) {
        console.warn('⚠️ No valid coordinates found in shipments')
        return
      }

      // ✅ FIXED: Fit bounds with padding and better zoom management
      googleMapRef.current.fitBounds(bounds, {
        top: 80,
        right: 80,
        bottom: 80,
        left: 80
      })
      
      // ✅ FIXED: Better zoom limits for journey viewing
      const listener = google.maps.event.addListener(googleMapRef.current, 'bounds_changed', () => {
        const zoom = googleMapRef.current!.getZoom()!
        if (zoom > 8) { // ✅ FIXED: Max zoom 8 for better route visibility
          googleMapRef.current!.setZoom(8)
        } else if (zoom < 6) { // ✅ FIXED: Min zoom 6 to see truck movement
          googleMapRef.current!.setZoom(6)
        }
        google.maps.event.removeListener(listener)
      })

      console.log('✅ Map bounds fitted to all shipments with journey-friendly zoom')
    } catch (error) {
      console.error('❌ Failed to fit map to shipments:', error)
    }
  }, [shipments])

  const focusOnShipment = useCallback((shipment: Shipment) => {
    if (!googleMapRef.current) return

    try {
      // Center map on selected shipment with smooth animation
      googleMapRef.current.panTo({
        lat: shipment.current_lat || shipment.origin_lat,
        lng: shipment.current_lng || shipment.origin_lng
      })
      
      // Set appropriate zoom level for focused view
      const currentZoom = googleMapRef.current.getZoom() || 8
      if (currentZoom < 8) {
        googleMapRef.current.setZoom(8)
      }
      
      console.log(`📍 Map focused on shipment: ${shipment.shipment_number}`)
    } catch (error) {
      console.error('❌ Failed to focus on shipment:', error)
    }
  }, [])

  // Show API key required message
  if (!hasValidApiKey) {
    return (
      <div className={`relative ${className} bg-gray-100 flex items-center justify-center`} style={{ minHeight: '500px' }}>
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Google Maps API Key Required
          </h3>
          <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-md mx-auto text-left">
            <h4 className="font-semibold text-gray-900 mb-3">To enable the map:</h4>
            <ol className="text-sm text-gray-600 space-y-2">
              <li>1. Get Google Maps API key from Google Cloud Console</li>
              <li>2. Enable Maps JavaScript API</li>
              <li>3. Add to .env.local file:</li>
            </ol>
            <code className="block bg-gray-50 p-3 rounded mt-3 text-xs">
              NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_key_here
            </code>
          </div>
          
          {shipments.length > 0 && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-sm mx-auto">
              <p className="text-sm text-blue-800">
                🚛 Ready to show <strong>{shipments.length} shipments</strong> on the map!
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={`relative ${className}`} style={{ minHeight: '500px' }}>
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Google Maps...</p>
            <p className="text-sm text-gray-500 mt-1">This may take a few seconds</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (loadError) {
    return (
      <div className={`relative ${className}`} style={{ minHeight: '500px' }}>
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Map</h3>
            <p className="text-red-600 text-sm">{loadError}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={{ minHeight: '500px', height: '100%' }}>
      {/* ✅ FIXED: Map Container with proper sizing */}
      <div
        ref={mapRef}
        className="w-full h-full absolute inset-0"
        style={{ minHeight: '500px' }}
      />

      {/* ✅ LOADING OVERLAY for markers */}
      {!markersLoaded && shipments.length > 0 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white border border-gray-300 rounded-lg px-4 py-2 shadow-sm z-10">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Loading {shipments.length} shipments...</span>
          </div>
        </div>
      )}

      {/* ✅ OPTIMIZED: Render markers with stable keys and proper onClick */}
      {isLoaded && googleMapRef.current && shipments.map(shipment => (
        <ShipmentMarker
          key={`marker-${shipment.id}`} // ✅ STABLE KEY
          shipment={shipment}
          map={googleMapRef.current!}
          isSelected={selectedShipment?.id === shipment.id}
          onClick={() => handleMarkerClick(shipment)}
        />
      ))}

      {/* Render polylines only when map is available */}
      {isLoaded && googleMapRef.current && shipments.map(shipment => (
        <RoutePolyline
          key={`route-${shipment.id}`}
          shipment={shipment}
          map={googleMapRef.current!}
          isSelected={selectedShipment?.id === shipment.id}
        />
      ))}

      {/* ✅ IMPROVED: Map Controls */}
      {googleMapRef.current && (
        <div className="absolute top-4 right-4 space-y-2 z-10">
          <button
            onClick={() => fitMapToShipments()}
            className="bg-white border border-gray-300 rounded-lg p-3 shadow-lg hover:shadow-xl transition-shadow"
            title="Fit all shipments to view"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
          
          {selectedShipment && (
            <button
              onClick={() => onSelectShipment(null)}
              className="bg-white border border-gray-300 rounded-lg p-3 shadow-lg hover:shadow-xl transition-shadow"
              title="Clear selection"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* ✅ REMOVED: Shipment counter that was blocking the view */}
    </div>
  )
}