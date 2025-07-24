'use client'

import React, { useState, useEffect } from 'react'
import { simulationService } from '@/services/SimulationService'
import { Shipment } from '@/types/shipment'

interface SimulationControlsProps {
  isVisible?: boolean
  className?: string
  selectedShipment?: Shipment | null
  journeyMode?: 'select' | 'preview' | 'running' | 'completed'
}

export default function SimulationControls({ 
  isVisible = true, 
  className = '',
  selectedShipment,
  journeyMode = 'select'
}: SimulationControlsProps) {
  const [isActive, setIsActive] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [progress, setProgress] = useState(0)
  const [eta, setEta] = useState<string>('--')

  // ✅ UPDATE STATUS FROM SIMULATION SERVICE
  useEffect(() => {
    const interval = setInterval(() => {
      const status = simulationService.getJourneyStatus()
      if (status) {
        setIsActive(status.isRunning)
        setProgress(status.progress)
        setSpeed(status.currentSpeed)
      }
    }, 500)

    return () => clearInterval(interval)
  }, [])

  // ✅ JOURNEY CONTROLS
  const handlePlay = () => {
    simulationService.resume()
    setIsActive(true)
  }

  const handlePause = () => {
    simulationService.pause()
    setIsActive(false)
  }

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed)
    simulationService.setSpeed(newSpeed)
  }

  const handleReset = () => {
    simulationService.destroy()
    setIsActive(false)
    setProgress(0)
  }

  if (!isVisible || !selectedShipment) {
    return null
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${
            isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
          }`}></div>
          <h3 className="text-lg font-semibold text-gray-900">
            Journey Control
          </h3>
        </div>
        <div className="text-sm text-gray-500">
          {selectedShipment.shipment_number}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Journey Status */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Status</div>
          <div className="text-sm font-semibold text-gray-900">
            {journeyMode === 'completed' ? 'Delivered!' :
             journeyMode === 'running' ? 'In Transit' :
             journeyMode === 'preview' ? 'Ready' : 'Select'}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 uppercase tracking-wide">ETA</div>
          <div className="text-sm font-semibold text-gray-900">
            {eta}
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      {journeyMode === 'running' && (
        <div className="space-y-3">
          {/* Play/Pause Button */}
          <div className="flex space-x-2">
            {!isActive ? (
              <button
                onClick={handlePlay}
                className="flex-1 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1M9 16h1m4 0h1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Resume Journey
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="flex-1 bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pause Journey
              </button>
            )}
          </div>

          {/* Speed Controls */}
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Journey Speed</span>
              <span className="font-medium">{speed}x</span>
            </div>
            <div className="flex space-x-1">
              {[0.5, 1, 2, 5, 10].map((speedOption) => (
                <button
                  key={speedOption}
                  onClick={() => handleSpeedChange(speedOption)}
                  className={`flex-1 py-2 px-2 text-xs rounded ${
                    speed === speedOption
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {speedOption}x
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Journey Information */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>From:</span>
            <span className="font-medium">{selectedShipment.origin_address}</span>
          </div>
          <div className="flex justify-between">
            <span>To:</span>
            <span className="font-medium">{selectedShipment.dest_address}</span>
          </div>
          {selectedShipment.distance_km && (
            <div className="flex justify-between">
              <span>Distance:</span>
              <span className="font-medium">{selectedShipment.distance_km} km</span>
            </div>
          )}
        </div>
      </div>

      {/* Journey Features */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="text-xs text-blue-800 font-medium mb-1">Journey Features</div>
        <div className="text-xs text-blue-600 space-y-1">
          <div>• Real road following</div>
          <div>• Smooth camera tracking</div>
          <div>• Realistic timing</div>
          <div>• Status updates</div>
        </div>
      </div>

      {/* Debug Info (Development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
          <div>Debug: Active={isActive.toString()}</div>
          <div>Speed: {speed}x</div>
          <div>Mode: {journeyMode}</div>
        </div>
      )}
    </div>
  )
}