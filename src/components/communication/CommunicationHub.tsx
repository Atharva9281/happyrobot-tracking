'use client'

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import MessageComposer from './MessageComposer'

// 🎯 AI ACTIONS CALCULATION FUNCTION
const calculateAIActions = (shipments: any[]) => {
  if (!shipments || shipments.length === 0) {
    return { totalActions: 0, totalCalls: 0, totalEmails: 0, customerCalls: 0, driverCalls: 0, answeredCalls: 0, totalDuration: 0 }
  }

  let totalActions = 0, totalCalls = 0, totalEmails = 0

  shipments.forEach(shipment => {
    const status = shipment.status || 'pending'
    
    switch (status) {
      case 'pending': totalActions += 3; totalCalls += 2; totalEmails += 1; break
      case 'in_transit': totalActions += 4; totalCalls += 3; totalEmails += 1; break  
      case 'delivered': totalActions += 6; totalCalls += 4; totalEmails += 2; break
      case 'delayed': totalActions += 7; totalCalls += 5; totalEmails += 2; break
      default: totalActions += 3; totalCalls += 2; totalEmails += 1
    }
  })

  return {
    totalActions,
    totalCalls, 
    totalEmails,
    customerCalls: Math.floor(totalCalls * 0.7),
    driverCalls: totalCalls - Math.floor(totalCalls * 0.7),
    answeredCalls: Math.floor(totalCalls * 0.8),
    totalDuration: Math.floor(totalCalls * 0.8) * 180
  }
}

export interface CommunicationItem {
  id: string
  shipmentId: string
  shipmentNumber: string
  type: 'email' | 'sms' | 'call' | 'notification'
  direction: 'outbound' | 'inbound'
  recipient: string
  sender: string
  subject?: string
  content: string
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'pending'
  timestamp: Date
  priority: 'low' | 'medium' | 'high' | 'urgent'
  tags: string[]
  metadata: {
    trigger: 'delivery_notification' | 'delay_alert' | 'pickup_confirmation' | 'eta_update' | 'customer_inquiry' | 'manual_send' | 'ai_proactive_call' | 'driver_issue'
    customerName?: string
    customerPhone?: string
    customerEmail?: string
    automationType?: string
    callDuration?: number
    callOutcome?: 'answered' | 'voicemail' | 'busy' | 'no_answer'
    driverId?: string
    driverName?: string
    satisfactionScore?: number
    responseTime?: number
  }
}

interface EnhancedCustomerCommunicationsProps {
  shipments: any[]
  selectedShipment?: any
  onSendCommunication?: (communication: Partial<CommunicationItem>) => void
  onShipmentSelect?: (shipmentId: string) => void
  onCommunicationsGenerated?: (communications: CommunicationItem[]) => void
}

export interface CommunicationHubRef {
  getCommunications: () => CommunicationItem[]
}

