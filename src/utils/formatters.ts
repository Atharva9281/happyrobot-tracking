// Date formatting utilities
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return formatDate(dateString)
}

// Distance formatting
export const formatDistance = (distanceKm: number | null): string => {
  if (!distanceKm) return 'Unknown'
  
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`
  }
  
  return `${Math.round(distanceKm)} km`
}

export const formatDistanceMiles = (distanceKm: number | null): string => {
  if (!distanceKm) return 'Unknown'
  
  const miles = distanceKm * 0.621371
  return `${Math.round(miles)} mi`
}

// Duration formatting
export const formatDuration = (durationHours: number | null): string => {
  if (!durationHours) return 'Unknown'
  
  if (durationHours < 1) {
    return `${Math.round(durationHours * 60)}min`
  }
  
  const hours = Math.floor(durationHours)
  const minutes = Math.round((durationHours - hours) * 60)
  
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

// Progress formatting
export const formatProgress = (percentage: number): string => {
  return `${Math.round(percentage)}%`
}

// Status formatting
export const formatStatus = (status: string): string => {
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

// Address formatting
export const formatAddress = (address: string): string => {
  // Remove unnecessary parts and clean up
  return address
    .replace(/, USA$/, '')
    .replace(/United States$/, '')
    .trim()
}

export const getShortAddress = (address: string): string => {
  const parts = address.split(',')
  if (parts.length >= 2) {
    return `${parts[0].trim()}, ${parts[1].trim()}`
  }
  return address
}

// Number formatting
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num)
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

// Percentage formatting
export const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return '0%'
  const percentage = (value / total) * 100
  return `${Math.round(percentage)}%`
}