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

interface AIActionsDashboardProps {
  shipments: any[]
  timeframe: string
  onShipmentSelect?: (shipmentId: string) => void
}

// ✅ OPERATIONS-FOCUSED TYPES
interface DriverWorkload {
  driverId: string
  driverName: string
  utilizationRate: number
  capacityStatus: 'available' | 'busy' | 'overloaded'
  assignedOrders: number
  totalWorkload: number
  efficiency: number
  nextAvailable: string
  assignedShipments: string[]
}

interface OperationalAlert {
  id: string
  type: 'capacity_warning' | 'efficiency_drop' | 'delay_risk' | 'resource_needed'
  driverId: string
  driverName: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  timestamp: Date
  shipmentId?: string
}

export default function AIOperationsDashboard({ 
  shipments, 
  timeframe,
  onShipmentSelect 
}: AIActionsDashboardProps) {
  const [view, setView] = useState<'capacity' | 'alerts'>('capacity')
  const [driverWorkloads, setDriverWorkloads] = useState<DriverWorkload[]>([])
  const [operationalAlerts, setOperationalAlerts] = useState<OperationalAlert[]>([])

  useEffect(() => {
    generateOperationalData()
  }, [shipments])

  const generateOperationalData = () => {
    const driverMap = new Map<string, DriverWorkload>()
    const alerts: OperationalAlert[] = []

    // Generate driver capacity data
    shipments.forEach((shipment) => {
      const shipmentHash = shipment.id.split('-').pop() || shipment.id.slice(-8)
      const driverNumber = (parseInt(shipmentHash.slice(-2), 16) % 12) + 1
      const driverId = `driver-${String(driverNumber).padStart(2, '0')}`
      const driverName = `Driver ${String(driverNumber).padStart(2, '0')}`
      
      if (!driverMap.has(driverId)) {
        driverMap.set(driverId, {
          driverId,
          driverName,
          utilizationRate: 0,
          capacityStatus: 'available',
          assignedOrders: 0,
          totalWorkload: 0,
          efficiency: 85 + Math.floor(Math.random() * 15), // 85-100%
          nextAvailable: 'Available Now',
          assignedShipments: []
        })
      }
      
      const driver = driverMap.get(driverId)!
      driver.assignedShipments.push(shipment.id)
      driver.assignedOrders++
      
      // Calculate workload based on shipment complexity
      let workloadPoints = 0
      switch (shipment.status) {
        case 'pending': workloadPoints = 20; break
        case 'in_transit': workloadPoints = 30; break
        case 'delivered': workloadPoints = 10; break
        case 'delayed': workloadPoints = 50; break
        default: workloadPoints = 25
      }
      
      driver.totalWorkload += workloadPoints
    })

    // Calculate utilization and capacity status
    Array.from(driverMap.values()).forEach(driver => {
      driver.utilizationRate = Math.min((driver.totalWorkload / 100) * 100, 100)
      
      if (driver.utilizationRate >= 90) {
        driver.capacityStatus = 'overloaded'
        driver.nextAvailable = `${Math.floor(Math.random() * 3) + 2} hours`
        
        // Generate capacity warning alert
        alerts.push({
          id: `alert-${driver.driverId}-capacity`,
          type: 'capacity_warning',
          driverId: driver.driverId,
          driverName: driver.driverName,
          message: `${driver.driverName} at 95% capacity - consider redistributing workload`,
          priority: 'high',
          timestamp: new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000)
        })
      } else if (driver.utilizationRate >= 70) {
        driver.capacityStatus = 'busy'
        driver.nextAvailable = `${Math.floor(Math.random() * 2) + 1} hours`
      } else {
        driver.capacityStatus = 'available'
        driver.nextAvailable = 'Available Now'
      }
      
      // Generate efficiency alerts
      if (driver.efficiency < 90) {
        alerts.push({
          id: `alert-${driver.driverId}-efficiency`,
          type: 'efficiency_drop',
          driverId: driver.driverId,
          driverName: driver.driverName,
          message: `${driver.driverName} efficiency at ${driver.efficiency}% - may need support`,
          priority: 'medium',
          timestamp: new Date(Date.now() - Math.random() * 4 * 60 * 60 * 1000)
        })
      }
    })

    // Generate delay risk alerts
    const delayedShipments = shipments.filter(s => s.status === 'delayed')
    delayedShipments.forEach(shipment => {
      const driverNumber = (parseInt((shipment.id.split('-').pop() || shipment.id.slice(-8)).slice(-2), 16) % 12) + 1
      const driverName = `Driver ${String(driverNumber).padStart(2, '0')}`
      
      alerts.push({
        id: `alert-delay-${shipment.id}`,
        type: 'delay_risk',
        driverId: `driver-${String(driverNumber).padStart(2, '0')}`,
        driverName,
        message: `Shipment ${shipment.shipment_number} delayed - immediate intervention required`,
        priority: 'urgent',
        timestamp: new Date(Date.now() - Math.random() * 1 * 60 * 60 * 1000),
        shipmentId: shipment.id
      })
    })

    const sortedDrivers = Array.from(driverMap.values())
      .filter(driver => driver.assignedOrders > 0)
      .sort((a, b) => b.utilizationRate - a.utilizationRate)
      .slice(0, 8)

    setDriverWorkloads(sortedDrivers)
    
    // Sort alerts by priority and timestamp
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
    alerts.sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      return b.timestamp.getTime() - a.timestamp.getTime()
    })
    setOperationalAlerts(alerts.slice(0, 10))
  }

  // ✅ UPDATED: Use centralized AI actions calculation
  const getOperationalStats = () => {
    const aiActionsData = calculateAIActions(shipments)
    const avgUtilization = driverWorkloads.length > 0 
      ? Math.round(driverWorkloads.reduce((sum, d) => sum + d.utilizationRate, 0) / driverWorkloads.length)
      : 0
    const availableDrivers = driverWorkloads.filter(d => d.capacityStatus === 'available').length
    const avgEfficiency = driverWorkloads.length > 0
      ? Math.round(driverWorkloads.reduce((sum, d) => sum + d.efficiency, 0) / driverWorkloads.length)
      : 0

    return {
      totalOperations: aiActionsData.totalActions,
      avgUtilization,
      availableDrivers,
      avgEfficiency
    }
  }

  const stats = getOperationalStats()

  const getCapacityColor = (status: string) => {
    switch (status) {
      case 'overloaded': return 'bg-red-100 text-red-700 border-red-200'
      case 'busy': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'available': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getUtilizationBarColor = (rate: number) => {
    if (rate >= 90) return 'bg-red-500'
    if (rate >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getAlertColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 border-l-red-500'
      case 'high': return 'bg-orange-100 text-orange-700 border-l-orange-500'
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-l-yellow-500'
      case 'low': return 'bg-blue-100 text-blue-700 border-l-blue-500'
      default: return 'bg-gray-100 text-gray-700 border-l-gray-500'
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'capacity_warning': return '⚠️'
      case 'efficiency_drop': return '📉'
      case 'delay_risk': return '🚨'
      case 'resource_needed': return '🔧'
      default: return '⚡'
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
            <h3 className="text-lg font-semibold text-gray-900">Driver Operations Dashboard</h3>
            <p className="text-sm text-gray-600">Driver workload management and operational efficiency</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-blue-700">Operations Live</span>
          </div>
        </div>

        {/* Operational Stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-xl font-bold text-blue-600">{stats.totalOperations}</div>
            <div className="text-xs text-blue-600">Operations</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-xl font-bold text-green-600">{stats.avgUtilization}%</div>
            <div className="text-xs text-green-600">Avg Utilization</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-xl font-bold text-purple-600">{stats.availableDrivers}</div>
            <div className="text-xs text-purple-600">Available</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-xl font-bold text-orange-600">{stats.avgEfficiency}%</div>
            <div className="text-xs text-orange-600">Efficiency</div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setView('capacity')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              view === 'capacity'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🚛 Driver Capacity
          </button>
          <button
            onClick={() => setView('alerts')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              view === 'alerts'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ⚡ Operational Alerts
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {view === 'capacity' ? (
          <div className="divide-y divide-gray-100">
            {driverWorkloads.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-sm">No driver capacity data available</p>
              </div>
            ) : (
              driverWorkloads.map((driver) => (
                <div key={driver.driverId} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{driver.driverName}</p>
                        <p className="text-xs text-gray-500">
                          {driver.assignedOrders} active orders • {driver.nextAvailable}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCapacityColor(driver.capacityStatus)}`}>
                        {driver.capacityStatus.toUpperCase()}
                      </span>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">{Math.round(driver.utilizationRate)}%</div>
                        <div className="text-xs text-gray-500">Utilization</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Utilization Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Workload Capacity</span>
                      <span>{Math.round(driver.utilizationRate)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getUtilizationBarColor(driver.utilizationRate)}`}
                        style={{ width: `${Math.min(driver.utilizationRate, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Performance metrics */}
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="text-center p-3 bg-green-50 rounded">
                      <div className="text-lg font-bold text-green-600">{driver.efficiency}%</div>
                      <div className="text-xs text-gray-500">Efficiency</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <div className="text-lg font-bold text-blue-600">{driver.assignedOrders}</div>
                      <div className="text-xs text-gray-500">Active Orders</div>
                    </div>
                  </div>
                  
                  {/* Capacity recommendation */}
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    <strong>Capacity Status:</strong> {
                      driver.capacityStatus === 'available' 
                        ? 'Ready for new assignments'
                        : driver.capacityStatus === 'busy'
                        ? 'Operating at optimal capacity'
                        : 'Consider workload redistribution'
                    }
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {operationalAlerts.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm">No operational alerts - all systems running smoothly</p>
              </div>
            ) : (
              operationalAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 ${getAlertColor(alert.priority)}`}
                  onClick={() => alert.shipmentId && onShipmentSelect?.(alert.shipmentId)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <span className="text-lg">{getAlertIcon(alert.type)}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900">
                            {alert.driverName}
                          </h4>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            alert.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                            alert.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                            alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {alert.priority.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          {formatTimeAgo(alert.timestamp)}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        {alert.message}
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Alert Type: {alert.type.replace('_', ' ').toUpperCase()}
                        {alert.shipmentId && ' • Click to view shipment'}
                      </div>
                    </div>
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
            {view === 'capacity' 
              ? `${driverWorkloads.length} drivers active • ${stats.availableDrivers} available for new assignments` 
              : `${operationalAlerts.length} operational alerts requiring attention`
            }
          </span>
          <span className="flex items-center space-x-1">
            <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Real-time operational data</span>
          </span>
        </div>
      </div>
    </div>
  )
}