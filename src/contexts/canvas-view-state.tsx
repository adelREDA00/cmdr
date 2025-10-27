'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface CanvasViewState {
  zoom: number
  pan: { x: number; y: number }
}

interface CanvasViewContextType {
  canvasState: CanvasViewState
  updateCanvasState: (state: Partial<CanvasViewState>) => void
  resetCanvasState: () => void
}

const CanvasViewContext = createContext<CanvasViewContextType | undefined>(undefined)

const STORAGE_KEY = 'canvas-view-state'

export function CanvasViewProvider({ children }: { children: ReactNode }) {
  const [canvasState, setCanvasState] = useState<CanvasViewState>({
    zoom: 1,
    pan: { x: 0, y: 0 }
  })

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setCanvasState({
          zoom: parsed.zoom || 1,
          pan: parsed.pan || { x: 0, y: 0 }
        })
      }
    } catch (error) {
      console.warn('Failed to load canvas view state from localStorage:', error)
    }
  }, [])

  // Save to localStorage whenever canvasState changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(canvasState))
    } catch (error) {
      console.warn('Failed to save canvas view state to localStorage:', error)
    }
  }, [canvasState])

  const updateCanvasState = (state: Partial<CanvasViewState>) => {
    setCanvasState(prev => ({
      ...prev,
      ...state
    }))
  }

  const resetCanvasState = () => {
    setCanvasState({
      zoom: 1,
      pan: { x: 0, y: 0 }
    })
  }

  return (
    <CanvasViewContext.Provider value={{
      canvasState,
      updateCanvasState,
      resetCanvasState
    }}>
      {children}
    </CanvasViewContext.Provider>
  )
}

export function useCanvasViewState() {
  const context = useContext(CanvasViewContext)
  if (context === undefined) {
    throw new Error('useCanvasViewState must be used within a CanvasViewProvider')
  }
  return context
}
