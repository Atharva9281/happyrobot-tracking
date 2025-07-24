// 'use client'

// import React, { useMemo } from 'react'

// interface RevenueImpactProps {
//   shipments: any[]
// }

// interface DelayImpact {
//   shipmentId: string
//   shipmentNumber: string
//   originalRevenue: number
//   delayHours: number
//   revenueReduction: number
//   finalRevenue: number
//   impactPercentage: number
//   delayReason: string
//   customerName: string
// }

// export default function RevenueImpactCalculator({ shipments }: RevenueImpactProps) {
//   // Calculate delay impacts for shipments
//   const delayAnalysis = useMemo(() => {
//     const impacts: DelayImpact[] = []
//     let totalOriginalRevenue = 0
//     let totalRevenueReduction = 0
//     let totalDelayedShipments = 0

//     shipments.forEach(shipment => {
//       const revenue = shipment.revenue || 0
//       totalOriginalRevenue += revenue

//       // Simulate delays for demo purposes (30% of shipments have delays)
//       const hasDelay = Math.random() > 0.7 || shipment.status === 'delayed'
      
//       if (hasDelay) {
//         totalDelayedShipments++
        
//         // Calculate delay impact based on shipment characteristics
//         const delayReasons = [
//           'Traffic congestion',
//           'Weather conditions',
//           'Vehicle breakdown',
//           'Customer unavailable',
//           'Route optimization',
//           'Driver break requirement',
//           'Loading dock delays',
//           'Documentation issues'
//         ]
        
//         const delayReason = delayReasons[Math.floor(Math.random() * delayReasons.length)]
//         const delayHours = Math.floor(Math.random() * 8) + 1 // 1-8 hours delay
        
//         // Revenue impact calculation (industry standard penalties)
//         let revenueReduction = 0
//         let impactPercentage = 0
        
//         if (delayHours <= 2) {
//           // Minor delay: 2-5% penalty
//           impactPercentage = Math.random() * 3 + 2
//         } else if (delayHours <= 4) {
//           // Moderate delay: 5-10% penalty
//           impactPercentage = Math.random() * 5 + 5
//         } else if (delayHours <= 6) {
//           // Significant delay: 10-15% penalty
//           impactPercentage = Math.random() * 5 + 10
//         } else {
//           // Severe delay: 15-25% penalty
//           impactPercentage = Math.random() * 10 + 15
//         }
        
//         revenueReduction = revenue * (impactPercentage / 100)
//         totalRevenueReduction += revenueReduction
        
//         impacts.push({
//           shipmentId: shipment.id,
//           shipmentNumber: shipment.shipment_number,
//           originalRevenue: revenue,
//           delayHours,
//           revenueReduction,
//           finalRevenue: revenue - revenueReduction,
//           impactPercentage,
//           delayReason,
//           customerName: shipment.customer_name || 'Unknown Customer'
//         })
//       }
//     })

//     // Sort by impact amount (highest first)
//     impacts.sort((a, b) => b.revenueReduction - a.revenueReduction)

//     return {
//       impacts,
//       totalOriginalRevenue,
//       totalRevenueReduction,
//       totalDelayedShipments,
//       totalShipments: shipments.length,
//       averageImpactPerShipment: totalDelayedShipments > 0 ? totalRevenueReduction / totalDelayedShipments : 0,
//       onTimePercentage: ((shipments.length - totalDelayedShipments) / shipments.length) * 100
//     }
//   }, [shipments])

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(amount)
//   }

//   const formatPercentage = (percentage: number) => {
//     return `${percentage.toFixed(1)}%`
//   }

//   const getImpactSeverityColor = (percentage: number) => {
//     if (percentage < 5) return 'text-yellow-600 bg-yellow-50'
//     if (percentage < 10) return 'text-orange-600 bg-orange-50'
//     if (percentage < 15) return 'text-red-600 bg-red-50'
//     return 'text-red-800 bg-red-100'
//   }

//   const getDelayReasonIcon = (reason: string) => {
//     if (reason.includes('Traffic')) return '🚦'
//     if (reason.includes('Weather')) return '🌧️'
//     if (reason.includes('Vehicle')) return '🔧'
//     if (reason.includes('Customer')) return '👤'
//     if (reason.includes('Route')) return '🗺️'
//     if (reason.includes('Driver')) return '⏰'
//     if (reason.includes('Loading')) return '🏭'
//     if (reason.includes('Documentation')) return '📄'
//     return '⚠️'
//   }

//   return (
//     <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[600px] flex flex-col">
//       {/* Header */}
//       <div className="p-4 border-b border-gray-200 flex-shrink-0">
//         <div className="flex items-center justify-between mb-4">
//           <div>
//             <h3 className="text-lg font-semibold text-gray-900">Revenue Impact Analysis</h3>
//             <p className="text-sm text-gray-600">Financial impact of shipment delays on revenue</p>
//           </div>
          
//           <div className="flex items-center space-x-2">
//             <div className="flex items-center space-x-1 text-sm text-gray-500">
//               <div className="w-2 h-2 bg-red-500 rounded-full"></div>
//               <span>Live Calculations</span>
//             </div>
//           </div>
//         </div>

//         {/* Revenue Impact Summary Cards */}
//         <div className="grid grid-cols-4 gap-4 mb-4">
//           <div className="bg-gray-50 p-3 rounded-lg">
//             <div className="text-2xl font-bold text-gray-900">
//               {formatCurrency(delayAnalysis.totalOriginalRevenue)}
//             </div>
//             <div className="text-xs text-gray-600">Total Revenue</div>
//           </div>
          
