'use client'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface TimezoneInfo {
  name: string
  offset: number
  display: string
  abbreviation: string
  city: string
  country?: string
}

interface ClockPosition {
  id: string
  timezone: TimezoneInfo
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center-top' | 'center-bottom'
  size: 'small' | 'medium' | 'large'
}

interface ClockContextType {
  clockPositions: ClockPosition[]
  hasUserSetClocks: boolean
  addClock: (timezone: TimezoneInfo) => void
  removeClock: (id: string) => void
  updateClockPosition: (id: string, updates: Partial<Omit<ClockPosition, 'id'>>) => void
  clearAllClocks: () => void
}

const ClockContext = createContext<ClockContextType | undefined>(undefined)

const STORAGE_KEY = 'reddit-clock-positions'

export function ClockProvider({ children }: { children: ReactNode }) {
  const [clockPositions, setClockPositions] = useState<ClockPosition[]>([])
  const [hasUserSetClocks, setHasUserSetClocks] = useState(false)

  // Load clock positions from localStorage on mount
  useEffect(() => {
    try {
      const savedPositions = localStorage.getItem(STORAGE_KEY)
      const hasUserSet = localStorage.getItem('reddit-has-user-set-clocks') === 'true'
      
      if (savedPositions) {
        const positions = JSON.parse(savedPositions)
        setClockPositions(positions)
        // If there are saved positions, user has set clocks
        if (positions.length > 0 && hasUserSet) {
          setHasUserSetClocks(true)
        }
      } else if (hasUserSet) {
        // No saved positions but flag is set - reset the flag
        localStorage.removeItem('reddit-has-user-set-clocks')
        setHasUserSetClocks(false)
      }
    } catch (error) {
      console.warn('Failed to load clock positions from localStorage:', error)
    }
  }, [])

  // Save clock positions to localStorage whenever positions change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clockPositions))
    } catch (error) {
      console.warn('Failed to save clock positions to localStorage:', error)
    }
  }, [clockPositions])

  const addClock = (timezone: TimezoneInfo) => {
    // Check if this timezone is already added
    const alreadyExists = clockPositions.some(clock => clock.timezone.name === timezone.name)
    if (alreadyExists) return
    
    const newClock: ClockPosition = {
      id: `clock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timezone,
      position: 'top-left',
      size: 'small'
    }
    
    setClockPositions(prev => [...prev, newClock])
    // Mark that user has manually set clocks
    setHasUserSetClocks(true)
    localStorage.setItem('reddit-has-user-set-clocks', 'true')
  }

  const removeClock = (id: string) => {
    setClockPositions(prev => prev.filter(clock => clock.id !== id))
    // Mark that user has manually manipulated clocks
    setHasUserSetClocks(true)
    localStorage.setItem('reddit-has-user-set-clocks', 'true')
  }

  const updateClockPosition = (id: string, updates: Partial<Omit<ClockPosition, 'id'>>) => {
    setClockPositions(prev => prev.map(clock => 
      clock.id === id ? { ...clock, ...updates } : clock
    ))
  }

  const clearAllClocks = () => {
    setClockPositions([])
  }

  return (
    <ClockContext.Provider value={{
      clockPositions,
      hasUserSetClocks,
      addClock,
      removeClock,
      updateClockPosition,
      clearAllClocks
    }}>
      {children}
    </ClockContext.Provider>
  )
}

export function useClock() {
  const context = useContext(ClockContext)
  if (context === undefined) {
    throw new Error('useClock must be used within a ClockProvider')
  }
  return context
}
