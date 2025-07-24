'use client'

import React, { useState } from 'react'

interface ExportModalProps {
  shipments: any[]
  communications?: any[]
  onClose: () => void
}

export default function ExportModal({ shipments, communications = [], onClose }: ExportModalProps) {
  const [exportType, setExportType] = useState<'shipments' | 'communications'>('shipments')
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf' | 'excel'>('csv')
  const [dateRange, setDateRange] = useState<'all' | 'today' | '7days' | '30days' | 'custom'>('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [includeFields, setIncludeFields] = useState({
    shipments: {
      basic: true,
      revenue: true,
      progress: true,
      dates: true,
      customer: true,
      locations: true
    },
    communications: {
      basic: true,
      content: true,
      metadata: true,
      aiCalls: true
    }
  })
  const [isExporting, setIsExporting] = useState(false)

  // Filter data based on date range
  const getFilteredData = (data: any[], dateField: string) => {
    if (dateRange === 'all') return data

    const now = new Date()
    let startDate: Date

    switch (dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'custom':
        if (!customStartDate) return data
        startDate = new Date(customStartDate)
        break
      default:
        return data
    }

    return data.filter(item => {
      const itemDate = new Date(item[dateField] || item.created_at || item.timestamp || Date.now())
      if (dateRange === 'custom' && customEndDate) {
        const endDate = new Date(customEndDate)
        endDate.setHours(23, 59, 59, 999)
        return itemDate >= startDate && itemDate <= endDate
      }
      return itemDate >= startDate
    })
  }

  // Generate CSV content
  const generateCSV = (data: any[], headers: string[], rowMapper: (item: any) => string[]) => {
    const csvHeaders = headers.join(',')
    const csvRows = data.map(item => {
      const values = rowMapper(item)
      return values.map(value => {
        // Escape quotes and wrap in quotes if contains comma or quotes
        const stringValue = String(value || '')
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      }).join(',')
    })
    
    return [csvHeaders, ...csvRows].join('\n')
  }

  // Generate shipments CSV
  const generateShipmentsCSV = () => {
    const filteredShipments = getFilteredData(shipments, 'created_at')
    const headers: string[] = []
    
    // Build headers based on selected fields
    if (includeFields.shipments.basic) {
      headers.push('Shipment Number', 'Status')
    }
    if (includeFields.shipments.customer) {
      headers.push('Customer Name')
    }
    if (includeFields.shipments.locations) {
      headers.push('Origin', 'Destination')
    }
    if (includeFields.shipments.progress) {
      headers.push('Progress (%)')
    }
    if (includeFields.shipments.revenue) {
      headers.push('Revenue')
    }
    if (includeFields.shipments.dates) {
      headers.push('Created Date', 'ETA')
    }

    const rowMapper = (shipment: any) => {
      const row: string[] = []
      
      if (includeFields.shipments.basic) {
        row.push(shipment.shipment_number || '', shipment.status || '')
      }
      if (includeFields.shipments.customer) {
        row.push(shipment.customer_name || 'Unknown')
      }
      if (includeFields.shipments.locations) {
        row.push(shipment.origin_address || '', shipment.dest_address || '')
      }
      if (includeFields.shipments.progress) {
        row.push(`${Math.round(shipment.progress_percentage || 0)}%`)
      }
      if (includeFields.shipments.revenue) {
        row.push(`${(shipment.revenue || 0).toLocaleString()}`)
      }
      if (includeFields.shipments.dates) {
        // ✅ SMART ETA CALCULATION
        let eta = 'TBD'
        
        if (shipment.eta) {
          // Use existing ETA
          eta = new Date(shipment.eta).toLocaleDateString()
        } else if (shipment.estimated_duration_hours && shipment.created_at) {
          // Calculate ETA from creation time + duration
          const etaTime = new Date(shipment.created_at)
          etaTime.setHours(etaTime.getHours() + (shipment.estimated_duration_hours || 24))
          eta = etaTime.toLocaleDateString()
        } else if (shipment.status === 'delivered') {
          // For delivered shipments, use delivery date
          eta = 'Delivered'
        } else if (shipment.distance_km) {
          // Calculate based on distance (assuming 65 km/h average)
          const hours = (shipment.distance_km / 65) + 2 // +2 hours buffer
          const etaTime = new Date(shipment.created_at || Date.now())
          etaTime.setHours(etaTime.getHours() + hours)
          eta = etaTime.toLocaleDateString()
        }
        
        row.push(
          new Date(shipment.created_at || Date.now()).toLocaleDateString(),
          eta
        )
      }
      
      return row
    }

    return generateCSV(filteredShipments, headers, rowMapper)
  }

  // Generate communications CSV
  const generateCommunicationsCSV = () => {
    const filteredComms = getFilteredData(communications, 'timestamp')
    const headers: string[] = []
    
    // Build headers based on selected fields
    if (includeFields.communications.basic) {
      headers.push('Shipment Number', 'Type', 'Direction', 'Status', 'Timestamp')
    }
    if (includeFields.communications.content) {
      headers.push('Recipient', 'Subject', 'Content')
    }
    if (includeFields.communications.aiCalls) {
      headers.push('AI Call', 'Call Duration', 'Call Outcome')
    }
    if (includeFields.communications.metadata) {
      headers.push('Trigger', 'Customer Name', 'Automation Type')
    }

    const rowMapper = (comm: any) => {
      const row: string[] = []
      
      if (includeFields.communications.basic) {
        row.push(
          comm.shipmentNumber || '',
          comm.type || '',
          comm.direction || '',
          comm.status || '',
          new Date(comm.timestamp).toLocaleString()
        )
      }
      if (includeFields.communications.content) {
        row.push(
          comm.recipient || comm.metadata?.customerName || '',
          comm.subject || '',
          comm.content || ''
        )
      }
      if (includeFields.communications.aiCalls) {
        row.push(
          comm.tags?.includes('ai_call') ? 'Yes' : 'No',
          comm.metadata?.callDuration ? `${Math.floor(comm.metadata.callDuration / 60)}m ${comm.metadata.callDuration % 60}s` : '',
          comm.metadata?.callOutcome || ''
        )
      }
      if (includeFields.communications.metadata) {
        row.push(
          comm.metadata?.trigger || '',
          comm.metadata?.customerName || '',
          comm.metadata?.automationType || ''
        )
      }
      
      return row
    }

    return generateCSV(filteredComms, headers, rowMapper)
  }

  // Handle export
  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      let csvContent = ''
      let filename = ''

      switch (exportType) {
        case 'shipments':
          csvContent = generateShipmentsCSV()
          filename = `shipments_export_${new Date().toISOString().split('T')[0]}.csv`
          break
        case 'communications':
          csvContent = generateCommunicationsCSV()
          filename = `communications_export_${new Date().toISOString().split('T')[0]}.csv`
          break
      }

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Show success message
      alert(`Export completed! Downloaded ${filename}`)
      onClose()
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const getRecordCount = () => {
    switch (exportType) {
      case 'shipments':
        return getFilteredData(shipments, 'created_at').length
      case 'communications':
        return getFilteredData(communications, 'timestamp').length
      default:
        return 0
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Export Data</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Export Type Selection - Only 2 options now */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">What to Export</label>
            <div className="grid grid-cols-1 gap-3">
              <label className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="exportType"
                  value="shipments"
                  checked={exportType === 'shipments'}
                  onChange={(e) => setExportType(e.target.value as any)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Shipments Data</div>
                  <div className="text-sm text-gray-500">Export shipment details, status, progress, and tracking info</div>
                </div>
              </label>
              
              <label className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="exportType"
                  value="communications"
                  checked={exportType === 'communications'}
                  onChange={(e) => setExportType(e.target.value as any)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">AI Communications Log</div>
                  <div className="text-sm text-gray-500">Export AI calls, emails, SMS, and automated interactions</div>
                </div>
              </label>
            </div>
          </div>

          {/* Date Range Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Date Range</label>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="custom">Custom Range</option>
              </select>
              
              <div className="text-sm text-gray-500 flex items-center">
                📊 {getRecordCount()} records to export
              </div>
            </div>

            {dateRange === 'custom' && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Field Selection for Shipments */}
          {exportType === 'shipments' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Include Fields</label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeFields.shipments.basic}
                    onChange={(e) => setIncludeFields(prev => ({
                      ...prev,
                      shipments: { ...prev.shipments, basic: e.target.checked }
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Basic Info (Number, Status)</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeFields.shipments.customer}
                    onChange={(e) => setIncludeFields(prev => ({
                      ...prev,
                      shipments: { ...prev.shipments, customer: e.target.checked }
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Customer Details</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeFields.shipments.locations}
                    onChange={(e) => setIncludeFields(prev => ({
                      ...prev,
                      shipments: { ...prev.shipments, locations: e.target.checked }
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Origin & Destination</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeFields.shipments.progress}
                    onChange={(e) => setIncludeFields(prev => ({
                      ...prev,
                      shipments: { ...prev.shipments, progress: e.target.checked }
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Progress Tracking</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeFields.shipments.revenue}
                    onChange={(e) => setIncludeFields(prev => ({
                      ...prev,
                      shipments: { ...prev.shipments, revenue: e.target.checked }
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Revenue Data</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeFields.shipments.dates}
                    onChange={(e) => setIncludeFields(prev => ({
                      ...prev,
                      shipments: { ...prev.shipments, dates: e.target.checked }
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Dates & ETA</span>
                </label>
              </div>
            </div>
          )}

          {/* Field Selection for Communications */}
          {exportType === 'communications' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Include Fields</label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeFields.communications.basic}
                    onChange={(e) => setIncludeFields(prev => ({
                      ...prev,
                      communications: { ...prev.communications, basic: e.target.checked }
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Basic Info (Type, Status, Date)</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeFields.communications.content}
                    onChange={(e) => setIncludeFields(prev => ({
                      ...prev,
                      communications: { ...prev.communications, content: e.target.checked }
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Message Content</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeFields.communications.aiCalls}
                    onChange={(e) => setIncludeFields(prev => ({
                      ...prev,
                      communications: { ...prev.communications, aiCalls: e.target.checked }
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm">AI Call Details</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeFields.communications.metadata}
                    onChange={(e) => setIncludeFields(prev => ({
                      ...prev,
                      communications: { ...prev.communications, metadata: e.target.checked }
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Metadata & Triggers</span>
                </label>
              </div>
            </div>
          )}

          {/* Export Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Export Format</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="exportFormat"
                  value="csv"
                  checked={exportFormat === 'csv'}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                  className="mr-2"
                />
                <span className="text-sm">CSV (Spreadsheet)</span>
              </label>
              
              <label className="flex items-center text-gray-400">
                <input
                  type="radio"
                  name="exportFormat"
                  value="pdf"
                  disabled
                  className="mr-2"
                />
                <span className="text-sm">PDF (Coming Soon)</span>
              </label>
              
              <label className="flex items-center text-gray-400">
                <input
                  type="radio"
                  name="exportFormat"
                  value="excel"
                  disabled
                  className="mr-2"
                />
                <span className="text-sm">Excel (Coming Soon)</span>
              </label>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Export Preview</h4>
            <div className="text-sm text-gray-600">
              <div>📄 Format: {exportFormat.toUpperCase()}</div>
              <div>📅 Date Range: {dateRange === 'all' ? 'All Time' : dateRange === 'custom' ? `${customStartDate} to ${customEndDate}` : dateRange}</div>
              <div>📊 Records: {getRecordCount()}</div>
              <div>🗂️ Data Type: {exportType === 'shipments' ? 'Shipment Operations' : 'AI Communications'}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 mt-8">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || getRecordCount() === 0}
            className="flex items-center space-x-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export Data</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}