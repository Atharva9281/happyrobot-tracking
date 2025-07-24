import { Shipment as DBShipment } from './database'

export interface Shipment extends DBShipment {
  // Additional computed properties for UI
  distance_display?: string
  eta_display?: string
  progress_display?: string
  status_color?: 'blue' | 'green' | 'yellow' | 'red'
}

export interface ShipmentLocation {
  lat: number
  lng: number
  address?: string
}

export interface ShipmentRoute {
  origin: ShipmentLocation
  destination: ShipmentLocation
  current: ShipmentLocation
  polyline?: string
  distance_km?: number
  duration_hours?: number
}

export interface CreateShipmentRequest {
  origin_address: string
  dest_address: string
  shipment_number?: string
}

export interface CreateShipmentResponse {
  success: boolean
  shipment?: Shipment
  error?: string
}

export interface ShipmentStats {
  total: number
  in_transit: number
  delivered: number
  pending: number
  delayed: number
  on_time_percentage: number
}

// Status type for components
export type ShipmentStatus = 'pending' | 'in_transit' | 'delivered' | 'delayed'

// Map marker interface
export interface ShipmentMarker {
  id: string
  position: { lat: number; lng: number }
  shipment: Shipment
  isSelected?: boolean
}