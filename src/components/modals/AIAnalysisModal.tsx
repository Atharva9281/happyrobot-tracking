'use client'

import React, { useState, useEffect } from 'react'
import { ApprovalItem } from '@/types/approval'

interface AIAnalysisModalProps {
  isOpen: boolean
  shipment: any | null
  openaiApiKey: string
  onClose: () => void
  onAnalysisComplete: (recommendations: ApprovalItem[]) => void
}

export default function AIAnalysisModal({ 
  isOpen, 
  shipment, 
  openaiApiKey,
  onClose, 
  onAnalysisComplete 
}: AIAnalysisModalProps) {
  const [processing, setProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [analysisResults, setAnalysisResults] = useState<ApprovalItem[]>([])
  const [error, setError] = useState<string | null>(null)

  const aiSteps = [
    "🔍 Analyzing shipment data and route details...",
    "📊 Evaluating costs, timing, and performance metrics...",
    "🤖 Consulting OpenAI for optimization opportunities...",
    "💡 Generating intelligent recommendations...",
    "✅ Analysis complete - preparing approval items..."
  ]

  const analyzeWithOpenAI = async (shipmentData: any): Promise<ApprovalItem[]> => {
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not available. Please configure NEXT_PUBLIC_OPENAI_API_KEY.')
    }

    // Build comprehensive context for OpenAI
    const shipmentContext = {
      shipment_number: shipmentData.shipment_number,
      origin: shipmentData.origin_address,
      destination: shipmentData.dest_address,
      distance_km: shipmentData.distance_km || 0,
      status: shipmentData.status,
      progress: shipmentData.progress_percentage || 0,
      revenue: shipmentData.revenue || 0,
      carrier: shipmentData.carrier || 'Unknown',
      priority: shipmentData.priority || 'normal',
      customer: shipmentData.customer_name || 'Customer',
      special_requirements: {
        temperature_controlled: shipmentData.temperature_controlled || false,
        hazmat: shipmentData.hazmat || false,
        fragile: shipmentData.fragile || false
      },
      eta: shipmentData.eta,
      created_at: shipmentData.created_at
    }

    const prompt = `
You are an expert logistics analyst. Analyze this shipment and provide specific, actionable recommendations.

SHIPMENT DATA:
${JSON.stringify(shipmentContext, null, 2)}

ANALYSIS REQUIREMENTS:
1. Rate Optimization: If revenue > $1000, analyze if rate can be optimized
2. Delay Risk: Assess potential delays and recommend proactive credits
3. Route Efficiency: Check for route optimization opportunities  
4. Carrier Performance: Evaluate if carrier switch is beneficial
5. Priority Handling: Determine if special handling is needed

For EACH recommendation, provide:
- Type: rate_approval, delay_credit, route_change, carrier_switch, or priority_escalation
- Current Value & Proposed Value
- Confidence Score (70-95%)
- Risk Level (low/medium/high)
- Detailed Reasoning
- Business Impact
- Urgency Level

RESPOND IN THIS EXACT JSON FORMAT:
{
  "recommendations": [
    {
      "type": "rate_approval",
      "title": "Rate Optimization Opportunity",
      "description": "Brief description",
      "current_value": "Current state",
      "proposed_value": "Proposed change", 
      "confidence": 85,
      "risk_level": "low",
      "reasoning": "Detailed explanation of why this recommendation makes sense",
      "impact": "Business impact description",
      "urgency": "medium",
      "estimated_savings": 150
    }
  ]
}

ONLY return recommendations that are genuinely valuable based on the data. If no meaningful optimizations are found, return empty recommendations array.
`

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a logistics optimization expert. Analyze shipment data and provide actionable recommendations in the exact JSON format requested. Only suggest realistic optimizations based on the actual data provided.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1500,
          temperature: 0.3
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`OpenAI API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      const aiResponse = data.choices[0]?.message?.content

      if (!aiResponse) {
        throw new Error('No response from OpenAI')
      }

      // Parse OpenAI JSON response
      let parsedResponse
      try {
        // Extract JSON from response (in case there's extra text)
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          throw new Error('No valid JSON found in OpenAI response')
        }
        parsedResponse = JSON.parse(jsonMatch[0])
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', aiResponse)
        throw new Error('Invalid JSON response from OpenAI')
      }

      // Convert OpenAI recommendations to ApprovalItem format
      if (!parsedResponse.recommendations || !Array.isArray(parsedResponse.recommendations)) {
        console.log('OpenAI found no recommendations for this shipment')
        return []
      }

      const approvalItems: ApprovalItem[] = parsedResponse.recommendations.map((rec: any, index: number) => ({
        id: `ai-${Date.now()}-${index}`,
        type: rec.type,
        shipmentId: shipmentData.id,
        shipmentNumber: shipmentData.shipment_number,
        title: rec.title,
        description: rec.description,
        details: {
          currentValue: rec.current_value,
          proposedValue: rec.proposed_value,
          reasoning: rec.reasoning,
          impact: rec.impact,
          riskLevel: rec.risk_level,
          confidence: rec.confidence,
          estimatedSavings: rec.estimated_savings || 0,
          urgency: rec.urgency
        },
        aiRecommendation: rec.confidence >= 80 ? 'approve' : 'review',
        submittedAt: new Date(),
        status: 'pending',
        submittedBy: 'ai_system'
      }))

      console.log(`OpenAI generated ${approvalItems.length} recommendations for ${shipmentData.shipment_number}`)
      return approvalItems

    } catch (error) {
      console.error('OpenAI Analysis Error:', error)
      throw error
    }
  }

  const handleAnalyze = async () => {
    if (!shipment) return

    setProcessing(true)
    setCurrentStep(0)
    setError(null)
    setAnalysisResults([])

    try {
      // Step through the analysis process
      for (let i = 0; i < aiSteps.length; i++) {
        setCurrentStep(i)
        
        if (i === 2) {
          // Step 3: Call OpenAI
          await new Promise(resolve => setTimeout(resolve, 1000))
          const recommendations = await analyzeWithOpenAI(shipment)
          setAnalysisResults(recommendations)
        } else {
          // Other steps: simulate processing time
          await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400))
        }
      }

      await new Promise(resolve => setTimeout(resolve, 500))
      setProcessing(false)

    } catch (error) {
      console.error('Analysis failed:', error)
      setError(error instanceof Error ? error.message : 'Analysis failed')
      setProcessing(false)
    }
  }

  const handleComplete = () => {
    if (analysisResults.length > 0) {
      onAnalysisComplete(analysisResults)
      console.log(`✅ AI Analysis complete: ${analysisResults.length} recommendations generated`)
    }
    onClose()
  }

  useEffect(() => {
    if (isOpen && shipment && openaiApiKey) {
      handleAnalyze()
    } else if (isOpen && !openaiApiKey) {
      setError('OpenAI API key not configured. Please set NEXT_PUBLIC_OPENAI_API_KEY environment variable.')
    }
  }, [isOpen, shipment, openaiApiKey])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">🤖 AI Analysis</h2>
              <p className="text-sm text-gray-600">
                {shipment ? `Analyzing ${shipment.shipment_number} with OpenAI GPT-4` : 'AI Analysis'}
              </p>
            </div>
            <button 
              onClick={onClose} 
              disabled={processing && !error}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Analysis Failed</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => {
                    setError(null)
                    handleAnalyze()
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm"
                >
                  Retry Analysis
                </button>
              </div>
            </div>
          )}

          {processing && !error && (
            <div className="text-center py-8">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Analysis in Progress</h3>
                <p className="text-gray-600 mb-6">Using OpenAI GPT-4 for intelligent logistics analysis...</p>
              </div>

              {/* Analysis Steps */}
              <div className="space-y-3 max-w-md mx-auto">
                {aiSteps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                      index <= currentStep 
                        ? index === currentStep 
                          ? 'bg-blue-100 border border-blue-200' 
                          : 'bg-green-50 border border-green-200'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      index < currentStep 
                        ? 'bg-green-500' 
                        : index === currentStep 
                        ? 'bg-blue-500' 
                        : 'bg-gray-300'
                    }`}>
                      {index < currentStep ? (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : index === currentStep ? (
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      ) : (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className={`text-sm ${index <= currentStep ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!processing && !error && analysisResults.length > 0 && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Analysis Complete</h3>
                    <p className="text-sm text-green-700 mt-1">
                      OpenAI found {analysisResults.length} optimization opportunities for {shipment?.shipment_number}
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview of recommendations */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900">Recommendations Preview:</h4>
                {analysisResults.map((item, index) => (
                  <div key={item.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-sm font-medium text-gray-900">{item.title}</h5>
                        <p className="text-xs text-gray-600">{item.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">AI Confidence</div>
                        <div className="text-sm font-medium text-blue-600">{item.details.confidence}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center pt-4">
                <button
                  onClick={handleComplete}
                  className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add {analysisResults.length} Recommendations to Approval Queue →
                </button>
              </div>
            </div>
          )}

          {!processing && !error && analysisResults.length === 0 && (
            <div className="text-center py-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex flex-col items-center">
                  <svg className="w-12 h-12 text-blue-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Analysis Complete</h3>
                  <p className="text-gray-600 mb-4">
                    OpenAI analyzed {shipment?.shipment_number} and found no optimization opportunities at this time.
                  </p>
                  <p className="text-sm text-gray-500">
                    The shipment appears to be well-optimized with current settings.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Only show when not processing */}
        {!processing && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {error ? (
                  <span className="text-red-600">⚠️ Analysis failed - check your OpenAI API key</span>
                ) : analysisResults.length > 0 ? (
                  <span>✅ Ready to add {analysisResults.length} recommendations</span>
                ) : (
                  <span>ℹ️ No optimizations found for this shipment</span>
                )}
              </div>
              
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}