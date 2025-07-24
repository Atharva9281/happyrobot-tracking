'use client'

import { useState, useEffect } from 'react'
import { googleMapsService } from '@/services/googleMaps'

export function useGoogleMaps() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadGoogleMaps()
  }, [])

  const loadGoogleMaps = async () => {
    try {
      setIsLoading(true)
      await googleMapsService.loadGoogleMaps()
      setIsLoaded(true)
      setLoadError(null)
    } catch (error) {
      console.error('Failed to load Google Maps:', error)
      setLoadError(error instanceof Error ? error.message : 'Failed to load Google Maps')
      setIsLoaded(false)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoaded,
    isLoading,
    loadError,
    googleMapsService,
    reload: loadGoogleMaps
  }
}