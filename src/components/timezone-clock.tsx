'use client'
import { useState, useEffect } from 'react'
import { Clock, Globe, Settings } from 'lucide-react'

interface TimezoneClockProps {
  className?: string
  showSeconds?: boolean
  showTimezone?: boolean
  compact?: boolean
}

interface TimezoneInfo {
  name: string
  offset: number
  display: string
  abbreviation: string
}

const COMMON_TIMEZONES: TimezoneInfo[] = [
  { name: 'UTC', offset: 0, display: 'UTC (Coordinated Universal Time)', abbreviation: 'UTC' },
  { name: 'EST', offset: -5, display: 'EST (Eastern Standard Time)', abbreviation: 'EST' },
  { name: 'EDT', offset: -4, display: 'EDT (Eastern Daylight Time)', abbreviation: 'EDT' },
  { name: 'CST', offset: -6, display: 'CST (Central Standard Time)', abbreviation: 'CST' },
  { name: 'CDT', offset: -5, display: 'CDT (Central Daylight Time)', abbreviation: 'CDT' },
  { name: 'MST', offset: -7, display: 'MST (Mountain Standard Time)', abbreviation: 'MST' },
  { name: 'MDT', offset: -6, display: 'MDT (Mountain Daylight Time)', abbreviation: 'MDT' },
  { name: 'PST', offset: -8, display: 'PST (Pacific Standard Time)', abbreviation: 'PST' },
  { name: 'PDT', offset: -7, display: 'PDT (Pacific Daylight Time)', abbreviation: 'PDT' },
  { name: 'GMT', offset: 0, display: 'GMT (Greenwich Mean Time)', abbreviation: 'GMT' },
  { name: 'BST', offset: 1, display: 'BST (British Summer Time)', abbreviation: 'BST' },
  { name: 'CET', offset: 1, display: 'CET (Central European Time)', abbreviation: 'CET' },
  { name: 'CEST', offset: 2, display: 'CEST (Central European Summer Time)', abbreviation: 'CEST' },
  { name: 'Europe/Paris', offset: 2, display: 'CEST (Central European Summer Time)', abbreviation: 'CEST' },
  { name: 'EET', offset: 2, display: 'EET (Eastern European Time)', abbreviation: 'EET' },
  { name: 'EEST', offset: 3, display: 'EEST (Eastern European Summer Time)', abbreviation: 'EEST' },
  { name: 'JST', offset: 9, display: 'JST (Japan Standard Time)', abbreviation: 'JST' },
  { name: 'KST', offset: 9, display: 'KST (Korea Standard Time)', abbreviation: 'KST' },
  { name: 'IST', offset: 5.5, display: 'IST (India Standard Time)', abbreviation: 'IST' },
  { name: 'AEST', offset: 10, display: 'AEST (Australian Eastern Standard Time)', abbreviation: 'AEST' },
  { name: 'NZST', offset: 12, display: 'NZST (New Zealand Standard Time)', abbreviation: 'NZST' },
  { name: 'NZDT', offset: 13, display: 'NZDT (New Zealand Daylight Time)', abbreviation: 'NZDT' }
]

