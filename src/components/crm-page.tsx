'use client'
import React, { useState } from "react"
import { Search, Plus, Minus, ChevronDown } from "lucide-react"
import { UserActivityModal } from "./user-activity-modal"
import { useCRM } from "../contexts/crm-state"
import { API_BASE_URL } from "../config"

interface Contact {
  id: string
  nom: string
  contact: string
  chatUrl: string
  dateOfFirstContact: string
  messageSent: string
  response: string
}

interface UserActivityData {
  username: string
  displayName: string
  avatar?: string
  analysis?: {
    totalPosts: number
    totalComments: number
    totalActivity: number
    windowDays: number
    dataQuality: 'high' | 'medium' | 'low'
  }
  activityPattern: {
    peakHours: Array<{ hour: number; activity: number; engagement: number }>
    bestDays: Array<{ day: string; activity: number; engagement: number }>
    responseRate: number
    avgResponseTime: string
    engagementScore: number
    activityLevel: 'high' | 'medium' | 'low'
    timezone: string
    preferredContentType: string
  }
  insights: {
    bestTimeToMessage: string
    bestTimeToMessageUTC?: string
    responseLikelihood: 'high' | 'medium' | 'low'
    preferredContentType: string
    timezone: string
    activityLevel: 'high' | 'medium' | 'low'
    confidence: 'high' | 'medium' | 'low'
    reasoning: string
  }
  recentActivity: Array<{
    type: 'post' | 'comment' | 'reply'
    subreddit: string
    timestamp: string
    engagement: number
  }>
  warning?: string
  error?: string
}

