// src/services/enrichmentService.ts

export interface CarrierData {
  id: string
  name: string
  code: string
  type: string
  service: string
}

export interface CompanyData {
  id: string
  name: string
  contact: string
  email?: string
  phone?: string
  industry: string
}

export interface RouteData {
  distance_km: number
  duration_hours: number
  polyline?: string
}

export interface EnrichmentResult {
  carriers: CarrierData[]
  companies: CompanyData[]
  success: boolean
  error?: string
}

class EnrichmentService {
  private baseUrl = '/api/external-data'
  
  /**
   * Fetch real carriers from ShipEngine API
   */
  async getCarriers(): Promise<CarrierData[]> {
    try {
      const response = await fetch(`${this.baseUrl}?type=carriers`)
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error('Failed to fetch carriers')
      }
      
      return result.data || []
    } catch (error) {
      console.error('Error fetching carriers:', error)
      return this.getFallbackCarriers()
    }
  }

  /**
   * Fetch real companies from JSONPlaceholder API
   */
  async getCompanies(): Promise<CompanyData[]> {
    try {
      const response = await fetch(`${this.baseUrl}?type=companies`)
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error('Failed to fetch companies')
      }
      
      return result.data || []
    } catch (error) {
      console.error('Error fetching companies:', error)
      return this.getFallbackCompanies()
    }
  }

  /**
   * Get enrichment data for shipment creation
   */
  async getEnrichmentData(): Promise<EnrichmentResult> {
    try {
      const [carriers, companies] = await Promise.all([
        this.getCarriers(),
        this.getCompanies()
      ])

      return {
        carriers,
        companies,
        success: true
      }
    } catch (error) {
      console.error('Error getting enrichment data:', error)
      return {
        carriers: this.getFallbackCarriers(),
        companies: this.getFallbackCompanies(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Select optimal carrier based on distance and requirements
   */
  selectOptimalCarrier(
    carriers: CarrierData[], 
    distance: number, 
    specialRequirements: {
      temperatureControlled?: boolean
      hazmat?: boolean
      fragile?: boolean
    }
  ): CarrierData {
    if (carriers.length === 0) {
      return this.getFallbackCarriers()[0]
    }

    // Filter carriers based on special requirements
    let filteredCarriers = carriers

    if (specialRequirements.hazmat) {
      filteredCarriers = carriers.filter(c => c.type === 'specialty' || c.type === 'freight')
    }

    if (specialRequirements.temperatureControlled) {
      filteredCarriers = carriers.filter(c => c.type === 'specialty' || c.type === 'freight')
    }

    // Select based on distance
    if (distance > 1500) {
      // Long haul - prefer truckload carriers
      const longHaulCarriers = filteredCarriers.filter(c => c.type === 'truckload' || c.type === 'intermodal')
      if (longHaulCarriers.length > 0) {
        return longHaulCarriers[Math.floor(Math.random() * longHaulCarriers.length)]
      }
    } else if (distance < 500) {
      // Short haul - prefer LTL carriers
      const shortHaulCarriers = filteredCarriers.filter(c => c.type === 'ltl' || c.type === 'freight')
      if (shortHaulCarriers.length > 0) {
        return shortHaulCarriers[Math.floor(Math.random() * shortHaulCarriers.length)]
      }
    }

    // Default to random selection from filtered carriers
    return filteredCarriers[Math.floor(Math.random() * filteredCarriers.length)]
  }

  /**
   * Calculate realistic revenue based on distance and carrier type
   */
  calculateRevenue(distance: number, carrierType: string, priority: string): number {
    const baseRates = {
      'freight': 3.5,
      'truckload': 2.8,
      'ltl': 4.2,
      'intermodal': 2.1,
      'specialty': 5.5
    }

    const priorityMultiplier = {
      'normal': 1.0,
      'high': 1.3,
      'urgent': 1.8
    }

    const rate = baseRates[carrierType as keyof typeof baseRates] || 3.0
    const multiplier = priorityMultiplier[priority as keyof typeof priorityMultiplier] || 1.0
    const randomVariation = 0.8 + Math.random() * 0.4 // 80% - 120%

    return Math.round(distance * rate * multiplier * randomVariation)
  }

  /**
   * Test external API connections
   */
  async testConnections(): Promise<{
    shipengine: { status: string; message: string }
    jsonplaceholder: { status: string; message: string }
    google: { status: string; message: string }
  }> {
    try {
      const response = await fetch(`${this.baseUrl}?type=test`)
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error('Failed to test connections')
      }
      
      return result.data
    } catch (error) {
      console.error('Error testing connections:', error)
      return {
        shipengine: { status: 'error', message: 'Connection failed' },
        jsonplaceholder: { status: 'error', message: 'Connection failed' },
        google: { status: 'error', message: 'Connection failed' }
      }
    }
  }

  /**
   * Fallback carriers when API fails
   */
  private getFallbackCarriers(): CarrierData[] {
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
      { id: 'saia', name: 'Saia Inc', code: 'saia', type: 'ltl', service: 'regional' }
    ]
  }

  /**
   * Fallback companies when API fails
   */
  private getFallbackCompanies(): CompanyData[] {
    return [
      { id: '1', name: 'Amazon Logistics', contact: 'Logistics Manager', industry: 'E-commerce' },
      { id: '2', name: 'Walmart Supply Chain', contact: 'Supply Chain Director', industry: 'Retail' },
      { id: '3', name: 'Target Corporation', contact: 'Distribution Manager', industry: 'Retail' },
      { id: '4', name: 'Home Depot Logistics', contact: 'Transportation Manager', industry: 'Home Improvement' },
      { id: '5', name: 'Costco Wholesale', contact: 'Freight Coordinator', industry: 'Wholesale' },
      { id: '6', name: 'Tesla Motors', contact: 'Supply Chain Lead', industry: 'Automotive' },
      { id: '7', name: 'Apple Inc', contact: 'Logistics Director', industry: 'Technology' },
      { id: '8', name: 'Microsoft Corporation', contact: 'Distribution Manager', industry: 'Technology' }
    ]
  }
}

// Export singleton instance
export const enrichmentService = new EnrichmentService()

// Export for use in components
export default enrichmentService