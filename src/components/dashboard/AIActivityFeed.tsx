// 'use client'

// import React, { useState, useEffect } from 'react'

// interface AIActivityFeedProps {
//   activityData: {
//     total: number
//     calls: number
//     emails: number
//     notifications: number
//   }
//   shipments: any[]
//   timeframe: string
// }

// interface AIActivity {
//   id: string
//   timestamp: string
//   type: 'call' | 'email' | 'notification' | 'automation' | 'analysis'
//   action: string
//   shipmentId?: string
//   shipmentNumber?: string
//   status: 'completed' | 'in_progress' | 'pending'
//   priority: 'high' | 'normal' | 'low'
//   result?: string
// }

// export default function AIActivityFeed({ 
//   activityData, 
//   shipments, 
//   timeframe 
// }: AIActivityFeedProps) {
//   const [activities, setActivities] = useState<AIActivity[]>([])
//   const [isLive, setIsLive] = useState(false) // Default to false - no auto generation
//   const [filter, setFilter] = useState<'all' | 'call' | 'email' | 'notification'>('all')

//   // Generate realistic AI activities based on shipment data (ONLY ONCE)
//   useEffect(() => {
//     generateStaticActivities()
//   }, [shipments]) // Remove isLive dependency

//   // REMOVED: Auto-generation interval
//   // No more setInterval that creates new activities every 15 seconds

//   const generateStaticActivities = () => {
//     const newActivities: AIActivity[] = []
//     const now = new Date()

//     // Generate activities based on shipment statuses (STATIC - not changing)
//     shipments.slice(0, 15).forEach((shipment, index) => {
//       const activityTime = new Date(now.getTime() - (index * 2 * 60 * 1000)) // 2 min intervals

//       // Different activities based on shipment status
//       switch (shipment.status) {
//         case 'delayed':
//           newActivities.push({
//             id: `ai-${shipment.id}-delay`,
//             timestamp: activityTime.toISOString(),
//             type: 'call',
//             action: `AI called driver for ${shipment.shipment_number} - delay confirmed`,
//             shipmentId: shipment.id,
//             shipmentNumber: shipment.shipment_number,
//             status: 'completed',
//             priority: 'high',
//             result: 'Driver confirmed 45min delay due to traffic'
//           })
//           break

//         case 'in_transit':
//           newActivities.push({
//             id: `ai-${shipment.id}-check`,
//             timestamp: activityTime.toISOString(),
//             type: 'automation',
//             action: `Automated status update for ${shipment.shipment_number}`,
//             shipmentId: shipment.id,
//             shipmentNumber: shipment.shipment_number,
//             status: 'completed',
//             priority: 'normal',
//             result: 'GPS location updated, on schedule'
//           })
//           break

//         case 'pickup':
//           newActivities.push({
//             id: `ai-${shipment.id}-pickup`,
//             timestamp: activityTime.toISOString(),
//             type: 'email',
//             action: `Customer notified of pickup for ${shipment.shipment_number}`,
//             shipmentId: shipment.id,
//             shipmentNumber: shipment.shipment_number,
//             status: 'completed',
//             priority: 'normal',
//             result: 'Pickup confirmation sent to customer'
//           })
//           break

//         case 'delivery':
//           newActivities.push({
//             id: `ai-${shipment.id}-delivery`,
//             timestamp: activityTime.toISOString(),
//             type: 'call',
//             action: `AI coordinating delivery for ${shipment.shipment_number}`,
//             shipmentId: shipment.id,
//             shipmentNumber: shipment.shipment_number,
//             status: 'in_progress',
//             priority: 'high',
//             result: 'Contacting consignee for delivery window'
//           })
//           break

//         default:
//           newActivities.push({
//             id: `ai-${shipment.id}-monitor`,
//             timestamp: activityTime.toISOString(),
//             type: 'analysis',
//             action: `AI monitoring ${shipment.shipment_number} for anomalies`,
//             shipmentId: shipment.id,
//             shipmentNumber: shipment.shipment_number,
//             status: 'completed',
//             priority: 'low',
//             result: 'Route optimization completed'
//           })
//       }
//     })

