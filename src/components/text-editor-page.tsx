'use client'
import { useState, useEffect } from "react"
import { CanvasTextEditor } from "./canvas-text-editor"
import { DocumentEditor } from "./document-editor"
import { useDocumentContent } from "../contexts/document-content-state"
import { useDocumentVisualState } from "../contexts/document-visual-state"

export function TextEditorPage() {
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null)
  const { getDocument, getAllDocuments, createDocument, updateDocument } = useDocumentContent()
  const { updateVisualState } = useDocumentVisualState()

  // Initialize with some sample documents if none exist
  useEffect(() => {
    const existingDocs = getAllDocuments()
    if (existingDocs.length === 0) {
      // Create sample documents
      const doc1Id = createDocument('My First Document', `Welcome to your canvas workspace! 

This is a powerful document editor that allows you to create and manage multiple documents in a visual canvas environment. You can drag, resize, and organize your documents however you like.

Click on any document to start editing. The content you write will be automatically saved and persisted across sessions.`)
      
      const doc2Id = createDocument('Ideas & Notes', `This is where you can jot down your thoughts and ideas.

• Brainstorming sessions
• Meeting notes  
• Creative concepts
• Project ideas

Feel free to organize your thoughts here and come back to them later.`)
      
      const doc3Id = createDocument('Project Planning', `Plan your projects and break them down into manageable tasks.

## Project Overview
Define the scope and objectives of your project.

## Key Milestones
1. Research phase
2. Design phase  
3. Development phase
4. Testing phase
5. Launch phase

## Resources Needed
- Team members
- Budget allocation
- Timeline considerations`)
      
      // Set initial visual positions for sample documents
      updateVisualState(doc1Id, { x: 100, y: 100, width: 300, height: 200 })
      updateVisualState(doc2Id, { x: 500, y: 150, width: 280, height: 180 })
      updateVisualState(doc3Id, { x: 200, y: 400, width: 320, height: 220 })
    }
  }, [createDocument, updateVisualState, getAllDocuments])

  const handleDocumentSelect = (documentId: string) => {
    setCurrentDocumentId(documentId)
  }

  const handleBackToCanvas = () => {
    setCurrentDocumentId(null)
  }

  const handleDocumentSave = (documentId: string, title: string, content: string) => {
    updateDocument(documentId, { title, content })
  }

  const handleSwitchDocument = (documentId: string) => {
    setCurrentDocumentId(documentId)
  }

  if (currentDocumentId) {
    const document = getDocument(currentDocumentId)
    if (!document) {
      setCurrentDocumentId(null)
      return null
    }
    
    return (
      <DocumentEditor
        documentId={document.id}
        title={document.title}
        content={document.content}
        onBack={handleBackToCanvas}
        onSave={handleDocumentSave}
        onSwitchDocument={handleSwitchDocument}
      />
    )
  }

  return (
    <CanvasTextEditor
      onDocumentSelect={handleDocumentSelect}
    />
  )
}
