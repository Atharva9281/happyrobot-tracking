// src/types/approval.ts

export interface ApprovalItem {
  id: string
  type: 'rate_approval' | 'delay_credit' | 'route_change' | 'carrier_switch' | 'priority_escalation'
  shipmentId: string
  shipmentNumber: string
  title: string
  description: string
  details: {
    currentValue?: string | number
    proposedValue?: string | number
    reasoning: string
    impact: string
    riskLevel: 'low' | 'medium' | 'high'
    confidence: number
    estimatedSavings?: number
    urgency: 'low' | 'medium' | 'high' | 'critical'
  }
  aiRecommendation: 'approve' | 'reject' | 'review'
  submittedAt: Date
  status: 'pending' | 'approved' | 'rejected' | 'auto_approved'
  submittedBy: 'ai_system' | 'customer' | 'driver' | 'carrier'
}