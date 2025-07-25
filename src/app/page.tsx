'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import LoginModal from '@/components/auth/LoginModal'
import UserProfile from '@/components/auth/UserProfile'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close modal when user signs in
  useEffect(() => {
    if (user) {
      setShowLoginModal(false)
    }
  }, [user])

  // Navigate to dashboard
  const goToDashboard = () => {
    router.push('/dashboard')
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Authentication */}
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-slate-800">
              HappyRobot Tracking
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <UserProfile />
                <button
                  onClick={goToDashboard}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Dashboard
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            HappyRobot Tracking
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Real-time shipment tracking dashboard with AI-powered logistics management
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Real-time Tracking Card - CLICKABLE */}
          <div 
            onClick={user ? goToDashboard : () => setShowLoginModal(true)}
            className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all duration-200"
          >
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Real-time Tracking</h3>
            <p className="text-slate-600 mb-3">
              Track shipments in real-time with live map updates and position monitoring.
            </p>
            {user && (
              <div className="flex items-center text-blue-600 text-sm font-medium">
                <span>Open Dashboard</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}
          </div>

          {/* AI Communications Card */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">AI Communications</h3>
            <p className="text-slate-600">
              Automated check calls, status updates, and intelligent logistics coordination.
            </p>
          </div>

          {/* Analytics Dashboard Card */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="w-12 h-12 bg-violet-500 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Analytics Dashboard</h3>
            <p className="text-slate-600">
              Comprehensive insights, performance metrics, and operational intelligence.
            </p>
          </div>
        </div>

        <div className="text-center mt-12">
          {user ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 max-w-md mx-auto">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                🎉 Welcome, {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}!
              </h3>
              <p className="text-green-700 mb-6">
                Authentication successful! You're now ready to access the full tracking dashboard with real-time shipment monitoring.
              </p>
              
              {/* BIG ENTER DASHBOARD BUTTON */}
              <button
                onClick={goToDashboard}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium text-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-transform"
              >
                🚛 Enter Dashboard →
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowLoginModal(true)}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium text-lg"
            >
              Get Started
            </button>
          )}
        </div>

        <div className="mt-16 text-center">
          <p className="text-slate-400 text-sm">
            🚀 Professional shipment tracking platform ready for enterprise use
          </p>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </main>
  )
}