export function TimezoneClock({ 
  className = '', 
  showSeconds = true, 
  showTimezone = true,
  compact = false 
}: TimezoneClockProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedTimezone, setSelectedTimezone] = useState<TimezoneInfo>(COMMON_TIMEZONES[0])
  const [isOpen, setIsOpen] = useState(false)

  // Auto-detect user's timezone with better location detection
  useEffect(() => {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const userOffset = new Date().getTimezoneOffset() / 60
    
    // Enhanced location detection
    let detectedTimezone: TimezoneInfo | undefined
    
    // Check for specific locations first
    if (userTimezone.includes('Europe/Paris') || userTimezone.includes('Europe/Marseille')) {
      detectedTimezone = COMMON_TIMEZONES.find(tz => tz.name === 'CET')
    } else if (userTimezone.includes('America/New_York')) {
      detectedTimezone = COMMON_TIMEZONES.find(tz => tz.name === 'EST')
    } else if (userTimezone.includes('America/Los_Angeles')) {
      detectedTimezone = COMMON_TIMEZONES.find(tz => tz.name === 'PST')
    } else if (userTimezone.includes('Asia/Kolkata') || userTimezone.includes('Asia/Calcutta')) {
      detectedTimezone = COMMON_TIMEZONES.find(tz => tz.name === 'IST')
    } else if (userTimezone.includes('Europe/London')) {
      detectedTimezone = COMMON_TIMEZONES.find(tz => tz.name === 'GMT')
    } else {
      // Fallback to offset matching
      detectedTimezone = COMMON_TIMEZONES.find(tz => 
        Math.abs(tz.offset - userOffset) < 0.5
      )
    }
    
    if (detectedTimezone) {
      setSelectedTimezone(detectedTimezone)
    } else {
      // Create a custom timezone entry for the user
      const locationName = userTimezone.split('/').pop()?.replace('_', ' ') || 'Local'
      const customTimezone: TimezoneInfo = {
        name: userTimezone,
        offset: userOffset,
        display: `${locationName} (${userOffset >= 0 ? '+' : ''}${userOffset})`,
        abbreviation: locationName.substring(0, 3).toUpperCase()
      }
      setSelectedTimezone(customTimezone)
    }
  }, [])

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Convert time to selected timezone
  const getTimezoneTime = () => {
    // Use proper timezone conversion instead of hardcoded offsets
    try {
      // Try to use the actual timezone name if available
      if (selectedTimezone.name && selectedTimezone.name !== 'UTC') {
        // Get the current time in the target timezone
        const timeString = currentTime.toLocaleString('en-US', { 
          timeZone: selectedTimezone.name,
          hour12: false,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
        
        // Parse the time string back to a Date object
        const [datePart, timePart] = timeString.split(', ')
        const [month, day, year] = datePart.split('/')
        const [hour, minute, second] = timePart.split(':')
        
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 
                       parseInt(hour), parseInt(minute), parseInt(second))
      }
    } catch (error) {
      console.warn('Invalid timezone name:', selectedTimezone.name, error)
    }
    
    // Fallback: manual calculation (this will be inaccurate during DST)
    const utcTime = currentTime.getTime() + (currentTime.getTimezoneOffset() * 60000)
    const targetTime = new Date(utcTime + (selectedTimezone.offset * 3600000))
    return targetTime
  }

  const timezoneTime = getTimezoneTime()

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = showSeconds ? `:${date.getSeconds().toString().padStart(2, '0')}` : ''
    return `${hours}:${minutes}${seconds}`
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Clock className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-mono">{formatTime(timezoneTime)}</span>
        {showTimezone && (
          <span className="text-xs text-muted-foreground">{selectedTimezone.abbreviation}</span>
        )}
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div className="bg-card/30 backdrop-blur-sm border border-border/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="font-medium">Live Clock</h3>
          </div>
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/20"
          >
            <Settings className="w-3 h-3" />
            Change
          </button>
        </div>

        <div className="space-y-2">
          <div className="text-2xl font-mono font-light">
            {formatTime(timezoneTime)}
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{formatDate(timezoneTime)}</span>
            {showTimezone && (
              <span className="font-medium">{selectedTimezone.display}</span>
            )}
          </div>
        </div>

        {/* Timezone Selector */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/30 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
            <div className="p-3">
              <div className="text-xs font-medium text-muted-foreground mb-2">Select Timezone</div>
              <div className="space-y-1">
                {COMMON_TIMEZONES.map((tz) => (
                  <button
                    key={tz.name}
                    onClick={() => {
                      setSelectedTimezone(tz)
                      setIsOpen(false)
                    }}
                    className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-muted/20 transition-colors ${
                      selectedTimezone.name === tz.name ? 'bg-primary/10 text-primary' : ''
                    }`}
                  >
                    <div className="font-medium">{tz.abbreviation}</div>
                    <div className="text-xs text-muted-foreground">{tz.display}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Timezone converter utility component
export function TimezoneConverter({ 
  utcTime, 
  className = '' 
}: { 
  utcTime: string
  className?: string 
}) {
  const [selectedTimezone, setSelectedTimezone] = useState<TimezoneInfo>(COMMON_TIMEZONES[0])

  const convertTime = (utcTimeStr: string, timezone: TimezoneInfo) => {
    try {
      // Parse UTC time (assuming format like "14:00" or "14:00–16:00")
      const isRange = utcTimeStr.includes('–')
      
      if (isRange) {
        const [startTime, endTime] = utcTimeStr.split('–')
        const startHour = parseInt(startTime.split(':')[0])
        const endHour = parseInt(endTime.split(':')[0])
        
        const convertedStart = (startHour + timezone.offset + 24) % 24
        const convertedEnd = (endHour + timezone.offset + 24) % 24
        
        return `${convertedStart.toString().padStart(2, '0')}:00–${convertedEnd.toString().padStart(2, '0')}:00`
      } else {
        const hour = parseInt(utcTimeStr.split(':')[0])
        const convertedHour = (hour + timezone.offset + 24) % 24
        return `${convertedHour.toString().padStart(2, '0')}:00`
      }
    } catch (error) {
      return utcTimeStr
    }
  }

  const convertedTime = convertTime(utcTime, selectedTimezone)

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm font-mono">{convertedTime}</span>
      <span className="text-xs text-muted-foreground">{selectedTimezone.abbreviation}</span>
    </div>
  )
}

// Hook for timezone management
export function useTimezone() {
  const [selectedTimezone, setSelectedTimezone] = useState<TimezoneInfo>(COMMON_TIMEZONES[0])

  const convertUtcToTimezone = (utcHour: number, timezone?: TimezoneInfo) => {
    const tz = timezone || selectedTimezone
    
    // Use proper timezone conversion that handles DST
    try {
      if (tz.name && tz.name !== 'UTC') {
        // Create a UTC date for the given hour
        const utcDate = new Date()
        utcDate.setUTCHours(utcHour, 0, 0, 0)
        
        // Convert to the target timezone
        const localTimeString = utcDate.toLocaleString('en-US', {
          timeZone: tz.name,
          hour12: false,
          hour: '2-digit',
          minute: '2-digit'
        })
        
        return parseInt(localTimeString.split(':')[0])
      }
    } catch (error) {
      console.warn('Invalid timezone name:', tz.name, error)
    }
    
    // Fallback: manual calculation (this will be inaccurate during DST)
    return (utcHour + tz.offset + 24) % 24
  }

  const formatTimeWindow = (hours: string, timezone?: TimezoneInfo) => {
    const tz = timezone || selectedTimezone
    
    if (hours.includes('–')) {
      const [start, end] = hours.split('–')
      const startHour = parseInt(start.split(':')[0])
      const endHour = parseInt(end.split(':')[0])
      
      const convertedStart = convertUtcToTimezone(startHour, tz)
      const convertedEnd = convertUtcToTimezone(endHour, tz)
      
      return `${convertedStart.toString().padStart(2, '0')}:00–${convertedEnd.toString().padStart(2, '0')}:00`
    } else {
      const hour = parseInt(hours.split(':')[0])
      const convertedHour = convertUtcToTimezone(hour, tz)
      return `${convertedHour.toString().padStart(2, '0')}:00`
    }
  }

  return {
    selectedTimezone,
    setSelectedTimezone,
    convertUtcToTimezone,
    formatTimeWindow,
    COMMON_TIMEZONES
  }
}
