'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Shipment } from '@/types/shipment'
import MapView from '@/components/map/MapView'
import SimulationControls from '@/components/dashboard/SimulationControls'
import { simulationService, SimulationUpdate } from '@/services/SimulationService'

interface SimulationModalProps {
  shipments: Shipment[]
  onClose: () => void
  onShipmentUpdate?: (shipmentId: string, updates: any) => Promise<boolean>
}

export default function SimulationModal({ 
  shipments, 
  onClose, 
  onShipmentUpdate 
}: SimulationModalProps) {
  const [localShipments, setLocalShipments] = useState<Shipment[]>(shipments)
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)
  const [simulationActive, setSimulationActive] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 🚀 JOURNEY STATE
  const [journeyMode, setJourneyMode] = useState<'select' | 'preview' | 'running' | 'completed'>('select')
  const [journeyProgress, setJourneyProgress] = useState(0)
  const [estimatedDuration, setEstimatedDuration] = useState(0)
  const [journeyStartTime, setJourneyStartTime] = useState<Date | null>(null)

  // ✅ SYNC: Update local shipments when parent shipments change
  useEffect(() => {
    setLocalShipments(shipments)
  }, [shipments])

  // ✅ CLEANUP ON UNMOUNT
  useEffect(() => {
    return () => {
      console.log('🚛 Cleaning up journey simulator')
      simulationService.destroy()
    }
  }, [])

  // 🚀 HANDLE SIMULATION UPDATES (Journey focused)
  const handleSimulationUpdate = useCallback(async (updates: SimulationUpdate[]) => {
    console.log('📡 [JourneySimulator] Received', updates.length, 'updates')
    
    // Only process updates for selected shipment
    const selectedUpdate = updates.find(u => u.shipmentId === selectedShipment?.id)
    if (!selectedUpdate) return

    // Update local state immediately for smooth UI
    setLocalShipments(prevShipments => 
      prevShipments.map(shipment => {
        if (shipment.id === selectedUpdate.shipmentId) {
          return {
            ...shipment,
            current_lat: selectedUpdate.current_lat,
            current_lng: selectedUpdate.current_lng,
            progress_percentage: selectedUpdate.progress_percentage,
            status: selectedUpdate.status as 'pending' | 'in_transit' | 'delivered' | 'delayed'
          }
        }
        return shipment
      })
    )

    // Update selected shipment
    setSelectedShipment(prev => prev ? {
      ...prev,
      current_lat: selectedUpdate.current_lat,
      current_lng: selectedUpdate.current_lng,
      progress_percentage: selectedUpdate.progress_percentage,
      status: selectedUpdate.status as 'pending' | 'in_transit' | 'delivered' | 'delayed'
    } : null)

    // Update journey progress
    setJourneyProgress(selectedUpdate.progress_percentage)

    // Check if journey completed
    if (selectedUpdate.progress_percentage >= 100) {
      setJourneyMode('completed')
      simulationService.pause()
      console.log('🎉 Journey completed!')
    }

    // Optional: Update parent component
    if (onShipmentUpdate) {
      try {
        await onShipmentUpdate(selectedUpdate.shipmentId, {
          current_lat: selectedUpdate.current_lat,
          current_lng: selectedUpdate.current_lng,
          progress_percentage: selectedUpdate.progress_percentage,
          status: selectedUpdate.status
        })
      } catch (error) {
        console.log('Note: Parent update skipped (journey mode)')
      }
    }
  }, [selectedShipment, onShipmentUpdate])

  // 🚀 START JOURNEY FOR SELECTED SHIPMENT
  const startJourney = async () => {
    if (!selectedShipment) return

    setIsInitializing(true)
    setError(null)
    setJourneyMode('running')
    setJourneyStartTime(new Date())
    
    try {
      console.log('🚛 Starting journey for:', selectedShipment.shipment_number)
      
      // Initialize with only the selected shipment
      const journeyShipment = {
        id: selectedShipment.id,
        shipment_number: selectedShipment.shipment_number,
        status: 'in_transit', // Force in_transit for journey
        progress_percentage: 0, // Start from beginning
        origin_lat: selectedShipment.origin_lat,
        origin_lng: selectedShipment.origin_lng,
        dest_lat: selectedShipment.dest_lat,
        dest_lng: selectedShipment.dest_lng,
        current_lat: selectedShipment.origin_lat, // Start at origin
        current_lng: selectedShipment.origin_lng,
        route_encoded: (selectedShipment as any).route_encoded,
        distance_km: (selectedShipment as any).distance_km
      }

      // Initialize simulation service with single shipment
      await simulationService.initializeJourney([journeyShipment], handleSimulationUpdate)
      setSimulationActive(true)
      
      // Start the journey immediately
      simulationService.start()
      
      console.log('✅ Journey started successfully')
      
    } catch (error) {
      console.error('❌ Failed to start journey:', error)
      setError('Failed to start journey. Please try again.')
      setJourneyMode('select')
    } finally {
      setIsInitializing(false)
    }
  }

  // 🚀 RESET JOURNEY
  const resetJourney = () => {
    simulationService.destroy()
    setJourneyMode('select')
    setJourneyProgress(0)
    setJourneyStartTime(null)
    setSimulationActive(false)
    setSelectedShipment(null)
  }

  const handleClose = () => {
    console.log('🚛 Closing journey simulator')
    simulationService.destroy()
    onClose()
  }

  // ✅ SIMPLIFIED: Calculate journey stats without ETA
  const getJourneyStats = () => {
    if (!selectedShipment) {
      return { progress: 0, status: 'Select a shipment to begin' }
    }

    const progress = journeyProgress
    const status = journeyMode === 'completed' ? 'Delivered!' : 
                  journeyMode === 'running' ? 'In Transit' :
                  journeyMode === 'preview' ? 'Ready to Start' : 'Select Shipment'

    return { progress, status }
  }

  const stats = getJourneyStats()

  // Get available shipments for selection
  const availableShipments = localShipments.filter(s => s.status !== 'delivered')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[95vw] h-[90vh] max-w-7xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                🚛 Journey Simulator
                {journeyMode === 'running' && (
                  <span className="ml-3 flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                    <span className="text-sm text-green-600 font-medium">Journey Active</span>
                  </span>
                )}
              </h2>
              <p className="text-gray-600 mt-1">
                {journeyMode === 'select' ? 'Select a shipment to simulate its complete journey' :
                 journeyMode === 'running' ? `Following ${selectedShipment?.shipment_number} on its journey` :
                 journeyMode === 'completed' ? 'Journey completed successfully!' :
                 'Ready to start the journey'}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* ✅ SIMPLIFIED: Journey Stats without ETA */}
              {selectedShipment && (
                <div className="flex items-center space-x-4 text-sm">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{stats.progress.toFixed(1)}%</div>
                    <div className="text-xs text-gray-500">Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-purple-600">{stats.status}</div>
                    <div className="text-xs text-gray-500">Status</div>
                  </div>
                </div>
              )}
              
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Journey Progress Bar */}
          {selectedShipment && journeyMode !== 'select' && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>From: {selectedShipment.origin_address}</span>
                <span>To: {selectedShipment.dest_address}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${journeyProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* ✅ FIXED: Content with proper flex layout */}
        <div className="flex-1 flex min-h-0">
          {/* ✅ FIXED: Map Area with proper sizing */}
          <div className="flex-1 relative min-h-0">
            {/* Error State */}
            {error && (
              <div className="absolute top-4 left-4 right-4 z-10 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-700 text-sm">{error}</span>
                  <button
                    onClick={() => setError(null)}
                    className="ml-auto text-red-400 hover:text-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isInitializing && (
              <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Starting journey...</p>
                  <p className="text-sm text-gray-500 mt-1">Calculating route and preparing simulation</p>
                </div>
              </div>
            )}

            {/* ✅ FIXED: Map with proper container */}
            <div className="absolute inset-0">
              <MapView
                shipments={localShipments}
                selectedShipment={selectedShipment}
                onSelectShipment={setSelectedShipment}
                className="w-full h-full"
              />
            </div>

            {/* Journey Completion Celebration */}
            {journeyMode === 'completed' && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                <div className="bg-white rounded-lg p-8 text-center max-w-md">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-2xl font-bold text-green-600 mb-2">Journey Complete!</h3>
                  <p className="text-gray-600 mb-4">
                    {selectedShipment?.shipment_number} has been successfully delivered!
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={resetJourney}
                      className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                    >
                      Start New Journey
                    </button>
                    <button
                      onClick={handleClose}
                      className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Controls Sidebar */}
          <div className="w-80 bg-gray-50 border-l border-gray-200 p-6 flex-shrink-0 overflow-y-auto">
            {/* Shipment Selection */}
            {journeyMode === 'select' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Select Shipment</h3>
                <p className="text-sm text-gray-600">Choose a shipment to simulate its complete journey from origin to destination.</p>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {availableShipments.map((shipment) => (
                    <div
                      key={shipment.id}
                      onClick={() => setSelectedShipment(shipment)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedShipment?.id === shipment.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{shipment.shipment_number}</div>
                      <div className="text-sm text-gray-600">
                        From: {shipment.origin_address}
                      </div>
                      <div className="text-sm text-gray-600">
                        To: {shipment.dest_address}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          shipment.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                          shipment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {shipment.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {shipment.progress_percentage?.toFixed(1) || 0}% complete
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedShipment && (
                  <button
                    onClick={startJourney}
                    className="w-full bg-green-500 text-white px-4 py-3 rounded-md hover:bg-green-600 font-medium"
                  >
                    🚀 Start Journey
                  </button>
                )}
              </div>
            )}

            {/* Journey Controls */}
            {journeyMode !== 'select' && (
              <div className="space-y-4">
                <SimulationControls 
                  isVisible={simulationActive} 
                  selectedShipment={selectedShipment}
                  journeyMode={journeyMode}
                />
                
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={resetJourney}
                    className="w-full bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                  >
                    ← Select Different Shipment
                  </button>
                </div>
              </div>
            )}

            {/* ✅ UPDATED: Journey Instructions without ETA mention */}
            <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Journey Features</h3>
              <div className="space-y-2 text-xs text-gray-600">
                <div>• Watch truck move along real roads</div>
                <div>• Real-time progress tracking</div>
                <div>• Smooth simulation controls</div>
                <div>• Perfect for client demos!</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}