export function CRMPage() {
  const { contacts, addContact, updateContact, deleteContact } = useCRM()

  const [searchQuery, setSearchQuery] = useState("")
  const [showUserActivity, setShowUserActivity] = useState(false)
  const [userActivityData, setUserActivityData] = useState<UserActivityData | null>(null)
  const [editingCell, setEditingCell] = useState<{rowId: string, field: string} | null>(null)
  const [editValue, setEditValue] = useState('')
  const [selectedCell, setSelectedCell] = useState<{rowId: string, field: string} | null>(null)
  const [dragStartPos, setDragStartPos] = useState<{row: number, col: number} | null>(null)
  const [isDraggingHandle, setIsDraggingHandle] = useState(false)
  const [dragRange, setDragRange] = useState<{startRow: number, endRow: number, startCol: number, endCol: number} | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showUrlModal, setShowUrlModal] = useState(false)
  const [selectedUrl, setSelectedUrl] = useState('')
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 })
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [clipboardContent, setClipboardContent] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('all')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [highlightedContactId, setHighlightedContactId] = useState<string | null>(null)

  // Generate mock user activity data for Reddit timing analysis
  const generateMockUserData = (username: string): UserActivityData => {
    const peakHours = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      activity: Math.floor(Math.random() * 100),
      engagement: Math.floor(Math.random() * 100)
    }))
    
    const bestDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => ({
      day,
      activity: Math.floor(Math.random() * 100),
      engagement: Math.floor(Math.random() * 100)
    }))
    
    const responseRate = Math.floor(Math.random() * 100)
    const avgResponseTime = `${Math.floor(Math.random() * 24)}h ${Math.floor(Math.random() * 60)}m`
    const engagementScore = Math.floor(Math.random() * 100)
    
    const bestTimeToMessage = `${Math.floor(Math.random() * 12) + 1}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')} ${Math.random() > 0.5 ? 'AM' : 'PM'}`
    const responseLikelihood = ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as 'high' | 'medium' | 'low'
    const preferredContentType = ['text', 'images', 'links', 'polls'][Math.floor(Math.random() * 4)]
    const timezone = ['EST', 'PST', 'CST', 'MST', 'GMT'][Math.floor(Math.random() * 5)]
    const activityLevel = ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as 'high' | 'medium' | 'low'
    
    const recentActivity = Array.from({ length: 5 }, () => ({
      type: ['post', 'comment', 'reply'][Math.floor(Math.random() * 3)] as 'post' | 'comment' | 'reply',
      subreddit: ['r/programming', 'r/technology', 'r/startups', 'r/webdev', 'r/reactjs'][Math.floor(Math.random() * 5)],
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      engagement: Math.floor(Math.random() * 100)
    }))
    
    return {
      username,
      displayName: username,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      analysis: {
        totalPosts: Math.floor(Math.random() * 50) + 10,
        totalComments: Math.floor(Math.random() * 100) + 20,
        totalActivity: Math.floor(Math.random() * 150) + 30,
        windowDays: 90,
        dataQuality: 'medium' as const
      },
      activityPattern: {
        peakHours,
        bestDays,
        responseRate,
        avgResponseTime,
        engagementScore,
        activityLevel,
        timezone,
        preferredContentType
      },
      insights: {
        bestTimeToMessage,
        responseLikelihood,
        preferredContentType,
        timezone,
        activityLevel,
        confidence: 'medium' as const,
        reasoning: 'Mock data for demonstration purposes'
      },
      recentActivity
    }
  }

  const handleRedditUsernameAnalysis = async () => {
    if (searchQuery.trim()) {
      setIsAnalyzing(true)
      try {
        const username = searchQuery.trim().replace(/^u\//, '')
        const response = await fetch(`${API_BASE_URL}/api/analyze-user/${username}`)
        
        if (!response.ok) {
          throw new Error(`Analysis failed: ${response.statusText}`)
        }
        
        const userData = await response.json()
        setUserActivityData(userData)
        setShowUserActivity(true)
      } catch (error) {
        console.error('Error analyzing user:', error)
        // Fallback to mock data for demo purposes
        const mockData = generateMockUserData(searchQuery.trim())
        setUserActivityData(mockData)
        setShowUserActivity(true)
      } finally {
        setIsAnalyzing(false)
      }
    }
  }

  const handleAddToCRM = (newContact: Contact) => {
    addContact(newContact)
    // Clear the search query after adding
    setSearchQuery('')
    
    // Highlight the newly added contact
    setHighlightedContactId(newContact.id)
    setTimeout(() => setHighlightedContactId(null), 1500) // Remove highlight after 1.5 seconds
  }

  // Field to column index mapping
  const fieldToColumn: { [key: string]: number } = {
    'nom': 1,
    'contact': 2,
    'chatUrl': 3,
    'messageSent': 4,
    'response': 5
  }

  // Helper function to check if a cell is in drag range
  const isCellInDragRange = (rowIndex: number, field: string) => {
    if (!dragRange) return false
    const colIndex = fieldToColumn[field]
    return rowIndex >= dragRange.startRow && rowIndex <= dragRange.endRow &&
           colIndex >= dragRange.startCol && colIndex <= dragRange.endCol
  }

  const filteredContacts = contacts.filter(contact => {
    // Apply filter type only (no search functionality)
    let matchesFilter = true
    switch (filterType) {
      case 'sent':
        matchesFilter = contact.messageSent.toUpperCase() === 'Y'
        break
      case 'not-sent':
        matchesFilter = contact.messageSent.toUpperCase() !== 'Y'
        break
      case 'responded':
        matchesFilter = contact.response.toUpperCase() === 'Y'
        break
      case 'not-interested':
        matchesFilter = contact.response.toUpperCase() === 'N'
        break
      case 'pending':
        matchesFilter = contact.messageSent.toUpperCase() === 'Y' && contact.response.toUpperCase() !== 'Y'
        break
      case 'all':
      default:
        matchesFilter = true
        break
    }
    
    return matchesFilter
  })


  const handleCellClick = (rowId: string, field: string) => {
    if (editingCell) return // Don't select if editing
    setSelectedCell({rowId, field})
    setSelectedRow(null) // Clear row selection when selecting a cell
    setEditValue('') // Prepare for potential immediate typing
  }

  const handleRowNumberClick = (rowId: string) => {
    if (editingCell) return // Don't select if editing
    setSelectedRow(rowId)
    setSelectedCell(null) // Clear cell selection when selecting a row
    setDragRange(null) // Clear any drag range
  }

  const handleMinusClick = (rowId: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent row selection
    deleteContact(rowId)
  }

  const handleCellDoubleClick = (rowId: string, field: string, currentValue: string) => {
    setEditingCell({rowId, field})
    setEditValue(String(currentValue))
    setSelectedCell({rowId, field})
  }

  const handleUrlClick = (url: string, event: React.MouseEvent) => {
    if (url && url.trim()) {
      event.stopPropagation()
      const rect = event.currentTarget.getBoundingClientRect()
      setModalPosition({
        x: rect.right, // Modal's left edge aligns with cell's right edge
        y: rect.top - 60 // Modal's bottom edge aligns with cell's top edge (accounting for modal height)
      })
      setSelectedUrl(url)
      setShowUrlModal(true)
    }
  }

  const handleUrlDoubleClick = (rowId: string, url: string) => {
    setEditingCell({rowId, field: 'chatUrl'})
    setEditValue(url)
    setSelectedCell({rowId, field: 'chatUrl'})
  }

  const getUrlDisplayText = (url: string) => {
    if (!url || !url.trim()) return 'Click to edit'
    
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.replace('www.', '')
    } catch {
      return url.length > 20 ? url.substring(0, 20) + '...' : url
    }
  }

  const handleCellSave = () => {
    if (!editingCell) return

    let processedValue = editValue
    // Normalize Y/N values to uppercase for Message Sent and Response fields
    if ((editingCell.field === 'messageSent' || editingCell.field === 'response') && 
        (editValue.toLowerCase() === 'y' || editValue.toLowerCase() === 'n')) {
      processedValue = editValue.toUpperCase()
    }

    updateContact(editingCell.rowId, { [editingCell.field]: processedValue })
    
    setEditingCell(null)
    setEditValue('')
  }

  const handleCellCancel = () => {
    setEditingCell(null)
    setEditValue('')
  }

  const handleDragHandleMouseDown = (e: React.MouseEvent, rowIndex: number, field: string) => {
    e.preventDefault()
    e.stopPropagation()
    const colIndex = fieldToColumn[field]
    setDragStartPos({row: rowIndex, col: colIndex})
    setIsDraggingHandle(true)
    setIsDragging(true)
    setSelectedCell({rowId: filteredContacts[rowIndex].id, field})
    setDragRange({startRow: rowIndex, endRow: rowIndex, startCol: colIndex, endCol: colIndex})
  }

  const handleDragHandleMouseUp = () => {
    if (isDraggingHandle && dragRange && dragStartPos && selectedCell) {
      // Get the source value from the selected cell
      const sourceContact = filteredContacts[dragStartPos.row]
      const sourceField = selectedCell.field
      const sourceValue = sourceContact[sourceField as keyof Contact]
      
      // Get all field names that correspond to the column range
      const fieldsInRange = Object.keys(fieldToColumn).filter(field => {
        const colIndex = fieldToColumn[field]
        return colIndex >= dragRange.startCol && colIndex <= dragRange.endCol
      })
      
      // Update contacts using context
      filteredContacts.forEach((contact, contactIndex) => {
        if (contactIndex >= dragRange.startRow && contactIndex <= dragRange.endRow) {
          const updates: Partial<Omit<Contact, 'id'>> = {}
          fieldsInRange.forEach(field => {
            updates[field as keyof Omit<Contact, 'id'>] = sourceValue
          })
          updateContact(contact.id, updates)
        }
      })
    }
    
    setIsDraggingHandle(false)
    setIsDragging(false)
    setDragStartPos(null)
    setDragRange(null)
  }

  const handleCellMouseEnter = (rowIndex: number, field: string) => {
    if (isDraggingHandle && dragStartPos) {
      const colIndex = fieldToColumn[field]
      const startRow = Math.min(dragStartPos.row, rowIndex)
      const endRow = Math.max(dragStartPos.row, rowIndex)
      const startCol = Math.min(dragStartPos.col, colIndex)
      const endCol = Math.max(dragStartPos.col, colIndex)
      
      // Only update if the range actually changed to avoid unnecessary re-renders
      if (!dragRange || dragRange.startRow !== startRow || dragRange.endRow !== endRow || 
          dragRange.startCol !== startCol || dragRange.endCol !== endCol) {
        setDragRange({startRow, endRow, startCol, endCol})
      }
    }
  }

  const addNewRow = () => {
    const newContact: Contact = {
      id: Date.now().toString(),
      nom: '',
      contact: '',
      chatUrl: '',
      dateOfFirstContact: new Date().toISOString().split('T')[0],
      messageSent: '',
      response: ''
    }
    addContact(newContact)
  }

  // Global mouse up handler for drag handle
  React.useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDraggingHandle && dragRange && dragStartPos && selectedCell) {
        // Get the source value from the selected cell
        const sourceContact = filteredContacts[dragStartPos.row]
        const sourceField = selectedCell.field
        const sourceValue = sourceContact[sourceField as keyof Contact]
        
        // Get all field names that correspond to the column range
        const fieldsInRange = Object.keys(fieldToColumn).filter(field => {
          const colIndex = fieldToColumn[field]
          return colIndex >= dragRange.startCol && colIndex <= dragRange.endCol
        })
        
        // Update contacts using context
        filteredContacts.forEach((contact, contactIndex) => {
          if (contactIndex >= dragRange.startRow && contactIndex <= dragRange.endRow) {
            const updates: Partial<Omit<Contact, 'id'>> = {}
            fieldsInRange.forEach(field => {
              updates[field as keyof Omit<Contact, 'id'>] = sourceValue
            })
            updateContact(contact.id, updates)
          }
        })
      }
      
      if (isDraggingHandle) {
        setIsDraggingHandle(false)
        setIsDragging(false)
        setDragStartPos(null)
        setDragRange(null)
      }
    }

    document.addEventListener('mouseup', handleGlobalMouseUp)
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [isDraggingHandle, dragRange, dragStartPos, filteredContacts, selectedCell])

  // Close URL popup when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      if (showUrlModal) {
        setShowUrlModal(false)
      }
    }

    if (showUrlModal) {
      // Add a small delay to prevent immediate closure
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleClickOutside)
      }, 100)
      
      return () => {
        clearTimeout(timeoutId)
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [showUrlModal])

  // Unfocus cells when clicking outside the table
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const isTableClick = target.closest('table') || target.closest('[data-table-container]')
      
      if (!isTableClick && !editingCell) {
        setSelectedCell(null)
        setSelectedRow(null)
        setDragRange(null)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [editingCell])

  // Add cursor style when dragging
  React.useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = 'copy'
    } else {
      document.body.style.cursor = 'default'
    }
    
    return () => {
      document.body.style.cursor = 'default'
    }
  }, [isDragging])

  // Handle keyboard events for deleting cell content and typing to edit
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if user is editing a cell
      if (editingCell) return
      
      // Handle Ctrl+C (Copy)
      if (e.ctrlKey && e.key === 'c' && selectedCell && !dragRange && !selectedRow) {
        e.preventDefault()
        const currentContact = filteredContacts.find(c => c.id === selectedCell.rowId)
        if (currentContact) {
          const cellValue = String(currentContact[selectedCell.field as keyof Contact])
          setClipboardContent(cellValue)
          // Also copy to system clipboard
          navigator.clipboard.writeText(cellValue).catch(() => {
            // Fallback if clipboard API fails
            console.log('Clipboard API not available')
          })
        }
        return
      }
      
      // Handle Ctrl+V (Paste)
      if (e.ctrlKey && e.key === 'v' && selectedCell && !dragRange && !selectedRow) {
        e.preventDefault()
        if (clipboardContent) {
          updateContact(selectedCell.rowId, { [selectedCell.field]: clipboardContent })
        }
        return
      }
      
      // Handle typing to enter edit mode
      if (selectedCell && !dragRange && !selectedRow) {
        // Check if it's a printable character (not special keys)
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault()
          const currentContact = filteredContacts.find(c => c.id === selectedCell.rowId)
          if (currentContact) {
            setEditingCell(selectedCell)
            setEditValue(e.key) // Start with the typed character
          }
          return
        }
      }
      
      // Handle Delete and Backspace keys
      if (e.key !== 'Delete' && e.key !== 'Backspace') return
      
      // Handle row deletion
      if (selectedRow) {
        e.preventDefault()
        deleteContact(selectedRow)
        setSelectedRow(null)
        return
      }
      
      // Handle single cell deletion
      if (selectedCell && !dragRange) {
        e.preventDefault()
        updateContact(selectedCell.rowId, { [selectedCell.field]: '' })
      }
      
      // Handle range deletion
      if (dragRange && selectedCell) {
        e.preventDefault()
        const fieldsInRange = Object.keys(fieldToColumn).filter(field => {
          const colIndex = fieldToColumn[field]
          return colIndex >= dragRange.startCol && colIndex <= dragRange.endCol
        })
        
        // Update contacts using context
        filteredContacts.forEach((contact, contactIndex) => {
          if (contactIndex >= dragRange.startRow && contactIndex <= dragRange.endRow) {
            const updates: Partial<Omit<Contact, 'id'>> = {}
            fieldsInRange.forEach(field => {
              updates[field as keyof Omit<Contact, 'id'>] = ''
            })
            updateContact(contact.id, updates)
          }
        })
        
        // Clear the drag range after deletion
        setDragRange(null)
        setSelectedCell(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedCell, dragRange, editingCell, filteredContacts, fieldToColumn, selectedRow, clipboardContent])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
        {/* Header */}
        <div className="mb-8 pb-6 border-b border-border/20">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-light tracking-tight text-foreground">Cold DM Tracker</h1>
            
            {/* Filter Dropdown */}
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="appearance-none bg-background border border-border rounded-md px-3 py-2 pr-8 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors duration-200"
              >
                <option value="all">All Contacts</option>
                <option value="sent">DM Sent</option>
                <option value="not-sent">Not Sent</option>
                <option value="responded">Responded</option>
                <option value="not-interested">Not Interested</option>
                <option value="pending">Pending Response</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="text-center">
            <div className="text-3xl font-light text-foreground mb-1">{contacts.length}</div>
            <div className="text-sm text-muted-foreground">Cold DMs Sent</div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-light text-green-600 dark:text-green-400 mb-1">{contacts.filter(c => c.response.toUpperCase() === 'Y').length}</div>
            <div className="text-sm text-muted-foreground">Positive Responses</div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-light text-red-600 dark:text-red-400 mb-1">{contacts.filter(c => c.response.toUpperCase() === 'N').length}</div>
            <div className="text-sm text-muted-foreground">Not Interested</div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-light text-purple-600 dark:text-purple-400 mb-1">
              {contacts.length > 0 ? Math.round((contacts.filter(c => c.response.toUpperCase() === 'Y').length / contacts.length) * 100) : 0}%
            </div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
          </div>
        </div>

        {/* Google Sheets-like Table */}
        <div className="bg-background rounded-lg overflow-hidden" data-table-container>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              {/* Header Row */}
              <thead>
                <tr className="border-b border-border/20">
                  <th className="w-12 h-10 text-center text-xs text-muted-foreground"></th>
                  <th className="w-48 h-10 text-left text-sm font-medium text-foreground">
                    Nom
                  </th>
                  <th className="w-64 h-10 text-left text-sm font-medium text-foreground">
                    Contact
                  </th>
                  <th className="w-32 h-10 text-left text-sm font-medium text-foreground">
                    Chat URL
                  </th>
                  <th className="w-32 h-10 text-left text-sm font-medium text-foreground">
                    Sent <span className="text-xs text-muted-foreground font-normal">(Y/N)</span>
                  </th>
                  <th className="w-32 h-10 text-left text-sm font-medium text-foreground">
                    Response <span className="text-xs text-muted-foreground font-normal">(Y/N)</span>
                  </th>
                  <th className="w-12 h-10 text-center text-xs text-muted-foreground"></th>
                </tr>
              </thead>
              
              {/* Data Rows */}
              <tbody>
                {filteredContacts.map((contact, index) => (
                  <tr key={contact.id} className={`transition-colors duration-300 ${
                    highlightedContactId === contact.id
                      ? 'bg-muted/20'
                      : selectedRow === contact.id 
                        ? 'bg-blue-500/10 hover:bg-blue-500/15' 
                        : 'hover:bg-muted/20'
                  }`}>
                    {/* Row Number */}
                    <td 
                      className={`w-12 h-10 text-center text-xs cursor-pointer transition-colors duration-150 ${
                        selectedRow === contact.id 
                          ? 'text-blue-600 dark:text-blue-400 bg-blue-500/5' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                      }`}
                      onClick={() => handleRowNumberClick(contact.id)}
                    >
                      {index + 1}
                    </td>
                    
                    {/* Nom */}
                    <td className="w-48 h-10 relative">
                      {editingCell?.rowId === contact.id && editingCell?.field === 'nom' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleCellSave}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCellSave()
                            if (e.key === 'Escape') handleCellCancel()
                          }}
                          className="w-full h-full px-2 py-0 text-sm border-none outline-none bg-background text-foreground m-0 box-border flex items-center"
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={() => handleCellClick(contact.id, 'nom')}
                          onDoubleClick={() => handleCellDoubleClick(contact.id, 'nom', contact.nom)}
                          onMouseEnter={() => handleCellMouseEnter(index, 'nom')}
                          className={`w-full h-full px-2 text-sm cursor-pointer hover:bg-muted/50 flex items-center text-foreground relative transition-all duration-75 border overflow-hidden ${
                            selectedCell?.rowId === contact.id && selectedCell?.field === 'nom' 
                              ? 'border-blue-500' 
                              : isCellInDragRange(index, 'nom')
                              ? 'bg-blue-500/10 border-l border-r border-dotted border-blue-400'
                              : 'border-transparent'
                          }`}
                        >
                          <div className="truncate min-w-0 flex-1 max-w-full">
                            {contact.nom}
                          </div>
                          {selectedCell?.rowId === contact.id && selectedCell?.field === 'nom' && (
                            <div
                              className="absolute bottom-0 right-0 w-5 h-5 cursor-nw-resize"
                              onMouseDown={(e) => handleDragHandleMouseDown(e, index, 'nom')}
                              onMouseUp={handleDragHandleMouseUp}
                            >
                              <div className="absolute bottom-0 right-0 w-2 h-2 bg-blue-500 rounded-full transition-colors duration-100 hover:bg-blue-600 transform translate-x-1 translate-y-1"></div>
                            </div>
                          )}
          </div>
                      )}
                    </td>
                    
                    {/* Contact */}
                    <td className="w-64 h-10 relative">
                      {editingCell?.rowId === contact.id && editingCell?.field === 'contact' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleCellSave}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCellSave()
                            if (e.key === 'Escape') handleCellCancel()
                          }}
                          className="w-full h-full px-2 py-0 text-sm border-none outline-none bg-background text-foreground m-0 box-border flex items-center"
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={() => handleCellClick(contact.id, 'contact')}
                          onDoubleClick={() => handleCellDoubleClick(contact.id, 'contact', contact.contact)}
                          onMouseEnter={() => handleCellMouseEnter(index, 'contact')}
                          className={`w-full h-full px-2 text-sm cursor-pointer hover:bg-muted/50 flex items-center text-foreground relative transition-all duration-75 border overflow-hidden ${
                            selectedCell?.rowId === contact.id && selectedCell?.field === 'contact' 
                              ? 'border-blue-500' 
                              : isCellInDragRange(index, 'contact')
                              ? 'bg-blue-500/10 border-l border-r border-dotted border-blue-400'
                              : 'border-transparent'
                          }`}
                        >
                          <div className="truncate min-w-0 flex-1 max-w-full">
                            {contact.contact}
                          </div>
                          {selectedCell?.rowId === contact.id && selectedCell?.field === 'contact' && (
                            <div
                              className="absolute bottom-0 right-0 w-5 h-5 cursor-nw-resize"
                              onMouseDown={(e) => handleDragHandleMouseDown(e, index, 'contact')}
                              onMouseUp={handleDragHandleMouseUp}
                            >
                              <div className="absolute bottom-0 right-0 w-2 h-2 bg-blue-500 rounded-full transition-colors duration-100 hover:bg-blue-600 transform translate-x-1 translate-y-1"></div>
                            </div>
                          )}
        </div>
                      )}
                    </td>
                    
                    {/* Chat URL */}
                    <td className="w-32 h-10 relative">
                      {editingCell?.rowId === contact.id && editingCell?.field === 'chatUrl' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleCellSave}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCellSave()
                            if (e.key === 'Escape') handleCellCancel()
                          }}
                          className="w-full h-full px-2 py-0 text-sm border-none outline-none bg-background text-foreground m-0 box-border flex items-center"
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={(e) => contact.chatUrl ? handleUrlClick(contact.chatUrl, e) : handleCellClick(contact.id, 'chatUrl')}
                          onDoubleClick={() => handleUrlDoubleClick(contact.id, contact.chatUrl)}
                          onMouseEnter={() => handleCellMouseEnter(index, 'chatUrl')}
                          className={`w-full h-full px-2 text-sm cursor-pointer hover:bg-muted/50 flex items-center text-foreground relative transition-all duration-75 border overflow-hidden ${
                            selectedCell?.rowId === contact.id && selectedCell?.field === 'chatUrl' 
                              ? 'border-blue-500' 
                              : isCellInDragRange(index, 'chatUrl')
                              ? 'bg-blue-500/10 border-l border-r border-dotted border-blue-400'
                              : 'border-transparent'
                          }`}
                        >
                          <div className="truncate min-w-0 flex-1 max-w-full">
                            {contact.chatUrl && (
                              <span className="text-blue-600 dark:text-blue-400 hover:underline">
                                {getUrlDisplayText(contact.chatUrl)}
                    </span>
                            )}
                          </div>
                          {selectedCell?.rowId === contact.id && selectedCell?.field === 'chatUrl' && (
                            <div
                              className="absolute bottom-0 right-0 w-5 h-5 cursor-nw-resize"
                              onMouseDown={(e) => handleDragHandleMouseDown(e, index, 'chatUrl')}
                              onMouseUp={handleDragHandleMouseUp}
                            >
                              <div className="absolute bottom-0 right-0 w-2 h-2 bg-blue-500 rounded-full transition-colors duration-100 hover:bg-blue-600 transform translate-x-1 translate-y-1"></div>
                            </div>
                          )}
                  </div>
                      )}
                    </td>
                    
                    {/* Message Sent */}
                    <td className="w-32 h-10 relative">
                      {editingCell?.rowId === contact.id && editingCell?.field === 'messageSent' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleCellSave}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCellSave()
                            if (e.key === 'Escape') handleCellCancel()
                          }}
                          className="w-full h-full px-2 py-0 text-sm border-none outline-none bg-background text-foreground m-0 box-border flex items-center"
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={() => handleCellClick(contact.id, 'messageSent')}
                          onDoubleClick={() => handleCellDoubleClick(contact.id, 'messageSent', contact.messageSent)}
                          onMouseEnter={() => handleCellMouseEnter(index, 'messageSent')}
                          className={`w-full h-full px-2 text-sm cursor-pointer hover:bg-muted/50 flex items-center text-foreground relative transition-all duration-75 border overflow-hidden ${
                            selectedCell?.rowId === contact.id && selectedCell?.field === 'messageSent' 
                              ? 'border-blue-500' 
                              : isCellInDragRange(index, 'messageSent')
                              ? 'bg-blue-500/10 border-l border-r border-dotted border-blue-400'
                              : 'border-transparent'
                          }`}
                        >
                          <div className="truncate min-w-0 flex-1 max-w-full">
                            {contact.messageSent ? (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                contact.messageSent.toUpperCase() === 'Y'
                                  ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                                  : 'bg-red-500/10 text-red-600 dark:text-red-400'
                              }`}>
                                {contact.messageSent.toUpperCase()}
                        </span>
                            ) : null}
                          </div>
                          {selectedCell?.rowId === contact.id && selectedCell?.field === 'messageSent' && (
                            <div
                              className="absolute bottom-0 right-0 w-5 h-5 cursor-nw-resize"
                              onMouseDown={(e) => handleDragHandleMouseDown(e, index, 'messageSent')}
                              onMouseUp={handleDragHandleMouseUp}
                            >
                              <div className="absolute bottom-0 right-0 w-2 h-2 bg-blue-500 rounded-full transition-colors duration-100 hover:bg-blue-600 transform translate-x-1 translate-y-1"></div>
                            </div>
                          )}
                    </div>
                  )}
                    </td>
                    
                    {/* Response */}
                    <td className="w-32 h-10 relative">
                      {editingCell?.rowId === contact.id && editingCell?.field === 'response' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleCellSave}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCellSave()
                            if (e.key === 'Escape') handleCellCancel()
                          }}
                          className="w-full h-full px-2 py-0 text-sm border-none outline-none bg-background text-foreground m-0 box-border flex items-center"
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={() => handleCellClick(contact.id, 'response')}
                          onDoubleClick={() => handleCellDoubleClick(contact.id, 'response', contact.response)}
                          onMouseEnter={() => handleCellMouseEnter(index, 'response')}
                          className={`w-full h-full px-2 text-sm cursor-pointer hover:bg-muted/50 flex items-center text-foreground relative transition-all duration-75 border overflow-hidden ${
                            selectedCell?.rowId === contact.id && selectedCell?.field === 'response' 
                              ? 'border-blue-500' 
                              : isCellInDragRange(index, 'response')
                              ? 'bg-blue-500/10 border-l border-r border-dotted border-blue-400'
                              : 'border-transparent'
                          }`}
                        >
                          <div className="truncate min-w-0 w-full">
                            {contact.response ? (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                contact.response.toUpperCase() === 'Y'
                                  ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                                  : 'bg-red-500/10 text-red-600 dark:text-red-400'
                              }`}>
                                {contact.response.toUpperCase()}
                              </span>
                            ) : null}
                </div>
                          {selectedCell?.rowId === contact.id && selectedCell?.field === 'response' && (
                            <div
                              className="absolute bottom-0 right-0 w-5 h-5 cursor-nw-resize"
                              onMouseDown={(e) => handleDragHandleMouseDown(e, index, 'response')}
                              onMouseUp={handleDragHandleMouseUp}
                            >
                              <div className="absolute bottom-0 right-0 w-2 h-2 bg-blue-500 rounded-full transition-colors duration-100 hover:bg-blue-600 transform translate-x-1 translate-y-1"></div>
                            </div>
                          )}
              </div>
                      )}
                    </td>
                    
                    {/* Delete Row Button */}
                    <td className="w-12 h-10 text-center">
                      <button
                        onClick={(e) => handleMinusClick(contact.id, e)}
                        className="w-6 h-6 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-white/40 dark:hover:text-white/80 dark:hover:bg-white/10 rounded transition-colors duration-150 flex items-center justify-center"
                        title="Delete row"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Add Row Indicator */}
            <div 
              className="w-full h-10 border-t border-border/20 hover:bg-muted/20 transition-colors duration-150 cursor-pointer flex items-center justify-center"
              onClick={addNewRow}
            >
              <Plus className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors duration-150" />
            </div>
            </div>
        </div>

        {filteredContacts.length === 0 && (
          <div className="text-center py-16">
            {isAnalyzing ? (
              <div className="max-w-md mx-auto">
                <div className="flex items-center justify-center gap-2 text-lg text-foreground mb-4">
                  <div className="w-px h-5 bg-foreground animate-cursor-rotate" />
                  <span>Analyzing user activity</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Processing Reddit data for u/{searchQuery.replace(/^u\//, '').trim()} to find the best time to DM. 
                  This may take a moment as we analyze their posting patterns and engagement history.
                </p>
              </div>
            ) : (
              <div className="max-w-md mx-auto">
                <div className="mb-8">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Search className="w-6 h-6 text-blue-500" />
                    <h3 className="text-xl font-medium text-foreground">Reddit User Analysis</h3>
                  </div>
                  <p className="text-muted-foreground mb-6">Find the best time to DM any Reddit user</p>
                  {/* <p className="text-sm text-muted-foreground mb-8">
                    Try: <span className="font-mono bg-muted/50 px-2 py-1 rounded">spez</span>, <span className="font-mono bg-muted/50 px-2 py-1 rounded">gallowboob</span>, or any active Reddit user
                  </p> */}
                </div>
                
                <div className="bg-background/95 backdrop-blur-sm  rounded-lg p-6 ">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="u/username"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleRedditUsernameAnalysis()
                        }
                      }}
                      className="flex-1 px-4 py-3 bg-background border border-border/30 rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-blue-500/50 transition-colors duration-200"
                    />
                    <button
                      onClick={handleRedditUsernameAnalysis}
                      disabled={!searchQuery.trim() || isAnalyzing}
                      className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                    >
                      {isAnalyzing ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky Reddit Analysis Input - Only show when contacts exist */}
      {filteredContacts.length > 0 && (
        <div className="fixed bottom-12 left-6 z-40">
          <div className="bg-background/95 backdrop-blur-sm border border-border/30 rounded-lg p-3 shadow-lg">
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-1">
                <Search className="w-3 h-3 text-blue-500" />
                <span className="text-xs font-medium text-foreground">Reddit User Analysis</span>
              </div>
              <p className="text-xs text-muted-foreground">Find best time to DM any Reddit user</p>
  
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="u/username"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRedditUsernameAnalysis()
                  }
                }}
                className="flex-1 px-2 py-1.5 bg-background border border-border/30 rounded text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-blue-500/50 transition-colors duration-200"
              />
              <button
                onClick={handleRedditUsernameAnalysis}
                disabled={!searchQuery.trim() || isAnalyzing}
                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded text-xs font-medium transition-colors duration-200 flex items-center gap-1"
              >
                {isAnalyzing ? (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Search className="w-3 h-3" />
                )}
                {/* {isAnalyzing ? 'Analyzing...' : 'Analyze'} */}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* URL Popup */}
      {showUrlModal && (
        <div 
          className="fixed z-50 bg-background border border-border rounded-lg p-3 shadow-lg max-w-xs"
          style={{
            left: `${modalPosition.x}px`,
            top: `${modalPosition.y}px`
          }}
        >
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground break-all">
              {selectedUrl}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  window.open(selectedUrl, '_blank')
                  setShowUrlModal(false)
                }}
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700 px-2 py-1 rounded text-xs font-medium transition-colors"
              >
                Open
              </button>
              <button
                onClick={() => setShowUrlModal(false)}
                className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Activity Modal */}
      {showUserActivity && userActivityData && (
        <UserActivityModal
          userData={userActivityData}
          onClose={() => {
            setShowUserActivity(false)
            setUserActivityData(null)
          }}
          onAddToCRM={handleAddToCRM}
        />
      )}
    </div>
  )
}
