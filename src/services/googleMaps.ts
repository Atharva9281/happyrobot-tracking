import { LatLng, MapOptions, RouteInfo } from '@/types/google-maps'

class GoogleMapsService {
  private static instance: GoogleMapsService
  private isLoaded = false
  private loadPromise: Promise<void> | null = null

  private constructor() {}

  static getInstance(): GoogleMapsService {
    if (!GoogleMapsService.instance) {
      GoogleMapsService.instance = new GoogleMapsService()
    }
    return GoogleMapsService.instance
  }

  async loadGoogleMaps(): Promise<void> {
    if (this.isLoaded) return
    if (this.loadPromise) return this.loadPromise

    this.loadPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Google Maps can only be loaded in browser'))
        return
      }

      if (window.google?.maps) {
        this.isLoaded = true
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,geometry`
      script.async = true
      script.defer = true

      script.onload = () => {
        this.isLoaded = true
        resolve()
      }

      script.onerror = () => {
        reject(new Error('Failed to load Google Maps'))
      }

      document.head.appendChild(script)
    })

    return this.loadPromise
  }

  isGoogleMapsLoaded(): boolean {
    return this.isLoaded && typeof window !== 'undefined' && !!window.google?.maps
  }

  createMap(element: HTMLElement, options: MapOptions): google.maps.Map {
    if (!this.isGoogleMapsLoaded()) {
      throw new Error('Google Maps not loaded')
    }

    return new google.maps.Map(element, {
      center: options.center,
      zoom: options.zoom,
      mapTypeId: options.mapTypeId || google.maps.MapTypeId.ROADMAP,
      disableDefaultUI: options.disableDefaultUI || false,
      zoomControl: options.zoomControl ?? true,
      streetViewControl: options.streetViewControl ?? false,
      mapTypeControl: options.mapTypeControl ?? false,
      fullscreenControl: options.fullscreenControl ?? false,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    })
  }

  createMarker(options: {
    position: LatLng
    map: google.maps.Map
    title?: string
    icon?: string
    animation?: google.maps.Animation
  }): google.maps.Marker {
    if (!this.isGoogleMapsLoaded()) {
      throw new Error('Google Maps not loaded')
    }

    return new google.maps.Marker({
      position: options.position,
      map: options.map,
      title: options.title,
      icon: options.icon,
      animation: options.animation
    })
  }

  createPolyline(
    path: LatLng[],
    map: google.maps.Map,
    options?: {
      strokeColor?: string
      strokeOpacity?: number
      strokeWeight?: number
    }
  ): google.maps.Polyline {
    if (!this.isGoogleMapsLoaded()) {
      throw new Error('Google Maps not loaded')
    }

    return new google.maps.Polyline({
      path,
      map,
      strokeColor: options?.strokeColor || '#2563EB',
      strokeOpacity: options?.strokeOpacity || 0.8,
      strokeWeight: options?.strokeWeight || 3
    })
  }

  fitBounds(map: google.maps.Map, bounds: google.maps.LatLngBounds): void {
    map.fitBounds(bounds)
  }

  createBounds(points: LatLng[]): google.maps.LatLngBounds {
    if (!this.isGoogleMapsLoaded()) {
      throw new Error('Google Maps not loaded')
    }

    const bounds = new google.maps.LatLngBounds()
    points.forEach(point => bounds.extend(point))
    return bounds
  }
}

export const googleMapsService = GoogleMapsService.getInstance()
export default googleMapsService