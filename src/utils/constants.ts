// App-wide constants
export const APP_CONFIG = {
  name: 'HappyRobot Tracking',
  version: '1.0.0',
  description: 'Real-time shipment tracking with AI-powered logistics',
}

// Map configuration
export const MAP_CONFIG = {
  defaultCenter: { lat: 39.8283, lng: -98.5795 }, // Center of US
  defaultZoom: 5,
  markerZoom: 10,
  routeZoom: 8,
  updateInterval: 3000, // 3 seconds for real-time updates
}

// Shipment configuration
export const SHIPMENT_CONFIG = {
  statuses: {
    pending: { color: 'yellow', label: 'Pending' },
    in_transit: { color: 'blue', label: 'In Transit' },
    delivered: { color: 'green', label: 'Delivered' },
    delayed: { color: 'red', label: 'Delayed' },
  },
  defaultSpeed: 80, // km/h average truck speed
  progressUpdateInterval: 2000, // 2 seconds for simulation
}

// Google Maps configuration
export const GOOGLE_MAPS_CONFIG = {
  libraries: ['places', 'geometry'] as const,
  mapOptions: {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
  },
  markerOptions: {
    animation: 2, // google.maps.Animation.DROP
  },
  polylineOptions: {
    strokeColor: '#2563EB',
    strokeOpacity: 0.8,
    strokeWeight: 3,
  },
}

// API endpoints (for Next.js API routes)
export const API_ROUTES = {
  shipments: '/api/shipments',
  simulation: '/api/simulation',
  geocoding: '/api/geocoding',
} as const

// Error messages
export const ERROR_MESSAGES = {
  GOOGLE_MAPS_LOAD_FAILED: 'Failed to load Google Maps',
  SHIPMENT_CREATE_FAILED: 'Failed to create shipment',
  SHIPMENT_UPDATE_FAILED: 'Failed to update shipment',
  LOCATION_NOT_FOUND: 'Location not found',
  ROUTE_CALCULATION_FAILED: 'Failed to calculate route',
  NETWORK_ERROR: 'Network error. Please check your connection.',
} as const

// Success messages
export const SUCCESS_MESSAGES = {
  SHIPMENT_CREATED: 'Shipment created successfully',
  SHIPMENT_UPDATED: 'Shipment updated successfully',
  SHIPMENT_DELETED: 'Shipment deleted successfully',
} as const