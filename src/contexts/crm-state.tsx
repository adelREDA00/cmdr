'use client'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Contact {
  id: string
  nom: string
  contact: string
  chatUrl: string
  dateOfFirstContact: string
  messageSent: string
  response: string
}

interface CRMContextType {
  contacts: Contact[]
  addContact: (contact: Contact) => void
  updateContact: (id: string, updates: Partial<Omit<Contact, 'id'>>) => void
  deleteContact: (id: string) => void
  clearAllContacts: () => void
}

const CRMContext = createContext<CRMContextType | undefined>(undefined)

const STORAGE_KEY = 'reddit-crm-contacts'

export function CRMProvider({ children }: { children: ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>([])

  // Load contacts from localStorage on mount
  useEffect(() => {
    try {
      const savedContacts = localStorage.getItem(STORAGE_KEY)
      if (savedContacts) {
        setContacts(JSON.parse(savedContacts))
      }
    } catch (error) {
      console.warn('Failed to load contacts from localStorage:', error)
    }
  }, [])

  // Save contacts to localStorage whenever contacts change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts))
    } catch (error) {
      console.warn('Failed to save contacts to localStorage:', error)
    }
  }, [contacts])

  const addContact = (contact: Contact) => {
    setContacts(prev => [...prev, contact])
  }

  const updateContact = (id: string, updates: Partial<Omit<Contact, 'id'>>) => {
    setContacts(prev => prev.map(contact => 
      contact.id === id ? { ...contact, ...updates } : contact
    ))
  }

  const deleteContact = (id: string) => {
    setContacts(prev => prev.filter(contact => contact.id !== id))
  }

  const clearAllContacts = () => {
    setContacts([])
  }

  return (
    <CRMContext.Provider value={{
      contacts,
      addContact,
      updateContact,
      deleteContact,
      clearAllContacts
    }}>
      {children}
    </CRMContext.Provider>
  )
}

export function useCRM() {
  const context = useContext(CRMContext)
  if (context === undefined) {
    throw new Error('useCRM must be used within a CRMProvider')
  }
  return context
}
