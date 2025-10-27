'use client'
import { useState } from 'react'
import { Clock, Globe, Users, ArrowRight } from 'lucide-react'
import { useTimezone } from './timezone-clock'

interface MultiTimezoneDisplayProps {
  utcTime: string
  className?: string
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
  { name: 'EET', offset: 2, display: 'EET (Eastern European Time)', abbreviation: 'EET' },
  { name: 'EEST', offset: 3, display: 'EEST (Eastern European Summer Time)', abbreviation: 'EEST' },
  { name: 'JST', offset: 9, display: 'JST (Japan Standard Time)', abbreviation: 'JST' },
  { name: 'KST', offset: 9, display: 'KST (Korea Standard Time)', abbreviation: 'KST' },
  { name: 'IST', offset: 5.5, display: 'IST (India Standard Time)', abbreviation: 'IST' },
  { name: 'AEST', offset: 10, display: 'AEST (Australian Eastern Standard Time)', abbreviation: 'AEST' },
  { name: 'NZST', offset: 12, display: 'NZST (New Zealand Standard Time)', abbreviation: 'NZST' },
  { name: 'NZDT', offset: 13, display: 'NZDT (New Zealand Daylight Time)', abbreviation: 'NZDT' }
]

export function MultiTimezoneDisplay({ utcTime, className = '' }: MultiTimezoneDisplayProps) {
  const { selectedTimezone } = useTimezone()
  const [showComparison, setShowComparison] = useState(false)
  const [selectedTimezones, setSelectedTimezones] = useState<TimezoneInfo[]>([
    selectedTimezone,
    COMMON_TIMEZONES.find(tz => tz.name === 'EST') || COMMON_TIMEZONES[0],
    COMMON_TIMEZONES.find(tz => tz.name === 'CET') || COMMON_TIMEZONES[0]
  ])

  const convertTime = (utcTimeStr: string, timezone: TimezoneInfo) => {
    try {
      const isRange = utcTimeStr.includes('–')
      
      if (isRange) {
        const [startTime, endTime] = utcTimeStr.split('–')
        const startHour = parseInt(startTime.split(':')[0])
        const endHour = parseInt(endTime.split(':')[0])
        
        // Use proper timezone conversion that handles DST
        const convertHour = (utcHour: number) => {
          try {
            if (timezone.name && timezone.name !== 'UTC') {
              const utcDate = new Date()
              utcDate.setUTCHours(utcHour, 0, 0, 0)
              
              const localTimeString = utcDate.toLocaleString('en-US', {
                timeZone: timezone.name,
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
              })
              
              return parseInt(localTimeString.split(':')[0])
            }
          } catch (error) {
            console.warn('Invalid timezone name:', timezone.name, error)
          }
          
          // Fallback: manual calculation
          return (utcHour + timezone.offset + 24) % 24
        }
        
        const convertedStart = convertHour(startHour)
        const convertedEnd = convertHour(endHour)
        
        return `${convertedStart.toString().padStart(2, '0')}:00–${convertedEnd.toString().padStart(2, '0')}:00`
      } else {
        const hour = parseInt(utcTimeStr.split(':')[0])
        
        // Use proper timezone conversion that handles DST
        try {
          if (timezone.name && timezone.name !== 'UTC') {
            const utcDate = new Date()
            utcDate.setUTCHours(hour, 0, 0, 0)
            
            const localTimeString = utcDate.toLocaleString('en-US', {
              timeZone: timezone.name,
              hour12: false,
              hour: '2-digit',
              minute: '2-digit'
            })
            
            const convertedHour = parseInt(localTimeString.split(':')[0])
            return `${convertedHour.toString().padStart(2, '0')}:00`
          }
        } catch (error) {
          console.warn('Invalid timezone name:', timezone.name, error)
        }
        
        // Fallback: manual calculation
        const convertedHour = (hour + timezone.offset + 24) % 24
        return `${convertedHour.toString().padStart(2, '0')}:00`
      }
    } catch (error) {
      return utcTimeStr
    }
  }

  const addTimezone = (timezone: TimezoneInfo) => {
    if (!selectedTimezones.find(tz => tz.name === timezone.name)) {
      setSelectedTimezones([...selectedTimezones, timezone])
    }
  }

  const removeTimezone = (timezoneName: string) => {
    if (selectedTimezones.length > 1) {
      setSelectedTimezones(selectedTimezones.filter(tz => tz.name !== timezoneName))
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Time Display */}
      <div className="flex items-center gap-3">
        <div className="text-lg font-mono font-medium">
          {convertTime(utcTime, selectedTimezone)}
        </div>
        <span className="text-sm text-muted-foreground">{selectedTimezone.abbreviation}</span>
        
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/20"
        >
          <Globe className="w-3 h-3" />
          {showComparison ? 'Hide' : 'Show'} Multi-Timezone
        </button>
      </div>

      {/* Multi-Timezone Comparison */}
      {showComparison && (
        <div className="bg-muted/10 border border-border/20 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Multi-Timezone View</span>
            <span className="text-xs text-muted-foreground">
              Perfect for reaching global audiences
            </span>
          </div>

          {/* Selected Timezones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedTimezones.map((tz) => (
              <div key={tz.name} className="flex items-center justify-between p-2 bg-card/50 rounded border border-border/20">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-mono font-medium">
                      {convertTime(utcTime, tz)}
                    </div>
                    <div className="text-xs text-muted-foreground">{tz.abbreviation}</div>
                  </div>
                </div>
                {selectedTimezones.length > 1 && (
                  <button
                    onClick={() => removeTimezone(tz.name)}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add More Timezones */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Add more timezones:</div>
            <div className="flex flex-wrap gap-1">
              {COMMON_TIMEZONES
                .filter(tz => !selectedTimezones.find(selected => selected.name === tz.name))
                .slice(0, 8)
                .map((tz) => (
                  <button
                    key={tz.name}
                    onClick={() => addTimezone(tz)}
                    className="px-2 py-1 text-xs bg-muted/20 hover:bg-muted/40 rounded transition-colors"
                  >
                    {tz.abbreviation}
                  </button>
                ))}
            </div>
          </div>

          {/* Usage Tips */}
          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border/20">
            <p><strong>💡 Pro Tip:</strong> Use this to find posting times that work across multiple regions</p>
            <p><strong>🌍 Global Strategy:</strong> Post when it's morning in Asia, afternoon in Europe, and evening in Americas</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Multi-timezone posting strategy component
export function MultiTimezoneStrategy({ 
  bestWindows, 
  className = '' 
}: { 
  bestWindows: Array<{ day: string; hours: string; score: number }>
  className?: string 
}) {
  const { selectedTimezone } = useTimezone()
  const [targetTimezones, setTargetTimezones] = useState<TimezoneInfo[]>([
    COMMON_TIMEZONES.find(tz => tz.name === 'EST') || COMMON_TIMEZONES[0],
    COMMON_TIMEZONES.find(tz => tz.name === 'CET') || COMMON_TIMEZONES[0],
    COMMON_TIMEZONES.find(tz => tz.name === 'IST') || COMMON_TIMEZONES[0]
  ])

  const convertTime = (utcTimeStr: string, timezone: TimezoneInfo) => {
    try {
      const isRange = utcTimeStr.includes('–')
      
      if (isRange) {
        const [startTime, endTime] = utcTimeStr.split('–')
        const startHour = parseInt(startTime.split(':')[0])
        const endHour = parseInt(endTime.split(':')[0])
        
        // Use proper timezone conversion that handles DST
        const convertHour = (utcHour: number) => {
          try {
            if (timezone.name && timezone.name !== 'UTC') {
              const utcDate = new Date()
              utcDate.setUTCHours(utcHour, 0, 0, 0)
              
              const localTimeString = utcDate.toLocaleString('en-US', {
                timeZone: timezone.name,
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
              })
              
              return parseInt(localTimeString.split(':')[0])
            }
          } catch (error) {
            console.warn('Invalid timezone name:', timezone.name, error)
          }
          
          // Fallback: manual calculation
          return (utcHour + timezone.offset + 24) % 24
        }
        
        const convertedStart = convertHour(startHour)
        const convertedEnd = convertHour(endHour)
        
        return `${convertedStart.toString().padStart(2, '0')}:00–${convertedEnd.toString().padStart(2, '0')}:00`
      } else {
        const hour = parseInt(utcTimeStr.split(':')[0])
        
        // Use proper timezone conversion that handles DST
        try {
          if (timezone.name && timezone.name !== 'UTC') {
            const utcDate = new Date()
            utcDate.setUTCHours(hour, 0, 0, 0)
            
            const localTimeString = utcDate.toLocaleString('en-US', {
              timeZone: timezone.name,
              hour12: false,
              hour: '2-digit',
              minute: '2-digit'
            })
            
            const convertedHour = parseInt(localTimeString.split(':')[0])
            return `${convertedHour.toString().padStart(2, '0')}:00`
          }
        } catch (error) {
          console.warn('Invalid timezone name:', timezone.name, error)
        }
        
        // Fallback: manual calculation
        const convertedHour = (hour + timezone.offset + 24) % 24
        return `${convertedHour.toString().padStart(2, '0')}:00`
      }
    } catch (error) {
      return utcTimeStr
    }
  }

  const getOptimalWindows = () => {
    return bestWindows.slice(0, 3).map(window => ({
      ...window,
      convertedTimes: targetTimezones.map(tz => ({
        timezone: tz,
        time: convertTime(window.hours, tz)
      }))
    }))
  }

  return (
    <div className={`bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-blue-500/20 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-5 h-5 text-blue-500" />
        <h3 className="font-medium">🌍 Multi-Timezone Posting Strategy</h3>
      </div>

      <div className="space-y-4">
        {getOptimalWindows().map((window, index) => (
          <div key={index} className="bg-card/50 rounded-lg p-3 border border-border/20">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{window.day}</span>
              <span className="text-xs text-muted-foreground">Score: {window.score}</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {window.convertedTimes.map((converted, idx) => (
                <div key={idx} className="text-center p-2 bg-muted/20 rounded">
                  <div className="text-sm font-mono font-medium">{converted.time}</div>
                  <div className="text-xs text-muted-foreground">{converted.timezone.abbreviation}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-muted-foreground space-y-1">
        <p><strong>🎯 Strategy:</strong> These times work well across multiple regions</p>
        <p><strong>📊 Data:</strong> Based on Reddit's global engagement patterns</p>
      </div>
    </div>
  )
}