const CustomerRelationshipHub = forwardRef<CommunicationHubRef, EnhancedCustomerCommunicationsProps>(({ 
  shipments, 
  selectedShipment, 
  onSendCommunication,
  onShipmentSelect,
  onCommunicationsGenerated
}, ref) => {
  const [communications, setCommunications] = useState<CommunicationItem[]>([])
  const [filter, setFilter] = useState<'all' | 'email' | 'sms' | 'call' | 'inbound' | 'outbound' | 'ai_automation' | 'satisfaction'>('all')
  const [selectedShipmentFilter, setSelectedShipmentFilter] = useState<string>('all')
  const [showComposer, setShowComposer] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCommunication, setSelectedCommunication] = useState<string | null>(null)

  useImperativeHandle(ref, () => ({
    getCommunications: () => communications
  }))

  // Generate realistic customer relationship communications
  useEffect(() => {
    if (shipments.length === 0) return

    const generatedCommunications: CommunicationItem[] = []

    shipments.forEach(shipment => {
      const customerName = shipment.customer_name || `Customer ${shipment.shipment_number?.slice(-3) || 'XXX'}`
      const customerEmail = `${customerName.toLowerCase().replace(/\s+/g, '.')}@company.com`
      const customerPhone = '+1-555-' + (Math.floor(Math.random() * 9000) + 1000)
      const baseTime = new Date(shipment.created_at || Date.now())
      
      // Customer journey touchpoints with satisfaction tracking
      const journeyTouchpoints = [
        {
          type: 'call',
          trigger: 'ai_proactive_call',
          title: 'Welcome Call',
          content: `AI welcome call to ${customerName}. Introduced HappyRobot services, confirmed shipment details, and set delivery expectations. Customer expressed satisfaction with proactive approach.`,
          satisfactionScore: 9,
          responseTime: 30
        },
        {
          type: 'email',
          trigger: 'pickup_confirmation',
          title: 'Pickup Confirmation',
          content: `Dear ${customerName}, your shipment has been successfully picked up and is now in our care. Our AI system will monitor progress and keep you informed throughout the journey.`,
          satisfactionScore: 8,
          responseTime: 5
        },
        {
          type: 'sms',
          trigger: 'eta_update',
          title: 'Progress Update',
          content: `Hi ${customerName}! Your shipment ${shipment.shipment_number} is ${Math.floor(shipment.progress_percentage || 50)}% complete. AI monitoring shows on-time delivery expected.`,
          satisfactionScore: 8,
          responseTime: 2
        }
      ]

      // Add satisfaction-based touchpoints based on shipment status
      if (shipment.status === 'delivered') {
        journeyTouchpoints.push({
          type: 'call',
          trigger: 'delivery_notification',
          title: 'Delivery Confirmation Call',
          content: `AI delivery confirmation call to ${customerName}. Confirmed successful delivery, gathered feedback, and ensured complete satisfaction. Customer rated experience 5/5 stars.`,
          satisfactionScore: 10,
          responseTime: 15
        })
        
        journeyTouchpoints.push({
          type: 'email',
          trigger: 'customer_inquiry',
          title: 'Satisfaction Survey',
          content: `Thank you ${customerName} for choosing HappyRobot! Please take a moment to rate your experience. Your feedback helps us maintain our 94% satisfaction rating.`,
          satisfactionScore: 9,
          responseTime: 10
        })
      }

      if (shipment.status === 'delayed') {
        journeyTouchpoints.unshift({
          type: 'call',
          trigger: 'delay_alert',
          title: 'Proactive Delay Notification',
          content: `AI proactively called ${customerName} about 45-minute delay due to traffic. Provided new ETA, offered expedited alternatives, and ensured customer comfort with changes.`,
          satisfactionScore: 7,
          responseTime: 120
        })
      }

      // Generate communications from touchpoints
      journeyTouchpoints.forEach((touchpoint, index) => {
        const timestamp = new Date(baseTime.getTime() + (index + 1) * 2 * 60 * 60 * 1000)
        const callOutcome = touchpoint.type === 'call' 
          ? (Math.random() > 0.2 ? 'answered' : 'voicemail') 
          : undefined

        generatedCommunications.push({
          id: `relationship-${shipment.id}-${index}`,
          shipmentId: shipment.id,
          shipmentNumber: shipment.shipment_number,
          type: touchpoint.type as any,
          direction: 'outbound',
          recipient: touchpoint.type === 'email' ? customerEmail : customerPhone,
          sender: touchpoint.type === 'email' ? 'care@happyrobot.ai' : 'HappyRobot Care',
          subject: touchpoint.type === 'email' ? `${touchpoint.title} - ${shipment.shipment_number}` : undefined,
          content: touchpoint.content,
          status: callOutcome === 'answered' || touchpoint.type !== 'call' ? 'delivered' : 'sent',
          timestamp,
          priority: touchpoint.trigger === 'delay_alert' ? 'high' : 'medium',
          tags: ['customer_relationship', 'ai_automation', touchpoint.trigger, 'satisfaction_tracked'],
          metadata: {
            trigger: touchpoint.trigger as any,
            customerName,
            customerPhone,
            customerEmail,
            automationType: 'ai_relationship_management',
            callDuration: touchpoint.type === 'call' ? 120 + Math.random() * 180 : undefined,
            callOutcome,
            satisfactionScore: touchpoint.satisfactionScore,
            responseTime: touchpoint.responseTime
          }
        })
      })

      // Add customer inquiry with AI response (relationship building)
      if (Math.random() > 0.4) {
        const inquiryTime = new Date(baseTime.getTime() + 5 * 60 * 60 * 1000)
        
        // Customer inquiry
        generatedCommunications.push({
          id: `inquiry-${shipment.id}`,
          shipmentId: shipment.id,
          shipmentNumber: shipment.shipment_number,
          type: 'email',
          direction: 'inbound',
          recipient: 'care@happyrobot.ai',
          sender: customerEmail,
          subject: `Quick question about ${shipment.shipment_number}`,
          content: `Hi, I'm really impressed with the proactive communication on this shipment. Could you send me an updated ETA? Thanks for the excellent service! - ${customerName}`,
          status: 'read',
          timestamp: inquiryTime,
          priority: 'medium',
          tags: ['customer_inquiry', 'inbound', 'positive_feedback'],
          metadata: {
            trigger: 'customer_inquiry',
            customerName,
            customerEmail,
            satisfactionScore: 9,
            responseTime: 0
          }
        })

        // AI relationship response
        generatedCommunications.push({
          id: `ai-care-response-${shipment.id}`,
          shipmentId: shipment.id,
          shipmentNumber: shipment.shipment_number,
          type: 'email',
          direction: 'outbound',
          recipient: customerEmail,
          sender: 'ai-care@happyrobot.ai',
          subject: `Re: Quick question about ${shipment.shipment_number}`,
          content: `Dear ${customerName}, thank you for your kind words! We're delighted you're experiencing our AI-powered care. Your shipment is ${Math.floor(shipment.progress_percentage || 60)}% complete with ETA of 2:30 PM today. Our relationship team has noted your positive feedback. We truly value customers like you!`,
          status: 'delivered',
          timestamp: new Date(inquiryTime.getTime() + 3 * 60 * 1000), // 3 min response
          priority: 'medium',
          tags: ['ai_response', 'relationship_building', 'instant_care'],
          metadata: {
            trigger: 'customer_inquiry',
            customerName,
            customerEmail,
            automationType: 'ai_relationship_care',
            satisfactionScore: 10,
            responseTime: 3
          }
        })
      }
    })

    // Sort by timestamp (newest first)
    generatedCommunications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    setCommunications(generatedCommunications)
    
    // Pass all generated communications to parent for export
    if (onCommunicationsGenerated && generatedCommunications.length > 0) {
      console.log('📡 [CommunicationHub] Passing', generatedCommunications.length, 'relationship communications for export')
      onCommunicationsGenerated(generatedCommunications)
    }
  }, [shipments, onCommunicationsGenerated])

  // Filter communications
  const filteredCommunications = communications.filter(comm => {
    const matchesType = filter === 'all' || 
                       comm.type === filter || 
                       comm.direction === filter ||
                       (filter === 'ai_automation' && comm.tags.includes('ai_automation')) ||
                       (filter === 'satisfaction' && comm.metadata.satisfactionScore && comm.metadata.satisfactionScore >= 8)
    const matchesShipment = selectedShipmentFilter === 'all' || comm.shipmentId === selectedShipmentFilter
    
    if (searchQuery === '') {
      return matchesType && matchesShipment
    }
    
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = 
      (comm.content && comm.content.toLowerCase().includes(searchLower)) ||
      (comm.shipmentNumber && comm.shipmentNumber.toLowerCase().includes(searchLower)) ||
      (comm.recipient && comm.recipient.toLowerCase().includes(searchLower)) ||
      (comm.subject && comm.subject.toLowerCase().includes(searchLower)) ||
      (comm.metadata.customerName && comm.metadata.customerName.toLowerCase().includes(searchLower))
    
    return matchesType && matchesShipment && matchesSearch
  })

  // ✅ UPDATED: Use centralized AI actions calculation + relationship metrics
  const getRelationshipStats = () => {
    const aiActionsData = calculateAIActions(shipments)
    const satisfactionScores = communications
      .filter(c => c.metadata.satisfactionScore)
      .map(c => c.metadata.satisfactionScore!)
    
    const avgSatisfaction = satisfactionScores.length > 0
      ? Math.round(satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length * 10) / 10
      : 0

    const responseTimes = communications
      .filter(c => c.direction === 'outbound' && c.metadata.responseTime)
      .map(c => c.metadata.responseTime!)
    
    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
      : 0

    const proactiveComms = communications.filter(c => 
      c.tags.includes('ai_automation') && c.direction === 'outbound'
    ).length

    return {
      totalInteractions: communications.length,
      avgSatisfaction,
      avgResponseTime,
      proactiveComms,
      aiAutomationRate: Math.round((communications.filter(c => c.tags.includes('ai_automation')).length / communications.length) * 100) || 0
    }
  }

  const relationshipStats = getRelationshipStats()

  // Handle manual message sending
  const handleSendMessage = (messageData: any) => {
    const shipment = shipments.find(s => s.id === messageData.shipmentId)
    if (!shipment) return

    const customerName = shipment.customer_name || 'Customer'
    const newCommunication: CommunicationItem = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      shipmentId: messageData.shipmentId,
      shipmentNumber: shipment.shipment_number || 'Unknown',
      type: messageData.type,
      direction: 'outbound',
      recipient: messageData.recipient || 'Unknown',
      sender: messageData.type === 'email' ? 'care@happyrobot.ai' : 'HappyRobot Care',
      subject: messageData.subject,
      content: messageData.content || '',
      status: 'sent',
      timestamp: new Date(),
      priority: messageData.priority || 'medium',
      tags: ['manual_send', 'customer_care', messageData.type],
      metadata: {
        trigger: 'manual_send',
        customerName: customerName,
        responseTime: 0
      }
    }
    
    setCommunications(prev => [newCommunication, ...prev])
    onSendCommunication?.(newCommunication)
    setShowComposer(false)
  }

  // Utility functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-700'
      case 'delivered': return 'bg-green-100 text-green-700'
      case 'read': return 'bg-purple-100 text-purple-700'
      case 'failed': return 'bg-red-100 text-red-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getSatisfactionColor = (score: number) => {
    if (score >= 9) return 'text-green-600'
    if (score >= 7) return 'text-yellow-600'
    if (score >= 5) return 'text-orange-600'
    return 'text-red-600'
  }

  const getSatisfactionIcon = (score: number) => {
    if (score >= 9) return '😊'
    if (score >= 7) return '🙂'
    if (score >= 5) return '😐'
    return '😞'
  }

  const getTypeIcon = (type: string, direction: string, tags: string[]) => {
    const isAIAutomation = tags.includes('ai_automation')
    const iconClass = isAIAutomation ? 'text-purple-600' : 
                     (direction === 'inbound' ? 'text-orange-600' : 'text-green-600')
    
    switch (type) {
      case 'email':
        return (
          <svg className={`w-5 h-5 ${iconClass}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
          </svg>
        )
      case 'sms':
        return (
          <svg className={`w-5 h-5 ${iconClass}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd"/>
          </svg>
        )
      case 'call':
        return (
          <div className="flex items-center">
            <svg className={`w-5 h-5 ${iconClass}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
            </svg>
            {isAIAutomation && <span className="ml-1 text-xs">🤖</span>}
          </div>
        )
      default:
        return (
          <svg className={`w-5 h-5 ${iconClass}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd"/>
          </svg>
        )
    }
  }

  const getTriggerIcon = (trigger: string) => {
    switch (trigger) {
      case 'pickup_confirmation': return '📦'
      case 'delivery_notification': return '✅'
      case 'delay_alert': return '⚠️'
      case 'eta_update': return '🕐'
      case 'customer_inquiry': return '❓'
      case 'ai_proactive_call': return '🤖'
      case 'manual_send': return '👤'
      default: return '💬'
    }
  }

  const getDirectionBadge = (direction: string) => {
    return direction === 'inbound' ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">
        ← Customer
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
        → HappyRobot
      </span>
    )
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Customer Relationship Hub</h3>
            <p className="text-sm text-gray-600">AI-powered customer relationship management and satisfaction tracking</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span>Relationship AI</span>
            </div>
          </div>
        </div>

        {/* Relationship Stats */}
        <div className="grid grid-cols-5 gap-3 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">{relationshipStats.totalInteractions}</div>
            <div className="text-xs text-gray-500">Interactions</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{relationshipStats.avgSatisfaction}/10</div>
            <div className="text-xs text-gray-500">Satisfaction</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{relationshipStats.avgResponseTime}m</div>
            <div className="text-xs text-gray-500">Response Time</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">{relationshipStats.proactiveComms}</div>
            <div className="text-xs text-gray-500">Proactive</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-indigo-600">{relationshipStats.aiAutomationRate}%</div>
            <div className="text-xs text-gray-500">AI Automated</div>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Interactions</option>
              <option value="ai_automation">🤖 AI Automated ({communications.filter(c => c.tags.includes('ai_automation')).length})</option>
              <option value="satisfaction">😊 High Satisfaction (8+)</option>
              <option value="outbound">Outbound Only</option>
              <option value="inbound">Customer Initiated</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="call">Calls</option>
            </select>

            <select
              value={selectedShipmentFilter}
              onChange={(e) => setSelectedShipmentFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Customers</option>
              {shipments.map(shipment => (
                <option key={shipment.id} value={shipment.id}>
                  {shipment.customer_name || shipment.shipment_number}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowComposer(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors text-sm font-medium whitespace-nowrap ml-auto"
            >
              + New Interaction
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search customers, interactions, feedback..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Communications List */}
      <div className="flex-1 overflow-y-auto">
        {filteredCommunications.length === 0 ? (
          <div className="p-6 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h2m-4 4v2m0 0v2m0-2h2m0 0h2" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No interactions found</h3>
            <p className="text-gray-500">Customer relationship interactions will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredCommunications.map((comm) => (
              <div 
                key={comm.id} 
                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                  selectedCommunication === comm.id ? 'bg-purple-50 border-l-4 border-purple-500' : ''
                } ${comm.tags.includes('ai_automation') ? 'border-l-2 border-purple-200' : ''}`}
                onClick={() => {
                  setSelectedCommunication(selectedCommunication === comm.id ? null : comm.id)
                  if (onShipmentSelect) {
                    onShipmentSelect(comm.shipmentId)
                  }
                }}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getTypeIcon(comm.type, comm.direction, comm.tags)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {comm.metadata.customerName || comm.recipient || 'Unknown Customer'}
                        </h4>
                        {getDirectionBadge(comm.direction)}
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(comm.status || 'pending')}`}>
                          {(comm.status || 'PENDING').toUpperCase()}
                        </span>
                        {comm.metadata.satisfactionScore && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 ${getSatisfactionColor(comm.metadata.satisfactionScore)}`}>
                            {getSatisfactionIcon(comm.metadata.satisfactionScore)} {comm.metadata.satisfactionScore}/10
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 text-xs text-gray-500 flex-shrink-0">
                        <span>{getTriggerIcon(comm.metadata?.trigger || 'manual_send')}</span>
                        <span>{formatTimeAgo(comm.timestamp)}</span>
                      </div>
                    </div>

                    <div className="text-xs text-blue-600 font-medium mb-2">
                      📦 {comm.shipmentNumber || 'Unknown Shipment'}
                      {comm.metadata.responseTime !== undefined && (
                        <span className="ml-2 text-gray-500">
                          • Response: {comm.metadata.responseTime}m
                        </span>
                      )}
                    </div>
                    
                    {comm.subject && (
                      <div className="text-sm font-medium text-gray-800 mb-2 line-clamp-1">
                        {comm.subject}
                      </div>
                    )}
                    
                    <div className={`text-sm text-gray-600 mb-3 ${
                      selectedCommunication === comm.id ? '' : 'line-clamp-2'
                    }`}>
                      {comm.content || 'No content available'}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-purple-100 text-purple-600">
                          {getTriggerIcon(comm.metadata.trigger)} {comm.metadata.trigger?.replace('_', ' ')}
                        </span>
                        {comm.tags.includes('ai_automation') && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-indigo-100 text-indigo-600">
                            🤖 AI Relationship
                          </span>
                        )}
                        {comm.tags.includes('satisfaction_tracked') && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-100 text-green-600">
                            📊 Satisfaction Tracked
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {selectedCommunication === comm.id && (
                      <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                        <div className="grid grid-cols-2 gap-4">
                          <div>Customer: {comm.metadata?.customerName || 'Unknown'}</div>
                          <div>Automation: {comm.metadata?.automationType || 'Manual'}</div>
                          {comm.metadata?.satisfactionScore && (
                            <div>Satisfaction: {comm.metadata.satisfactionScore}/10</div>
                          )}
                          {comm.metadata?.responseTime !== undefined && (
                            <div>Response Time: {comm.metadata.responseTime} minutes</div>
                          )}
                          <div>Time: {comm.timestamp.toLocaleString()}</div>
                          <div>Journey: {comm.shipmentNumber}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message Composer Modal */}
      {showComposer && (
        <MessageComposer
          shipments={shipments}
          onClose={() => setShowComposer(false)}
          onSend={handleSendMessage}
        />
      )}
    </div>
  )
})

CustomerRelationshipHub.displayName = 'CustomerRelationshipHub'

export default CustomerRelationshipHub