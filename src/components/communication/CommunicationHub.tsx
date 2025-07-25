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

const EnhancedCustomerCommunications = forwardRef<CommunicationHubRef, EnhancedCustomerCommunicationsProps>(({ 
  shipments, 
  selectedShipment, 
  onSendCommunication,
  onShipmentSelect,
  onCommunicationsGenerated
}, ref) => {
  const [communications, setCommunications] = useState<CommunicationItem[]>([])
  const [filter, setFilter] = useState<'all' | 'email' | 'sms' | 'call' | 'inbound' | 'outbound' | 'ai_calls'>('all')
  const [selectedShipmentFilter, setSelectedShipmentFilter] = useState<string>('all')
  const [showComposer, setShowComposer] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCommunication, setSelectedCommunication] = useState<string | null>(null)

  useImperativeHandle(ref, () => ({
    getCommunications: () => communications
  }))

  // Generate realistic customer communications with heavy AI call focus
  useEffect(() => {
    if (shipments.length === 0) return

    const generatedCommunications: CommunicationItem[] = []

    shipments.forEach(shipment => {
      const customerName = shipment.customer_name || `Customer ${shipment.shipment_number?.slice(-3) || 'XXX'}`
      const customerEmail = `${customerName.toLowerCase().replace(/\s+/g, '.')}@company.com`
      const customerPhone = '+1-555-' + (Math.floor(Math.random() * 9000) + 1000)
      const driverName = `Driver ${Math.floor(Math.random() * 50) + 1}`
      const driverId = `driver-${Math.floor(Math.random() * 1000) + 1000}`
      
      const baseTime = new Date(shipment.created_at || Date.now())
      
      // Generate multiple AI calls per shipment (HappyRobot's core business)
      const numberOfCalls = Math.floor(Math.random() * 4) + 2 // 2-5 calls per shipment
      
      for (let i = 0; i < numberOfCalls; i++) {
        const callTime = new Date(baseTime.getTime() + (i + 1) * 2 * 60 * 60 * 1000) // Calls every 2 hours
        const callReasons = [
          'proactive_delay_alert',
          'eta_update_call',
          'pickup_confirmation_call',
          'delivery_scheduling',
          'customer_inquiry_response',
          'route_optimization_alert'
        ]
        const callReason = callReasons[Math.floor(Math.random() * callReasons.length)]
        const callOutcomes: ('answered' | 'voicemail' | 'busy' | 'no_answer')[] = ['answered', 'voicemail', 'busy', 'no_answer']
        const outcome = callOutcomes[Math.floor(Math.random() * callOutcomes.length)]
        const duration = outcome === 'answered' ? Math.floor(Math.random() * 300) + 60 : 0 // 1-5 minutes if answered

        let callContent = ''
        switch (callReason) {
          case 'proactive_delay_alert':
            callContent = outcome === 'answered' 
              ? `AI proactively called customer about potential 30-minute delay due to traffic. Customer appreciated the heads-up. Provided new ETA of 3:45 PM. Customer confirmed availability for delivery.`
              : `AI attempted to call customer about potential delay. ${outcome === 'voicemail' ? 'Left detailed voicemail with new ETA.' : 'Will retry in 30 minutes.'}`
            break
          case 'eta_update_call':
            callContent = outcome === 'answered'
              ? `AI called to provide ETA update. Shipment is ${Math.floor(shipment.progress_percentage || 0)}% complete. Customer informed delivery expected by 2:30 PM today. No concerns raised.`
              : `AI attempted ETA update call. ${outcome === 'voicemail' ? 'Left voicemail with current progress and ETA.' : 'Customer unavailable, will send SMS backup.'}`
            break
          case 'pickup_confirmation_call':
            callContent = outcome === 'answered'
              ? `AI confirmed successful pickup with customer. All items accounted for. Customer notified of tracking link and expected delivery timeframe. Smooth handoff completed.`
              : `AI attempted pickup confirmation call. ${outcome === 'voicemail' ? 'Left confirmation voicemail with tracking details.' : 'Will send confirmation email as backup.'}`
            break
          case 'delivery_scheduling':
            callContent = outcome === 'answered'
              ? `AI coordinated delivery timing with customer. Customer confirmed availability between 2-4 PM. Special delivery instructions noted: leave with receptionist. Customer very satisfied with proactive communication.`
              : `AI attempted delivery scheduling call. ${outcome === 'voicemail' ? 'Left voicemail requesting delivery preferences.' : 'Will try again in 1 hour.'}`
            break
          case 'customer_inquiry_response':
            callContent = outcome === 'answered'
              ? `AI responded to customer inquiry about shipment location. Provided real-time tracking update. Customer questions fully resolved. Excellent AI interaction - customer impressed with immediate response.`
              : `AI attempted to respond to customer inquiry. ${outcome === 'voicemail' ? 'Left detailed response voicemail.' : 'Will send comprehensive email response.'}`
            break
          case 'route_optimization_alert':
            callContent = outcome === 'answered'
              ? `AI called about route optimization opportunity. Delivery can be moved 1 hour earlier. Customer approved change. New delivery window: 1:30-2:30 PM. Customer delighted with flexibility.`
              : `AI attempted route optimization call. ${outcome === 'voicemail' ? 'Left voicemail about earlier delivery option.' : 'Will coordinate via SMS.'}`
            break
        }

        generatedCommunications.push({
          id: `ai-call-${shipment.id}-${i}`,
          shipmentId: shipment.id,
          shipmentNumber: shipment.shipment_number,
          type: 'call',
          direction: 'outbound',
          recipient: customerPhone,
          sender: 'HappyRobot AI',
          content: callContent,
          status: outcome === 'answered' ? 'delivered' : 'sent',
          timestamp: callTime,
          priority: callReason.includes('delay') ? 'high' : 'medium',
          tags: ['ai_call', 'automated', 'proactive', callReason],
          metadata: {
            trigger: 'ai_proactive_call',
            customerName,
            customerPhone,
            automationType: 'ai_voice_assistant',
            callDuration: duration,
            callOutcome: outcome,
            driverId,
            driverName
          }
        })
      }

      // Generate AI calls to drivers (internal communication but shown for transparency)
      const driverCalls = Math.floor(Math.random() * 3) + 1 // 1-3 calls to driver
      for (let i = 0; i < driverCalls; i++) {
        const callTime = new Date(baseTime.getTime() + (i + 1) * 3 * 60 * 60 * 1000)
        const driverCallReasons = [
          'route_optimization',
          'delivery_scheduling_conflict',
          'customer_special_request',
          'traffic_alert_response'
        ]
        const reason = driverCallReasons[Math.floor(Math.random() * driverCallReasons.length)]
        
        let driverCallContent = ''
        switch (reason) {
          case 'route_optimization':
            driverCallContent = `AI called driver to optimize route. New route saves 25 minutes. Driver confirmed route change. ETA updated to 2:15 PM.`
            break
          case 'delivery_scheduling_conflict':
            driverCallContent = `AI coordinated with driver about customer availability. Delivery rescheduled to 3:00 PM per customer request. Driver confirmed new timeline.`
            break
          case 'customer_special_request':
            driverCallContent = `AI relayed customer special delivery instructions to driver. Customer requests call 10 minutes before arrival. Driver acknowledged and will comply.`
            break
          case 'traffic_alert_response':
            driverCallContent = `AI alerted driver about traffic congestion on current route. Alternative route suggested. Driver switched routes, avoiding 45-minute delay.`
            break
        }

        generatedCommunications.push({
          id: `driver-call-${shipment.id}-${i}`,
          shipmentId: shipment.id,
          shipmentNumber: shipment.shipment_number,
          type: 'call',
          direction: 'outbound',
          recipient: `+1-555-${Math.floor(Math.random() * 9000) + 1000}`,
          sender: 'HappyRobot AI',
          content: driverCallContent,
          status: 'delivered',
          timestamp: callTime,
          priority: 'medium',
          tags: ['ai_call', 'driver_communication', 'operational', reason],
          metadata: {
            trigger: 'driver_issue',
            automationType: 'ai_driver_coordination',
            callDuration: Math.floor(Math.random() * 180) + 120, // 2-5 minutes
            callOutcome: 'answered',
            driverId,
            driverName
          }
        })
      }

      // Standard communications (emails, SMS)
      
      // 1. Pickup Confirmation Email
      generatedCommunications.push({
        id: `pickup-${shipment.id}`,
        shipmentId: shipment.id,
        shipmentNumber: shipment.shipment_number,
        type: 'email',
        direction: 'outbound',
        recipient: customerEmail,
        sender: 'logistics@happyrobot.ai',
        subject: `Pickup Confirmed - ${shipment.shipment_number}`,
        content: `Dear ${customerName},\n\nYour shipment has been picked up and is on its way! Our AI system is actively monitoring the delivery and will keep you updated.\n\nOrigin: ${shipment.origin_address}\nDestination: ${shipment.dest_address}\nEstimated Delivery: ${new Date(baseTime.getTime() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString()}\n\nOur AI assistant has already made contact to confirm delivery preferences. Track your shipment: https://track.happyrobot.ai/${shipment.shipment_number}\n\nBest regards,\nHappyRobot AI Logistics`,
        status: 'delivered',
        timestamp: new Date(baseTime.getTime() + 30 * 60 * 1000),
        priority: 'medium',
        tags: ['automated', 'pickup', 'confirmation'],
        metadata: {
          trigger: 'pickup_confirmation',
          customerName,
          customerEmail,
          automationType: 'ai_triggered'
        }
      })

      // 2. SMS Updates (frequent)
      if (shipment.status === 'in_transit') {
        const smsUpdates = Math.floor(Math.random() * 3) + 2 // 2-4 SMS updates
        for (let i = 0; i < smsUpdates; i++) {
          const smsTime = new Date(baseTime.getTime() + (i + 2) * 2 * 60 * 60 * 1000)
          generatedCommunications.push({
            id: `sms-${shipment.id}-${i}`,
            shipmentId: shipment.id,
            shipmentNumber: shipment.shipment_number,
            type: 'sms',
            direction: 'outbound',
            recipient: customerPhone,
            sender: 'HappyRobot',
            content: `${customerName}, your shipment ${shipment.shipment_number} is ${Math.floor((shipment.progress_percentage || 0) + (i * 20))}% complete. Our AI called you earlier to confirm delivery details. ETA: ${i === smsUpdates - 1 ? 'Today 2:30 PM' : 'On schedule'}. Track: https://track.happyrobot.ai/${shipment.shipment_number}`,
            status: 'delivered',
            timestamp: smsTime,
            priority: 'medium',
            tags: ['automated', 'eta_update', 'progress'],
            metadata: {
              trigger: 'eta_update',
              customerName,
              customerPhone,
              automationType: 'ai_monitoring'
            }
          })
        }
      }

      // 3. Customer Inquiries (inbound) with AI responses
      const shouldHaveInquiry = Math.random() > 0.5 // 50% chance
      if (shouldHaveInquiry) {
        const inquiryTime = new Date(baseTime.getTime() + 5 * 60 * 60 * 1000)
        
        // Customer inquiry
        generatedCommunications.push({
          id: `inquiry-${shipment.id}`,
          shipmentId: shipment.id,
          shipmentNumber: shipment.shipment_number,
          type: 'email',
          direction: 'inbound',
          recipient: 'support@happyrobot.ai',
          sender: customerEmail,
          subject: `Question about shipment ${shipment.shipment_number}`,
          content: `Hi,\n\nI received a call from your AI assistant earlier about my shipment ${shipment.shipment_number}. Can you provide more details about the current location?\n\nThanks,\n${customerName}`,
          status: 'read',
          timestamp: inquiryTime,
          priority: 'medium',
          tags: ['customer_inquiry', 'inbound', 'status_check'],
          metadata: {
            trigger: 'customer_inquiry',
            customerName,
            customerEmail
          }
        })

        // Immediate AI response
        generatedCommunications.push({
          id: `ai-response-${shipment.id}`,
          shipmentId: shipment.id,
          shipmentNumber: shipment.shipment_number,
          type: 'email',
          direction: 'outbound',
          recipient: customerEmail,
          sender: 'ai-support@happyrobot.ai',
          subject: `Re: Question about shipment ${shipment.shipment_number}`,
          content: `Dear ${customerName},\n\nThank you for your follow-up! As discussed in our earlier AI call, your shipment is progressing well.\n\nCurrent Status:\n• Location: ${shipment.progress_percentage > 50 ? 'En route to destination' : 'Departed from origin'}\n• Progress: ${Math.floor(shipment.progress_percentage || 0)}% complete\n• ETA: Today by 2:30 PM (confirmed during our AI call)\n• Driver: ${driverName} (our AI coordinates directly with driver)\n\nOur AI assistant will call you again if there are any changes. You can also track real-time progress: https://track.happyrobot.ai/${shipment.shipment_number}\n\nBest regards,\nHappyRobot AI Support Team`,
          status: 'sent',
          timestamp: new Date(inquiryTime.getTime() + 5 * 60 * 1000), // 5 min response time
          priority: 'medium',
          tags: ['ai_response', 'automated', 'support', 'instant_reply'],
          metadata: {
            trigger: 'customer_inquiry',
            customerName,
            customerEmail,
            automationType: 'ai_instant_response'
          }
        })
      }

      // 4. Delivery notifications
      if (shipment.status === 'delivered') {
        generatedCommunications.push({
          id: `delivery-${shipment.id}`,
          shipmentId: shipment.id,
          shipmentNumber: shipment.shipment_number,
          type: 'email',
          direction: 'outbound',
          recipient: customerEmail,
          sender: 'logistics@happyrobot.ai',
          subject: `Delivered Successfully - ${shipment.shipment_number}`,
          content: `Dear ${customerName},\n\nExcellent news! Your shipment has been delivered successfully.\n\nDelivery Details:\n• Delivered to: ${shipment.dest_address}\n• Delivery Time: ${new Date().toLocaleString()}\n• Signed by: Reception\n• Driver: ${driverName}\n\nOur AI system coordinated ${numberOfCalls + driverCalls} calls during transit to ensure smooth delivery. Thank you for choosing HappyRobot Logistics!\n\nRate your AI experience: https://feedback.happyrobot.ai/${shipment.shipment_number}\n\nBest regards,\nHappyRobot AI Logistics`,
          status: 'read',
          timestamp: new Date(baseTime.getTime() + 8 * 60 * 60 * 1000),
          priority: 'medium',
          tags: ['automated', 'delivery', 'confirmation', 'completed'],
          metadata: {
            trigger: 'delivery_notification',
            customerName,
            customerEmail,
            automationType: 'ai_delivery_confirmation'
          }
        })
      }
    })

    // Sort by timestamp (newest first)
    generatedCommunications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    setCommunications(generatedCommunications)
    
    // Pass all generated communications to parent for export
    if (onCommunicationsGenerated && generatedCommunications.length > 0) {
      console.log('📡 [CommunicationHub] Passing', generatedCommunications.length, 'communications to parent for export')
      onCommunicationsGenerated(generatedCommunications)
    }
  }, [shipments, onCommunicationsGenerated])

  // Filter communications
  const filteredCommunications = communications.filter(comm => {
    const matchesType = filter === 'all' || 
                       comm.type === filter || 
                       comm.direction === filter ||
                       (filter === 'ai_calls' && comm.tags.includes('ai_call'))
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
      (comm.metadata.customerName && comm.metadata.customerName.toLowerCase().includes(searchLower)) ||
      (comm.metadata.driverName && comm.metadata.driverName.toLowerCase().includes(searchLower))
    
    return matchesType && matchesShipment && matchesSearch
  })

  // ✅ UPDATED: Use centralized AI actions calculation
  const aiActionsData = calculateAIActions(shipments)
  const aiCallStats = {
    totalCalls: aiActionsData.totalCalls,
    customerCalls: aiActionsData.customerCalls,
    driverCalls: aiActionsData.driverCalls,
    answeredCalls: aiActionsData.answeredCalls,
    totalDuration: aiActionsData.totalDuration // already in seconds
  }

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
      sender: messageData.type === 'email' ? 'logistics@happyrobot.ai' : 'HappyRobot',
      subject: messageData.subject,
      content: messageData.content || '',
      status: 'sent',
      timestamp: new Date(),
      priority: messageData.priority || 'medium',
      tags: ['manual_send', messageData.type],
      metadata: {
        trigger: 'manual_send',
        customerName: customerName
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

  const getTypeIcon = (type: string, direction: string, tags: string[]) => {
    // Special styling for AI calls
    const isAICall = tags.includes('ai_call')
    const iconClass = isAICall ? 'text-purple-600' : 
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
            {isAICall && <span className="ml-1 text-xs">🤖</span>}
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
      case 'driver_issue': return '🚛'
      case 'manual_send': return '👤'
      default: return '📤'
    }
  }

  const getDirectionBadge = (direction: string) => {
    return direction === 'inbound' ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">
        ← Inbound
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
        → Outbound
      </span>
    )
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
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
      {/* ✅ FIXED HEADER - Better Layout */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Customer Communications</h3>
            <p className="text-sm text-gray-600">AI-powered customer interactions and driver coordination</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>AI Active</span>
            </div>
          </div>
        </div>

        {/* ✅ IMPROVED AI Call Stats - Better Spacing */}
        <div className="grid grid-cols-5 gap-3 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">{aiCallStats.totalCalls}</div>
            <div className="text-xs text-gray-500">AI calls</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{aiCallStats.customerCalls}</div>
            <div className="text-xs text-gray-500">to customers</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{aiCallStats.driverCalls}</div>
            <div className="text-xs text-gray-500">to drivers</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">{aiCallStats.answeredCalls}</div>
            <div className="text-xs text-gray-500">answered</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-indigo-600">{Math.floor(aiCallStats.totalDuration / 60)}m</div>
            <div className="text-xs text-gray-500">talk time</div>
          </div>
        </div>

        {/* ✅ FIXED CONTROLS - Better Responsive Layout */}
        <div className="space-y-3">
          {/* First Row - Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Communications</option>
              <option value="ai_calls">🤖 AI Calls ({aiCallStats.totalCalls})</option>
              <option value="outbound">Outbound Only</option>
              <option value="inbound">Inbound Only</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="call">All Calls</option>
            </select>

            <select
              value={selectedShipmentFilter}
              onChange={(e) => setSelectedShipmentFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Shipments</option>
              {shipments.map(shipment => (
                <option key={shipment.id} value={shipment.id}>
                  {shipment.shipment_number}
                </option>
              ))}
            </select>

            {/* ✅ FIXED: Send Message Button - Better Positioning */}
            <button
              onClick={() => setShowComposer(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap ml-auto"
            >
              + Send Message
            </button>
          </div>

          {/* Second Row - Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search customers, drivers, shipments, content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* ✅ IMPROVED Communications List - Better Cards */}
      <div className="flex-1 overflow-y-auto">
        {filteredCommunications.length === 0 ? (
          <div className="p-6 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No communications found</h3>
            <p className="text-gray-500">AI communications will appear here as shipments progress.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredCommunications.map((comm) => (
              <div 
                key={comm.id} 
                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                  selectedCommunication === comm.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                } ${comm.tags.includes('ai_call') ? 'border-l-2 border-purple-200' : ''}`}
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
                    {/* ✅ IMPROVED Header Row - Better Layout */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {comm.tags.includes('ai_call') && comm.metadata.trigger === 'driver_issue' 
                            ? `${comm.metadata.driverName || 'Driver'} (${comm.metadata.customerName || 'Customer'} shipment)`
                            : comm.metadata.customerName || comm.recipient || 'Unknown Contact'
                          }
                        </h4>
                        {getDirectionBadge(comm.direction)}
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(comm.status || 'pending')}`}>
                          {(comm.status || 'PENDING').toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-xs text-gray-500 flex-shrink-0">
                        <span>{getTriggerIcon(comm.metadata?.trigger || 'manual_send')}</span>
                        <span>{formatTimeAgo(comm.timestamp)}</span>
                      </div>
                    </div>

                    {/* ✅ IMPROVED Shipment Info */}
                    <div className="text-xs text-blue-600 font-medium mb-2">
                      📦 {comm.shipmentNumber || 'Unknown Shipment'}
                    </div>
                    
                    {comm.subject && (
                      <div className="text-sm font-medium text-gray-800 mb-2 line-clamp-1">
                        {comm.subject}
                      </div>
                    )}
                    
                    {/* ✅ IMPROVED Content Display */}
                    <div className={`text-sm text-gray-600 mb-3 ${
                      selectedCommunication === comm.id ? '' : 'line-clamp-2'
                    }`}>
                      {comm.content || 'No content available'}
                    </div>
                    
                    {/* ✅ IMPROVED Tags and Metadata */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-600">
                          {getTriggerIcon(comm.metadata.trigger)} {comm.metadata.trigger.replace('_', ' ')}
                        </span>
                        {comm.tags.includes('ai_call') && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-purple-100 text-purple-600">
                            🤖 AI Call
                            {comm.metadata.callDuration && ` - ${formatDuration(comm.metadata.callDuration)}`}
                          </span>
                        )}
                        {comm.metadata.callOutcome && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs ${
                            comm.metadata.callOutcome === 'answered' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                          }`}>
                            {comm.metadata.callOutcome === 'answered' ? '✅' : '📞'} {comm.metadata.callOutcome}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* ✅ IMPROVED Expanded Details */}
                    {selectedCommunication === comm.id && (
                      <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                        <div className="grid grid-cols-2 gap-4">
                          <div>Contact: {comm.metadata?.customerName || 'Unknown'}</div>
                          <div>Type: {comm.metadata?.automationType || 'Standard'}</div>
                          {comm.metadata?.driverName && (
                            <div>Driver: {comm.metadata.driverName}</div>
                          )}
                          {comm.metadata?.callDuration && (
                            <div>Duration: {formatDuration(comm.metadata.callDuration)}</div>
                          )}
                          <div>Time: {comm.timestamp.toLocaleString()}</div>
                          <div>Shipment: {comm.shipmentNumber}</div>
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

EnhancedCustomerCommunications.displayName = 'EnhancedCustomerCommunications'

export default EnhancedCustomerCommunications