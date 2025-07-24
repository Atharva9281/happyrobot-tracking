'use client'

import React, { useEffect, useRef, useMemo } from 'react'
import { Shipment } from '@/types/shipment'

interface ShipmentMarkerProps {
  shipment: Shipment
  map: google.maps.Map
  isSelected: boolean
  onClick: () => void
}

export default function ShipmentMarker({
  shipment,
  map,
  isSelected,
  onClick
}: ShipmentMarkerProps) {
  const markerRef = useRef<google.maps.Marker | null>(null)
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)

  // ✅ OPTIMIZED: Memoize computed values to prevent unnecessary recalculations
  const computedColor = useMemo(() => getStatusColor(shipment.status), [shipment.status])
  
  const currentPosition = useMemo(() => ({
    lat: shipment.current_lat,
    lng: shipment.current_lng
  }), [shipment.current_lat, shipment.current_lng])

  const truckIcon = useMemo(() => ({
    url: createTruckIconSVG(computedColor),
    scaledSize: new google.maps.Size(32, 32),
    anchor: new google.maps.Point(16, 16)
  }), [computedColor])

  // ✅ INITIAL MARKER CREATION - ONLY CREATE ONCE
  useEffect(() => {
    if (!map || !window.google || markerRef.current) return // ✅ Don't recreate if marker exists

    console.log(`🗺️ Creating marker for ${shipment.shipment_number} with status: ${shipment.status}`)

    // Create marker with optimized settings
    const marker = new google.maps.Marker({
      position: currentPosition,
      map: map,
      title: shipment.shipment_number,
      icon: truckIcon,
      animation: isSelected ? google.maps.Animation.BOUNCE : undefined,
      optimized: true, // ✅ PERFORMANCE: Enable marker optimization
      clickable: true,
      zIndex: isSelected ? 1000 : 100
    })

    // Create info window
    const infoWindow = new google.maps.InfoWindow({
      content: createInfoWindowContent(shipment),
      disableAutoPan: false,
      maxWidth: 350,
      pixelOffset: new google.maps.Size(0, -40) // Offset above marker
    })

    // Add click listener
    marker.addListener('click', () => {
      console.log(`🖱️ Marker clicked: ${shipment.shipment_number}`)
      onClick()
    })

    markerRef.current = marker
    infoWindowRef.current = infoWindow

    return () => {
      console.log(`🗑️ Cleaning up marker for ${shipment.shipment_number}`)
      if (markerRef.current) {
        markerRef.current.setMap(null)
        markerRef.current = null
      }
      if (infoWindowRef.current) {
        infoWindowRef.current.close()
        infoWindowRef.current = null
      }
    }
  }, [map, shipment.id]) // ✅ STABLE: Only depend on map and shipment ID

  // ✅ UPDATE MARKER POSITION when shipment moves (optimized)
  useEffect(() => {
    if (markerRef.current) {
      console.log(`📍 Updating position for ${shipment.shipment_number}`)
      markerRef.current.setPosition(currentPosition)
    }
  }, [currentPosition.lat, currentPosition.lng, shipment.shipment_number])

  // ✅ UPDATE MARKER ICON when status changes (optimized)
  useEffect(() => {
    if (markerRef.current) {
      console.log(`🎨 Updating icon for ${shipment.shipment_number}: ${shipment.status} → ${computedColor}`)
      markerRef.current.setIcon(truckIcon)
    }
  }, [truckIcon, shipment.shipment_number])

  // ✅ UPDATE Z-INDEX based on selection
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setZIndex(isSelected ? 1000 : 100)
    }
  }, [isSelected])

  // ✅ UPDATE MARKER ANIMATION and INFO WINDOW (optimized)
  useEffect(() => {
    if (markerRef.current && infoWindowRef.current) {
      // Update animation
      markerRef.current.setAnimation(
        isSelected ? google.maps.Animation.BOUNCE : undefined
      )

      // Update info window content
      infoWindowRef.current.setContent(createInfoWindowContent(shipment))

      // Show/hide info window
      if (isSelected) {
        infoWindowRef.current.open(map, markerRef.current)
      } else {
        infoWindowRef.current.close()
      }
    }
  }, [isSelected, map, shipment.shipment_number, shipment.status, shipment.progress_percentage])

  return null // This component doesn't render anything directly
}

// ✅ ORIGINAL: Your better truck icon design (restored and kept!)
function createTruckIconSVG(color: string): string {
  const colorMap = {
    blue: '#2563EB',
    green: '#10B981',
    yellow: '#F59E0B',
    red: '#EF4444'
  }

  const fillColor = colorMap[color as keyof typeof colorMap] || colorMap.blue

  const svgContent = `
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="15" fill="white" stroke="${fillColor}" stroke-width="2"/>
      <path d="M8 12h6v8H8v-8zm8 0h2v2h4l2 2v4h-2v2h-2v-2h-4v2h-2v-2H8v-8h8v0z" fill="${fillColor}"/>
      <circle cx="12" cy="22" r="2" fill="white"/>
      <circle cx="22" cy="22" r="2" fill="white"/>
    </svg>
  `

  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgContent)
}

