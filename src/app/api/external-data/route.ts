// src/app/api/external-data/route.ts

import { NextRequest, NextResponse } from 'next/server'

// Type definitions
interface Carrier {
  id: string
  name: string
  code: string
  type: string
  service: string
  active?: boolean
}

interface Company {
  id: string
  name: string
  contact: string
  email?: string
  phone?: string
  address?: string
  industry: string
}

interface RouteData {
  id: string
  origin: {
    address: string
    lat: number
    lng: number
    hub: string
  }
  destination: {
    address: string
    lat: number
    lng: number
    hub: string
  }
  distance: number
  duration: number
  type: string
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresIn: number
}

// External API endpoints
const APIS = {
  shipengine: 'https://api.shipengine.com/v1',
  jsonplaceholder: 'https://jsonplaceholder.typicode.com',
  googleMaps: 'https://maps.googleapis.com/maps/api'
}

// In-memory cache for API responses
const cache = new Map<string, CacheEntry<any>>()

// Cache helper functions
function isValidCache(entry: CacheEntry<any>): boolean {
  return Date.now() - entry.timestamp < entry.expiresIn
}

function getFromCache<T>(key: string): T | null {
  const cached = cache.get(key)
  if (cached && isValidCache(cached)) {
    console.log(`📦 Using cached ${key}`)
    return cached.data as T
  }
  return null
}

function setCache<T>(key: string, data: T, expiresIn: number = 30 * 60 * 1000): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    expiresIn
  })
  console.log(`💾 Cached ${key} for ${expiresIn / 1000 / 60} minutes`)
}

// Headers for ShipEngine API
const getShipEngineHeaders = () => ({
  'API-Key': process.env.SHIPENGINE_API_KEY || '',
  'Content-Type': 'application/json'
})

