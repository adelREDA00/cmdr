'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface DocumentContent {
  id: string
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
}

interface DocumentContentContextType {
  documents: Map<string, DocumentContent>
  createDocument: (title?: string, content?: string) => string
  updateDocument: (id: string, updates: Partial<Pick<DocumentContent, 'title' | 'content'>>) => void
  deleteDocument: (id: string) => void
  getDocument: (id: string) => DocumentContent | undefined
  getAllDocuments: () => DocumentContent[]
  clearAllDocuments: () => void
}

const DocumentContentContext = createContext<DocumentContentContextType | undefined>(undefined)

const STORAGE_KEY = 'document-content-states'

export function DocumentContentProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<Map<string, DocumentContent>>(new Map())

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        const map = new Map()
        
        // Convert date strings back to Date objects
        Object.entries(parsed).forEach(([id, doc]: [string, any]) => {
          map.set(id, {
            ...doc,
            createdAt: new Date(doc.createdAt),
            updatedAt: new Date(doc.updatedAt)
          })
        })
        
        setDocuments(map)
      }
    } catch (error) {
      console.warn('Failed to load document content from localStorage:', error)
    }
  }, [])

  // Save to localStorage whenever documents change
  useEffect(() => {
    try {
      const obj = Object.fromEntries(documents)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj))
    } catch (error) {
      console.warn('Failed to save document content to localStorage:', error)
    }
  }, [documents])

  const createDocument = (title: string = 'Untitled Document', content: string = ''): string => {
    const id = Date.now().toString()
    const now = new Date()
    
    const newDocument: DocumentContent = {
      id,
      title,
      content,
      createdAt: now,
      updatedAt: now
    }
    
    setDocuments(prev => {
      const newMap = new Map(prev)
      newMap.set(id, newDocument)
      return newMap
    })
    
    return id
  }

  const updateDocument = (id: string, updates: Partial<Pick<DocumentContent, 'title' | 'content'>>) => {
    setDocuments(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(id)
      
      if (existing) {
        const updated = {
          ...existing,
          ...updates,
          updatedAt: new Date()
        }
        newMap.set(id, updated)
      }
      
      return newMap
    })
  }

  const deleteDocument = (id: string) => {
    setDocuments(prev => {
      const newMap = new Map(prev)
      newMap.delete(id)
      return newMap
    })
  }

  const getDocument = (id: string): DocumentContent | undefined => {
    return documents.get(id)
  }

  const getAllDocuments = (): DocumentContent[] => {
    return Array.from(documents.values())
  }

  const clearAllDocuments = () => {
    setDocuments(new Map())
  }

  return (
    <DocumentContentContext.Provider value={{
      documents,
      createDocument,
      updateDocument,
      deleteDocument,
      getDocument,
      getAllDocuments,
      clearAllDocuments
    }}>
      {children}
    </DocumentContentContext.Provider>
  )
}

export function useDocumentContent() {
  const context = useContext(DocumentContentContext)
  if (context === undefined) {
    throw new Error('useDocumentContent must be used within a DocumentContentProvider')
  }
  return context
}