//     // Add some general AI activities (STATIC)
//     const generalActivities: AIActivity[] = [
//       {
//         id: 'ai-rate-nego-1',
//         timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
//         type: 'automation',
//         action: 'AI negotiated rate for new lane: Austin → Denver',
//         status: 'completed',
//         priority: 'normal',
//         result: 'Secured $2,450 rate (8% above market)'
//       },
//       {
//         id: 'ai-capacity-1',
//         timestamp: new Date(now.getTime() - 8 * 60 * 1000).toISOString(),
//         type: 'analysis',
//         action: 'AI analyzed capacity constraints for Chicago hub',
//         status: 'completed',
//         priority: 'high',
//         result: 'Recommended 3 additional carriers for peak hours'
//       },
//       {
//         id: 'ai-weather-1',
//         timestamp: new Date(now.getTime() - 12 * 60 * 1000).toISOString(),
//         type: 'notification',
//         action: 'AI sent weather alert for Denver routes',
//         status: 'completed',
//         priority: 'high',
//         result: 'Proactive rerouting initiated for 6 shipments'
//       },
//       {
//         id: 'ai-cost-analysis',
//         timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
//         type: 'analysis',
//         action: 'AI completed fuel cost optimization analysis',
//         status: 'completed',
//         priority: 'normal',
//         result: 'Identified 12% potential savings through route consolidation'
//       },
//       {
//         id: 'ai-carrier-rating',
//         timestamp: new Date(now.getTime() - 18 * 60 * 1000).toISOString(),
//         type: 'automation',
//         action: 'AI updated carrier performance ratings',
//         status: 'completed',
//         priority: 'low',
//         result: 'Processed 47 carrier scorecards automatically'
//       }
//     ]

//     const allActivities = [...newActivities, ...generalActivities]
//       .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
//       .slice(0, 20)

//     setActivities(allActivities)
//   }

//   // Manual activity generation (only when button is clicked)
//   const addNewActivityManually = () => {
//     if (shipments.length === 0) return

//     const randomShipment = shipments[Math.floor(Math.random() * shipments.length)]
//     const activityTypes = ['call', 'email', 'notification', 'automation', 'analysis'] as const
//     const randomType = activityTypes[Math.floor(Math.random() * activityTypes.length)]
    
//     const actions = {
//       call: [
//         `AI called driver for ${randomShipment.shipment_number} - ETA confirmation`,
//         `AI contacted customer about ${randomShipment.shipment_number} delivery`,
//         `AI negotiated detention fee for ${randomShipment.shipment_number}`,
//         `AI coordinated dock appointment for ${randomShipment.shipment_number}`
//       ],
//       email: [
//         `Customer notified of delay for ${randomShipment.shipment_number}`,
//         `Driver sent route optimization for ${randomShipment.shipment_number}`,
//         `Carrier updated on requirements for ${randomShipment.shipment_number}`,
//         `BOL sent for completed delivery ${randomShipment.shipment_number}`
//       ],
//       notification: [
//         `Geofence alert triggered for ${randomShipment.shipment_number}`,
//         `Temperature variance detected on ${randomShipment.shipment_number}`,
//         `Route deviation alert for ${randomShipment.shipment_number}`,
//         `Delivery window notification for ${randomShipment.shipment_number}`
//       ],
//       automation: [
//         `Automated status update for ${randomShipment.shipment_number}`,
//         `GPS tracking activated for ${randomShipment.shipment_number}`,
//         `Rate confirmation sent for ${randomShipment.shipment_number}`,
//         `Invoice processing completed for ${randomShipment.shipment_number}`
//       ],
//       analysis: [
//         `AI analyzed route efficiency for ${randomShipment.shipment_number}`,
//         `Performance metrics calculated for ${randomShipment.shipment_number}`,
//         `Carrier rating updated after ${randomShipment.shipment_number}`,
//         `Cost analysis completed for ${randomShipment.shipment_number}`
//       ]
//     }

//     const newActivity: AIActivity = {
//       id: `ai-manual-${Date.now()}`,
//       timestamp: new Date().toISOString(),
//       type: randomType,
//       action: actions[randomType][Math.floor(Math.random() * actions[randomType].length)],
//       shipmentId: randomShipment.id,
//       shipmentNumber: randomShipment.shipment_number,
//       status: Math.random() > 0.1 ? 'completed' : 'in_progress',
//       priority: Math.random() > 0.7 ? 'high' : 'normal',
//       result: 'Action completed successfully'
//     }

//     setActivities(prev => [newActivity, ...prev.slice(0, 19)])
//   }

//   const filteredActivities = activities.filter(activity => 
//     filter === 'all' || activity.type === filter
//   )

//   const getActivityIcon = (type: string, status: string) => {
//     const iconClass = status === 'in_progress' ? 'animate-pulse' : ''
    
//     switch (type) {
//       case 'call':
//         return (
//           <div className={`w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center ${iconClass}`}>
//             <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
//             </svg>
//           </div>
//         )
//       case 'email':
//         return (
//           <div className={`w-8 h-8 bg-green-100 rounded-full flex items-center justify-center ${iconClass}`}>
//             <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
//             </svg>
//           </div>
//         )
//       case 'notification':
//         return (
//           <div className={`w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center ${iconClass}`}>
//             <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 17H4l5 5v-5zM12 3v18" />
//             </svg>
//           </div>
//         )
//       case 'automation':
//         return (
//           <div className={`w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center ${iconClass}`}>
//             <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
//             </svg>
//           </div>
//         )
//       default:
//         return (
//           <div className={`w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center ${iconClass}`}>
//             <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
//             </svg>
//           </div>
//         )
//     }
//   }

