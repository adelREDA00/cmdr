'use client'
import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

export function FloatingClock() {
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    })
  }

  return (
    <div className="fixed bottom-6 left-6 z-40">
      <div className="flex items-center gap-2 px-3 py-2 bg-background/80 backdrop-blur-sm border border-border/30 rounded-lg shadow-lg hover:bg-background/90 transition-all duration-200">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-mono font-medium">
          {formatTime(currentTime)}
        </span>
      </div>
    </div>
  )
}
