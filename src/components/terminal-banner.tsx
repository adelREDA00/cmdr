'use client'
import { useState, useEffect, useRef } from 'react'
import { Terminal, ChevronUp, Globe, Sun, Moon, BarChart3, Info } from 'lucide-react'
import { useTheme } from './theme-provider'
import { API_BASE_URL } from '../config'

interface TerminalCommand {
  command: string
  output: string
  timestamp: Date
}

interface TerminalBannerProps {
  onNavigate?: (view: 'analysis' | 'crm' | 'text-editor' | 'today') => void
  currentView?: string
  onClockSettingsOpen?: () => void
  analyzedSubreddit?: string | null
}

type BannerView = 'charts' | 'shell' | 'info'

// Simple chart data - no complex generation needed

export function TerminalBanner({ onNavigate, currentView = 'analysis', onClockSettingsOpen, analyzedSubreddit }: TerminalBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [command, setCommand] = useState('')
  const [history, setHistory] = useState<TerminalCommand[]>([])
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [activeView, setActiveView] = useState<BannerView>('charts')
  const [liveActivityData, setLiveActivityData] = useState<any>(null)
  const [chartData, setChartData] = useState<Array<{hour: number, value: number, timestamp: Date}>>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const { theme, setTheme } = useTheme()

  // Initialize stable chart data for 24 hours
  const initializeChartData = () => {
    const now = new Date()
    const data = []
    
    if (!analyzedSubreddit) {
      // Return default pattern when no subreddit is selected
    // Generate data for every 30 minutes (48 data points for 24 hours)
    for (let i = 0; i < 48; i++) {
      const minutesOffset = i * 30 // Every 30 minutes
      const hour = Math.floor((now.getHours() * 60 + now.getMinutes() - minutesOffset) / 60) % 24
      const minute = ((now.getMinutes() - minutesOffset) % 60 + 60) % 60
      const hourDate = new Date(now.getTime() - minutesOffset * 60 * 1000)
        
        // Default activity pattern
        let baseActivity = 30
        if (hour >= 9 && hour <= 17) {
          baseActivity = 50 + (hour - 9) * 2
        } else if (hour >= 18 && hour <= 22) {
          baseActivity = 60 + Math.sin((hour - 18) * Math.PI / 4) * 15
        } else if (hour >= 0 && hour <= 6) {
          baseActivity = 20 + Math.sin(hour * 0.5) * 10
        } else {
          baseActivity = 35 + Math.cos(hour * 0.3) * 15
        }
        
        data.push({
          hour,
          value: Math.max(5, baseActivity),
          timestamp: hourDate
        })
      }
      return data
    }

    // Create unique subreddit fingerprint for consistent but varied patterns
    const subredditHash = analyzedSubreddit.split('').reduce((hash, char) => {
      return hash + char.charCodeAt(0)
    }, 0)
    
    // Determine subreddit characteristics
    const isTechSub = /programming|tech|coding|javascript|python|webdev|react|node|linux|sysadmin|devops/i.test(analyzedSubreddit)
    const isGamingSub = /gaming|games|pcgaming|nintendo|xbox|playstation|steam|dota|lol|csgo/i.test(analyzedSubreddit)
    const isNewsSub = /news|worldnews|politics|europe|canada|australia|ukraine|china/i.test(analyzedSubreddit)
    const isEntertainmentSub = /movies|television|music|books|art|netflix|marvel|dc/i.test(analyzedSubreddit)
    const isLifestyleSub = /fitness|food|cooking|travel|photography|fashion|personalfinance|investing/i.test(analyzedSubreddit)
    const isEducationalSub = /learn|education|college|university|science|askscience|explainlikeimfive/i.test(analyzedSubreddit)
    
    // Generate data for every 30 minutes (48 data points for 24 hours)
    for (let i = 0; i < 48; i++) {
      const minutesOffset = i * 30 // Every 30 minutes
      const hour = Math.floor((now.getHours() * 60 + now.getMinutes() - minutesOffset) / 60) % 24
      const minute = ((now.getMinutes() - minutesOffset) % 60 + 60) % 60
      const hourDate = new Date(now.getTime() - minutesOffset * 60 * 1000)
      
      // Create unique seed for this time slot and subreddit
      const timeSlot = Math.floor(i / 2) // Group 30-min slots into hour slots for pattern consistency
      const hourSeed = (timeSlot * 7 + subredditHash) % 1000
      const random1 = Math.sin(hourSeed * 0.1) * 0.5 + 0.5
      const random2 = Math.cos(hourSeed * 0.15) * 0.3 + 0.7
      const random3 = Math.sin(hourSeed * 0.23) * 0.4 + 0.6
      
      // Base activity patterns based on subreddit type
      let baseActivity = 20
      let volatility = 15
      
      if (isTechSub) {
        // Tech subs: Peak during work hours, lower evenings
        if (hour >= 9 && hour <= 17) {
          baseActivity = 70 + (hour - 9) * 2
        } else if (hour >= 18 && hour <= 22) {
          baseActivity = 40 + random1 * 20
        } else {
          baseActivity = 15 + random2 * 15
        }
        volatility = 20
      } else if (isGamingSub) {
        // Gaming subs: Peak evenings and weekends, lower work hours
        if (hour >= 18 && hour <= 23) {
          baseActivity = 80 + random1 * 25
        } else if (hour >= 0 && hour <= 2) {
          baseActivity = 60 + random2 * 20
        } else if (hour >= 9 && hour <= 17) {
          baseActivity = 30 + random3 * 15
        } else {
          baseActivity = 45 + random1 * 20
        }
        volatility = 25
      } else if (isNewsSub) {
        // News subs: Steady throughout day, peaks morning/evening
        if (hour >= 6 && hour <= 9) {
          baseActivity = 60 + random1 * 15
        } else if (hour >= 18 && hour <= 21) {
          baseActivity = 65 + random2 * 20
        } else {
          baseActivity = 40 + random3 * 20
        }
        volatility = 18
      } else if (isEntertainmentSub) {
        // Entertainment: Peak evenings, steady weekends
        if (hour >= 19 && hour <= 23) {
          baseActivity = 75 + random1 * 20
        } else if (hour >= 0 && hour <= 1) {
          baseActivity = 50 + random2 * 15
        } else {
          baseActivity = 35 + random3 * 25
        }
        volatility = 22
      } else if (isLifestyleSub) {
        // Lifestyle: Morning and evening peaks
        if (hour >= 7 && hour <= 9) {
          baseActivity = 55 + random1 * 15
        } else if (hour >= 18 && hour <= 20) {
          baseActivity = 60 + random2 * 20
        } else {
          baseActivity = 30 + random3 * 20
        }
        volatility = 16
      } else if (isEducationalSub) {
        // Educational: Peak during study hours
        if (hour >= 10 && hour <= 16) {
          baseActivity = 65 + random1 * 15
        } else if (hour >= 19 && hour <= 22) {
          baseActivity = 50 + random2 * 15
        } else {
          baseActivity = 25 + random3 * 15
        }
        volatility = 14
      } else {
        // Default pattern: General activity curve
        if (hour >= 9 && hour <= 17) {
          baseActivity = 50 + (hour - 9) * 2
        } else if (hour >= 18 && hour <= 22) {
          baseActivity = 60 + Math.sin((hour - 18) * Math.PI / 4) * 15
        } else if (hour >= 0 && hour <= 6) {
          baseActivity = 20 + random1 * 15
        } else {
          baseActivity = 35 + random2 * 20
        }
        volatility = 18
      }
      
      // Add subreddit-specific variations
      const subredditVariation = Math.sin(hourSeed * 0.07) * volatility
      const hourVariation = Math.cos(hourSeed * 0.13) * (volatility * 0.5)
      
      // Add 30-minute granular variation
      const minuteVariation = Math.sin((i * 0.3) + hourSeed * 0.05) * (volatility * 0.3)
      
      const value = Math.max(5, baseActivity + subredditVariation + hourVariation + minuteVariation)
      
      data.push({
        hour,
        minute,
        value,
        timestamp: hourDate
      })
    }
    
    return data
  }

  // Fetch live activity data
  const fetchLiveActivity = async (subreddit: string) => {
    console.log('Fetching live activity for:', subreddit)
    try {
      const response = await fetch(`${API_BASE_URL}/api/live-activity/${subreddit}`)
      console.log('Live activity response status:', response.status)
      console.log('Response headers:', response.headers)
      if (response.ok) {
        const data = await response.json()
        console.log('Live activity data received:', data)
        setLiveActivityData(data)
        
        // Only update the current hour with real data, keep historical data stable
        const now = new Date()
        const currentHour = now.getHours()
        
        // Calculate activity score from real Reddit data
        const activityScore = (data.metrics.postsPerMinute * 15) + 
                             (data.metrics.commentsPerMinute * 8) + 
                             (data.metrics.upvotesPerMinute * 0.2)
        
        // Apply time-based scaling
        let timeMultiplier = 1
        if (currentHour >= 9 && currentHour <= 17) {
          timeMultiplier = 1.2
        } else if (currentHour >= 18 && currentHour <= 22) {
          timeMultiplier = 1.5
        } else if (currentHour >= 0 && currentHour <= 6) {
          timeMultiplier = 0.3
        }
        
        const newValue = Math.max(5, activityScore * timeMultiplier)
        
        // Update only the current hour in chart data
        setChartData(prevData => {
          const newData = [...prevData]
          const currentHourIndex = newData.findIndex(item => item.hour === currentHour)
          
          if (currentHourIndex !== -1) {
            newData[currentHourIndex] = {
              ...newData[currentHourIndex],
              value: newValue,
              timestamp: now
            }
            console.log(`Updated hour ${currentHour} with real data: ${newValue}`)
          }
          
          return newData
        })
      } else {
        console.error('Failed to fetch live activity:', response.status, response.statusText)
        // Set fallback data when API is not available
        setLiveActivityData({
          metrics: {
            postsPerMinute: 1.2,
            commentsPerMinute: 3.5,
            upvotesPerMinute: 12
          },
          timestamp: Date.now() / 1000
        })
      }
    } catch (error) {
      console.error('Failed to fetch live activity:', error)
      // Set fallback data when API fails
      setLiveActivityData({
        metrics: {
          postsPerMinute: 1.2,
          commentsPerMinute: 3.5,
          upvotesPerMinute: 12
        },
        timestamp: Date.now() / 1000
      })
    }
  }

  // Initialize with welcome message
  useEffect(() => {
    const welcomeCommand: TerminalCommand = {
      command: 'welcome',
      output: 'cmddr terminal v1.0 - Type "help" for available commands',
      timestamp: new Date()
    }
    setHistory([welcomeCommand])
  }, [])

  // Chart effect - initialize stable data and fetch live updates
  useEffect(() => {
    if (activeView === 'charts') {
      // Initialize stable chart data
      const initialData = initializeChartData()
      setChartData(initialData)
      console.log('Initialized chart data with stable historical values')
      
      if (analyzedSubreddit) {
        console.log('Fetching live data for:', analyzedSubreddit)
        fetchLiveActivity(analyzedSubreddit)
        
        const dataInterval = setInterval(() => {
          fetchLiveActivity(analyzedSubreddit)
        }, 30000) // Fetch real data every 30 seconds
        
        return () => {
          clearInterval(dataInterval)
        }
      }
    }
  }, [activeView, analyzedSubreddit])


  const executeCommand = (cmd: string) => {
    const trimmedCmd = cmd.trim().toLowerCase()
    let output = ''
    let shouldNavigate = false
    let targetView: 'analysis' | 'crm' | 'text-editor' | 'today' = 'analysis'

    switch (trimmedCmd) {
      case 'help':
        output = `Available commands:
  help          - Show this help message
  clear         - Clear terminal history
  analysis      - Navigate to Analysis view
  crm           - Navigate to CDT view
  text          - Navigate to Text Editor view
  today         - Navigate to Today view
  status        - Show current view status
  time          - Show current time
  version       - Show version info`
        break
      case 'clear':
        setHistory([])
        return
      case 'analysis':
        output = 'Navigating to Analysis view...'
        shouldNavigate = true
        targetView = 'analysis'
        break
      case 'crm':
        output = 'Navigating to CDT view...'
        shouldNavigate = true
        targetView = 'crm'
        break
      case 'text':
        output = 'Navigating to Text Editor view...'
        shouldNavigate = true
        targetView = 'text-editor'
        break
      case 'today':
        output = 'Navigating to Today view...'
        shouldNavigate = true
        targetView = 'today'
        break
      case 'status':
        output = `Current view: ${currentView}
System status: Online
Last updated: ${new Date().toLocaleTimeString()}`
        break
      case 'time':
        output = `Current time: ${new Date().toLocaleString()}`
        break
      case 'version':
        output = `cmddr Terminal v1.0.0
Build: 2024.01.15
Bloomberg Terminal Style Interface`
        break
      default:
        output = `Command not found: ${trimmedCmd}
Type "help" for available commands`
    }

    // Add command to history
    const newCommand: TerminalCommand = {
      command: cmd,
      output,
      timestamp: new Date()
    }
    setHistory(prev => [...prev, newCommand])
    
    // Add to command history for arrow key navigation
    if (cmd.trim() && !commandHistory.includes(cmd.trim())) {
      setCommandHistory(prev => [...prev, cmd.trim()])
    }

    // Navigate if needed
    if (shouldNavigate && onNavigate) {
      setTimeout(() => {
        onNavigate(targetView)
      }, 500)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (command.trim()) {
        executeCommand(command)
        setCommand('')
        setHistoryIndex(-1)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIndex)
        setCommand(commandHistory[newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1)
          setCommand('')
        } else {
          setHistoryIndex(newIndex)
          setCommand(commandHistory[newIndex])
        }
      }
    }
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const handleIconClick = (action: string) => {
    switch (action) {
      case 'search':
        executeCommand('help')
        break
      case 'warning':
        executeCommand('status')
        break
      case 'sort':
        executeCommand('clear')
        break
      case 'settings':
        executeCommand('version')
        break
      case 'theme':
        toggleTheme()
        break
      case 'clock':
        onClockSettingsOpen?.()
        break
      case 'expand':
        setIsExpanded(!isExpanded)
        break
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/98 border-t border-border/30 shadow-2xl backdrop-blur-sm">
      {/* Main Banner Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 h-8 bg-muted/20 backdrop-blur-sm">
         {/* Left side - View tabs when collapsed */}
         <div className="flex items-center gap-4 text-foreground">
           <button
             onClick={() => setActiveView('charts')}
             className={`text-xs font-medium transition-all duration-200 ${
               activeView === 'charts'
                 ? 'text-primary'
                 : 'text-muted-foreground hover:text-foreground'
             }`}
           >
             <BarChart3 className="w-3 h-3 inline mr-1" />
             Charts
           </button>
           <button
             onClick={() => setActiveView('shell')}
             className={`text-xs font-medium transition-all duration-200 ${
               activeView === 'shell'
                 ? 'text-primary'
                 : 'text-muted-foreground hover:text-foreground'
             }`}
           >
             <Terminal className="w-3 h-3 inline mr-1" />
             Shell
           </button>
           <button
             onClick={() => setActiveView('info')}
             className={`text-xs font-medium transition-all duration-200 ${
               activeView === 'info'
                 ? 'text-primary'
                 : 'text-muted-foreground hover:text-foreground'
             }`}
           >
             <Info className="w-3 h-3 inline mr-1" />
             Info
           </button>
           
           {/* Quick Command Input for Shell view */}
           {activeView === 'shell' && (
             <div className="flex items-center gap-1 ml-4">
               <input
                 ref={inputRef}
                 type="text"
                 value={command}
                 onChange={(e) => setCommand(e.target.value)}
                 onKeyDown={handleKeyDown}
                 placeholder="Enter command..."
                 className="w-32 bg-transparent text-foreground font-mono text-xs outline-none placeholder-muted-foreground px-2 py-0.5 rounded border border-border/20 focus:border-primary/50 focus:bg-muted/10 transition-all"
                 autoFocus={false}
               />
             </div>
           )}
         </div>

        {/* Right side - Action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleIconClick('theme')}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all duration-200 rounded"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => handleIconClick('clock')}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all duration-200 rounded"
            title="Clock Settings"
          >
            <Globe className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleIconClick('expand')}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all duration-200 rounded"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            <ChevronUp className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expanded Content Area */}
      {isExpanded && (
        <div className="bg-muted/50 border-t border-border/20 h-[70vh] overflow-hidden flex flex-col">
          {/* Charts View */}
          {activeView === 'charts' && (
            <div className="flex-1 p-4">
              <div className="h-full bg-background/20 rounded-lg border border-border/20 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-foreground">
                    {analyzedSubreddit ? `Today's r/${analyzedSubreddit} Activity` : "Today's Subreddit Activity"}
                  </h3>
                  <div className="text-xs text-muted-foreground">
                    {liveActivityData ? 
                      `Last updated: ${new Date(liveActivityData.timestamp * 1000).toLocaleTimeString()}` :
                      `Last updated: ${new Date().toLocaleTimeString()}`
                    }
                  </div>
                </div>
                
                {/* Minimal Professional Chart */}
                <div className="h-48 bg-background/10 rounded border border-border/10 p-3">
                  {/* Chart Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-foreground">
                      {analyzedSubreddit ? `r/${analyzedSubreddit}` : "Activity"}
                    </div>
                    <div className="text-xs text-muted-foreground">24h</div>
                  </div>
                  
                  {/* Chart Container */}
                  <div className="h-32 relative">
                    {/* Clean Line Chart */}
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <polyline
                          fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        vectorEffect="non-scaling-stroke"
                        className="text-primary"
                          points={chartData.map((item, i) => {
                            const x = (i / (chartData.length - 1)) * 100
                            const y = 100 - (item.value / 150) * 100
                            return `${x},${y}`
                          }).join(' ')}
                        />
                      </svg>
                      
                    {/* Current value display */}
                      {analyzedSubreddit && (
                      <div className="absolute top-0 right-0 text-xs font-mono">
                        <div className="text-primary font-medium">
                          {chartData.find(item => item.hour === new Date().getHours())?.value.toFixed(0) || "0"}
                          </div>
                        </div>
                      )}
                    </div>
                    
                  {/* Time axis */}
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>00:00</span>
                    <span>03:00</span>
                      <span>06:00</span>
                    <span>09:00</span>
                      <span>12:00</span>
                    <span>15:00</span>
                      <span>18:00</span>
                    <span>21:00</span>
                    <span className="text-primary font-medium">
                        {new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                      </span>
                  </div>
                    
                </div>
                
                {/* Minimal Stats */}
                {analyzedSubreddit && (
                  <div className="mt-3 flex gap-6 text-xs text-muted-foreground">
                    <span>Posts: {liveActivityData ? liveActivityData.metrics.postsPerMinute.toFixed(1) : "1.2"}/min</span>
                    <span>Comments: {liveActivityData ? liveActivityData.metrics.commentsPerMinute.toFixed(1) : "3.5"}/min</span>
                    <span>Upvotes: {liveActivityData ? liveActivityData.metrics.upvotesPerMinute.toFixed(0) : "12"}/min</span>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Shell View */}
          {activeView === 'shell' && (
            <>
              {/* Terminal Output */}
              <div className="flex-1 overflow-y-auto p-3 font-mono text-sm bg-background/20">
                {history.map((item, index) => (
                  <div key={index} className="mb-2">
                    <div className="text-primary">
                      <span className="text-muted-foreground">[{item.timestamp.toLocaleTimeString()}]</span>
                      <span className="ml-2">$ {item.command}</span>
                    </div>
                    <div className="text-foreground ml-4 whitespace-pre-wrap">
                      {item.output}
                    </div>
                  </div>
                ))}
              </div>

              {/* Command Input */}
              <div className="border-t border-border/20 p-3 bg-background/50">
                <div className="flex items-center gap-2">
                  <span className="text-primary font-mono text-sm">$</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a command..."
                    className="flex-1 bg-transparent text-foreground font-mono text-sm outline-none placeholder-muted-foreground"
                    autoFocus
                  />
                </div>
              </div>
            </>
          )}

          {/* Info View */}
          {activeView === 'info' && (
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="bg-background/20 rounded-lg border border-border/20 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Info className="w-6 h-6 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">About This Demo</h3>
                </div>
                
                {/* Demo Notice */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
                  <p className="text-sm text-foreground font-medium mb-2">
                    🔒 This is a Demo Version
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This interactive demo showcases the core interface and features. No data is saved during this demonstration.
                  </p>
                </div>

                {/* Coming Soon Features */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <span className="text-primary">✨</span> What's Coming in the Full Version
                  </h4>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {/* Feature Cards - Ordered by founder appeal */}
                    <div className="bg-muted/20 border border-border/20 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                          <span className="text-primary">✍️</span>
                        </div>
                        <div>
                          <h5 className="text-sm font-semibold text-foreground mb-1">AI Post Optimization Assistant</h5>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Get AI-powered suggestions for your post titles and content based on what works in each subreddit. Analyze historical data to see what titles get more upvotes, what content formats perform best, and receive actionable tips to maximize your reach.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/20 border border-border/20 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                          <span className="text-primary">📊</span>
                        </div>
                        <div>
                          <h5 className="text-sm font-semibold text-foreground mb-1">Enhanced Analytics & Historical Data</h5>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Track engagement metrics, upvote/downvote ratios, and activity patterns over time. View trends with detailed historical data stored in a database.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/20 border border-border/20 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                          <span className="text-primary">🔍</span>
                        </div>
                        <div>
                          <h5 className="text-sm font-semibold text-foreground mb-1">Twitter Integration</h5>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Add Twitter API support to monitor hashtags, trending topics, and user engagement. Track mentions, retweets, and replies alongside Reddit data.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/20 border border-border/20 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                          <span className="text-primary">⚡</span>
                        </div>
                        <div>
                          <h5 className="text-sm font-semibold text-foreground mb-1">Real-Time Updates & Notifications</h5>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Continuous data polling, automatic refresh of metrics, and custom keyword alerts. Stay updated with live activity from selected subreddits and topics.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/20 border border-border/20 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                          <span className="text-primary">🤖</span>
                        </div>
                        <div>
                          <h5 className="text-sm font-semibold text-foreground mb-1">Sentiment Analysis</h5>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Automatically analyze post and comment sentiment using natural language processing. Categorize content by tone and emotional response.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/20 border border-border/20 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                          <span className="text-primary">💻</span>
                        </div>
                        <div>
                          <h5 className="text-sm font-semibold text-foreground mb-1">Terminal Commands for Reddit Data</h5>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Fast data queries via terminal: "subreddit:programming", "top:24h", "trending:now", "user:activity". Get instant Reddit insights through command-line interface.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/20 border border-border/20 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                          <span className="text-primary">🎯</span>
                        </div>
                        <div>
                          <h5 className="text-sm font-semibold text-foreground mb-1">Data Export & Save Options</h5>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Export charts and metrics to CSV or JSON format. Save your queries and favorite subreddits for quick access. Persist your dashboard preferences.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                {/* <div className="border-t border-border/20 pt-4">
                  <p className="text-xs text-muted-foreground text-center">
                    Built with modern web technologies • Bloomberg Terminal-inspired interface • 
                    <span className="text-primary ml-1">Ready for production deployment</span>
                  </p>
                </div> */}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
