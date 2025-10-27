'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface DocumentVisualState {
  x: number
  y: number
  width: number
  height: number
}

interface DocumentVisualContextType {
  visualStates: Map<string, DocumentVisualState>
  updateVisualState: (id: string, state: Partial<DocumentVisualState>) => void
  getVisualState: (id: string, fallback: DocumentVisualState) => DocumentVisualState
  clearVisualState: (id: string) => void
  clearAllVisualStates: () => void
}

const DocumentVisualContext = createContext<DocumentVisualContextType | undefined>(undefined)

const STORAGE_KEY = 'document-visual-states'

export function DocumentVisualProvider({ children }: { children: ReactNode }) {
  const [visualStates, setVisualStates] = useState<Map<string, DocumentVisualState>>(new Map())

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        const map = new Map(Object.entries(parsed)) as Map<string, DocumentVisualState>
        setVisualStates(map)
      }
    } catch (error) {
      console.warn('Failed to load visual states from localStorage:', error)
    }
  }, [])

  // Save to localStorage whenever visualStates changes
  useEffect(() => {
    try {
      const obj = Object.fromEntries(visualStates)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj))
    } catch (error) {
      console.warn('Failed to save visual states to localStorage:', error)
    }
  }, [visualStates])

  const updateVisualState = (id: string, state: Partial<DocumentVisualState>) => {
    setVisualStates(prev => {
      const newMap = new Map(prev)
      const current = newMap.get(id) || { x: 0, y: 0, width: 300, height: 200 }
      newMap.set(id, { ...current, ...state })
      return newMap
    })
  }

  const getVisualState = (id: string, fallback: DocumentVisualState): DocumentVisualState => {
    return visualStates.get(id) || fallback
  }

  const clearVisualState = (id: string) => {
    setVisualStates(prev => {
      const newMap = new Map(prev)
      newMap.delete(id)
      return newMap
    })
  }

  const clearAllVisualStates = () => {
    setVisualStates(new Map())
  }

  return (
    <DocumentVisualContext.Provider value={{
      visualStates,
      updateVisualState,
      getVisualState,
      clearVisualState,
      clearAllVisualStates
    }}>
      {children}
    </DocumentVisualContext.Provider>
  )
}

export function useDocumentVisualState() {
  const context = useContext(DocumentVisualContext)
  if (context === undefined) {
    throw new Error('useDocumentVisualState must be used within a DocumentVisualProvider')
  }
  return context
}
