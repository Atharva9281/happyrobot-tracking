'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { redirect } from 'next/navigation'
import AnalyticsDashboard from '@/components/dashboard/AnalyticsDashboard'
import RealtimeEvents from '@/components/ai/RealtimeEvents'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [shipments, setShipments] = useState<any[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect if not authenticated (only after mount to avoid hydration issues)
  useEffect(() => {
    if (mounted && !authLoading && !user) {
      redirect('/')
    }
  }, [mounted, authLoading, user])

  if (!mounted || authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  const handleShipmentAction = (action: string, shipmentId: string) => {
    console.log(`AI Action: ${action} for shipment ${shipmentId}`)
    // Handle AI actions here (call driver, email customer, etc.)
  }

  const handleEventTriggered = (event: any) => {
    console.log('Real-time event triggered:', event)
    // Handle real-time events here
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Analytics Dashboard */}
      <AnalyticsDashboard />
      
      {/* Real-time Events (Hidden - can be shown in a modal or sidebar) */}
      <div className="hidden">
        <RealtimeEvents 
          shipments={shipments}
          onEventTriggered={handleEventTriggered}
        />
      </div>
    </div>
  )
}