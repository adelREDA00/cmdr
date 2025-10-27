'use client'
import { useState, useRef, useCallback, useEffect } from "react"
import { Plus, ZoomIn, ZoomOut, RotateCcw, Edit3, Trash2, HelpCircle } from "lucide-react"
import { useDocumentVisualState } from "../contexts/document-visual-state"
import { useDocumentContent } from "../contexts/document-content-state"
import { useCanvasViewState } from "../contexts/canvas-view-state"


interface CanvasTextEditorProps {
  onDocumentSelect?: (documentId: string) => void
}

export function CanvasTextEditor({ 
  onDocumentSelect
}: CanvasTextEditorProps) {

  const { updateVisualState, getVisualState, clearVisualState } = useDocumentVisualState()
  const { 
    documents, 
    createDocument, 
    updateDocument, 
    deleteDocument
  } = useDocumentContent()
  const { canvasState, updateCanvasState, resetCanvasState } = useCanvasViewState()
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null)
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set())
  const [editingTitle, setEditingTitle] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [isSelecting, setIsSelecting] = useState(false)
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [selectionRect, setSelectionRect] = useState<{
    startX: number
    startY: number
    endX: number
    endY: number
  } | null>(null)

  // Use refs for immediate visual feedback without waiting for React re-renders
  const containerRef = useRef<HTMLDivElement>(null)
  const documentsRef = useRef<Map<string, HTMLDivElement>>(new Map())
  const isPanningRef = useRef(false)
  const isDraggingRef = useRef(false)
  const isResizingRef = useRef(false)
  const isMultiDraggingRef = useRef(false)
  const dragStateRef = useRef<{
    docId: string
    startX: number
    startY: number
    initialDocX: number
    initialDocY: number
  } | null>(null)
  const resizeStateRef = useRef<{
    docId: string
    handle: string
    startX: number
    startY: number
    initialWidth: number
    initialHeight: number
    initialX: number
    initialY: number
    currentWidth?: number
    currentHeight?: number
    currentX?: number
    currentY?: number
  } | null>(null)
  const panStateRef = useRef<{ startX: number; startY: number; initialPanX: number; initialPanY: number } | null>(null)
  const multiDragStateRef = useRef<{
    selectedDocs: Set<string>
    startX: number
    startY: number
    initialPositions: Map<string, { x: number; y: number }>
  } | null>(null)
  const previousZoomRef = useRef(canvasState.zoom)

  // Handle zoom centering when zoom changes
  useEffect(() => {
    if (previousZoomRef.current !== canvasState.zoom) {
      const zoomRatio = canvasState.zoom / previousZoomRef.current
      const containerRect = containerRef.current?.getBoundingClientRect()
      
      if (containerRect) {
        const centerX = containerRect.width / 2
        const centerY = containerRect.height / 2
        
        // Calculate new pan position to keep the center point stable
        const newPanX = centerX - (centerX - canvasState.pan.x) * zoomRatio
        const newPanY = centerY - (centerY - canvasState.pan.y) * zoomRatio
        
        updateCanvasState({
          pan: { x: newPanX, y: newPanY }
        })
      }
      
      previousZoomRef.current = canvasState.zoom
    }
  }, [canvasState.zoom, updateCanvasState])

  // Handle zoom with Ctrl + scroll
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault()
        const delta = e.deltaY > 0 ? 0.9 : 1.1
        const newZoom = Math.max(0.1, Math.min(3, canvasState.zoom * delta))
        updateCanvasState({ zoom: newZoom })
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false })
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel)
      }
    }
  }, [canvasState.zoom, updateCanvasState])

  // Global mouse move and up handlers for smooth dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      
      // Handle selection rectangle
      if (isSelecting && selectionRect) {
        const rect = containerRef.current?.getBoundingClientRect()
        if (rect) {
          const endX = (e.clientX - rect.left - canvasState.pan.x) / canvasState.zoom
          const endY = (e.clientY - rect.top - canvasState.pan.y) / canvasState.zoom
          setSelectionRect({
            ...selectionRect,
            endX,
            endY
          })
          
          // Check which documents are in selection
          const newSelectedDocs = new Set<string>()
          Array.from(documents.values()).forEach(doc => {
            const visualState = getVisualState(doc.id, { x: 0, y: 0, width: 300, height: 200 })
            const docRect = {
              left: visualState.x,
              top: visualState.y,
              right: visualState.x + visualState.width,
              bottom: visualState.y + visualState.height
            }
            
            const selectionLeft = Math.min(selectionRect.startX, endX)
            const selectionRight = Math.max(selectionRect.startX, endX)
            const selectionTop = Math.min(selectionRect.startY, endY)
            const selectionBottom = Math.max(selectionRect.startY, endY)
            
            if (docRect.left < selectionRight && docRect.right > selectionLeft &&
                docRect.top < selectionBottom && docRect.bottom > selectionTop) {
              newSelectedDocs.add(doc.id)
            }
          })
          setSelectedDocuments(newSelectedDocs)
        }
        return
      }
      
      // Handle multi-dragging
      if (isMultiDraggingRef.current && multiDragStateRef.current) {
        const deltaX = (e.clientX - multiDragStateRef.current.startX) / canvasState.zoom
        const deltaY = (e.clientY - multiDragStateRef.current.startY) / canvasState.zoom
        
        multiDragStateRef.current.selectedDocs.forEach(docId => {
          const initialPos = multiDragStateRef.current!.initialPositions.get(docId)
          if (initialPos) {
            const newX = initialPos.x + deltaX
            const newY = initialPos.y + deltaY
            
            // Update DOM directly for instant feedback
            const docElement = documentsRef.current.get(docId)
            if (docElement) {
              docElement.style.transform = `translate(${newX}px, ${newY}px)`
            }
            // Update visual state in context
            updateVisualState(docId, { x: newX, y: newY })
          }
        })
        return
      }
      
      // Handle panning
      if (isPanningRef.current && panStateRef.current) {
        const deltaX = e.clientX - panStateRef.current.startX
        const deltaY = e.clientY - panStateRef.current.startY
        updateCanvasState({
          pan: {
            x: panStateRef.current.initialPanX + deltaX,
            y: panStateRef.current.initialPanY + deltaY
          }
        })
        return
      }

      // Handle dragging with immediate visual feedback
      if (isDraggingRef.current && dragStateRef.current) {
        const deltaX = (e.clientX - dragStateRef.current.startX) / canvasState.zoom
        const deltaY = (e.clientY - dragStateRef.current.startY) / canvasState.zoom
        
        const newX = dragStateRef.current.initialDocX + deltaX
        const newY = dragStateRef.current.initialDocY + deltaY

        // Update DOM directly for instant feedback
        const docElement = documentsRef.current.get(dragStateRef.current.docId)
        if (docElement) {
          docElement.style.transform = `translate(${newX}px, ${newY}px)`
          // Update visual state in context
          updateVisualState(dragStateRef.current.docId, { x: newX, y: newY })
        } else {
          console.warn('Document element not found for dragging:', dragStateRef.current.docId)
        }
        return
      }

      // Handle resizing with immediate visual feedback
      if (isResizingRef.current && resizeStateRef.current) {
        const state = resizeStateRef.current
        const deltaX = (e.clientX - state.startX) / canvasState.zoom
        const deltaY = (e.clientY - state.startY) / canvasState.zoom
        
        let newWidth = state.initialWidth
        let newHeight = state.initialHeight
        let newX = state.initialX
        let newY = state.initialY
        
        if (state.handle.includes('e')) newWidth += deltaX
        if (state.handle.includes('w')) {
          newWidth -= deltaX
        }
        if (state.handle.includes('s')) newHeight += deltaY
        if (state.handle.includes('n')) {
          newHeight -= deltaY
        }
        
        newWidth = Math.max(200, newWidth)
        newHeight = Math.max(150, newHeight)

        // Recalculate position adjustments for west/north handles
        if (state.handle.includes('w')) {
          newX = state.initialX + (state.initialWidth - newWidth)
        }
        if (state.handle.includes('n')) {
          newY = state.initialY + (state.initialHeight - newHeight)
        }

        // Store current values in ref for mouseup
        resizeStateRef.current.currentWidth = newWidth
        resizeStateRef.current.currentHeight = newHeight
        resizeStateRef.current.currentX = newX
        resizeStateRef.current.currentY = newY

        // Update DOM directly for instant feedback
        const docElement = documentsRef.current.get(state.docId)
        if (docElement) {
          docElement.style.width = `${newWidth}px`
          docElement.style.height = `${newHeight}px`
          docElement.style.transform = `translate(${newX}px, ${newY}px)`
          // Update visual state in context
          updateVisualState(state.docId, { width: newWidth, height: newHeight, x: newX, y: newY })
        }
        return
      }
    }

    const handleGlobalMouseUp = () => {
      // Finalize selection
      if (isSelecting) {
        setIsSelecting(false)
        setSelectionRect(null)
        if (containerRef.current) {
          containerRef.current.style.cursor = 'default'
        }
      }

      // Finalize multi-dragging
      if (isMultiDraggingRef.current) {
        isMultiDraggingRef.current = false
        multiDragStateRef.current = null
      }

      // Finalize panning
      if (isPanningRef.current) {
        isPanningRef.current = false
        panStateRef.current = null
        if (containerRef.current) {
          containerRef.current.style.cursor = 'default'
        }
      }

      // Finalize dragging
      if (isDraggingRef.current && dragStateRef.current) {
        isDraggingRef.current = false
        dragStateRef.current = null
      }

      // Finalize resizing
      if (isResizingRef.current && resizeStateRef.current) {
        isResizingRef.current = false
        resizeStateRef.current = null
        
        // Reset cursor
        if (document.body) {
          document.body.style.cursor = 'default'
        }
      }
    }

    document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false })
    document.addEventListener('mouseup', handleGlobalMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [canvasState.zoom, isSelecting, selectionRect, canvasState.pan, documents, getVisualState, selectedDocuments])

  // Handle space key for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && editingTitle === null && !isSelecting) {
        e.preventDefault()
        setIsSpacePressed(true)
        if (containerRef.current) {
          containerRef.current.style.cursor = 'grab'
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false)
        if (containerRef.current && !isPanningRef.current) {
          containerRef.current.style.cursor = 'default'
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [editingTitle, isSelecting])

  // Sync DOM with visual state when documents change
  useEffect(() => {
    const documentIds = Array.from(documents.keys())
    documentIds.forEach(docId => {
      const el = documentsRef.current.get(docId)
      if (el && !isDraggingRef.current && !isResizingRef.current) {
        const visualState = getVisualState(docId, { x: 0, y: 0, width: 300, height: 200 })
        const expectedTransform = `translate(${visualState.x}px, ${visualState.y}px)`
        const expectedWidth = `${visualState.width}px`
        const expectedHeight = `${visualState.height}px`
        
        // Only update if there's a mismatch
        if (el.style.transform !== expectedTransform) {
          el.style.transform = expectedTransform
        }
        if (el.style.width !== expectedWidth) {
          el.style.width = expectedWidth
        }
        if (el.style.height !== expectedHeight) {
          el.style.height = expectedHeight
        }
      }
    })
  }, [documents, getVisualState])

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return

    const target = e.target as HTMLElement
    if (target.classList.contains('canvas-background') || target.classList.contains('canvas-container')) {
      // Check if space bar is held down for panning
      if (isSpacePressed) {
        isPanningRef.current = true
        panStateRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          initialPanX: canvasState.pan.x,
          initialPanY: canvasState.pan.y
        }
        if (containerRef.current) {
          containerRef.current.style.cursor = 'grabbing'
        }
        return
      }
      
      // Check if we're starting a multi-drag on selected documents
      if (selectedDocuments.size > 0) {
        const rect = containerRef.current?.getBoundingClientRect()
        if (rect) {
          const startX = (e.clientX - rect.left - canvasState.pan.x) / canvasState.zoom
          const startY = (e.clientY - rect.top - canvasState.pan.y) / canvasState.zoom
          
          // Check if click is on any selected document
          let clickedOnSelected = false
          selectedDocuments.forEach(docId => {
            const visualState = getVisualState(docId, { x: 0, y: 0, width: 300, height: 200 })
            if (startX >= visualState.x && startX <= visualState.x + visualState.width &&
                startY >= visualState.y && startY <= visualState.y + visualState.height) {
              clickedOnSelected = true
            }
          })
          
          if (clickedOnSelected) {
            // Start multi-drag
            isMultiDraggingRef.current = true
            const initialPositions = new Map<string, { x: number; y: number }>()
            selectedDocuments.forEach(docId => {
              const visualState = getVisualState(docId, { x: 0, y: 0, width: 300, height: 200 })
              initialPositions.set(docId, { x: visualState.x, y: visualState.y })
            })
            
            multiDragStateRef.current = {
              selectedDocs: selectedDocuments,
              startX: e.clientX,
              startY: e.clientY,
              initialPositions
            }
            return
          }
        }
      }
      
      // Start selection rectangle
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        const startX = (e.clientX - rect.left - canvasState.pan.x) / canvasState.zoom
        const startY = (e.clientY - rect.top - canvasState.pan.y) / canvasState.zoom
        
        setIsSelecting(true)
        setSelectionRect({
          startX,
          startY,
          endX: startX,
          endY: startY
        })
        setSelectedDocuments(new Set())
        setSelectedDocument(null)
      }
    }
  }, [canvasState.pan, canvasState.zoom, selectedDocuments, getVisualState, isSpacePressed])

  const handleCreateDocument = () => {
    const newDocId = createDocument('Untitled Document', '')
    
    // Set initial visual position
    updateVisualState(newDocId, {
      x: -canvasState.pan.x / canvasState.zoom + 200,
      y: -canvasState.pan.y / canvasState.zoom + 200,
      width: 300,
      height: 200
    })
    
    // Auto-select the new document after creation
    setTimeout(() => {
      setSelectedDocument(newDocId)
    }, 100)
  }

  const handleDeleteDocument = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    deleteDocument(id)
    // Clear visual state for deleted document
    clearVisualState(id)
    if (selectedDocument === id) {
      setSelectedDocument(null)
    }
  }


  const handleDocumentClick = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation()
    if (!isDraggingRef.current && !isResizingRef.current && !isMultiDraggingRef.current) {
      if (e.ctrlKey || e.metaKey) {
        // Add/remove from selection
        const newSelected = new Set(selectedDocuments)
        if (newSelected.has(docId)) {
          newSelected.delete(docId)
        } else {
          newSelected.add(docId)
        }
        setSelectedDocuments(newSelected)
        setSelectedDocument(newSelected.size === 1 ? docId : null)
      } else {
        // Single selection
        setSelectedDocument(docId)
        setSelectedDocuments(new Set([docId]))
      }
    }
  }

  const handleDocumentDoubleClick = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation()
    // Double-click to open document
    if (onDocumentSelect) {
      onDocumentSelect(docId)
    }
  }

  const handleEditClick = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation()
    if (onDocumentSelect) {
      onDocumentSelect(docId)
    }
  }

  const handleDocumentMouseDown = (e: React.MouseEvent, docId: string) => {
    if (e.button !== 0 || isPanningRef.current || isSelecting) return
    
    const target = e.target as HTMLElement
    if (target.closest('.doc-actions') || target.closest('input')) return

    e.stopPropagation()
    e.preventDefault()
    
    // Check if element exists in refs
    const docElement = documentsRef.current.get(docId)
    if (!docElement) {
      console.warn('Document element not found in refs during mousedown:', docId)
      return
    }
    
    // If this document is not in the current selection, select only this one
    if (!selectedDocuments.has(docId)) {
      setSelectedDocument(docId)
      setSelectedDocuments(new Set([docId]))
    }
    
    // Check if we should start multi-drag (if this document is part of multi-selection)
    if (selectedDocuments.has(docId) && selectedDocuments.size > 1) {
      // Start multi-drag
      isMultiDraggingRef.current = true
      const initialPositions = new Map<string, { x: number; y: number }>()
      selectedDocuments.forEach(selectedDocId => {
        const visualState = getVisualState(selectedDocId, { x: 0, y: 0, width: 300, height: 200 })
        initialPositions.set(selectedDocId, { x: visualState.x, y: visualState.y })
      })
      
      multiDragStateRef.current = {
        selectedDocs: selectedDocuments,
        startX: e.clientX,
        startY: e.clientY,
        initialPositions
      }
    } else {
      // Start single document drag
      isDraggingRef.current = true
      const visualState = getVisualState(docId, { x: 0, y: 0, width: 300, height: 200 })
      dragStateRef.current = {
        docId: docId,
        startX: e.clientX,
        startY: e.clientY,
        initialDocX: visualState.x,
        initialDocY: visualState.y
      }
    }
  }

  const handleResizeMouseDown = (e: React.MouseEvent, docId: string, handle: string) => {
    e.stopPropagation()
    e.preventDefault()
    
    isResizingRef.current = true
    const visualState = getVisualState(docId, { x: 0, y: 0, width: 300, height: 200 })
    resizeStateRef.current = {
      docId: docId,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialWidth: visualState.width,
      initialHeight: visualState.height,
      initialX: visualState.x,
      initialY: visualState.y
    }

    // Set cursor for entire document during resize
    if (document.body) {
      const cursorMap: Record<string, string> = {
        'nw': 'nw-resize',
        'ne': 'ne-resize',
        'sw': 'sw-resize',
        'se': 'se-resize',
        'n': 'n-resize',
        's': 's-resize',
        'e': 'e-resize',
        'w': 'w-resize'
      }
      document.body.style.cursor = cursorMap[handle] || 'default'
    }
  }

  const startTitleEdit = (e: React.MouseEvent, docId: string, currentTitle: string) => {
    e.stopPropagation()
    setEditingTitle(docId)
    setNewTitle(currentTitle)
  }

  const saveTitleEdit = (docId: string) => {
    if (newTitle.trim()) {
      updateDocument(docId, { title: newTitle.trim() })
    }
    setEditingTitle(null)
    setNewTitle('')
  }

  // Function to get preview content (first 2-4 paragraphs)
  const getContentPreview = (content: string, maxParagraphs: number = 3): string => {
    if (!content.trim()) return ''
    
    // Split content into paragraphs (by double newlines, single newlines, or bullet points)
    const paragraphs = content
      .split(/\n\s*\n|\n(?=\s*[-*•]|\n(?=\s*\d+\.))/)
      .map(p => p.trim())
      .filter(p => p.length > 0)
    
    if (paragraphs.length === 0) return ''
    
    // If no clear paragraphs, split by single newlines
    if (paragraphs.length === 1) {
      const lines = content.split('\n').filter(line => line.trim())
      if (lines.length > 1) {
        const previewLines = lines.slice(0, Math.min(maxParagraphs, lines.length))
        let preview = previewLines.join('\n')
        if (lines.length > maxParagraphs) {
          preview += '...'
        }
        return preview.length > 300 ? preview.substring(0, 300).trim() + '...' : preview
      }
    }
    
    // Take first few paragraphs
    const previewParagraphs = paragraphs.slice(0, maxParagraphs)
    let preview = previewParagraphs.join('\n\n')
    
    // If we have more paragraphs, add ellipsis
    if (paragraphs.length > maxParagraphs) {
      preview += '...'
    }
    
    // Limit total length to prevent overflow (reduced from 400 to 300 for better fit)
    const maxLength = 300
    if (preview.length > maxLength) {
      preview = preview.substring(0, maxLength).trim() + '...'
    }
    
    return preview
  }

  return (
    <div 
      ref={containerRef}
      className="canvas-container w-full h-screen bg-background text-foreground overflow-hidden relative select-none"
      onMouseDown={handleCanvasMouseDown}
    >
       {/* Canvas */}
       <div
         className="canvas-background w-full h-full relative"
         style={{
           transform: `translate(${canvasState.pan.x}px, ${canvasState.pan.y}px) scale(${canvasState.zoom})`,
           transformOrigin: '0 0',
           willChange: 'transform'
         }}
       >

        {/* Documents */}
        {Array.from(documents.values()).map((doc) => {
          const isSelected = selectedDocument === doc.id
          const isMultiSelected = selectedDocuments.has(doc.id)
          
          return (
            <div
              key={doc.id}
              ref={(el) => {
                if (el) {
                  documentsRef.current.set(doc.id, el)
                  // Always ensure styles match the visual state when not actively dragging/resizing
                  if (!isDraggingRef.current && !isResizingRef.current) {
                    const visualState = getVisualState(doc.id, { x: 0, y: 0, width: 300, height: 200 })
                    const currentTransform = el.style.transform
                    const expectedTransform = `translate(${visualState.x}px, ${visualState.y}px)`
                    const currentWidth = el.style.width
                    const expectedWidth = `${visualState.width}px`
                    const currentHeight = el.style.height
                    const expectedHeight = `${visualState.height}px`
                    
                    // Only update if there's a mismatch to avoid unnecessary DOM operations
                    if (currentTransform !== expectedTransform) {
                      el.style.transform = expectedTransform
                    }
                    if (currentWidth !== expectedWidth) {
                      el.style.width = expectedWidth
                    }
                    if (currentHeight !== expectedHeight) {
                      el.style.height = expectedHeight
                    }
                  }
                } else {
                  documentsRef.current.delete(doc.id)
                }
              }}
              className={`absolute rounded-lg transition-colors duration-150 flex flex-col ${
                isSelected 
                  ? 'border-2 border-blue-500' 
                  : isMultiSelected
                  ? 'border-2 border-blue-400'
                  : 'border border-gray-500'
              }`}
              style={{
                backgroundColor: 'transparent',
                cursor: 'grab',
                willChange: 'transform, width, height',
                touchAction: 'none'
              }}
              onMouseDown={(e) => handleDocumentMouseDown(e, doc.id)}
              onClick={(e) => handleDocumentClick(e, doc.id)}
              onDoubleClick={(e) => handleDocumentDoubleClick(e, doc.id)}
            >
              {/* Document Header */}
              <div className="flex items-center justify-between p-3">
                {editingTitle === doc.id ? (
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onBlur={() => saveTitleEdit(doc.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveTitleEdit(doc.id)
                      if (e.key === 'Escape') {
                        setEditingTitle(null)
                        setNewTitle('')
                      }
                    }}
                    className="bg-transparent text-foreground text-sm font-medium flex-1 outline-none"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <h3 
                    className="text-sm font-medium text-foreground flex-1 truncate cursor-text"
                    onDoubleClick={(e) => startTitleEdit(e, doc.id, doc.title)}
                  >
                    {doc.title}
                  </h3>
                )}
                
                {(isSelected || isMultiSelected) && (
                  <div className="doc-actions flex items-center gap-1 ml-2">
                    <button
                      onClick={(e) => handleEditClick(e, doc.id)}
                      className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
                      title="Edit document"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteDocument(doc.id, e)}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Document Content Preview - Read-only, never affects document state */}
              <div className="p-3 text-xs text-muted-foreground leading-relaxed overflow-hidden pointer-events-none flex-1 min-h-0">
                {doc.content ? (
                  <div className="whitespace-pre-wrap break-words overflow-hidden h-full" style={{ 
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    hyphens: 'auto'
                  }}>
                    {getContentPreview(doc.content)}
                  </div>
                ) : (
                  <div className="text-muted-foreground/50 italic">Empty document</div>
                )}
              </div>

              {/* Resize Handles - Only show when selected */}
              {(isSelected || isMultiSelected) && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Corner handles */}
                  <div
                    className="absolute w-3 h-3 bg-blue-500 rounded-full pointer-events-auto cursor-nw-resize hover:scale-125 transition-transform"
                    style={{ top: -6, left: -6 }}
                    onMouseDown={(e) => handleResizeMouseDown(e, doc.id, 'nw')}
                  />
                  <div
                    className="absolute w-3 h-3 bg-blue-500 rounded-full pointer-events-auto cursor-ne-resize hover:scale-125 transition-transform"
                    style={{ top: -6, right: -6 }}
                    onMouseDown={(e) => handleResizeMouseDown(e, doc.id, 'ne')}
                  />
                  <div
                    className="absolute w-3 h-3 bg-blue-500 rounded-full pointer-events-auto cursor-sw-resize hover:scale-125 transition-transform"
                    style={{ bottom: -6, left: -6 }}
                    onMouseDown={(e) => handleResizeMouseDown(e, doc.id, 'sw')}
                  />
                  <div
                    className="absolute w-3 h-3 bg-blue-500 rounded-full pointer-events-auto cursor-se-resize hover:scale-125 transition-transform"
                    style={{ bottom: -6, right: -6 }}
                    onMouseDown={(e) => handleResizeMouseDown(e, doc.id, 'se')}
                  />
                </div>
              )}
            </div>
          )
        })}
        
        {/* Selection Rectangle */}
        {isSelecting && selectionRect && (
          <div
            className="absolute border-2 border-blue-400 bg-blue-400/10 pointer-events-none"
            style={{
              left: Math.min(selectionRect.startX, selectionRect.endX),
              top: Math.min(selectionRect.startY, selectionRect.endY),
              width: Math.abs(selectionRect.endX - selectionRect.startX),
              height: Math.abs(selectionRect.endY - selectionRect.startY),
            }}
          />
        )}
      </div>

      {/* Toolbar */}
      <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-10 pointer-events-auto">
        <div className="flex flex-col bg-background/95 backdrop-blur-sm border border-border/40 rounded-xl p-1.5 shadow-2xl">
          {/* Add Document Button */}
          <button
            onClick={handleCreateDocument}
            className="w-8 h-8 bg-muted/80 hover:bg-muted text-foreground rounded-lg transition-all duration-200 flex items-center justify-center mb-2 group"
            title="New Document"
          >
            <Plus className="w-4 h-4" />
          </button>
          
          {/* Main Tools Section */}
          <div className="flex flex-col gap-1 mb-2">
            {/* Zoom Controls */}
            <div className="flex flex-col gap-1">
              <button
                onClick={() => {
                  const newZoom = Math.min(3, canvasState.zoom + 0.1)
                  updateCanvasState({ zoom: newZoom })
                }}
                className="w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200 flex items-center justify-center"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              
              <div className="text-center">
                <span className="text-[10px] text-muted-foreground font-mono">
                  {Math.round(canvasState.zoom * 100)}%
                </span>
              </div>
              
              <button
                onClick={() => {
                  const newZoom = Math.max(0.1, canvasState.zoom - 0.1)
                  updateCanvasState({ zoom: newZoom })
                }}
                className="w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200 flex items-center justify-center"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
            </div>
            
            {/* Separator */}
            <div className="w-6 h-px bg-border/50 mx-auto my-1.5"></div>
            
            {/* Reset Button */}
            <button
              onClick={() => {
                resetCanvasState()
              }}
              className="w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200 flex items-center justify-center"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
          
          {/* Bottom Section */}
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className={`w-8 h-8 rounded-lg transition-all duration-200 flex items-center justify-center ${
                showInstructions 
                  ? 'bg-primary/20 text-primary border border-primary/30' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
              title="Help & Shortcuts"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        
        {/* Instructions Dropdown */}
        {showInstructions && (
          <div className="absolute left-full top-0 ml-3 bg-background/95 backdrop-blur-sm border border-border/40 rounded-xl p-4 text-xs text-muted-foreground shadow-2xl min-w-[220px]">
            <div className="space-y-2">
              <div className="text-foreground font-medium mb-2">Canvas Shortcuts</div>
              <div className="flex items-center gap-2">
                <kbd className="bg-muted px-2 py-1 rounded text-[10px] font-mono text-muted-foreground">Ctrl</kbd>
                <span className="text-muted-foreground">+</span>
                <kbd className="bg-muted px-2 py-1 rounded text-[10px] font-mono text-muted-foreground">Scroll</kbd>
                <span className="text-muted-foreground">Zoom</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="bg-muted px-2 py-1 rounded text-[10px] font-mono text-muted-foreground">Space</kbd>
                <span className="text-muted-foreground">+</span>
                <kbd className="bg-muted px-2 py-1 rounded text-[10px] font-mono text-muted-foreground">Drag</kbd>
                <span className="text-muted-foreground">Pan</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="bg-muted px-2 py-1 rounded text-[10px] font-mono text-muted-foreground">Click</kbd>
                <span className="text-muted-foreground">Select</span>
                <span className="text-muted-foreground">•</span>
                <kbd className="bg-muted px-2 py-1 rounded text-[10px] font-mono text-muted-foreground">Drag</kbd>
                <span className="text-muted-foreground">Move</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="bg-muted px-2 py-1 rounded text-[10px] font-mono text-muted-foreground">Ctrl</kbd>
                <span className="text-muted-foreground">+</span>
                <kbd className="bg-muted px-2 py-1 rounded text-[10px] font-mono text-muted-foreground">Click</kbd>
                <span className="text-muted-foreground">Multi-select</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="bg-muted px-2 py-1 rounded text-[10px] font-mono text-muted-foreground">Drag</kbd>
                <span className="text-muted-foreground">Selection Rectangle</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}