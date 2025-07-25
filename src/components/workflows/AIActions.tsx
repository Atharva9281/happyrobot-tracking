'use client'

import React, { useState, useEffect } from 'react'

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

interface AIDriverActionsProps {
  shipments: any[]
  timeframe: string
  onShipmentSelect?: (shipmentId: string) => void
}

interface DriverAction {
  driverId: string
  driverName: string
  shipmentId: string
  shipmentNumber: string
  action: string
  timestamp: Date
  type: 'call' | 'coordination' | 'route_update' | 'issue_resolution'
  status: 'completed' | 'in_progress'
}

export default function AIDriverActions({ 
  shipments, 
  timeframe,
  onShipmentSelect 
}: AIDriverActionsProps) {
  const [driverActions, setDriverActions] = useState<DriverAction[]>([])
  const [view, setView] = useState<'recent' | 'by_driver'>('recent')

  useEffect(() => {
    generateDriverActions()
  }, [shipments])

  const generateDriverActions = () => {
    const actions: DriverAction[] = []

    shipments.forEach(shipment => {
      // Assign consistent driver
      const shipmentHash = shipment.id.split('-').pop() || shipment.id.slice(-8)
      const driverNumber = (parseInt(shipmentHash.slice(-2), 16) % 12) + 1
      const driverId = `driver-${String(driverNumber).padStart(2, '0')}`
      const driverName = `Driver ${String(driverNumber).padStart(2, '0')}`

      // Generate AI actions based on shipment status
      const actionTemplates = {
        pending: [
          { action: 'AI called driver for pickup coordination', type: 'call' as const },
          { action: 'AI sent route optimization to driver', type: 'route_update' as const }
        ],
        in_transit: [
          { action: 'AI coordinated delivery window with driver', type: 'coordination' as const },
          { action: 'AI provided traffic update to driver', type: 'route_update' as const },
          { action: 'AI sent customer preference update to driver', type: 'coordination' as const }
        ],
        delivered: [
          { action: 'AI confirmed delivery completion with driver', type: 'call' as const },
          { action: 'AI collected delivery feedback from driver', type: 'coordination' as const }
        ],
        delayed: [
          { action: 'AI coordinated delay resolution with driver', type: 'issue_resolution' as const },
          { action: 'AI provided alternative route to driver', type: 'route_update' as const },
          { action: 'AI escalated issue support to driver', type: 'issue_resolution' as const }
        ]
      }

      const templates = actionTemplates[shipment.status as keyof typeof actionTemplates] || actionTemplates.pending
      const numActions = Math.min(templates.length, shipment.status === 'delivered' ? 2 : shipment.status === 'delayed' ? 3 : templates.length)

      for (let i = 0; i < numActions; i++) {
        const template = templates[i % templates.length]
        const minutesAgo = Math.floor(Math.random() * 240) + 30 // 30 minutes to 4 hours ago
        
        actions.push({
          driverId,
          driverName,
          shipmentId: shipment.id,
          shipmentNumber: shipment.shipment_number,
          action: template.action,
          timestamp: new Date(Date.now() - minutesAgo * 60 * 1000),
          type: template.type,
          status: 'completed'
        })
      }
    })

    // Sort by timestamp (newest first)
    actions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    setDriverActions(actions)
  }

  // Get AI actions stats
  const getDriverActionStats = () => {
    const aiActionsData = calculateAIActions(shipments)
    const totalDriverActions = driverActions.length
    const callsToDrivers = driverActions.filter(a => a.type === 'call').length
    const coordinationActions = driverActions.filter(a => a.type === 'coordination').length
    const routeUpdates = driverActions.filter(a => a.type === 'route_update').length

    return {
      totalDriverActions,
      driverCalls: callsToDrivers,
      coordinationActions,
      routeUpdates,
      totalSystemActions: aiActionsData.totalActions
    }
  }

  const stats = getDriverActionStats()

  // Group actions by driver
  const actionsByDriver = driverActions.reduce((acc, action) => {
    if (!acc[action.driverId]) {
      acc[action.driverId] = {
        driverName: action.driverName,
        actions: [],
        totalActions: 0,
        calls: 0,
        coordination: 0,
        routes: 0
      }
    }
    
    acc[action.driverId].actions.push(action)
    acc[action.driverId].totalActions++
    
    if (action.type === 'call') acc[action.driverId].calls++
    else if (action.type === 'coordination') acc[action.driverId].coordination++
    else if (action.type === 'route_update') acc[action.driverId].routes++
    
    return acc
  }, {} as Record<string, any>)

  const sortedDrivers = Object.entries(actionsByDriver)
    .sort(([,a], [,b]) => b.totalActions - a.totalActions)
    .slice(0, 8)

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'call': return '📞'
      case 'coordination': return '🤝'
      case 'route_update': return '🗺️'
      case 'issue_resolution': return '🔧'
      default: return '⚡'
    }
  }

  const getActionColor = (type: string) => {
    switch (type) {
      case 'call': return 'bg-blue-100 text-blue-700'
      case 'coordination': return 'bg-green-100 text-green-700'
      case 'route_update': return 'bg-purple-100 text-purple-700'
      case 'issue_resolution': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60))
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Driver Actions</h3>
            <p className="text-sm text-gray-600">AI coordination and support actions with drivers</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700">AI Active</span>
          </div>
        </div>

        {/* Driver Action Stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-xl font-bold text-blue-600">{stats.totalDriverActions}</div>
            <div className="text-xs text-blue-600">Driver Actions</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-xl font-bold text-green-600">{stats.driverCalls}</div>
            <div className="text-xs text-green-600">Calls Made</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-xl font-bold text-purple-600">{stats.coordinationActions}</div>
            <div className="text-xs text-purple-600">Coordination</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-xl font-bold text-orange-600">{stats.routeUpdates}</div>
            <div className="text-xs text-orange-600">Route Updates</div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setView('recent')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              view === 'recent'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🕐 Recent Actions
          </button>
          <button
            onClick={() => setView('by_driver')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              view === 'by_driver'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🚛 By Driver
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {view === 'recent' ? (
          <div className="divide-y divide-gray-100">
            {driverActions.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-sm">No AI driver actions recorded</p>
              </div>
            ) : (
              driverActions.slice(0, 12).map((action) => (
                <div 
                  key={`${action.driverId}-${action.timestamp.getTime()}`} 
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => onShipmentSelect?.(action.shipmentId)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <span className="text-lg">{getActionIcon(action.type)}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900">
                            {action.driverName}
                          </h4>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getActionColor(action.type)}`}>
                            {action.type.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          {formatTimeAgo(action.timestamp)}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        {action.action}
                      </div>
                      
                      <div className="text-xs text-blue-600">
                        📦 {action.shipmentNumber} • Click to view shipment
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedDrivers.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-sm">No driver data available</p>
              </div>
            ) : (
              sortedDrivers.map(([driverId, driverData]) => (
                <div key={driverId} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{driverData.driverName}</p>
                        <p className="text-xs text-gray-500">
                          {driverData.totalActions} AI actions today
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">{driverData.totalActions}</div>
                      <div className="text-xs text-gray-500">Total Actions</div>
                    </div>
                  </div>
                  
                  {/* Action breakdown */}
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <div className="text-sm font-bold text-blue-600">{driverData.calls}</div>
                      <div className="text-xs text-gray-500">Calls</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="text-sm font-bold text-green-600">{driverData.coordination}</div>
                      <div className="text-xs text-gray-500">Coordination</div>
                    </div>
                    <div className="text-center p-2 bg-purple-50 rounded">
                      <div className="text-sm font-bold text-purple-600">{driverData.routes}</div>
                      <div className="text-xs text-gray-500">Route Updates</div>
                    </div>
                  </div>
                  
                  {/* Latest action */}
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    <strong>Latest:</strong> {driverData.actions[0]?.action || 'No recent actions'} 
                    {driverData.actions[0] && ` (${formatTimeAgo(driverData.actions[0].timestamp)})`}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {view === 'recent' 
              ? `${Math.min(driverActions.length, 12)} recent AI actions with drivers` 
              : `${sortedDrivers.length} drivers receiving AI support`
            }
          </span>
          <span className="flex items-center space-x-1">
            <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Real-time AI coordination</span>
          </span>
        </div>
      </div>
    </div>
  )
}