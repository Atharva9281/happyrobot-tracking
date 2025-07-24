'use client'

import React, { useEffect, useRef } from 'react'
import { Shipment } from '@/types/shipment'
import { directionsService } from '@/services/directions'
import { LatLng } from '@/types/google-maps'

// API Rate Limiting - Increased limit since we don't want fallbacks
const routeCache = new Map()
let apiCallCount = 0
const MAX_API_CALLS = 20 // ✅ INCREASED: More API calls allowed

// Reset function for manual refresh
export const resetApiLimits = () => {
  apiCallCount = 0
  routeCache.clear()
  console.log('🔄 API limits and cache reset')
}

interface RoutePolylineProps {
  shipment: Shipment
  map: google.maps.Map
  isSelected: boolean
}

export default function RoutePolyline({
  shipment,
  map,
  isSelected
}: RoutePolylineProps) {
  const polylineRef = useRef<google.maps.Polyline | null>(null)

  useEffect(() => {
    if (!map || !window.google) return

    createRoutePolyline()

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null)
      }
    }
  }, [map, shipment])

  // Update polyline style when selection changes
  useEffect(() => {
    if (polylineRef.current) {
      updatePolylineStyle()
    }
  }, [isSelected])

  const createRoutePolyline = async () => {
    try {
      let routePath: LatLng[] = []

      // Check if we have encoded route first
      if (shipment.route_encoded) {
        // Decode existing polyline (no API call needed)
        routePath = directionsService.decodePolyline(shipment.route_encoded)
        console.log('📦 Using existing encoded route for', shipment.shipment_number)
      } else {
        // Need to calculate route - check API limits first
        const cacheKey = `${shipment.origin_lat},${shipment.origin_lng}-${shipment.dest_lat},${shipment.dest_lng}`
        
        // Check cache first
        if (routeCache.has(cacheKey)) {
          console.log('📦 Using cached route for', shipment.shipment_number)
          routePath = routeCache.get(cacheKey)
        } else if (apiCallCount >= MAX_API_CALLS) {
          // ✅ REMOVED: No more straight line fallback when API limit reached
          console.log(`🚫 API limit reached (${apiCallCount}/${MAX_API_CALLS}) - skipping route for`, shipment.shipment_number)
          return // ✅ Just return, don't create any polyline
        } else {
          // Make API call
          apiCallCount++
          console.log(`🌐 Making Directions API call ${apiCallCount}/${MAX_API_CALLS} for ${shipment.shipment_number}`)
          
          const routeInfo = await directionsService.getRoute({
            origin: { lat: shipment.origin_lat, lng: shipment.origin_lng },
            destination: { lat: shipment.dest_lat, lng: shipment.dest_lng },
            travelMode: google.maps.TravelMode.DRIVING
          })
          
          routePath = directionsService.decodePolyline(routeInfo.polyline)
          
          // Cache the result
          routeCache.set(cacheKey, routePath)
          console.log(`✅ Route calculated and cached for ${shipment.shipment_number}`)
        }
      }

      // ✅ ONLY create polyline if we have a valid route path
      if (routePath.length > 0) {
        const polyline = new google.maps.Polyline({
          path: routePath,
          map: map,
          strokeColor: getStrokeColor(),
          strokeOpacity: getStrokeOpacity(),
          strokeWeight: getStrokeWeight(),
          geodesic: true
        })

        polylineRef.current = polyline
        console.log(`✅ Polyline created for ${shipment.shipment_number} with ${routePath.length} points`)
      }

    } catch (error) {
      console.error('Failed to create route polyline:', error)
      
      // ✅ REMOVED: No fallback straight line creation
      // Just log the error and don't create any polyline
      console.log(`❌ Skipping polyline for ${shipment.shipment_number} due to error`)
    }
  }

  // ✅ REMOVED: createFallbackPolyline function completely deleted

  const updatePolylineStyle = () => {
    if (!polylineRef.current) return

    polylineRef.current.setOptions({
      strokeColor: getStrokeColor(),
      strokeOpacity: getStrokeOpacity(),
      strokeWeight: getStrokeWeight()
    })
  }

  const getStrokeColor = (): string => {
    if (isSelected) {
      return '#1F2937' // Dark gray when selected
    }

    // ✅ FIXED: Use actual status instead of status_color
    switch (shipment.status) {
      case 'delivered': return '#10B981' // Green
      case 'in_transit': return '#2563EB' // Blue
      case 'pending': return '#F59E0B' // Yellow
      case 'delayed': return '#EF4444' // Red
      default: return '#6B7280' // Default gray
    }
  }

  const getStrokeOpacity = (): number => {
    return isSelected ? 0.9 : 0.6
  }

  const getStrokeWeight = (): number => {
    return isSelected ? 5 : 3
  }

  return null // This component doesn't render anything directly
}