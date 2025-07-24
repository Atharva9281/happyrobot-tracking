'use client'

import React, { useState, useEffect } from 'react'

interface RealtimeEventsProps {
  shipments: any[]
  onEventTriggered?: (event: RealtimeEvent) => void
}

interface RealtimeEvent {
  id: string
  type: 'delay' | 'delivery' | 'pickup' | 'route_deviation' | 'weather_alert' | 'ai_action' | 'customer_contact'
  shipmentId: string
  shipmentNumber: string
  title: string
  description: string
  timestamp: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
  aiResponse?: string
  location?: {
    lat: number
    lng: number
    address: string
  }
}

export default function RealtimeEvents({ shipments, onEventTriggered }: RealtimeEventsProps) {
  const [events, setEvents] = useState<RealtimeEvent[]>([])
  const [isActive, setIsActive] = useState(true)
  const [showNotifications, setShowNotifications] = useState(true)

  // Event generation templates
  const eventTemplates = {
    delay: {
      titles: [
        "Traffic Delay Detected",
        "Unexpected Stop",
        "Route Congestion",
        "Driver Break Extended"
      ],
      descriptions: [
        "Heavy traffic causing 45-minute delay",
        "Unscheduled stop for vehicle inspection",
        "Construction zone causing delays",
        "Driver extending mandatory rest period"
      ],
      aiResponses: [
        "AI called driver to confirm delay. Rerouting through alternate highway.",
        "AI contacted customer with updated ETA and delay notification.",
        "AI analyzing traffic patterns to optimize remaining route.",
        "AI coordinating with dispatcher for priority handling."
      ]
    },
    delivery: {
      titles: [
        "Delivery Completed",
        "Successful Handoff",
        "POD Received",
        "Customer Satisfied"
      ],
      descriptions: [
        "Package delivered successfully to consignee",
        "Goods transferred to customer facility",
        "Proof of delivery documentation complete",
        "Customer confirmed receipt and satisfaction"
      ],
      aiResponses: [
        "AI automatically generated delivery confirmation and invoice.",
        "AI sent completion notification to all stakeholders.",
        "AI updated carrier performance metrics.",
        "AI initiated next shipment in queue for this route."
      ]
    },
    pickup: {
      titles: [
        "Pickup Completed",
        "Freight Loaded",
        "Departure Confirmed",
        "Route Initiated"
      ],
      descriptions: [
        "Freight successfully loaded and secured",
        "All documentation verified and complete",
        "Driver confirmed departure from origin",
        "GPS tracking activated and monitoring"
      ],
      aiResponses: [
        "AI sent pickup confirmation to customer and consignee.",
        "AI activated real-time tracking and monitoring.",
        "AI optimized route based on current traffic conditions.",
        "AI scheduled automated check-in calls with driver."
      ]
    },
    route_deviation: {
      titles: [
        "Route Deviation Alert",
        "Unexpected Detour",
        "GPS Variance Detected",
        "Off-Route Navigation"
      ],
      descriptions: [
        "Vehicle deviated 5+ miles from planned route",
        "Driver taking alternate path due to road closure",
        "GPS shows unexpected location variance",
        "Route optimization triggered automatic rerouting"
      ],
      aiResponses: [
        "AI contacted driver to verify route change reason.",
        "AI updated ETA based on new route calculations.",
        "AI confirmed alternate route is more efficient.",
        "AI monitoring closely for any additional deviations."
      ]
    },
    weather_alert: {
      titles: [
        "Weather Advisory",
        "Storm Warning",
        "Road Conditions Alert",
        "Safety Notification"
      ],
      descriptions: [
        "Winter storm warning affecting planned route",
        "Heavy rain causing reduced visibility",
        "High winds advisory for highway sections",
        "Fog conditions requiring reduced speeds"
      ],
      aiResponses: [
        "AI recommended route change to avoid severe weather.",
        "AI contacted driver with safety guidelines and updates.",
        "AI monitoring weather patterns for route optimization.",
        "AI prepared contingency plans for weather delays."
      ]
    },
    ai_action: {
      titles: [
        "AI Rate Negotiation",
        "Carrier Optimization",
        "Capacity Management",
        "Performance Analysis"
      ],
      descriptions: [
        "AI negotiated 8% better rate for return load",
        "AI identified more efficient carrier for this lane",
        "AI balanced capacity across multiple shipments",
        "AI completed quarterly performance review"
      ],
      aiResponses: [
        "Secured $240 additional profit on this shipment.",
        "Improved delivery time by 6 hours with carrier switch.",
        "Optimized 4 shipments for maximum efficiency.",
        "Generated actionable insights for route improvements."
      ]
    },
    customer_contact: {
      titles: [
        "Customer Inquiry",
        "Delivery Coordination",
        "Schedule Change Request",
        "Special Instructions"
      ],
      descriptions: [
        "Customer requested status update on delivery",
        "Consignee wants to reschedule delivery window",
        "Customer provided additional delivery instructions",
        "Urgent delivery time change requested"
      ],
      aiResponses: [
        "AI provided real-time status and ETA to customer.",
        "AI coordinated new delivery window with driver.",
        "AI updated delivery instructions in system.",
        "AI confirmed feasibility and adjusted schedule."
      ]
    }
  }

  // Generate realistic events based on shipment data
  const generateRealtimeEvent = (): RealtimeEvent | null => {
    if (shipments.length === 0) return null

    const randomShipment = shipments[Math.floor(Math.random() * shipments.length)]
    const eventTypes = Object.keys(eventTemplates) as Array<keyof typeof eventTemplates>
    
    // Weight event types based on shipment status
    let weightedTypes: string[] = []
    
    if (randomShipment.status === 'in_transit') {
      weightedTypes = ['delay', 'route_deviation', 'weather_alert', 'ai_action', 'customer_contact']
    } else if (randomShipment.status === 'pickup') {
      weightedTypes = ['pickup', 'ai_action']
    } else if (randomShipment.status === 'delivery') {
      weightedTypes = ['delivery', 'customer_contact']
    } else {
      weightedTypes = ['ai_action', 'customer_contact']
    }
    
    const eventType = weightedTypes[Math.floor(Math.random() * weightedTypes.length)] as keyof typeof eventTemplates
    const template = eventTemplates[eventType]
    
    const titleIndex = Math.floor(Math.random() * template.titles.length)
    const title = template.titles[titleIndex]
    const description = template.descriptions[titleIndex]
    const aiResponse = template.aiResponses[titleIndex]
    
    // Determine severity based on event type
    let severity: RealtimeEvent['severity'] = 'low'
    if (eventType === 'delay' || eventType === 'route_deviation') {
      severity = ['medium', 'high'][Math.floor(Math.random() * 2)] as 'medium' | 'high'
    } else if (eventType === 'weather_alert') {
      severity = ['high', 'critical'][Math.floor(Math.random() * 2)] as 'high' | 'critical'
    } else if (eventType === 'delivery' || eventType === 'pickup') {
      severity = 'low'
    } else {
      severity = 'medium'
    }

    return {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: eventType,
      shipmentId: randomShipment.id,
      shipmentNumber: randomShipment.shipment_number,
      title,
      description,
      timestamp: new Date(),
      severity,
      aiResponse,
      location: {
        lat: randomShipment.current_lat || randomShipment.origin_lat,
        lng: randomShipment.current_lng || randomShipment.origin_lng,
        address: randomShipment.current_address || randomShipment.origin_address
      }
    }
  }

  // Start event simulation
  useEffect(() => {
    if (!isActive) return

    const interval = setInterval(() => {
      // Generate events randomly (30% chance every 10 seconds)
      if (Math.random() < 0.3) {
        const newEvent = generateRealtimeEvent()
        if (newEvent) {
          setEvents(prev => [newEvent, ...prev.slice(0, 19)]) // Keep last 20 events
          onEventTriggered?.(newEvent)
        }
      }
    }, 10000) // Check every 10 seconds

    return () => clearInterval(interval)
  }, [isActive, shipments])

  // Initialize with some sample events
  useEffect(() => {
    if (shipments.length > 0 && events.length === 0) {
      const initialEvents: RealtimeEvent[] = []
      
      // Generate 3-5 initial events
      for (let i = 0; i < Math.floor(Math.random() * 3) + 3; i++) {
        const event = generateRealtimeEvent()
        if (event) {
          // Backdate the events
          event.timestamp = new Date(Date.now() - (i * 5 * 60 * 1000)) // 5 minutes apart
          initialEvents.push(event)
        }
      }
      
      setEvents(initialEvents.reverse())
    }
  }, [shipments])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-green-100 text-green-800 border-green-200'
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'delay':
        return (
          <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        )
      case 'delivery':
        return (
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )
      case 'pickup':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
          </svg>
        )
      case 'route_deviation':
        return (
          <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
        )
      case 'weather_alert':
        return (
          <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
          </svg>
        )
      case 'ai_action':
        return (
          <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
        )
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Live Events</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsActive(!isActive)}
            className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              isActive 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span>{isActive ? 'LIVE' : 'PAUSED'}</span>
          </button>
          
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 17H4l5 5v-5zM12 3v18" />
            </svg>
            <p className="text-sm">No events yet</p>
            <p className="text-xs mt-1">Live events will appear here</p>
          </div>
        ) : (
          events.map((event, index) => (
            <div 
              key={event.id}
              className={`border rounded-lg p-4 transition-all duration-300 ${
                index === 0 && isActive ? 'ring-2 ring-blue-200 bg-blue-50' : 'bg-white'
              } ${getSeverityColor(event.severity)} border`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {getEventIcon(event.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-gray-900">
                      {event.title}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(event.timestamp)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">{event.shipmentNumber}:</span> {event.description}
                  </p>
                  
                  {event.aiResponse && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-2 mt-2">
                      <div className="flex items-start space-x-2">
                        <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        <p className="text-xs text-blue-800">
                          <strong>AI Response:</strong> {event.aiResponse}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Action buttons */}
                  <div className="flex items-center justify-between mt-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(event.severity)}`}>
                      {event.severity.toUpperCase()}
                    </span>
                    
                    <div className="flex space-x-2">
                      <button className="text-xs text-blue-600 hover:text-blue-800 transition-colors">
                        View Details
                      </button>
                      {event.type === 'delay' && (
                        <button className="text-xs text-green-600 hover:text-green-800 transition-colors">
                          Call Driver
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Event Summary (Last Hour)</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{events.length}</div>
            <div className="text-xs text-gray-500">Total Events</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {events.filter(e => e.type === 'ai_action').length}
            </div>
            <div className="text-xs text-gray-500">AI Actions</div>
          </div>
        </div>
      </div>
    </div>
  )
}