// components/modals/EditShipmentModal.tsx
'use client'

import React, { useState } from 'react'

interface EditShipmentModalProps {
  shipment: any
  onClose: () => void
  onUpdate: (shipmentId: string, updates: any) => Promise<boolean>
}

export default function EditShipmentModal({ shipment, onClose, onUpdate }: EditShipmentModalProps) {
  const [updating, setUpdating] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'in_transit': return 'bg-blue-100 text-blue-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'delayed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    console.log(`🔄 [EditModal] Updating ${shipment.shipment_number} from ${shipment.status} to ${newStatus}`)
    
    setUpdating(true)
    try {
      const success = await onUpdate(shipment.id, { status: newStatus })
      
      if (success) {
        console.log(`✅ [EditModal] Successfully updated to ${newStatus}`)
        onClose() // Close modal on success
      } else {
        console.log(`❌ [EditModal] Failed to update`)
        alert('Failed to update shipment status')
      }
    } catch (error) {
      console.error('❌ [EditModal] Error:', error)
      alert('An error occurred while updating')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Update Shipment Status
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Change status for shipment: <strong>{shipment.shipment_number}</strong>
        </p>
        
        <div className="space-y-3 mb-6">
          <div className="text-sm">
            <span className="text-gray-600">Current Status: </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}>
              {shipment.status?.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Update to:
            </label>
            <div className="space-y-2">
              {['pending', 'in_transit', 'delivered', 'delayed'].map(status => (
                <button
                  key={status}
                  onClick={() => handleStatusUpdate(status)}
                  disabled={status === shipment.status || updating}
                  className={`w-full text-left px-3 py-2 rounded-md border text-sm ${
                    status === shipment.status || updating
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white hover:bg-gray-50 border-gray-300 hover:border-blue-500'
                  }`}
                >
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 ${getStatusColor(status)}`}>
                    {status.replace('_', ' ').toUpperCase()}
                  </span>
                  {status === 'pending' && 'Mark as Pending'}
                  {status === 'in_transit' && 'Start Transit'}
                  {status === 'delivered' && 'Mark as Delivered'}
                  {status === 'delayed' && 'Mark as Delayed'}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={updating}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
        
        {updating && (
          <div className="mt-4 text-center text-sm text-blue-600">
            Updating shipment status...
          </div>
        )}
      </div>
    </div>
  )
}