// ✅ OPTIMIZED: Better status color mapping
function getStatusColor(status: string): 'blue' | 'green' | 'yellow' | 'red' {
  switch (status?.toLowerCase()) {
    case 'in_transit':
    case 'in-transit':
      return 'blue'
    case 'delivered':
    case 'completed':
      return 'green'
    case 'pending':
    case 'waiting':
    case 'scheduled':
      return 'yellow'
    case 'delayed':
    case 'overdue':
    case 'failed':
      return 'red'
    default:
      console.warn(`⚠️ Unknown status: ${status}, defaulting to blue`)
      return 'blue'
  }
}

// ✅ ENHANCED: Better info window with improved styling and animation
function createInfoWindowContent(shipment: Shipment): string {
  const computedColor = getStatusColor(shipment.status)
  const progress = shipment.progress_percentage?.toFixed(1) || '0'
  
  const statusConfig = {
    blue: { 
      bg: '#EFF6FF', 
      text: '#1E40AF', 
      border: '#DBEAFE',
      icon: '🚛',
      label: 'In Transit'
    },
    green: { 
      bg: '#F0FDF4', 
      text: '#166534', 
      border: '#DCFCE7',
      icon: '✅',
      label: 'Delivered'
    },
    yellow: { 
      bg: '#FFFBEB', 
      text: '#92400E', 
      border: '#FEF3C7',
      icon: '⏳',
      label: 'Pending'
    },
    red: { 
      bg: '#FEF2F2', 
      text: '#991B1B', 
      border: '#FECACA',
      icon: '⚠️',
      label: 'Delayed'
    }
  }

  const config = statusConfig[computedColor]
  const statusLabel = shipment.status.replace('_', ' ').toUpperCase()

  return `
    <div style="
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 16px;
      min-width: 280px;
      max-width: 350px;
      border-radius: 12px;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    ">
      <!-- Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <h3 style="
          font-weight: 700; 
          font-size: 18px; 
          color: #1f2937; 
          margin: 0;
          display: flex;
          align-items: center;
        ">
          ${config.icon} ${shipment.shipment_number}
        </h3>
        <span style="
          background: ${config.bg}; 
          color: ${config.text}; 
          border: 1px solid ${config.border};
          padding: 4px 8px; 
          border-radius: 8px; 
          font-size: 11px; 
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        ">
          ${statusLabel}
        </span>
      </div>
      
      <!-- Progress Section -->
      <div style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-size: 14px; font-weight: 600; color: #374151;">Progress</span>
          <span style="font-size: 16px; font-weight: 700; color: #3b82f6;">${progress}%</span>
        </div>
        <div style="
          background: #e5e7eb; 
          height: 8px; 
          border-radius: 4px; 
          overflow: hidden;
          position: relative;
        ">
          <div style="
            background: linear-gradient(90deg, #3b82f6 0%, #10b981 100%); 
            height: 100%; 
            width: ${progress}%; 
            border-radius: 4px; 
            transition: width 0.5s ease-in-out;
            position: relative;
          ">
            ${parseFloat(progress) > 10 ? `
              <div style="
                position: absolute;
                right: 4px;
                top: 50%;
                transform: translateY(-50%);
                width: 4px;
                height: 4px;
                background: white;
                border-radius: 50%;
                animation: pulse 2s infinite;
              "></div>
            ` : ''}
          </div>
        </div>
      </div>
      
      <!-- Route Information -->
      <div style="
        background: #f8fafc; 
        border-left: 4px solid #3b82f6; 
        padding: 12px; 
        border-radius: 6px;
        margin-bottom: 12px;
      ">
        <div style="margin-bottom: 8px;">
          <div style="font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">From</div>
          <div style="font-size: 14px; color: #1f2937; font-weight: 500;">📍 ${shipment.origin_address}</div>
        </div>
        <div>
          <div style="font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">To</div>
          <div style="font-size: 14px; color: #1f2937; font-weight: 500;">🎯 ${shipment.dest_address}</div>
        </div>
      </div>
      
      <!-- Stats Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
        <div style="text-align: center; background: white; padding: 8px; border-radius: 6px; border: 1px solid #e5e7eb;">
          <div style="font-size: 12px; color: #6b7280; font-weight: 600;">DISTANCE</div>
          <div style="font-size: 16px; font-weight: 700; color: #1f2937;">${shipment.distance_display || 'N/A'}</div>
        </div>
        <div style="text-align: center; background: white; padding: 8px; border-radius: 6px; border: 1px solid #e5e7eb;">
          <div style="font-size: 12px; color: #6b7280; font-weight: 600;">ETA</div>
          <div style="font-size: 16px; font-weight: 700; color: #1f2937;">${shipment.eta_display || 'TBD'}</div>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="
        padding-top: 12px; 
        border-top: 1px solid #e5e7eb; 
        font-size: 11px; 
        color: #9ca3af;
        text-align: center;
      ">
        Last updated: ${new Date().toLocaleTimeString()}
      </div>
    </div>
    
    <style>
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    </style>
  `
}