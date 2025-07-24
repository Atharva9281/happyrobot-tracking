import { LatLng } from '@/types/google-maps'

// Linear interpolation between two points
export const interpolateLatLng = (
  start: LatLng,
  end: LatLng,
  progress: number
): LatLng => {
  // Clamp progress between 0 and 1
  const clampedProgress = Math.max(0, Math.min(1, progress))
  
  return {
    lat: start.lat + (end.lat - start.lat) * clampedProgress,
    lng: start.lng + (end.lng - start.lng) * clampedProgress,
  }
}

// Calculate distance between two points using Haversine formula
export const calculateDistance = (point1: LatLng, point2: LatLng): number => {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(point2.lat - point1.lat)
  const dLng = toRadians(point2.lng - point1.lng)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Convert degrees to radians
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180)
}

// Calculate bearing between two points
export const calculateBearing = (start: LatLng, end: LatLng): number => {
  const dLng = toRadians(end.lng - start.lng)
  const startLat = toRadians(start.lat)
  const endLat = toRadians(end.lat)
  
  const y = Math.sin(dLng) * Math.cos(endLat)
  const x = Math.cos(startLat) * Math.sin(endLat) - 
           Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng)
  
  return (toDegrees(Math.atan2(y, x)) + 360) % 360
}

// Convert radians to degrees
const toDegrees = (radians: number): number => {
  return radians * (180 / Math.PI)
}

// Interpolate along a polyline path
export const interpolateAlongPath = (
  path: LatLng[],
  progress: number
): LatLng => {
  if (path.length === 0) throw new Error('Path cannot be empty')
  if (path.length === 1) return path[0]
  
  // Clamp progress between 0 and 1
  const clampedProgress = Math.max(0, Math.min(1, progress))
  
  // Calculate total distance
  const distances: number[] = [0]
  let totalDistance = 0
  
  for (let i = 1; i < path.length; i++) {
    const segmentDistance = calculateDistance(path[i - 1], path[i])
    totalDistance += segmentDistance
    distances.push(totalDistance)
  }
  
  // Find target distance
  const targetDistance = totalDistance * clampedProgress
  
  // Find the segment containing the target distance
  for (let i = 1; i < distances.length; i++) {
    if (targetDistance <= distances[i]) {
      const segmentStart = distances[i - 1]
      const segmentEnd = distances[i]
      const segmentProgress = (targetDistance - segmentStart) / (segmentEnd - segmentStart)
      
      return interpolateLatLng(path[i - 1], path[i], segmentProgress)
    }
  }
  
  // If we get here, return the last point
  return path[path.length - 1]
}

// Calculate ETA based on current position and speed
export const calculateETA = (
  currentPosition: LatLng,
  destination: LatLng,
  speedKmh: number
): Date => {
  const distance = calculateDistance(currentPosition, destination)
  const timeHours = distance / speedKmh
  const timeMs = timeHours * 60 * 60 * 1000
  
  return new Date(Date.now() + timeMs)
}

// Smooth interpolation with easing
export const easeInOutQuad = (t: number): number => {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

export const interpolateWithEasing = (
  start: LatLng,
  end: LatLng,
  progress: number,
  easingFunction: (t: number) => number = easeInOutQuad
): LatLng => {
  const easedProgress = easingFunction(Math.max(0, Math.min(1, progress)))
  return interpolateLatLng(start, end, easedProgress)
}