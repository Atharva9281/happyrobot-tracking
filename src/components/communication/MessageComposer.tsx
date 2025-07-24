'use client'

import React, { useState } from 'react'

interface CommunicationTemplate {
  id: string
  name: string
  type: 'email' | 'sms'
  subject?: string
  content: string
  variables: string[]
  useCase: string
}

interface MessageComposerProps {
  shipments: any[]
  onClose: () => void
  onSend: (messageData: {
    type: 'email' | 'sms'
    recipient: string
    subject?: string
    content: string
    shipmentId: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    scheduledFor?: Date
    requestReceipt: boolean
  }) => void
}

export default function MessageComposer({ shipments, onClose, onSend }: MessageComposerProps) {
  const [composerType, setComposerType] = useState<'email' | 'sms'>('email')
  const [formData, setFormData] = useState({
    recipient: '',
    subject: '',
    content: '',
    shipmentId: '',
    priority: 'medium' as const,
    scheduleLater: false,
    scheduledDate: '',
    scheduledTime: '',
    requestReceipt: false
  })
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Communication templates
  const templates: CommunicationTemplate[] = [
    {
      id: 'delay-notification',
      name: 'Delay Notification',
      type: 'email',
      subject: 'Shipment Delay Update - {{shipment_number}}',
      content: `Dear {{customer_name}},

We want to inform you that your shipment {{shipment_number}} has experienced a delay due to {{delay_reason}}.

Updated Details:
- Original ETA: {{original_eta}}
- New ETA: {{new_eta}}
- Current Location: {{current_location}}

We sincerely apologize for any inconvenience this may cause. Our team is actively monitoring the shipment and will provide updates as the situation progresses.

As a gesture of goodwill, we are applying a {{credit_amount}} service credit to your account.

Track your shipment: {{tracking_link}}

Best regards,
HappyRobot Logistics Team`,
      variables: ['customer_name', 'shipment_number', 'delay_reason', 'original_eta', 'new_eta', 'current_location', 'credit_amount', 'tracking_link'],
      useCase: 'Automatic delay notifications'
    },
    {
      id: 'delivery-confirmation',
      name: 'Delivery Confirmation',
      type: 'email',
      subject: 'Delivered Successfully - {{shipment_number}}',
      content: `Dear {{customer_name}},

Great news! Your shipment {{shipment_number}} has been successfully delivered.

Delivery Details:
- Delivered On: {{delivery_time}}
- Delivered To: {{delivery_location}}
- Received By: {{received_by}}
- Proof of Delivery: {{pod_link}}

Thank you for choosing HappyRobot Logistics. We look forward to serving you again.

Rate your experience: {{feedback_link}}

Best regards,
HappyRobot Logistics Team`,
      variables: ['customer_name', 'shipment_number', 'delivery_time', 'delivery_location', 'received_by', 'pod_link', 'feedback_link'],
      useCase: 'Delivery confirmations'
    },
    {
      id: 'pickup-confirmation',
      name: 'Pickup Confirmation',
      type: 'sms',
      content: 'HappyRobot: Your shipment {{shipment_number}} has been picked up and is now in transit. Track: {{tracking_link}}',
      variables: ['shipment_number', 'tracking_link'],
      useCase: 'Pickup notifications'
    },
    {
      id: 'eta-update',
      name: 'ETA Update',
      type: 'sms',
      content: 'HappyRobot: {{shipment_number}} ETA updated to {{new_eta}}. Current location: {{current_location}}. Track: {{tracking_link}}',
      variables: ['shipment_number', 'new_eta', 'current_location', 'tracking_link'],
      useCase: 'ETA changes'
    },
    {
      id: 'payment-reminder',
      name: 'Payment Reminder',
      type: 'email',
      subject: 'Invoice Due - {{shipment_number}}',
      content: `Dear {{customer_name}},

This is a friendly reminder that payment for shipment {{shipment_number}} is due.

Invoice Details:
- Invoice Number: {{invoice_number}}
- Amount Due: {{amount_due}}
- Due Date: {{due_date}}
- Payment Link: {{payment_link}}

Please process payment at your earliest convenience to avoid any service disruptions.

Thank you for your business.

Best regards,
HappyRobot Billing Team`,
      variables: ['customer_name', 'shipment_number', 'invoice_number', 'amount_due', 'due_date', 'payment_link'],
      useCase: 'Payment reminders'
    },
    {
      id: 'weather-alert',
      name: 'Weather Alert',
      type: 'email',
      subject: 'Weather Advisory - {{shipment_number}}',
      content: `Dear {{customer_name}},

We're monitoring severe weather conditions that may affect your shipment {{shipment_number}}.

Weather Advisory:
- Current Location: {{current_location}}
- Weather Condition: {{weather_condition}}
- Potential Delay: {{estimated_delay}}
- Alternative Route: {{alternative_action}}

We're taking proactive measures to minimize any impact. Our team will keep you updated on any changes.

Track your shipment: {{tracking_link}}

Best regards,
HappyRobot Operations Team`,
      variables: ['customer_name', 'shipment_number', 'current_location', 'weather_condition', 'estimated_delay', 'alternative_action', 'tracking_link'],
      useCase: 'Weather alerts'
    }
  ]

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setSelectedTemplate(templateId)
      setComposerType(template.type)
      
      // Auto-populate form with template data
      setFormData(prev => ({
        ...prev,
        subject: template.subject || '',
        content: template.content
      }))
    }
  }

  // Replace template variables with actual data
  const replaceTemplateVariables = (text: string, shipment: any) => {
    if (!shipment) return text
    
    const variables = {
      customer_name: (shipment as any).customer_name || 'Customer',
      shipment_number: shipment.shipment_number,
      current_location: `${Math.round((shipment as any).progress_percentage || 0)}% complete`,
      original_eta: shipment.eta ? new Date(shipment.eta).toLocaleDateString() : 'TBD',
      new_eta: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString(),
      delivery_time: new Date().toLocaleDateString(),
      delivery_location: (shipment as any).dest_address || 'Destination',
      received_by: (shipment as any).customer_name || 'Customer',
      tracking_link: `https://track.happyrobot.ai/${shipment.shipment_number}`,
      feedback_link: `https://feedback.happyrobot.ai/${shipment.shipment_number}`,
      pod_link: `https://pod.happyrobot.ai/${shipment.shipment_number}`,
      credit_amount: `${Math.round(((shipment as any).revenue || 1000) * 0.1)}`,
      delay_reason: 'severe weather conditions',
      invoice_number: `INV-${shipment.shipment_number}`,
      amount_due: `${(shipment as any).revenue || 1000}`,
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      payment_link: `https://pay.happyrobot.ai/${shipment.shipment_number}`,
      weather_condition: 'Heavy snow and high winds',
      estimated_delay: '4-6 hours',
      alternative_action: 'Rerouting via southern corridor'
    }
    
    let result = text
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      result = result.replace(regex, value.toString())
    })
    
    return result
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Get selected shipment for variable replacement
      const selectedShipment = shipments.find(s => s.id === formData.shipmentId)
      
      // Replace variables in content and subject
      const processedContent = replaceTemplateVariables(formData.content, selectedShipment)
      const processedSubject = replaceTemplateVariables(formData.subject, selectedShipment)
      
      // Prepare message data
      const messageData = {
        type: composerType,
        recipient: formData.recipient,
        subject: composerType === 'email' ? processedSubject : undefined,
        content: processedContent,
        shipmentId: formData.shipmentId,
        priority: formData.priority,
        scheduledFor: formData.scheduleLater ? 
          new Date(`${formData.scheduledDate}T${formData.scheduledTime}`) : undefined,
        requestReceipt: formData.requestReceipt
      }
      
      // Send message
      onSend(messageData)
      
      // Reset form
      setFormData({
        recipient: '',
        subject: '',
        content: '',
        shipmentId: '',
        priority: 'medium',
        scheduleLater: false,
        scheduledDate: '',
        scheduledTime: '',
        requestReceipt: false
      })
      setSelectedTemplate('')
      
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Character count for SMS
  const smsCharCount = formData.content.length
  const smsLimit = 160

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Compose {composerType === 'email' ? 'Email' : 'SMS'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Type Toggle */}
          <div className="flex items-center space-x-4 mt-4">
            <button
              onClick={() => setComposerType('email')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                composerType === 'email' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              📧 Email
            </button>
            <button
              onClick={() => setComposerType('sms')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                composerType === 'sms' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              💬 SMS
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Templates */}
          <div className="w-1/3 border-r border-gray-200 p-4 overflow-y-auto">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Message Templates</h4>
            <div className="space-y-2">
              {templates
                .filter(template => template.type === composerType)
                .map(template => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateSelect(template.id)}
                    className={`w-full text-left p-3 rounded-md border transition-colors ${
                      selectedTemplate === template.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-sm text-gray-900">{template.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{template.useCase}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {template.variables.length} variables
                    </div>
                  </button>
                ))}
            </div>
            
            {/* Template Variables */}
            {selectedTemplate && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <h5 className="text-xs font-medium text-gray-700 mb-2">Available Variables:</h5>
                <div className="space-y-1">
                  {templates.find(t => t.id === selectedTemplate)?.variables.map(variable => (
                    <div key={variable} className="text-xs text-gray-600">
                      <code className="bg-gray-200 px-1 rounded">
                        {`{{${variable}}}`}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Right Panel - Form */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-4">
              {/* Recipient */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {composerType === 'email' ? 'To (Email)' : 'To (Phone Number)'}
                </label>
                <input
                  type={composerType === 'email' ? 'email' : 'tel'}
                  value={formData.recipient}
                  onChange={(e) => setFormData(prev => ({ ...prev, recipient: e.target.value }))}
                  placeholder={composerType === 'email' ? 'customer@company.com' : '+1-555-0123'}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Shipment Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Related Shipment
                </label>
                <select
                  value={formData.shipmentId}
                  onChange={(e) => setFormData(prev => ({ ...prev, shipmentId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select shipment...</option>
                  {shipments.map(shipment => (
                    <option key={shipment.id} value={shipment.id}>
                      {shipment.shipment_number} - {(shipment as any).customer_name || 'Customer'} - {shipment.status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject (Email only) */}
              {composerType === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Enter subject line..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              )}

              {/* Message Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={composerType === 'email' ? 12 : 6}
                  placeholder={composerType === 'email' ? 'Type your email message...' : 'Type your SMS message...'}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  required
                />
                {composerType === 'sms' && (
                  <div className={`text-xs mt-1 ${smsCharCount > smsLimit ? 'text-red-600' : 'text-gray-500'}`}>
                    Character count: {smsCharCount} / {smsLimit}
                    {smsCharCount > smsLimit && (
                      <span className="ml-2 font-medium">Message will be split into multiple SMS</span>
                    )}
                  </div>
                )}
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">🟢 Low Priority</option>
                  <option value="medium">🟡 Medium Priority</option>
                  <option value="high">🟠 High Priority</option>
                  <option value="urgent">🔴 Urgent</option>
                </select>
              </div>

              {/* Schedule Options */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.scheduleLater}
                      onChange={(e) => setFormData(prev => ({ ...prev, scheduleLater: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Schedule for later</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.requestReceipt}
                      onChange={(e) => setFormData(prev => ({ ...prev, requestReceipt: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Request delivery receipt</span>
                  </label>
                </div>
              </div>

              {/* Schedule Date/Time */}
              {formData.scheduleLater && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time
                    </label>
                    <input
                      type="time"
                      value={formData.scheduledTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {formData.scheduleLater ? (
                <span>⏰ Scheduled for {formData.scheduledDate} at {formData.scheduledTime}</span>
              ) : (
                <span>📤 Will be sent immediately</span>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isLoading || !formData.recipient || !formData.content || !formData.shipmentId}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span>Send {composerType === 'email' ? 'Email' : 'SMS'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}