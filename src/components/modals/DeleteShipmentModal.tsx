// components/modals/DeleteShipmentModal.tsx
'use client'

import React, { useState } from 'react'

interface DeleteShipmentModalProps {
  shipment: any
  onClose: () => void
  onDelete: (shipmentId: string) => Promise<boolean>
}

export default function DeleteShipmentModal({ shipment, onClose, onDelete }: DeleteShipmentModalProps) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    console.log(`🗑️ [DeleteModal] Deleting shipment ${shipment.shipment_number}`)
    
    setDeleting(true)
    try {
      const success = await onDelete(shipment.id)
      
      if (success) {
        console.log(`✅ [DeleteModal] Successfully deleted ${shipment.shipment_number}`)
        onClose() // Close modal on success
      } else {
        console.log(`❌ [DeleteModal] Failed to delete`)
        alert('Failed to delete shipment')
      }
    } catch (error) {
      console.error('❌ [DeleteModal] Error:', error)
      alert('An error occurred while deleting')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0 w-10 h-10 mx-auto flex items-center justify-center rounded-full bg-red-100">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          Delete Shipment
        </h3>
        
        <p className="text-sm text-gray-600 mb-6 text-center">
          Are you sure you want to delete shipment <strong>{shipment.shipment_number}</strong>?
        </p>
        
        <div className="bg-gray-50 p-3 rounded-md mb-6">
          <div className="text-sm">
            <div className="font-medium text-gray-900">{shipment.shipment_number}</div>
            <div className="text-gray-600">
              {shipment.origin_address} → {shipment.dest_address}
            </div>
            <div className="text-gray-500 text-xs mt-1">
              Status: {shipment.status?.replace('_', ' ').toUpperCase()}
            </div>
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 p-3 rounded-md mb-6">
          <p className="text-sm text-red-800">
            <strong>Warning:</strong> This action cannot be undone. All shipment data will be permanently deleted.
          </p>
        </div>
        
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? 'Deleting...' : 'Delete Shipment'}
          </button>
        </div>
        
        {deleting && (
          <div className="mt-4 text-center text-sm text-red-600">
            Deleting shipment permanently...
          </div>
        )}
      </div>
    </div>
  )
}