//           <div className="bg-red-50 p-3 rounded-lg">
//             <div className="text-2xl font-bold text-red-600">
//               -{formatCurrency(delayAnalysis.totalRevenueReduction)}
//             </div>
//             <div className="text-xs text-gray-600">Lost to Delays</div>
//           </div>
          
//           <div className="bg-green-50 p-3 rounded-lg">
//             <div className="text-2xl font-bold text-green-600">
//               {formatPercentage(delayAnalysis.onTimePercentage)}
//             </div>
//             <div className="text-xs text-gray-600">On-Time Rate</div>
//           </div>
          
//           <div className="bg-blue-50 p-3 rounded-lg">
//             <div className="text-2xl font-bold text-blue-600">
//               {formatCurrency(delayAnalysis.averageImpactPerShipment)}
//             </div>
//             <div className="text-xs text-gray-600">Avg Impact/Delay</div>
//           </div>
//         </div>

//         {/* Quick Stats */}
//         <div className="flex items-center justify-between text-sm">
//           <div className="flex items-center space-x-4">
//             <div>
//               <span className="font-medium text-gray-900">{delayAnalysis.totalDelayedShipments}</span>
//               <span className="text-gray-500"> delayed shipments</span>
//             </div>
//             <div>
//               <span className="font-medium text-red-600">{formatPercentage((delayAnalysis.totalRevenueReduction / delayAnalysis.totalOriginalRevenue) * 100)}</span>
//               <span className="text-gray-500"> revenue impact</span>
//             </div>
//             <div>
//               <span className="font-medium text-orange-600">{formatCurrency(delayAnalysis.totalRevenueReduction / 365)}</span>
//               <span className="text-gray-500"> daily loss rate</span>
//             </div>
//           </div>

//           <div className="text-xs text-gray-500">
//             Updated: {new Date().toLocaleTimeString()}
//           </div>
//         </div>
//       </div>

//       {/* Delay Impact List */}
//       <div className="flex-1 overflow-y-auto">
//         {delayAnalysis.impacts.length === 0 ? (
//           <div className="p-6 text-center">
//             <svg className="w-12 h-12 text-green-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//             </svg>
//             <h3 className="text-lg font-medium text-gray-900 mb-2">No Revenue Impact</h3>
//             <p className="text-gray-500">All shipments are on time! No revenue loss from delays.</p>
//           </div>
//         ) : (
//           <div className="divide-y divide-gray-200">
//             {delayAnalysis.impacts.map((impact) => (
//               <div 
//                 key={impact.shipmentId} 
//                 className="p-4 hover:bg-gray-50 transition-colors"
//               >
//                 <div className="flex items-start justify-between">
//                   <div className="flex-1">
//                     <div className="flex items-center space-x-3 mb-2">
//                       <h4 className="text-sm font-medium text-gray-900">
//                         {impact.shipmentNumber}
//                       </h4>
//                       <span className="text-sm text-gray-600">
//                         {impact.customerName}
//                       </span>
//                       <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getImpactSeverityColor(impact.impactPercentage)}`}>
//                         -{formatPercentage(impact.impactPercentage)} impact
//                       </span>
//                     </div>
                    
//                     <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
//                       <div className="flex items-center space-x-1">
//                         <span>{getDelayReasonIcon(impact.delayReason)}</span>
//                         <span>{impact.delayReason}</span>
//                       </div>
//                       <div>
//                         <span className="font-medium">{impact.delayHours}h</span> delay
//                       </div>
//                     </div>
                    
//                     <div className="flex items-center space-x-6 text-sm">
//                       <div>
//                         <span className="text-gray-500">Original: </span>
//                         <span className="font-medium text-gray-900">{formatCurrency(impact.originalRevenue)}</span>
//                       </div>
//                       <div>
//                         <span className="text-gray-500">Lost: </span>
//                         <span className="font-medium text-red-600">-{formatCurrency(impact.revenueReduction)}</span>
//                       </div>
//                       <div>
//                         <span className="text-gray-500">Final: </span>
//                         <span className="font-medium text-gray-900">{formatCurrency(impact.finalRevenue)}</span>
//                       </div>
//                     </div>
//                   </div>
                  
//                   <div className="text-right">
//                     <div className="text-lg font-bold text-red-600">
//                       -{formatCurrency(impact.revenueReduction)}
//                     </div>
//                     <div className="text-xs text-gray-500">
//                       revenue loss
//                     </div>
//                   </div>
//                 </div>
                
//                 {/* Revenue Impact Visualization */}
//                 <div className="mt-3">
//                   <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
//                     <span>Revenue Impact</span>
//                     <span>{formatPercentage(impact.impactPercentage)} reduction</span>
//                   </div>
//                   <div className="w-full bg-gray-200 rounded-full h-2">
//                     <div 
//                       className="bg-red-500 h-2 rounded-full"
//                       style={{ width: `${Math.min(100, impact.impactPercentage)}%` }}
//                     ></div>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Footer with Potential Savings */}
//       <div className="p-4 border-t border-gray-200 bg-blue-50">
//         <div className="flex items-center justify-between">
//           <div>
//             <h4 className="text-sm font-medium text-blue-900">AI Prevention Potential</h4>
//             <p className="text-xs text-blue-700">
//               HappyRobot AI could prevent {formatPercentage(70)} of these delays through proactive communication
//             </p>
//           </div>
//           <div className="text-right">
//             <div className="text-lg font-bold text-blue-600">
//               +{formatCurrency(delayAnalysis.totalRevenueReduction * 0.7)}
//             </div>
//             <div className="text-xs text-blue-700">potential savings</div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }