'use client'
import { useState, useEffect, useRef, useCallback } from "react"
import { Clock, Plus, CheckCircle, Circle, Edit3, Trash2, GripVertical } from "lucide-react"
import { useTasks } from "../contexts/task-state"

export function TodayPage() {
  const { tasks, addTask, updateTask, deleteTask, toggleCompleted, updateTaskTitle } = useTasks()
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeType, setResizeType] = useState<'top' | 'bottom' | null>(null)
  const dragStateRef = useRef<{
    taskId: string
    startY: number
    initialStartHour: number
  } | null>(null)
  const resizeStateRef = useRef<{
    taskId: string
    startY: number
    initialDuration: number
    initialStartHour: number
  } | null>(null)
  const taskElementsRef = useRef<Map<string, HTMLDivElement>>(new Map())
  
  const timelineRef = useRef<HTMLDivElement>(null)

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM'
    if (hour < 12) return `${hour} AM`
    if (hour === 12) return '12 PM'
    return `${hour - 12} PM`
  }

  const getCurrentHour = () => {
    return new Date().getHours()
  }

  const getCurrentMinute = () => {
    return new Date().getMinutes()
  }

  const getVisibleStartHour = () => {
    if (!timelineRef.current) return 9 // default to 9 AM if ref not ready
    
    const timelineRect = timelineRef.current.getBoundingClientRect()
    
    // Calculate the middle of the viewport as the reference point
    const viewportCenter = window.innerHeight / 2
    
    // Calculate the offset in pixels from the timeline top to the viewport center
    const offsetInTimeline = viewportCenter - timelineRect.top
    
    // If offset is negative or too small, we're not yet into the timeline
    if (offsetInTimeline <= 0) {
      return 0
    }
    
    // Convert pixels to hours (each hour is 60px)
    const visibleHour = Math.min(23, Math.floor(offsetInTimeline / 60))
    
    return visibleHour
  }

  const createTask = () => {
    if (!newTaskTitle.trim()) return
    
    const visibleHour = getVisibleStartHour()
    addTask(newTaskTitle.trim(), visibleHour, 1)
    setNewTaskTitle("")
  }

  const startEditTask = (taskId: string, currentTitle: string) => {
    setEditingTask(taskId)
    setEditingTitle(currentTitle)
  }

  const cancelEditTask = () => {
    setEditingTask(null)
    setEditingTitle("")
  }

  const handleUpdateTaskTitle = (taskId: string, newTitle: string) => {
    updateTaskTitle(taskId, newTitle)
    setEditingTask(null)
    setEditingTitle("")
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Only handle delete if a task is selected and not currently editing
    if (selectedTask && !editingTask && (e.key === 'Delete' || e.key === 'Backspace')) {
      e.preventDefault()
      deleteTask(selectedTask)
      setSelectedTask(null)
    }
  }, [selectedTask, editingTask])

  // Convert hour to pixel position (assuming 60px per hour)
  const hourToPixels = (hour: number) => {
    return hour * 60
  }

  // Convert pixel position to hour
  const pixelsToHour = (pixels: number) => {
    return Math.max(0, Math.min(23, Math.round(pixels / 60)))
  }

  const handleTaskMouseDown = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Select the task on click
    setSelectedTask(taskId)
    
    setIsDragging(true)
    dragStateRef.current = {
      taskId,
      startY: e.clientY,
      initialStartHour: tasks.find(t => t.id === taskId)?.startHour || 0
    }
    
    // Prevent scrolling during drag
    document.body.style.pointerEvents = 'none'
    document.body.style.userSelect = 'none'
  }

  const handleResizeMouseDown = (e: React.MouseEvent, taskId: string, type: 'top' | 'bottom') => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsResizing(true)
    setResizeType(type)
    const task = tasks.find(t => t.id === taskId)
    resizeStateRef.current = {
      taskId,
      startY: e.clientY,
      initialDuration: task?.duration || 1,
      initialStartHour: task?.startHour || 0
    }
    
    // Prevent scrolling during resize
    document.body.style.pointerEvents = 'none'
    document.body.style.userSelect = 'none'
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    e.preventDefault()
    
    if (isDragging && dragStateRef.current) {
      const deltaY = e.clientY - dragStateRef.current.startY
      const newTop = Math.max(0, Math.min(1380, dragStateRef.current.initialStartHour * 60 + deltaY))
      
      const taskElement = taskElementsRef.current.get(dragStateRef.current.taskId)
      if (taskElement) {
        taskElement.style.top = `${newTop}px`
      }
    }
    
    if (isResizing && resizeStateRef.current && resizeType) {
      const deltaY = e.clientY - resizeStateRef.current.startY
      const taskElement = taskElementsRef.current.get(resizeStateRef.current.taskId)
      if (!taskElement) return
      
      if (resizeType === 'bottom') {
        const newHeight = Math.max(30, Math.min(1440, resizeStateRef.current.initialDuration * 60 + deltaY))
        const currentTop = parseFloat(taskElement.style.top) || 0
        const maxHeight = 1440 - currentTop
        const clampedHeight = Math.min(newHeight, maxHeight)
        
        taskElement.style.height = `${clampedHeight}px`
      } else if (resizeType === 'top') {
        const deltaHours = deltaY / 60
        const newStartHour = Math.max(0, Math.min(23, resizeStateRef.current.initialStartHour + deltaHours))
        const newDuration = Math.max(0.5, Math.min(8, resizeStateRef.current.initialDuration - deltaHours))
        
        const maxDuration = 24 - newStartHour
        const finalDuration = Math.min(newDuration, maxDuration)
        
        taskElement.style.top = `${newStartHour * 60}px`
        taskElement.style.height = `${Math.max(30, finalDuration * 60)}px`
      }
    }
  }, [isDragging, isResizing, resizeType])

  const handleMouseUp = useCallback(() => {
    if (isDragging && dragStateRef.current) {
      // Finalize drag position
      const taskId = dragStateRef.current.taskId
      const taskElement = taskElementsRef.current.get(taskId)
      if (taskElement) {
        const currentTop = parseFloat(taskElement.style.top) || 0
        const newStartHour = Math.max(0, Math.min(23, currentTop / 60))
        
        updateTask(taskId, { startHour: newStartHour })
      }
    }
    
    if (isResizing && resizeStateRef.current && resizeType) {
      // Finalize resize
      const taskId = resizeStateRef.current.taskId
      const taskElement = taskElementsRef.current.get(taskId)
      if (taskElement) {
        const currentTop = parseFloat(taskElement.style.top) || 0
        const currentHeight = parseFloat(taskElement.style.height) || 0
        const newStartHour = Math.max(0, Math.min(23, currentTop / 60))
        const newDuration = Math.max(0.5, Math.min(8, currentHeight / 60))
        
        updateTask(taskId, { startHour: newStartHour, duration: newDuration })
      }
    }
    
    // Restore body styles
    document.body.style.pointerEvents = ''
    document.body.style.userSelect = ''
    
    setIsDragging(false)
    setIsResizing(false)
    setResizeType(null)
    dragStateRef.current = null
    resizeStateRef.current = null
  }, [isDragging, isResizing, resizeType])

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('keydown', handleKeyDown)
      // Cleanup: restore body styles if component unmounts during drag
      document.body.style.pointerEvents = ''
      document.body.style.userSelect = ''
    }
  }, [handleMouseMove, handleMouseUp, handleKeyDown])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/20 bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-medium text-foreground">Today</h1>
                <p className="text-xs text-muted-foreground">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground">
              {tasks.filter(task => task.completed).length} of {tasks.length} completed
            </div>
          </div>
        </div>
      </div>

      {/* Task Input */}
      <div className="border-b border-border/20 bg-background/95 backdrop-blur-sm sticky top-16 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  createTask()
                }
              }}
              placeholder="Type a task and press Enter..."
              className="flex-1 px-3 py-2 text-sm bg-background border border-border/30 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              onClick={createTask}
              disabled={!newTaskTitle.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="max-w-4xl mx-auto pl-4 sm:pl-6 lg:pl-8 pr-4 sm:pr-6 lg:pr-8 py-8">
        <div className="relative" ref={timelineRef} onClick={() => setSelectedTask(null)}>
          {/* Hour Grid */}
          <div className="relative" style={{ height: '1440px' }}> {/* 24 hours * 60px */}
            {/* Left Border */}
            <div className="absolute left-0 top-0 bottom-0 w-px bg-border/30"></div>
            
            {/* Hour Lines */}
            {Array.from({ length: 24 }, (_, hour) => (
              <div
                key={hour}
                className="absolute w-full border-t border-border/20"
                style={{ top: `${hour * 60}px` }}
              >
                <div className="absolute -left-16 w-12 text-right text-xs font-medium text-muted-foreground">
                  {formatHour(hour)}
                </div>
              </div>
            ))}
            
            {/* Current Time Line */}
            <div
              className="absolute w-full border-t-2 border-primary/60 z-10"
              style={{ 
                top: `${(getCurrentHour() + getCurrentMinute() / 60) * 60}px` 
              }}
            >
              <div className="absolute -left-2 -top-1 w-4 h-2 bg-primary rounded-full"></div>
                  </div>
                  
            {/* Tasks */}
            {tasks.map((task) => (
              <div
                key={task.id}
                ref={(el) => {
                  if (el) {
                    taskElementsRef.current.set(task.id, el)
                    // Only set initial position if not currently dragging/resizing
                    if (!isDragging && !isResizing) {
                      el.style.top = `${task.startHour * 60}px`
                      el.style.height = `${task.duration * 60}px`
                    }
                  } else {
                    taskElementsRef.current.delete(task.id)
                  }
                }}
                className={`absolute left-0 right-0 border rounded-lg p-2 cursor-move select-none hover:shadow-md ${
                  task.completed ? 'opacity-60' : ''
                } ${task.color} ${isDragging || isResizing ? '' : 'transition-all duration-200'}`}
                style={{
                  top: `${task.startHour * 60}px`,
                  height: `${task.duration * 60}px`,
                  minHeight: '30px',
                  willChange: isDragging || isResizing ? 'transform, height' : 'auto'
                }}
                onMouseDown={(e) => handleTaskMouseDown(e, task.id)}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between h-full">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                        toggleCompleted(task.id)
                              }}
                      className="flex-shrink-0"
                            >
                      {task.completed ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <Circle className="w-4 h-4 text-muted-foreground hover:text-green-500" />
                              )}
                            </button>
                    
                    {editingTask === task.id ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleUpdateTaskTitle(task.id, editingTitle)
                          } else if (e.key === 'Escape') {
                            cancelEditTask()
                          }
                        }}
                        onBlur={() => handleUpdateTaskTitle(task.id, editingTitle)}
                        className="flex-1 text-sm font-medium bg-transparent border-none outline-none"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div
                        className={`text-sm font-medium truncate ${
                          task.completed ? 'line-through' : ''
                        }`}
                        onDoubleClick={(e) => {
                          e.stopPropagation()
                          startEditTask(task.id, task.title)
                        }}
                      >
                        {task.title}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        startEditTask(task.id, task.title)
                      }}
                      className="p-1 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteTask(task.id)
                      }}
                      className="p-1 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                {/* Top Resize Handle */}
                <div
                  className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-current/20"
                  onMouseDown={(e) => handleResizeMouseDown(e, task.id, 'top')}
                />
                
                {/* Bottom Resize Handle */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-current/20"
                  onMouseDown={(e) => handleResizeMouseDown(e, task.id, 'bottom')}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
