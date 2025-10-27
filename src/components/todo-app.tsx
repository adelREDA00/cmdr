'use client'
import { Check, Minus } from "lucide-react"
import { useTasks } from "../contexts/task-state"

export function TodoApp() {
  const { tasks, toggleCompleted, deleteTask } = useTasks()

  return (
    <div className="fixed right-6 top-6 z-40 w-56">
      {/* Header */}
      <div className="pb-3 border-b border-border/20">
        <h3 className="text-sm font-light text-foreground">Today's Tasks</h3>
      </div>

      {/* Task List */}
      <div>
        {tasks.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p className="text-sm font-light">No tasks yet</p>
            <p className="text-sm mt-1">Add tasks on the Today page</p>
          </div>
        ) : (
          <div>
            {tasks
              .sort((a, b) => a.startHour - b.startHour)
              .map((task, index) => (
              <div
                key={task.id}
                className={`py-3 ${index !== tasks.length - 1 ? 'border-b border-border/20' : ''} ${
                  task.completed ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleCompleted(task.id)}
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors duration-200 ${
                      task.completed
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {task.completed && <Check className="w-2.5 h-2.5" />}
                  </button>

                  {/* Task Text */}
                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-sm font-light ${
                        task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1 hover:opacity-70 transition-opacity duration-200"
                  >
                    <Minus className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
