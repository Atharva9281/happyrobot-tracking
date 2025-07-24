'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Shipment, ShipmentStats } from '@/types/shipment'

export function useShipments() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchShipments()
    
    // FIXED: Properly handle async function in useEffect
    const setupSubscription = () => {
      const subscription = supabase
        .channel('shipments_changes')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'shipments' 
          },
          (payload) => {
            console.log('🔄 Real-time shipment update:', payload)
            
            switch (payload.eventType) {
              case 'INSERT':
                const newShipment = enhanceShipment(payload.new as Shipment)
                console.log('➕ Adding new shipment:', newShipment.shipment_number)
                setShipments(prev => [newShipment, ...prev])
                break
                
              case 'UPDATE':
                const updatedShipment = enhanceShipment(payload.new as Shipment)
                console.log(`🔄 Updating shipment: ${updatedShipment.shipment_number} - Status: ${updatedShipment.status} - Color: ${updatedShipment.status_color}`)
                setShipments(prev => 
                  prev.map(shipment => 
                    shipment.id === updatedShipment.id ? updatedShipment : shipment
                  )
                )
                break
                
              case 'DELETE':
                console.log('🗑️ Deleting shipment:', payload.old.id)
                setShipments(prev => 
                  prev.filter(shipment => shipment.id !== payload.old.id)
                )
                break
            }
          }
        )
        .subscribe()

      // Return cleanup function (not a Promise)
      return () => {
        subscription.unsubscribe()
      }
    }

    const cleanup = setupSubscription()
    
    // FIXED: Return cleanup function directly
    return cleanup
  }, [])

  const fetchShipments = async () => {
    try {
      setLoading(true)
      console.log('📡 Fetching shipments from database...')
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Enhance shipments with computed properties
      const enhancedShipments = data?.map(enhanceShipment) || []
      console.log(`✅ Fetched ${enhancedShipments.length} shipments`)
      setShipments(enhancedShipments)
      setError(null)
    } catch (error) {
      console.error('❌ Error fetching shipments:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch shipments')
    } finally {
      setLoading(false)
    }
  }

  // ✅ ENHANCED: Enhance shipment with computed UI properties
  const enhanceShipment = (shipment: Shipment): Shipment => {
    const statusColor = getStatusColor(shipment.status)
    
    const enhanced = {
      ...shipment,
      distance_display: shipment.distance_km 
        ? `${Math.round(shipment.distance_km)} km`
        : 'Unknown',
      eta_display: shipment.eta 
        ? new Date(shipment.eta).toLocaleDateString()
        : 'TBD',
      progress_display: `${Math.round(shipment.progress_percentage || 0)}%`,
      status_color: statusColor
    }

    // ✅ LOG STATUS COLOR ASSIGNMENT
    console.log(`🎨 Enhanced shipment ${enhanced.shipment_number}: ${enhanced.status} → ${statusColor}`)
    
    return enhanced
  }

  // ✅ IMPROVED: More robust status color mapping
  const getStatusColor = (status: string): 'blue' | 'green' | 'yellow' | 'red' => {
    switch (status?.toLowerCase()) {
      case 'in_transit':
      case 'in-transit':
        return 'blue'
      case 'delivered':
      case 'completed':
        return 'green'
      case 'pending':
      case 'waiting':
      case 'scheduled':
        return 'yellow'
      case 'delayed':
      case 'overdue':
      case 'failed':
        return 'red'
      default:
        console.warn(`⚠️ Unknown status: ${status}, defaulting to blue`)
        return 'blue'
    }
  }

  // Calculate statistics
  const getStats = (): ShipmentStats => {
    const total = shipments.length
    const in_transit = shipments.filter(s => s.status === 'in_transit').length
    const delivered = shipments.filter(s => s.status === 'delivered').length
    const pending = shipments.filter(s => s.status === 'pending').length
    const delayed = shipments.filter(s => s.status === 'delayed').length
    
    const on_time_percentage = total > 0 
      ? Math.round(((delivered + in_transit) / total) * 100)
      : 0

    return {
      total,
      in_transit,
      delivered,
      pending,
      delayed,
      on_time_percentage
    }
  }

  const createShipment = async (shipmentData: {
    origin_address: string
    origin_lat: number
    origin_lng: number
    dest_address: string
    dest_lat: number
    dest_lng: number
    distance_km?: number
    estimated_duration_hours?: number
  }) => {
    try {
      console.log('➕ Creating new shipment...')
      const { data, error } = await supabase
        .from('shipments')
        .insert({
          shipment_number: `SHIP-${Date.now()}`,
          ...shipmentData
        })
        .select()
        .single()

      if (error) throw error
      console.log('✅ Shipment created successfully:', data.shipment_number)
      return { success: true, shipment: data }
    } catch (error) {
      console.error('❌ Error creating shipment:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create shipment' 
      }
    }
  }

  // ✅ ENHANCED: Better update logging
  const updateShipment = async (id: string, updates: {
    current_lat?: number
    current_lng?: number
    progress_percentage?: number
    status?: 'pending' | 'in_transit' | 'delivered' | 'delayed'
    eta?: string | null
  }) => {
    try {
      const shipment = shipments.find(s => s.id === id)
      console.log(`🔄 Updating shipment ${shipment?.shipment_number || id}:`, updates)
      
      const { error } = await supabase
        .from('shipments')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
      
      console.log(`✅ Shipment ${shipment?.shipment_number || id} updated successfully`)
      return { success: true }
    } catch (error) {
      console.error('❌ Error updating shipment:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update shipment' 
      }
    }
  }

  const deleteShipment = async (id: string) => {
    try {
      const shipment = shipments.find(s => s.id === id)
      console.log(`🗑️ Deleting shipment ${shipment?.shipment_number || id}...`)
      
      const { error } = await supabase
        .from('shipments')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      console.log(`✅ Shipment ${shipment?.shipment_number || id} deleted successfully`)
      return { success: true }
    } catch (error) {
      console.error('❌ Error deleting shipment:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete shipment' 
      }
    }
  }

  // Get shipment by ID
  const getShipmentById = (id: string): Shipment | undefined => {
    return shipments.find(shipment => shipment.id === id)
  }

  // Filter shipments by status
  const getShipmentsByStatus = (status: 'pending' | 'in_transit' | 'delivered' | 'delayed'): Shipment[] => {
    return shipments.filter(shipment => shipment.status === status)
  }

  return {
    shipments,
    loading,
    error,
    stats: getStats(),
    createShipment,
    updateShipment,
    deleteShipment,
    getShipmentById,
    getShipmentsByStatus,
    refetch: fetchShipments
  }
}