// Get real data from external APIs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'shipments'
    const count = parseInt(searchParams.get('count') || '50')
    const forceRefresh = searchParams.get('force') === 'true'

    console.log(`Fetching ${type} data, count: ${count}, force: ${forceRefresh}`)

    // Clear cache if force refresh is requested
    if (forceRefresh) {
      cache.clear()
      console.log('🗑️ Cache cleared due to force refresh')
    }

    switch (type) {
      case 'shipments':
        const shipments = await generateRealisticShipments(count)
        return NextResponse.json({
          success: true,
          data: shipments,
          count: shipments.length,
          source: 'external-apis',
          timestamp: new Date().toISOString(),
          cached: false
        })

      case 'carriers':
        const carriers = await getRealCarriersWithCache()
        return NextResponse.json({
          success: true,
          data: carriers,
          source: 'shipengine-api',
          cached: getFromCache<Carrier[]>('carriers') !== null
        })

      case 'companies':
        const companies = await getRealCompaniesWithCache()
        return NextResponse.json({
          success: true,
          data: companies,
          source: 'jsonplaceholder-api',
          cached: getFromCache<Company[]>('companies') !== null
        })

      case 'test':
        const testData = await testExternalAPIs()
        return NextResponse.json({
          success: true,
          data: testData,
          message: 'API connection test results'
        })

      case 'cache-stats':
        const stats = Array.from(cache.entries()).map(([key, entry]) => ({
          key,
          age: Math.round((Date.now() - entry.timestamp) / 1000 / 60), // minutes
          isValid: isValidCache(entry),
          expiresIn: Math.round(entry.expiresIn / 1000 / 60) // minutes
        }))
        return NextResponse.json({
          success: true,
          data: {
            totalEntries: cache.size,
            entries: stats
          },
          message: 'Cache statistics'
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid type parameter. Use: shipments, carriers, companies, test, or cache-stats'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('External data API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch external data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Get real carriers with caching (1 hour cache)
async function getRealCarriersWithCache(): Promise<Carrier[]> {
  const cacheKey = 'carriers'
  const cached = getFromCache<Carrier[]>(cacheKey)
  
  if (cached) {
    return cached
  }

  // No cache, fetch fresh data
  console.log('🌐 Fetching fresh carriers from ShipEngine...')
  const carriers = await getRealCarriers()
  setCache(cacheKey, carriers, 60 * 60 * 1000) // Cache for 1 hour
  return carriers
}

// Get real companies with caching (1 hour cache)
async function getRealCompaniesWithCache(): Promise<Company[]> {
  const cacheKey = 'companies'
  const cached = getFromCache<Company[]>(cacheKey)
  
  if (cached) {
    return cached
  }

  // No cache, fetch fresh data
  console.log('🌐 Fetching fresh companies from JSONPlaceholder...')
  const companies = await getRealCompanies()
  setCache(cacheKey, companies, 60 * 60 * 1000) // Cache for 1 hour
  return companies
}

// Generate realistic shipments using cached external data
async function generateRealisticShipments(count: number): Promise<any[]> {
  console.log('Generating realistic shipments...')
  
  // Get real data from cached APIs
  const [realCarriers, realCompanies, realRoutes] = await Promise.all([
    getRealCarriersWithCache(), // Uses cache now
    getRealCompaniesWithCache(), // Uses cache now
    getRealisticUSRoutes()
  ])

  console.log(`Got ${realCarriers.length} carriers, ${realCompanies.length} companies (from cache if available)`)

  const shipments: any[] = []

  for (let i = 0; i < count; i++) {
    const route = realRoutes[Math.floor(Math.random() * realRoutes.length)]
    const carrier = realCarriers[Math.floor(Math.random() * realCarriers.length)]
    const company = realCompanies[Math.floor(Math.random() * realCompanies.length)]
    
    const createdDate = getRandomDateWithinDays(30)
    const progress = Math.round(Math.random() * 100)
    const status = getRealisticStatus(progress, createdDate)

    // Calculate current position based on progress
    const currentPosition = interpolatePosition(
      route.origin.lat, route.origin.lng,
      route.destination.lat, route.destination.lng,
      progress
    )

    const shipment = {
      id: `ext-${Date.now()}-${i}`,
      shipment_number: generateShipmentNumber(),
      
      // Real route data
      origin_address: route.origin.address,
      origin_lat: route.origin.lat,
      origin_lng: route.origin.lng,
      dest_address: route.destination.address,
      dest_lat: route.destination.lat,
      dest_lng: route.destination.lng,
      
      // Current tracking position
      current_lat: currentPosition.lat,
      current_lng: currentPosition.lng,
      progress_percentage: progress,
      
      // Business data from real APIs
      status: status,
      customer_name: company.name,
      carrier: carrier.name,
      
      // Calculated realistic data
      distance_km: route.distance,
      estimated_duration_hours: route.duration,
      revenue: calculateRealisticRevenue(route.distance, carrier.type),
      priority: Math.random() > 0.8 ? 'high' : 'normal',
      
      // Logistics details
      temperature_controlled: Math.random() > 0.7,
      hazmat: Math.random() > 0.9,
      weight_kg: Math.round(Math.random() * 15000 + 5000), // 5-20 tons
      
      // Timestamps
      created_at: createdDate,
      started_at: createdDate,
      eta: calculateRealisticETA(createdDate, route.duration, progress),
      updated_at: new Date().toISOString(),
      
      // Metadata
      external_source: 'real-apis',
      route_encoded: null, // Will be filled by Google Directions API
      carrier_service: carrier.service,
      tracking_events: generateTrackingEvents(status, createdDate)
    }

    shipments.push(shipment)
  }

  console.log(`Generated ${shipments.length} realistic shipments`)
  return shipments
}

// Get real carriers from ShipEngine API (WITHOUT caching - called by cached version)
async function getRealCarriers(): Promise<Carrier[]> {
  try {
    if (!process.env.SHIPENGINE_API_KEY) {
      console.log('No ShipEngine API key, using fallback carriers')
      return getFallbackCarriers()
    }

    console.log('🌐 Making actual API call to ShipEngine...')
    const response = await fetch(`${APIS.shipengine}/carriers`, {
      headers: getShipEngineHeaders()
    })

    if (!response.ok) {
      throw new Error(`ShipEngine API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Transform ShipEngine carrier data
    const carriers: Carrier[] = data.carriers?.map((carrier: any) => ({
      id: carrier.carrier_id,
      name: carrier.friendly_name || carrier.carrier_code,
      code: carrier.carrier_code,
      type: 'freight',
      service: carrier.services?.[0]?.service_code || 'ground',
      active: true
    })) || []

    console.log(`✅ Got ${carriers.length} real carriers from ShipEngine`)
    return carriers.length > 0 ? carriers : getFallbackCarriers()

  } catch (error) {
    console.error('❌ ShipEngine API error:', error)
    return getFallbackCarriers()
  }
}

// Get real company names from JSONPlaceholder (WITHOUT caching - called by cached version)
async function getRealCompanies(): Promise<Company[]> {
  try {
    console.log('🌐 Making actual API call to JSONPlaceholder...')
    const response = await fetch(`${APIS.jsonplaceholder}/users`)
    
    if (!response.ok) {
      throw new Error(`JSONPlaceholder API error: ${response.status}`)
    }

    const users = await response.json()
    
    const companies: Company[] = users.map((user: any) => ({
      id: user.id,
      name: user.company?.name || `${user.name} Logistics`,
      contact: user.name,
      email: user.email,
      phone: user.phone,
      address: `${user.address?.street}, ${user.address?.city}`,
      industry: getRandomIndustry()
    }))

    // Add some realistic logistics companies
    const logisticsCompanies: Company[] = [
      { id: 'amazon', name: 'Amazon Logistics', contact: 'Logistics Manager', industry: 'E-commerce' },
      { id: 'walmart', name: 'Walmart Supply Chain', contact: 'Supply Chain Director', industry: 'Retail' },
      { id: 'target', name: 'Target Corporation', contact: 'Distribution Manager', industry: 'Retail' },
      { id: 'homedepot', name: 'Home Depot Logistics', contact: 'Transportation Manager', industry: 'Home Improvement' },
      { id: 'costco', name: 'Costco Wholesale', contact: 'Freight Coordinator', industry: 'Wholesale' }
    ]

    const allCompanies = [...companies, ...logisticsCompanies]
    console.log(`✅ Got ${allCompanies.length} real companies from JSONPlaceholder`)
    return allCompanies

  } catch (error) {
    console.error('❌ JSONPlaceholder API error:', error)
    return getFallbackCompanies()
  }
}

// Fallback carriers (real logistics companies)
function getFallbackCarriers(): Carrier[] {
  return [
    { id: 'fedex', name: 'FedEx Freight', code: 'fedex', type: 'freight', service: 'ground' },
    { id: 'ups', name: 'UPS Freight', code: 'ups', type: 'freight', service: 'ground' },
    { id: 'swift', name: 'Swift Transportation', code: 'swift', type: 'truckload', service: 'dry_van' },
    { id: 'schneider', name: 'Schneider National', code: 'schneider', type: 'truckload', service: 'dry_van' },
    { id: 'jbhunt', name: 'J.B. Hunt Transport', code: 'jbhunt', type: 'intermodal', service: 'container' },
    { id: 'knight', name: 'Knight-Swift Transportation', code: 'knight', type: 'truckload', service: 'dry_van' },
    { id: 'landstar', name: 'Landstar System', code: 'landstar', type: 'specialty', service: 'flatbed' },
    { id: 'olddom', name: 'Old Dominion Freight Line', code: 'olddom', type: 'ltl', service: 'regional' },
    { id: 'xpo', name: 'XPO Logistics', code: 'xpo', type: 'ltl', service: 'national' },
    { id: 'yellow', name: 'Yellow Corporation', code: 'yellow', type: 'ltl', service: 'regional' },
    { id: 'saia', name: 'Saia Inc', code: 'saia', type: 'ltl', service: 'regional' },
    { id: 'estes', name: 'Estes Express Lines', code: 'estes', type: 'ltl', service: 'regional' }
  ]
}

function getFallbackCompanies(): Company[] {
  return [
    { id: '1', name: 'Amazon Logistics', contact: 'Logistics Manager', industry: 'E-commerce' },
    { id: '2', name: 'Walmart Supply Chain', contact: 'Supply Chain Director', industry: 'Retail' },
    { id: '3', name: 'Target Corporation', contact: 'Distribution Manager', industry: 'Retail' }
  ]
}

// Get realistic US routes (using real cities)
async function getRealisticUSRoutes(): Promise<RouteData[]> {
  // Major US logistics hubs and routes
  const majorCities = [
    { name: 'Los Angeles, CA', lat: 34.0522, lng: -118.2437, hub: 'West Coast' },
    { name: 'Chicago, IL', lat: 41.8781, lng: -87.6298, hub: 'Midwest' },
    { name: 'Atlanta, GA', lat: 33.7490, lng: -84.3880, hub: 'Southeast' },
    { name: 'Dallas, TX', lat: 32.7767, lng: -96.7970, hub: 'South Central' },
    { name: 'Newark, NJ', lat: 40.7357, lng: -74.1724, hub: 'Northeast' },
    { name: 'Phoenix, AZ', lat: 33.4484, lng: -112.0740, hub: 'Southwest' },
    { name: 'Houston, TX', lat: 29.7604, lng: -95.3698, hub: 'Gulf Coast' },
    { name: 'Denver, CO', lat: 39.7392, lng: -104.9903, hub: 'Mountain West' },
    { name: 'Seattle, WA', lat: 47.6062, lng: -122.3321, hub: 'Pacific Northwest' },
    { name: 'Miami, FL', lat: 25.7617, lng: -80.1918, hub: 'Southeast' },
    { name: 'Memphis, TN', lat: 35.1495, lng: -90.0490, hub: 'FedEx Hub' },
    { name: 'Louisville, KY', lat: 38.2527, lng: -85.7585, hub: 'UPS Hub' },
    { name: 'San Francisco, CA', lat: 37.7749, lng: -122.4194, hub: 'Tech Hub' },
    { name: 'New York, NY', lat: 40.7128, lng: -74.0060, hub: 'Financial' },
    { name: 'Boston, MA', lat: 42.3601, lng: -71.0589, hub: 'Northeast' },
    { name: 'Portland, OR', lat: 45.5152, lng: -122.6784, hub: 'Pacific NW' },
    { name: 'Kansas City, MO', lat: 39.0997, lng: -94.5786, hub: 'Central' },
    { name: 'Salt Lake City, UT', lat: 40.7608, lng: -111.8910, hub: 'Mountain' },
    { name: 'Nashville, TN', lat: 36.1627, lng: -86.7816, hub: 'Music City' },
    { name: 'Columbus, OH', lat: 39.9612, lng: -82.9988, hub: 'Midwest' }
  ]

  const routes: RouteData[] = []

  // Generate realistic routes between major logistics hubs
  for (let i = 0; i < 40; i++) {
    const origin = majorCities[Math.floor(Math.random() * majorCities.length)]
    let destination = majorCities[Math.floor(Math.random() * majorCities.length)]
    
    // Ensure different origin and destination
    while (destination.name === origin.name) {
      destination = majorCities[Math.floor(Math.random() * majorCities.length)]
    }

    const distance = calculateRealDistance(origin.lat, origin.lng, destination.lat, destination.lng)
    const duration = calculateRealisticDuration(distance)

    routes.push({
      id: `route-${i}`,
      origin: {
        address: origin.name,
        lat: origin.lat,
        lng: origin.lng,
        hub: origin.hub
      },
      destination: {
        address: destination.name,
        lat: destination.lat,
        lng: destination.lng,
        hub: destination.hub
      },
      distance: Math.round(distance),
      duration: Math.round(duration),
      type: distance > 1000 ? 'long_haul' : 'regional'
    })
  }

  return routes
}

// Test external API connections
async function testExternalAPIs() {
  const tests = {
    shipengine: { status: 'unknown', message: '' },
    jsonplaceholder: { status: 'unknown', message: '' },
    google: { status: 'unknown', message: '' }
  }

  // Test ShipEngine
  try {
    if (process.env.SHIPENGINE_API_KEY) {
      const response = await fetch(`${APIS.shipengine}/carriers`, {
        headers: getShipEngineHeaders()
      })
      tests.shipengine = {
        status: response.ok ? 'success' : 'error',
        message: response.ok ? 'Connected' : `HTTP ${response.status}`
      }
    } else {
      tests.shipengine = {
        status: 'warning',
        message: 'No API key configured'
      }
    }
  } catch (error) {
    tests.shipengine = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Connection failed'
    }
  }

  // Test JSONPlaceholder
  try {
    const response = await fetch(`${APIS.jsonplaceholder}/users`)
    tests.jsonplaceholder = {
      status: response.ok ? 'success' : 'error',
      message: response.ok ? 'Connected' : `HTTP ${response.status}`
    }
  } catch (error) {
    tests.jsonplaceholder = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Connection failed'
    }
  }

  // Test Google Maps (check if API key exists)
  tests.google = {
    status: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'success' : 'warning',
    message: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'API key configured' : 'No API key'
  }

  return tests
}

// Utility functions
function generateShipmentNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `SHIP-${year}${month}${day}-${random}`
}

function getRandomDateWithinDays(days: number): string {
  const now = new Date()
  const pastDate = new Date(now.getTime() - Math.random() * days * 24 * 60 * 60 * 1000)
  return pastDate.toISOString()
}

function interpolatePosition(originLat: number, originLng: number, destLat: number, destLng: number, progress: number) {
  const p = progress / 100
  return {
    lat: originLat + (destLat - originLat) * p,
    lng: originLng + (destLng - originLng) * p
  }
}

function getRealisticStatus(progress: number, createdDate: string): string {
  const daysSinceCreated = (Date.now() - new Date(createdDate).getTime()) / (1000 * 60 * 60 * 24)
  
  if (progress === 0) return 'pending'
  if (progress === 100) return 'delivered'
  if (progress < 10) return 'pickup'
  if (progress > 90) return 'delivery'
  if (daysSinceCreated > 5 && progress < 50) return 'delayed'
  return 'in_transit'
}

function calculateRealisticRevenue(distance: number, carrierType: string): number {
  const baseRates: Record<string, number> = {
    'freight': 3.5,
    'truckload': 2.8,
    'ltl': 4.2,
    'intermodal': 2.1,
    'specialty': 5.5
  }
  
  const rate = baseRates[carrierType] || 3.0
  const randomMultiplier = 0.8 + Math.random() * 0.4 // 80% - 120%
  return Math.round(distance * rate * randomMultiplier)
}

function calculateRealisticETA(startDate: string, durationHours: number, progress: number): string {
  const start = new Date(startDate)
  const remainingHours = durationHours * (1 - progress / 100)
  const eta = new Date(start.getTime() + remainingHours * 60 * 60 * 1000)
  return eta.toISOString()
}

function calculateRealDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

function calculateRealisticDuration(distance: number): number {
  // Account for realistic truck driving speeds and rest breaks
  const avgSpeed = 65 // km/h average including stops
  let baseDuration = distance / avgSpeed
  
  // Add mandatory rest breaks for long hauls
  if (distance > 800) {
    baseDuration += 10 // 10 hour rest break
  }
  
  return baseDuration
}

function getRandomIndustry(): string {
  const industries = [
    'Manufacturing', 'Retail', 'E-commerce', 'Automotive', 
    'Food & Beverage', 'Pharmaceuticals', 'Electronics', 
    'Construction', 'Agriculture', 'Chemical'
  ]
  return industries[Math.floor(Math.random() * industries.length)]
}

function generateTrackingEvents(status: string, createdDate: string) {
  const events = []
  const created = new Date(createdDate)
  
  events.push({
    timestamp: created.toISOString(),
    event: 'shipment_created',
    description: 'Shipment booking confirmed',
    location: 'Origin facility'
  })
  
  if (status !== 'pending') {
    const pickup = new Date(created.getTime() + 2 * 60 * 60 * 1000) // +2 hours
    events.push({
      timestamp: pickup.toISOString(),
      event: 'picked_up',
      description: 'Package picked up',
      location: 'Origin facility'
    })
  }
  
  if (status === 'delivered') {
    const delivery = new Date(created.getTime() + 24 * 60 * 60 * 1000) // +24 hours
    events.push({
      timestamp: delivery.toISOString(),
      event: 'delivered',
      description: 'Package delivered successfully',
      location: 'Destination'
    })
  }
  
  return events
}

// Enhanced POST endpoint with cache control
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'refresh':
        // Clear cache before refreshing
        cache.clear()
        console.log('🗑️ Cache cleared for refresh')
        
        const refreshedData = await generateRealisticShipments(body.count || 50)
        return NextResponse.json({
          success: true,
          data: refreshedData,
          message: `Refreshed ${refreshedData.length} shipments with real external data (cache cleared)`
        })

      case 'test-apis':
        const testResults = await testExternalAPIs()
        return NextResponse.json({
          success: true,
          data: testResults,
          message: 'External API connection test completed'
        })

      case 'clear-cache':
        cache.clear()
        return NextResponse.json({
          success: true,
          message: 'Cache cleared successfully'
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: refresh, test-apis, or clear-cache'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('External data POST error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}