'use client'
import { useState, useEffect, useRef } from "react"
import { ArrowLeft } from "lucide-react"
import { useDocumentContent } from "../contexts/document-content-state"

interface DocumentEditorProps {
  documentId: string
  title: string
  content: string
  onBack: () => void
  onSave: (documentId: string, title: string, content: string) => void
  onSwitchDocument: (documentId: string) => void
}

export function DocumentEditor({ documentId, title: initialTitle, content: initialContent, onBack, onSave, onSwitchDocument }: DocumentEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [title, setTitle] = useState(initialTitle)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const backgroundRef = useRef<HTMLDivElement>(null)
  const { getAllDocuments } = useDocumentContent()
  
  // Get all documents for the sidebar
  const allDocuments = getAllDocuments()

  // Update content when document changes
  useEffect(() => {
    setContent(initialContent)
    setTitle(initialTitle)
  }, [documentId, initialContent, initialTitle])

  // Handle input changes
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
  }

  // Handle paste events to prevent layout issues
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // Allow default paste behavior but ensure proper synchronization
    setTimeout(() => {
      syncScrollPositions()
    }, 0)
  }

  // Synchronize scroll positions between textarea and background
  const syncScrollPositions = () => {
    if (textareaRef.current && backgroundRef.current) {
      backgroundRef.current.scrollTop = textareaRef.current.scrollTop
      backgroundRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }

  // Handle scroll events to keep elements synchronized
  const handleScroll = () => {
    syncScrollPositions()
  }

  // Render content with line-by-line highlighting
  const renderHighlightedContent = () => {
    const lines = content.split('\n')
    return lines.map((line, index) => {
      const isHeading = line.trim().startsWith('##')
      return (
        <div 
          key={index} 
          className={`whitespace-pre-wrap ${isHeading ? 'text-blue-400' : 'text-foreground'}`}
        >
          {line || '\u00A0'}
        </div>
      )
    })
  }

  // Auto-save functionality
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (content !== initialContent || title !== initialTitle) {
        onSave(documentId, title, content)
      }
    }, 1000) // Auto-save after 1 second of inactivity

    return () => clearTimeout(timeoutId)
  }, [content, title, documentId, initialContent, initialTitle, onSave])

  // Sync scroll positions when content changes
  useEffect(() => {
    syncScrollPositions()
  }, [content])

  // Calculate dynamic height based on content
  const calculateTextareaHeight = () => {
    const minHeight = 500
    const lineHeight = 1.7
    const fontSize = 14 // text-sm
    const lines = content.split('\n').length
    const calculatedHeight = Math.max(minHeight, lines * fontSize * lineHeight + 48) // 48px for padding
    return Math.min(calculatedHeight, window.innerHeight * 0.8) // Cap at 80% of viewport height
  }

  const handleBack = () => {
    onBack()
  }

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      {/* Fixed Back Button - Left Side */}
      <button
        onClick={handleBack}
        className="fixed top-20 left-8 z-50 w-8 h-8 text-muted-foreground hover:text-foreground transition-all duration-200 flex items-center justify-center"
        title="Back to Canvas"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Documents Sidebar - Right Side */}
      {allDocuments.length > 1 && (
        <div className="fixed right-6 top-24 z-40 w-64 max-h-[calc(100vh-120px)] overflow-hidden flex flex-col bg-background/95 backdrop-blur-sm rounded-lg">
          {/* Header */}
          <div className="pb-3 px-4 pt-4 border-b border-border/20">
            <h3 className="text-sm font-light text-foreground">All Documents</h3>
          </div>

          {/* Document List */}
          <div className="overflow-y-auto flex-1">
            {allDocuments.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground px-4">
                <p className="text-sm font-light">No documents</p>
              </div>
            ) : (
              <div>
                {allDocuments.map((doc) => {
                  const isCurrentDoc = doc.id === documentId
                  const preview = doc.content.split('\n')[0] || 'Empty document'
                  const truncatedPreview = preview.length > 50 ? preview.substring(0, 50) + '...' : preview
                  
                  return (
                    <div
                      key={doc.id}
                      className={`px-4 py-3 cursor-pointer transition-all duration-200 border-b border-border/20 ${
                        isCurrentDoc 
                          ? 'bg-primary/10' 
                          : 'hover:bg-muted/30'
                      }`}
                      onClick={() => doc.id !== documentId && onSwitchDocument(doc.id)}
                    >
                      {/* Title */}
                      <div className={`font-medium text-sm mb-1 ${
                        isCurrentDoc ? 'text-primary' : 'text-foreground'
                      }`}>
                        {doc.title}
                      </div>
                      
                      {/* Preview */}
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {truncatedPreview}
                      </div>
                      
                      {/* Date */}
                      <div className="text-xs text-muted-foreground/60 mt-1">
                        {new Date(doc.updatedAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Editor */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Document Title */}
        <div className="mb-6">
          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsEditingTitle(false)
                if (e.key === 'Escape') {
                  setTitle(initialTitle)
                  setIsEditingTitle(false)
                }
              }}
              className="w-full bg-transparent text-2xl font-bold text-foreground outline-none border-b border-transparent focus:border-primary/50 transition-colors pb-2"
              autoFocus
            />
          ) : (
            <h1 
              className="text-2xl font-bold text-foreground cursor-pointer hover:text-primary transition-colors pb-2"
              onDoubleClick={() => setIsEditingTitle(true)}
              title="Double-click to edit title"
            >
              {title}
            </h1>
          )}
        </div>

        {/* Document Content */}
        <div className="relative w-full">
          {/* Highlighted background */}
          <div 
            ref={backgroundRef}
            className="absolute inset-0 p-6 text-sm leading-relaxed pointer-events-none scrollbar-hide overflow-auto" 
            style={{ 
              lineHeight: '1.7',
              fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
              height: `${calculateTextareaHeight()}px`,
              scrollbarWidth: 'none', // Firefox
              msOverflowStyle: 'none', // IE and Edge
            }}
          >
            {renderHighlightedContent()}
          </div>
          
          {/* Editable textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onPaste={handlePaste}
            onScroll={handleScroll}
            placeholder="Start writing your document here..."
            className="relative w-full p-6 text-sm leading-relaxed resize-none focus:outline-none placeholder:text-muted-foreground/60 bg-transparent border-none scrollbar-hide text-transparent caret-foreground"
            style={{
              fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
              lineHeight: '1.7',
              height: `${calculateTextareaHeight()}px`,
              scrollbarWidth: 'none', // Firefox
              msOverflowStyle: 'none', // IE and Edge
            }}
          />
        </div>
      </div>

    </div>
  )
}
