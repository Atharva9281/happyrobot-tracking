// Google Maps API types that we'll use
export interface LatLng {
  lat: number
  lng: number
}

export interface MapOptions {
  center: LatLng
  zoom: number
  mapTypeId?: google.maps.MapTypeId
  disableDefaultUI?: boolean
  zoomControl?: boolean
  streetViewControl?: boolean
  mapTypeControl?: boolean
  fullscreenControl?: boolean
}

export interface MarkerOptions {
  position: LatLng
  map?: google.maps.Map
  title?: string
  icon?: string | google.maps.Icon
  animation?: google.maps.Animation
}

export interface DirectionsRequest {
  origin: LatLng | string
  destination: LatLng | string
  travelMode: google.maps.TravelMode
  unitSystem?: google.maps.UnitSystem
  avoidHighways?: boolean
  avoidTolls?: boolean
}

export interface DirectionsResult {
  routes: google.maps.DirectionsRoute[]
  status: google.maps.DirectionsStatus
}

export interface GeocodeRequest {
  address?: string
  location?: LatLng
  componentRestrictions?: google.maps.GeocoderComponentRestrictions
}

export interface GeocodeResult {
  results: google.maps.GeocoderResult[]
  status: google.maps.GeocoderStatus
}

export interface PlacesRequest {
  input: string
  types?: string[]
  componentRestrictions?: google.maps.places.ComponentRestrictions
}

// Custom interfaces for our app
export interface RouteInfo {
  distance: {
    text: string
    value: number // meters
  }
  duration: {
    text: string
    value: number // seconds
  }
  polyline: string
  start_location: LatLng
  end_location: LatLng
}

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}