//   const formatTimeAgo = (timestamp: string) => {
//     const now = new Date()
//     const time = new Date(timestamp)
//     const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
//     if (diffInMinutes < 1) return 'Just now'
//     if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
//     const diffInHours = Math.floor(diffInMinutes / 60)
//     if (diffInHours < 24) return `${diffInHours}h ago`
    
//     const diffInDays = Math.floor(diffInHours / 24)
//     return `${diffInDays}d ago`
//   }

//   return (
//     <div className="bg-white rounded-lg shadow-sm border border-gray-200">
//       {/* Header */}
//       <div className="p-4 border-b border-gray-200">
//         <div className="flex items-center justify-between mb-4">
//           <h3 className="text-lg font-semibold text-gray-900">AI Activity Feed</h3>
          
//           <div className="flex items-center space-x-2">
//             {/* Manual activity generator button */}
//             <button
//               onClick={addNewActivityManually}
//               className="flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
//             >
//               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//               </svg>
//               <span>Simulate Activity</span>
//             </button>
            
//             {/* Status indicator (now just shows static status) */}
//             <div className="flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700">
//               <div className="w-2 h-2 rounded-full bg-green-500"></div>
//               <span>AI Online</span>
//             </div>
//           </div>
//         </div>

//         {/* Activity Summary */}
//         <div className="grid grid-cols-2 gap-4 mb-4">
//           <div className="text-center p-3 bg-blue-50 rounded-lg">
//             <div className="text-2xl font-bold text-blue-600">{activityData.calls}</div>
//             <div className="text-xs text-blue-600 font-medium">AI Calls</div>
//           </div>
//           <div className="text-center p-3 bg-green-50 rounded-lg">
//             <div className="text-2xl font-bold text-green-600">{activityData.emails}</div>
//             <div className="text-xs text-green-600 font-medium">Emails Sent</div>
//           </div>
//         </div>

//         {/* Filter Buttons */}
//         <div className="flex space-x-2 overflow-x-auto">
//           {(['all', 'call', 'email', 'notification'] as const).map((filterType) => (
//             <button
//               key={filterType}
//               onClick={() => setFilter(filterType)}
//               className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
//                 filter === filterType
//                   ? 'bg-blue-100 text-blue-700'
//                   : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//               }`}
//             >
//               {filterType === 'all' ? 'All' : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Activity List */}
//       <div className="max-h-96 overflow-y-auto">
//         {filteredActivities.length === 0 ? (
//           <div className="p-6 text-center text-gray-500">
//             <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
//             </svg>
//             <p className="text-sm">No AI activities yet</p>
//             <button
//               onClick={addNewActivityManually}
//               className="mt-2 text-blue-600 text-sm hover:text-blue-800"
//             >
//               Simulate an activity
//             </button>
//           </div>
//         ) : (
//           <div className="divide-y divide-gray-100">
//             {filteredActivities.map((activity, index) => (
//               <div 
//                 key={activity.id} 
//                 className="p-4 hover:bg-gray-50 transition-colors"
//               >
//                 <div className="flex space-x-3">
//                   {getActivityIcon(activity.type, activity.status)}
                  
//                   <div className="flex-1 min-w-0">
//                     <div className="flex items-center justify-between mb-1">
//                       <p className="text-sm font-medium text-gray-900 truncate">
//                         {activity.action}
//                       </p>
//                       <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
//                         {formatTimeAgo(activity.timestamp)}
//                       </span>
//                     </div>
                    
//                     {activity.result && (
//                       <p className="text-xs text-gray-600 mb-2">
//                         {activity.result}
//                       </p>
//                     )}
                    
//                     <div className="flex items-center space-x-2">
//                       <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
//                         activity.status === 'completed' 
//                           ? 'bg-green-100 text-green-800' 
//                           : activity.status === 'in_progress'
//                           ? 'bg-yellow-100 text-yellow-800'
//                           : 'bg-gray-100 text-gray-800'
//                       }`}>
//                         {activity.status.replace('_', ' ')}
//                       </span>
                      
//                       {activity.priority === 'high' && (
//                         <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
//                           High Priority
//                         </span>
//                       )}
                      
//                       {activity.shipmentNumber && (
//                         <span className="text-xs text-blue-600 font-mono">
//                           {activity.shipmentNumber}
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Footer */}
//       <div className="p-3 border-t border-gray-200 bg-gray-50">
//         <div className="flex items-center justify-between text-xs text-gray-500">
//           <span>Showing {filteredActivities.length} activities</span>
//           <span className="flex items-center space-x-1">
//             <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
//               <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//             </svg>
//             <span>AI Workers Online</span>s
//           </span>
//         </div>
//       </div>
//     </div>
//   )
// }