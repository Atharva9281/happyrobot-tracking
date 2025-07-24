'use client'

import React from 'react'

interface MetricsCardProps {
  title: string
  value: string
  change: number
  changeType: 'increase' | 'decrease'
  icon: string
  color: string
}

const iconMap = {
  truck: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.596a1 1 0 01.707.293l2.414 2.414A1 1 0 0118 6.414V7M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2M8 7l4 4 4-4" />
    </svg>
  ),
  clock: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  dollar: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
    </svg>
  ),
  bot: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  users: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  ),
  chart: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-100 text-blue-600',
    text: 'text-blue-600',
    ring: 'ring-blue-200'
  },
  green: {
    bg: 'bg-green-50',
    icon: 'bg-green-100 text-green-600',
    text: 'text-green-600',
    ring: 'ring-green-200'
  },
  emerald: {
    bg: 'bg-emerald-50',
    icon: 'bg-emerald-100 text-emerald-600',
    text: 'text-emerald-600',
    ring: 'ring-emerald-200'
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'bg-purple-100 text-purple-600',
    text: 'text-purple-600',
    ring: 'ring-purple-200'
  },
  red: {
    bg: 'bg-red-50',
    icon: 'bg-red-100 text-red-600',
    text: 'text-red-600',
    ring: 'ring-red-200'
  },
  yellow: {
    bg: 'bg-yellow-50',
    icon: 'bg-yellow-100 text-yellow-600',
    text: 'text-yellow-600',
    ring: 'ring-yellow-200'
  },
  gray: {
    bg: 'bg-gray-50',
    icon: 'bg-gray-100 text-gray-600',
    text: 'text-gray-600',
    ring: 'ring-gray-200'
  }
}

export default function MetricsCard({
  title,
  value,
  change,
  changeType,
  icon,
  color
}: MetricsCardProps) {
  const colorScheme = colorMap[color as keyof typeof colorMap] || colorMap.gray
  const iconComponent = iconMap[icon as keyof typeof iconMap] || iconMap.chart
  
  const changeColor = change > 0 
    ? 'text-green-600' 
    : change < 0 
    ? 'text-red-600' 
    : 'text-gray-500'
    
  const changeIcon = change > 0 
    ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
        </svg>
      )
    : change < 0 
    ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7l9.2 9.2M17 7v10H7" />
        </svg>
      )
    : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      )

  return (
    <div className={`relative overflow-hidden rounded-xl bg-white shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02] ${colorScheme.ring} ring-1`}>
      {/* Background Pattern */}
      <div className={`absolute top-0 right-0 w-32 h-32 ${colorScheme.bg} rounded-full -translate-y-16 translate-x-16 opacity-60`}></div>
      
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${colorScheme.icon}`}>
            {iconComponent}
          </div>
          
          {/* Change Indicator */}
          {change !== 0 && (
            <div className={`flex items-center space-x-1 ${changeColor}`}>
              {changeIcon}
              <span className="text-sm font-medium">
                {Math.abs(change)}%
              </span>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
            {title}
          </h3>
          
          <div className="flex items-baseline space-x-2">
            <p className="text-3xl font-bold text-gray-900">
              {value}
            </p>
          </div>

          {/* Change Description */}
          {change !== 0 && (
            <p className="text-sm text-gray-500">
              {change > 0 ? '↗' : change < 0 ? '↘' : '→'} {Math.abs(change)}% from last period
            </p>
          )}
        </div>

        {/* Bottom Action Area */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">
              {changeType === 'increase' ? 'TRENDING UP' : changeType === 'decrease' ? 'TRENDING DOWN' : 'STABLE'}
            </span>
            
            {/* Performance Indicator */}
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((bar) => (
                <div
                  key={bar}
                  className={`w-1 h-4 rounded-full ${
                    (changeType === 'increase' && bar <= Math.min(5, Math.abs(change) / 10 + 1)) ||
                    (changeType === 'decrease' && bar <= Math.max(1, 5 - Math.abs(change) / 10))
                      ? colorScheme.text.replace('text-', 'bg-')
                      : 'bg-gray-200'
                  }`}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black opacity-0 hover:opacity-5 transition-opacity duration-200 pointer-events-none"></div>
    </div>
  )
}