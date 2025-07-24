// src/services/openai-logistics.ts
import OpenAI from 'openai'

interface ShipmentData {
  id: string
  shipment_number: string
  status: string
  progress_percentage: number
  origin_address: string
  dest_address: string
  carrier: string
  customer_name: string
  customer_industry: string
  revenue: number
  distance_km: number
  estimated_duration_hours: number
  priority: string
  temperature_controlled: boolean
  hazmat: boolean
  fragile: boolean
  created_at: string
  eta: string
}

interface LogisticsContext {
  shipments: ShipmentData[]
  totalRevenue: number
  activeShipments: number
  delayedShipments: number
  onTimeRate: number
  topCarriers: string[]
  recentEvents: any[]
}

interface AIResponse {
  message: string
  confidence: number
  suggestedActions?: Array<{
    type: string
    description: string
    priority: 'low' | 'medium' | 'high'
    shipmentId?: string
  }>
  insights?: string[]
  data?: any
}

class OpenAILogisticsService {
  private openai: OpenAI
  private systemPrompt: string

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // Only for demo - use backend in production
    })

    this.systemPrompt = `You are an expert AI logistics assistant for a freight management platform. You help logistics managers make data-driven decisions by analyzing shipment data, identifying patterns, and providing actionable insights.

Your capabilities include:
- Real-time shipment tracking and analysis
- Delay prediction and problem identification  
- Carrier performance evaluation
- Route optimization recommendations
- Customer communication assistance
- Revenue and cost optimization
- Risk assessment and mitigation

Communication style:
- Professional yet approachable
- Data-driven with specific metrics
- Action-oriented with clear next steps
- Logistics terminology when appropriate
- Concise but comprehensive responses

Always provide:
1. Direct answer to the question
2. Supporting data/metrics when relevant
3. Actionable recommendations
4. Risk factors or considerations if applicable

Remember: You're helping busy logistics professionals make quick, informed decisions.`
  }

  // Create logistics context from shipment data
  private createLogisticsContext(shipments: ShipmentData[]): LogisticsContext {
    const totalRevenue = shipments.reduce((sum, s) => sum + (s.revenue || 0), 0)
    const activeShipments = shipments.filter(s => s.status === 'in_transit').length
    const delayedShipments = shipments.filter(s => s.status === 'delayed').length
    const deliveredShipments = shipments.filter(s => s.status === 'delivered').length
    const onTimeRate = shipments.length > 0 ? ((deliveredShipments + activeShipments) / shipments.length) * 100 : 0

    // Get top carriers by volume
    const carrierCounts = shipments.reduce((acc, s) => {
      if (s.carrier) {
        acc[s.carrier] = (acc[s.carrier] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
    
    const topCarriers = Object.entries(carrierCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([carrier]) => carrier)

    return {
      shipments,
      totalRevenue,
      activeShipments,
      delayedShipments,
      onTimeRate,
      topCarriers,
      recentEvents: [] // Can be populated with recent events
    }
  }

  // Generate user-friendly context summary
  private formatContextForAI(context: LogisticsContext): string {
    const { shipments, totalRevenue, activeShipments, delayedShipments, onTimeRate, topCarriers } = context
    
    return `Current Logistics Overview:
- Total Shipments: ${shipments.length}
- Active In-Transit: ${activeShipments}
- Delayed: ${delayedShipments}  
- Total Revenue: $${(totalRevenue / 1000).toFixed(1)}K
- On-Time Rate: ${onTimeRate.toFixed(1)}%
- Top Carriers: ${topCarriers.join(', ')}

Recent Shipments:
${shipments.slice(0, 5).map(s => 
  `- ${s.shipment_number}: ${s.status} (${s.progress_percentage}%) - ${s.origin_address?.split(',')[0]} → ${s.dest_address?.split(',')[0]} via ${s.carrier}`
).join('\n')}

Priority Shipments: ${shipments.filter(s => s.priority === 'high' || s.priority === 'urgent').length}
Special Requirements: ${shipments.filter(s => s.temperature_controlled || s.hazmat || s.fragile).length} shipments`
  }

  // Main AI query method
  async queryLogisticsAI(
    userMessage: string, 
    shipments: ShipmentData[], 
    conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = []
  ): Promise<AIResponse> {
    try {
      const context = this.createLogisticsContext(shipments)
      const contextSummary = this.formatContextForAI(context)

      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: this.systemPrompt },
        { role: 'system', content: `Current logistics data context:\n${contextSummary}` },
        ...conversationHistory.map(msg => ({ 
          role: msg.role, 
          content: msg.content 
        } as OpenAI.Chat.Completions.ChatCompletionMessageParam)),
        { role: 'user', content: userMessage }
      ]

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      })

      const aiMessage = response.choices[0]?.message?.content || 'I apologize, but I could not process your request at the moment.'
      
      // Extract insights and actions from response (basic parsing)
      const suggestedActions = this.extractActions(aiMessage, shipments)
      const insights = this.extractInsights(aiMessage)

      return {
        message: aiMessage,
        confidence: 0.85, // Could implement confidence scoring
        suggestedActions,
        insights,
        data: {
          context,
          tokensUsed: response.usage?.total_tokens || 0
        }
      }

    } catch (error) {
      console.error('OpenAI API Error:', error)
      
      // Intelligent fallback based on query
      return this.getFallbackResponse(userMessage, shipments)
    }
  }

  // Extract actionable items from AI response
  private extractActions(aiMessage: string, shipments: ShipmentData[]): Array<{type: string, description: string, priority: 'low' | 'medium' | 'high', shipmentId?: string}> {
    const actions: Array<{type: string, description: string, priority: 'low' | 'medium' | 'high', shipmentId?: string}> = []
    
    // Look for specific action keywords
    if (aiMessage.toLowerCase().includes('call driver') || aiMessage.toLowerCase().includes('contact driver')) {
      const delayedShipment = shipments.find(s => s.status === 'delayed')
      if (delayedShipment) {
        actions.push({
          type: 'call_driver',
          description: `Call driver for ${delayedShipment.shipment_number}`,
          priority: 'high',
          shipmentId: delayedShipment.id
        })
      }
    }

    if (aiMessage.toLowerCase().includes('email customer') || aiMessage.toLowerCase().includes('notify customer')) {
      actions.push({
        type: 'email_customer',
        description: 'Send customer update notification',
        priority: 'medium'
      })
    }

    if (aiMessage.toLowerCase().includes('optimize') || aiMessage.toLowerCase().includes('reroute')) {
      actions.push({
        type: 'optimize_route',
        description: 'Review route optimization opportunities',
        priority: 'medium'
      })
    }

    return actions
  }

  // Extract key insights from AI response
  private extractInsights(aiMessage: string): string[] {
    const insights: string[] = []
    
    // Look for insight patterns
    const sentences = aiMessage.split(/[.!?]+/).filter(s => s.trim().length > 10)
    
    sentences.forEach(sentence => {
      const lower = sentence.toLowerCase()
      if (lower.includes('recommend') || lower.includes('suggest') || 
          lower.includes('consider') || lower.includes('should') ||
          lower.includes('opportunity') || lower.includes('risk')) {
        insights.push(sentence.trim())
      }
    })

    return insights.slice(0, 3) // Limit to top 3 insights
  }

  // Intelligent fallback when OpenAI fails
  private getFallbackResponse(userMessage: string, shipments: ShipmentData[]): AIResponse {
    const lowerMessage = userMessage.toLowerCase()
    
    if (lowerMessage.includes('delay') || lowerMessage.includes('late')) {
      const delayedCount = shipments.filter(s => s.status === 'delayed').length
      return {
        message: `I found ${delayedCount} delayed shipments. I recommend calling drivers for status updates and notifying affected customers.`,
        confidence: 0.6,
        suggestedActions: [{
          type: 'review_delays',
          description: 'Review all delayed shipments',
          priority: 'high'
        }]
      }
    }

    if (lowerMessage.includes('revenue') || lowerMessage.includes('profit')) {
      const totalRevenue = shipments.reduce((sum, s) => sum + (s.revenue || 0), 0)
      return {
        message: `Current total revenue: $${totalRevenue.toLocaleString()}. Based on your shipment mix, I see opportunities for route optimization and carrier negotiation.`,
        confidence: 0.7
      }
    }

    if (lowerMessage.includes('status') || lowerMessage.includes('overview')) {
      const activeCount = shipments.filter(s => s.status === 'in_transit').length
      return {
        message: `Overview: ${activeCount} shipments in transit, ${shipments.length} total active shipments. Operations are running smoothly with normal activity levels.`,
        confidence: 0.8
      }
    }

    return {
      message: "I'm having trouble connecting to my AI systems right now, but I can help you with shipment tracking, delay analysis, and operational insights. Please try rephrasing your question or ask about specific shipments.",
      confidence: 0.3
    }
  }

  // Specialized methods for common logistics queries
  async analyzeCarrierPerformance(shipments: ShipmentData[]): Promise<AIResponse> {
    const query = "Analyze carrier performance across all shipments. Which carriers are performing best and worst? What patterns do you see in delivery times, delays, and costs?"
    return this.queryLogisticsAI(query, shipments)
  }

  async predictDelays(shipments: ShipmentData[]): Promise<AIResponse> {
    const query = "Based on current shipment data, which shipments are at risk for delays? What factors should I monitor closely?"
    return this.queryLogisticsAI(query, shipments)
  }

  async optimizeRoutes(shipments: ShipmentData[]): Promise<AIResponse> {
    const query = "Analyze current routes and suggest optimization opportunities. Focus on cost savings and efficiency improvements."
    return this.queryLogisticsAI(query, shipments)
  }

  async generateCustomerCommunication(shipmentNumber: string, reason: string): Promise<AIResponse> {
    const query = `Generate a professional customer communication for shipment ${shipmentNumber} regarding: ${reason}. Make it informative but reassuring.`
    return this.queryLogisticsAI(query, [])
  }
}

export default OpenAILogisticsService