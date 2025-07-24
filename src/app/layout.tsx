import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HappyRobot Tracking | Real-time Shipment Tracking',
  description: 'Professional shipment tracking dashboard with real-time updates, AI-powered communications, and comprehensive logistics management.',
  keywords: 'shipment tracking, logistics, AI, real-time, freight, transportation',
  authors: [{ name: 'HappyRobot Team' }],
  openGraph: {
    title: 'HappyRobot Tracking',
    description: 'Real-time shipment tracking dashboard',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div id="root">{children}</div>
      </body>
    </html>
  )
}