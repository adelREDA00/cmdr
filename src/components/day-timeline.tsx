'use client'
import { ChevronRight, Clock } from "lucide-react"

interface TimeBlock {
  startHour: number
  endHour: number
  hourRange: string
  score: number
  confidence: number
  postCount: number
  uplift: number
  rank: number
}

interface DayTimelineProps {
  day: string
  blocks: TimeBlock[]
  blockSize: number
  isExpanded: boolean
  onToggle: () => void
  timezone: string
}

export function DayTimeline({ 
  day, 
  blocks, 
  blockSize,
  isExpanded, 
  onToggle,
  timezone 
}: DayTimelineProps) {
  
  // Sort blocks by hour (00:00 to 23:59) instead of by rank
  const sortedBlocks = [...blocks].sort((a, b) => a.startHour - b.startHour)
  
  // Get current time to highlight current block (only for current day)
  const getCurrentTimeBlock = () => {
    const now = new Date()
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' })
    
    // Only show current time indicator for today
    if (day !== currentDay) return null
    
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTimeInMinutes = currentHour * 60 + currentMinute
    
    // First try to find exact match
    let exactMatch = sortedBlocks.find(block => 
      currentTimeInMinutes >= block.startHour * 60 && 
      currentTimeInMinutes < (block.endHour || block.startHour + blockSize) * 60
    )
    
    if (exactMatch) return exactMatch
    
    // If no exact match, find the closest block
    if (sortedBlocks.length === 0) return null
    
    let closestBlock = sortedBlocks[0]
    let minDistance = Math.abs(currentTimeInMinutes - closestBlock.startHour * 60)
    
    for (const block of sortedBlocks) {
      const blockStartMinutes = block.startHour * 60
      const blockEndMinutes = (block.endHour || block.startHour + blockSize) * 60
      const blockCenterMinutes = (blockStartMinutes + blockEndMinutes) / 2
      
      const distance = Math.abs(currentTimeInMinutes - blockCenterMinutes)
      
      if (distance < minDistance) {
        minDistance = distance
        closestBlock = block
      }
    }
    
    return closestBlock
  }
  
  const currentTimeBlock = getCurrentTimeBlock()
  
  // Get line color based on rank - green for excellent, blue for good, grey for fair
  const getLineColor = (block: TimeBlock, rank: number, totalBlocks: number) => {
    if (rank <= 3) return 'bg-emerald-500' // Excellent (Top 3) - Green
    if (rank <= 6) return 'bg-blue-500'    // Good (4-6) - Blue
    return 'bg-gray-500'                   // Fair (7+) - Grey
  }
  
  return (
    <div className="border-l-4 border-emerald-500/30 pl-4">
      {isExpanded && (
        <div className="mt-4 animate-fade-in-up">
          {/* Vertical Timeline */}
          <div className="relative bg-muted/5 rounded-lg p-4 border border-border/20">
            {/* Vertical line container */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border/30"></div>
              
              {/* Time blocks */}
              <div className="space-y-4">
                {sortedBlocks.map((block, index) => {
                  const colorClass = getLineColor(block, block.rank, sortedBlocks.length)
                  const isCurrentTime = currentTimeBlock && 
                    block.startHour === currentTimeBlock.startHour && 
                    block.endHour === currentTimeBlock.endHour
                  
                  return (
                    <div 
                      key={block.startHour}
                      className={`relative flex items-center gap-4 p-3 rounded-lg transition-all duration-200 hover:bg-muted/10 animate-fade-in-right ${
                        isCurrentTime ? 'bg-red-500/10 border-2 border-red-500/30 shadow-md shadow-red-500/10' : ''
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Colored dot on vertical line */}
                      <div className={`absolute left-5 w-3 h-3 rounded-full ${colorClass} shadow-sm z-10`} 
                           style={{ top: '50%', transform: 'translateY(-50%)' }}></div>
                      
                      {/* Hour info */}
                      <div className="ml-8 flex-1">
                        <div className={`text-base font-semibold ${isCurrentTime ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
                          {block.hourRange}
                          {isCurrentTime && (
                            <span className="ml-2 text-sm text-red-500 font-bold group relative cursor-help">
                              ● CLOSEST TO NOW
                              <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                                This is the time block closest to your current time. We show the most relevant posting window for right now.
                                <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                              </div>
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Rank #{block.rank} • {block.postCount} posts • +{Math.round(block.uplift)}% uplift
                        </div>
                      </div>
                      
                      {/* Performance indicator */}
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          block.rank <= 3 ? 'text-emerald-600 dark:text-emerald-400' : 
                          block.rank <= 6 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {block.rank <= 3 ? 'Excellent' : block.rank <= 6 ? 'Good' : 'Fair'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {block.confidence}% confidence
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            
            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-border/20">
              <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span>Excellent (Top 3)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Good (4-6)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <span>Fair (7+)</span>
                </div>
              </div>
            </div>
          </div>
          
          {blocks.length === 0 && (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <Clock className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p>No hourly data available for {day}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
