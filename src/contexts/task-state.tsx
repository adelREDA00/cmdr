'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Task {
  id: string
  title: string
  startHour: number
  duration: number // in hours
  completed: boolean
  color: string
}

interface TaskContextType {
  tasks: Task[]
  addTask: (title: string, startHour?: number, duration?: number) => void
  updateTask: (id: string, updates: Partial<Omit<Task, 'id'>>) => void
  deleteTask: (id: string) => void
  toggleCompleted: (id: string) => void
  updateTaskTitle: (id: string, title: string) => void
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

const TASK_COLORS = [
  'bg-blue-500/20 border-blue-500/50 text-blue-700 dark:text-blue-300',
  'bg-green-500/20 border-green-500/50 text-green-700 dark:text-green-300',
  'bg-purple-500/20 border-purple-500/50 text-purple-700 dark:text-purple-300',
  'bg-orange-500/20 border-orange-500/50 text-orange-700 dark:text-orange-300',
  'bg-pink-500/20 border-pink-500/50 text-pink-700 dark:text-pink-300',
  'bg-cyan-500/20 border-cyan-500/50 text-cyan-700 dark:text-cyan-300',
  'bg-yellow-500/20 border-yellow-500/50 text-yellow-700 dark:text-yellow-300',
  'bg-red-500/20 border-red-500/50 text-red-700 dark:text-red-300',
]

const STORAGE_KEY = 'reddit-tasks'

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])

  // Load tasks from localStorage on mount
  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem(STORAGE_KEY)
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks))
      }
    } catch (error) {
      console.warn('Failed to load tasks from localStorage:', error)
    }
  }, [])

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    } catch (error) {
      console.warn('Failed to save tasks to localStorage:', error)
    }
  }, [tasks])

  const addTask = (title: string, startHour: number = 9, duration: number = 1) => {
    if (!title.trim()) return
    
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      startHour,
      duration,
      completed: false,
      color: TASK_COLORS[tasks.length % TASK_COLORS.length]
    }
    
    setTasks(prev => [...prev, newTask])
  }

  const updateTask = (id: string, updates: Partial<Omit<Task, 'id'>>) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, ...updates } : task
    ))
  }

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id))
  }

  const toggleCompleted = (id: string) => {
    setTasks(prev => prev.map(task => 
      task.id === id 
        ? { ...task, completed: !task.completed }
        : task
    ))
  }

  const updateTaskTitle = (id: string, title: string) => {
    if (title.trim()) {
      setTasks(prev => prev.map(task => 
        task.id === id 
          ? { ...task, title: title.trim() }
          : task
      ))
    }
  }

  return (
    <TaskContext.Provider value={{
      tasks,
      addTask,
      updateTask,
      deleteTask,
      toggleCompleted,
      updateTaskTitle
    }}>
      {children}
    </TaskContext.Provider>
  )
}

export function useTasks() {
  const context = useContext(TaskContext)
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider')
  }
  return context
}
