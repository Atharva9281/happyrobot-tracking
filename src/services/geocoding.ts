import { LatLng, GeocodeRequest } from '@/types/google-maps'

interface GeocodeResponse {
  results: google.maps.GeocoderResult[]
  status: google.maps.GeocoderStatus
}

class GeocodingService {
  private geocoder: google.maps.Geocoder | null = null

  private getGeocoder(): google.maps.Geocoder {
    if (!window.google?.maps) {
      throw new Error('Google Maps not loaded')
    }

    if (!this.geocoder) {
      this.geocoder = new google.maps.Geocoder()
    }

    return this.geocoder
  }

  async geocodeAddress(address: string): Promise<LatLng> {
    const geocoder = this.getGeocoder()

    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          const location = results[0].geometry.location
          resolve({
            lat: location.lat(),
            lng: location.lng()
          })
        } else {
          reject(new Error(`Geocoding failed: ${status}`))
        }
      })
    })
  }

  async reverseGeocode(location: LatLng): Promise<string> {
    const geocoder = this.getGeocoder()

    return new Promise((resolve, reject) => {
      geocoder.geocode({ location }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          resolve(results[0].formatted_address)
        } else {
          reject(new Error(`Reverse geocoding failed: ${status}`))
        }
      })
    })
  }

  async geocodeMultipleAddresses(addresses: string[]): Promise<LatLng[]> {
    const promises = addresses.map(address => this.geocodeAddress(address))
    return Promise.all(promises)
  }
}

export const geocodingService = new GeocodingService()
export default geocodingService