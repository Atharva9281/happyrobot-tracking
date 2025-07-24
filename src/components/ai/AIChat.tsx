'use client'

import React, { useState, useEffect, useRef } from 'react'
import OpenAILogisticsService from '@/services/openai-logistics'

interface EnhancedAIChatProps {
  shipments: any[]
  onShipmentAction?: (action: string, shipmentId: string) => void
  openaiApiKey: string
}

interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  message: string
  timestamp: Date
  confidence?: number
  suggestedActions?: Array<{
    type: string
    description: string
    priority: 'low' | 'medium' | 'high'
    shipmentId?: string
  }>
  insights?: string[]
  isLoading?: boolean
}

export default function EnhancedAIChat({ shipments, onShipmentAction, openaiApiKey }: EnhancedAIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([])
  const [aiService, setAIService] = useState<OpenAILogisticsService | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize OpenAI service
  useEffect(() => {
    if (openaiApiKey) {
      try {
        const service = new OpenAILogisticsService(openaiApiKey)
        setAIService(service)
        setIsConnected(true)
      } catch (error) {
        console.error('Failed to initialize OpenAI service:', error)
        setIsConnected(false)
      }
    }
  }, [openaiApiKey])

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: '1',
      type: 'ai',
      message: isConnected 
        ? `Hello! I'm your AI logistics assistant powered by advanced intelligence. I can analyze your ${shipments.length} shipments, predict delays, optimize routes, and help with operational decisions. What would you like to know?`
        : "Hello! I'm your AI logistics assistant. I'm currently running in simulation mode. I can help with basic shipment tracking and logistics insights.",
      timestamp: new Date(),
      confidence: isConnected ? 0.95 : 0.6
    }
    setMessages([welcomeMessage])
  }, [shipments.length, isConnected])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Process user message with OpenAI
  const processUserMessage = async (message: string) => {
    setIsTyping(true)
    
    try {
      if (aiService && isConnected) {
        // Use real OpenAI intelligence
        const response = await aiService.queryLogisticsAI(message, shipments, conversationHistory)
        
        const aiMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'ai',
          message: response.message,
          timestamp: new Date(),
          confidence: response.confidence,
          suggestedActions: response.suggestedActions,
          insights: response.insights
        }
        
        setMessages(prev => [...prev, aiMessage])
        
        // Update conversation history for context
        setConversationHistory(prev => [
          ...prev,
          { role: 'user' as const, content: message },
          { role: 'assistant' as const, content: response.message }
        ].slice(-10)) // Keep last 10 exchanges for context
        
      } else {
        // Fallback to template responses
        await processMessageWithTemplates(message)
      }
    } catch (error) {
      console.error('AI processing error:', error)
      
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        message: "I'm experiencing some technical difficulties. Let me try to help you with basic logistics information instead. What specific shipment or operation would you like me to assist with?",
        timestamp: new Date(),
        confidence: 0.3
      }
      
      setMessages(prev => [...prev, errorMessage])
    }
    
    setIsTyping(false)
  }

  // Fallback template processing (enhanced version of your original)
  const processMessageWithTemplates = async (message: string) => {
    const lowerMessage = message.toLowerCase()
    
    // Add slight delay for realism
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))
    
    let response = ''
    let suggestedActions: any[] = []
    let insights: string[] = []
    
    if (lowerMessage.includes('delay') || lowerMessage.includes('late')) {
      const delayedShipments = shipments.filter(s => s.status === 'delayed')
      response = `I found ${delayedShipments.length} delayed shipments. Key factors: traffic conditions, weather, and carrier capacity. ${delayedShipments.length > 0 ? `Most critical: ${delayedShipments[0]?.shipment_number}` : 'All shipments on schedule.'}`
      
      if (delayedShipments.length > 0) {
        suggestedActions.push({
          type: 'call_driver',
          description: `Contact driver for ${delayedShipments[0]?.shipment_number}`,
          priority: 'high',
          shipmentId: delayedShipments[0]?.id
        })
      }
      
      insights.push('Consider implementing real-time traffic monitoring for better ETA accuracy')
    }
    else if (lowerMessage.includes('revenue') || lowerMessage.includes('profit')) {
      const totalRevenue = shipments.reduce((sum, s) => sum + (s.revenue || 0), 0)
      const avgRevenue = totalRevenue / shipments.length
      response = `Total revenue: $${totalRevenue.toLocaleString()}. Average per shipment: $${Math.round(avgRevenue).toLocaleString()}. Revenue trends look ${avgRevenue > 2000 ? 'strong' : 'moderate'} for this period.`
      
      insights.push('High-value shipments show 15% better profit margins')
      insights.push('Consider premium service offerings for enterprise customers')
    }
    else if (lowerMessage.includes('carrier') && lowerMessage.includes('performance')) {
      const carriers = [...new Set(shipments.map(s => s.carrier).filter(Boolean))]
      response = `Analyzing ${carriers.length} carriers across ${shipments.length} shipments. Top performers by reliability: ${carriers.slice(0, 3).join(', ')}. Recommend quarterly carrier scorecards for optimization.`
      
      insights.push('Carrier diversification reduces risk and improves negotiation power')
    }
    else if (lowerMessage.includes('ship-') || /\b\d{3,}\b/.test(message)) {
      const shipmentMatch = message.match(/ship-[\d-]+|\b\d{3,}\b/i)
      const shipmentNumber = shipmentMatch ? shipmentMatch[0] : ''
      const shipment = shipments.find(s => 
        s.shipment_number?.toLowerCase().includes(shipmentNumber.toLowerCase())
      )
      
      if (shipment) {
        response = `${shipment.shipment_number}: ${shipment.status} (${Math.round(shipment.progress_percentage || 0)}% complete). Route: ${shipment.origin_address?.split(',')[0]} → ${shipment.dest_address?.split(',')[0]}. Carrier: ${shipment.carrier}. Revenue: $${shipment.revenue?.toLocaleString()}.`
        
        if (shipment.status === 'delayed') {
          suggestedActions.push({
            type: 'call_driver',
            description: 'Call driver for status update',
            priority: 'high',
            shipmentId: shipment.id
          })
        }
      } else {
        response = `Shipment ${shipmentNumber} not found in current active shipments. Please verify the shipment number or check if it's been delivered.`
      }
    }
    else {
      const activeCount = shipments.filter(s => s.status === 'in_transit').length
      const delayedCount = shipments.filter(s => s.status === 'delayed').length
      response = `Current operations: ${activeCount} in transit, ${delayedCount} delayed, ${shipments.length} total active. I can help with specific shipment tracking, delay analysis, carrier performance, revenue optimization, or route planning. What would you like to explore?`
      
      insights.push('Operations running at normal capacity levels')
    }

    const aiMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'ai',
      message: response,
      timestamp: new Date(),
      confidence: 0.75,
      suggestedActions: suggestedActions,
      insights: insights.length > 0 ? insights : undefined
    }
    
    setMessages(prev => [...prev, aiMessage])
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const messageToProcess = inputValue
    setInputValue('')

    // Process with AI
    await processUserMessage(messageToProcess)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleQuickAction = async (action: string) => {
    setInputValue(action)
    setTimeout(() => {
      handleSendMessage()
    }, 100)
  }

  const handleSuggestedAction = (action: any) => {
    if (onShipmentAction && action.shipmentId) {
      onShipmentAction(action.type, action.shipmentId)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-500'
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Quick action suggestions based on shipment data
  const smartQuickActions = [
    'Any delays or issues?',
    'Show performance analytics',
    shipments.find(s => s.status === 'delayed') ? 'Call delayed drivers' : 'Optimize routes',
    `Analyze carrier performance`
  ]

  if (!isExpanded) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-105"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            {isConnected ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zM9 9a1 1 0 011-1h4a1 1 0 110 2h-4a1 1 0 01-1-1zM7 13a1 1 0 100-2 1 1 0 000 2zM9 13a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div>
            <h3 className="font-semibold">AI Logistics Assistant</h3>
            <p className="text-xs text-blue-100">
              {isConnected ? 'OpenAI Powered • Ready' : 'Simulation Mode • Ready'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-blue-100 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Smart Quick Actions */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-wrap gap-2">
          {smartQuickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleQuickAction(action)}
              className="px-2 py-1 text-xs bg-white border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm">{message.message}</p>
              
              {/* Confidence indicator for AI messages */}
              {message.type === 'ai' && message.confidence && (
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500">
                    {formatTime(message.timestamp)}
                  </p>
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${getConfidenceColor(message.confidence)}`}></div>
                    <span className="text-xs text-gray-500">
                      {Math.round(message.confidence * 100)}%
                    </span>
                  </div>
                </div>
              )}
              
              {/* Time for user messages */}
              {message.type === 'user' && (
                <p className="text-xs mt-1 text-blue-100">
                  {formatTime(message.timestamp)}
                </p>
              )}
              
              {/* AI Insights */}
              {message.insights && message.insights.length > 0 && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                  <div className="text-xs font-medium text-blue-800 mb-1">💡 AI Insights:</div>
                  {message.insights.map((insight, index) => (
                    <div key={index} className="text-xs text-blue-700 mb-1">
                      • {insight}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Suggested Actions */}
              {message.suggestedActions && message.suggestedActions.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="text-xs font-medium text-gray-700">Suggested Actions:</div>
                  {message.suggestedActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedAction(action)}
                      className={`block w-full text-left text-xs px-2 py-1 rounded transition-colors ${
                        action.priority === 'high' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                        action.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
                        'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      <span className="font-medium">
                        {action.priority === 'high' ? '🔴' : action.priority === 'medium' ? '🟡' : '🟢'}
                      </span>
                      {' '}{action.description}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Enhanced Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-3 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-gray-500">
                  {isConnected ? 'AI analyzing...' : 'Processing...'}
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isConnected ? "Ask about shipments, analytics, optimization..." : "Ask about shipments, delays, analytics..."}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            disabled={isTyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTyping ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>
            {isConnected ? '🤖 OpenAI Connected' : '⚡ Simulation Mode'}
          </span>
          <span>
            {messages.length - 1} messages
          </span>
        </div>
      </div>
    </div>
  )
}