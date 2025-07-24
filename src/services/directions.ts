import { LatLng, DirectionsRequest, RouteInfo } from '@/types/google-maps'

class DirectionsService {
  private service: google.maps.DirectionsService | null = null

  private getService(): google.maps.DirectionsService {
    if (!window.google?.maps) {
      throw new Error('Google Maps not loaded')
    }

    if (!this.service) {
      this.service = new google.maps.DirectionsService()
    }

    return this.service
  }

  async getRoute(request: DirectionsRequest): Promise<RouteInfo> {
    const service = this.getService()

    return new Promise((resolve, reject) => {
      service.route(
        {
          origin: request.origin,
          destination: request.destination,
          travelMode: request.travelMode,
          unitSystem: request.unitSystem || google.maps.UnitSystem.METRIC,
          avoidHighways: request.avoidHighways || false,
          avoidTolls: request.avoidTolls || false
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            const route = result.routes[0]
            const leg = route.legs[0]

            // FIXED: Handle both string and object types for overview_polyline
            let polylinePoints = ''
            const polyline = route.overview_polyline as any
            
            if (typeof polyline === 'string') {
              polylinePoints = polyline
            } else if (polyline && typeof polyline === 'object' && 'points' in polyline) {
              polylinePoints = polyline.points
            }

            const routeInfo: RouteInfo = {
              distance: leg.distance!,
              duration: leg.duration!,
              polyline: polylinePoints,
              start_location: {
                lat: leg.start_location.lat(),
                lng: leg.start_location.lng()
              },
              end_location: {
                lat: leg.end_location.lat(),
                lng: leg.end_location.lng()
              }
            }

            resolve(routeInfo)
          } else {
            reject(new Error(`Directions request failed: ${status}`))
          }
        }
      )
    })
  }

  async getMultipleRoutes(requests: DirectionsRequest[]): Promise<RouteInfo[]> {
    const promises = requests.map(request => this.getRoute(request))
    return Promise.all(promises)
  }

  decodePolyline(encoded: string): LatLng[] {
    if (!window.google?.maps?.geometry?.encoding) {
      throw new Error('Google Maps geometry library not loaded')
    }

    const path = google.maps.geometry.encoding.decodePath(encoded)
    return path.map(point => ({
      lat: point.lat(),
      lng: point.lng()
    }))
  }

  // Helper method to safely extract polyline from DirectionsResult
  static extractPolyline(result: google.maps.DirectionsResult): string {
    const route = result.routes[0]
    if (!route?.overview_polyline) return ''
    
    const polyline = route.overview_polyline as any
    
    if (typeof polyline === 'string') {
      return polyline
    } else if (polyline && typeof polyline === 'object' && 'points' in polyline) {
      return polyline.points
    }
    
    return ''
  }
}

export const directionsService = new DirectionsService()
export default directionsService