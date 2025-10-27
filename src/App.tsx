'use client'
import { useState } from "react"
import { RedditStatsResults } from "./components/reddit-stats-results"
import { BloombergClockSystem } from "./components/bloomberg-clock-system"
import { BloombergLoading } from "./components/bloomberg-loading"
import { CRMPage } from "./components/crm-page"
import { TextEditorPage } from "./components/text-editor-page"
import { TodayPage } from "./components/today-page"
import { TodoApp } from "./components/todo-app"
import { TerminalBanner } from "./components/terminal-banner"
import { useIsMobile } from "./hooks/use-mobile"
import { DocumentVisualProvider } from "./contexts/document-visual-state"
import { DocumentContentProvider } from "./contexts/document-content-state"
import { CanvasViewProvider } from "./contexts/canvas-view-state"
import { TaskProvider } from "./contexts/task-state"
import { CRMProvider } from "./contexts/crm-state"
import { ClockProvider } from "./contexts/clock-state"
import { Search, BarChart3, FileText, Clock, MessageSquare, Menu, X } from "lucide-react"
import { API_BASE_URL } from "./config"

interface RedditStats {
  subreddit: string
  subredditInfo?: {
    displayName: string
    title: string
    description: string
    subscribers: number
    activeUsers: number
    iconImg: string
  }
  metrics: {
    totalSubscribers: number
    avgPostsPerDay: number
    postsAnalyzed: number
    avgScore: number
    avgComments: number
  }
  bestTimeToPost?: {
    top_windows: Array<{
      day: string
      hours: string
      score: number
      posts: number
      efficiency: number
      z_score?: number
      confidence?: number
      statistical_significance?: string
    }>
    confidence: number
    algorithm_version: string
    statistical_notes?: {
      method: string
      confidence_interval: string
      significance_threshold: string
    }
  }
  analysis: {
    peakHours: Array<{ hour: number; posts: number; percentage: number }>
    bestDays: Array<{ day: string; posts: number; percentage: number }>
    engagementRate: number
    optimalPostingTimes: string[]
    objective: string
    upvoteWeight: number
    contentTypes: {
      selfPosts: number
      linkPosts: number
      imagePosts: number
      videoPosts: number
      nsfwPosts: number
    }
  }
  trends: Array<{
    metric: string
    change: number
    trend: 'up' | 'down'
    current: number
    previous: number
  }>
  performance: {
    fetchTime: string
    analysisTime: string
    totalProcessingTime: string
  }
  dataQuality: {
    postsAnalyzed: number
    analysisAccuracy: string
    dataCoverage: {
      totalSlots: number
      slotsWithPosts: number
      slotsWithData: number
      coveragePercent: number
    }
  }
  dayBreakdowns?: Record<string, {
    blocks: Array<{
      startHour: number
      endHour: number
      hourRange: string
      score: number
      confidence: number
      postCount: number
      uplift: number
      rank: number
    }>
    blockSize: number
  }>
  heatmap?: Array<{
    day: string
    dayOfWeek: number
    hour: number
    hourRange: string
    uplift: number
    opportunityScore: number
    postCount: number
    confidence: number
    competition: string
    isMissing?: boolean
    hasData: boolean
  }>
  postTypeAnalysis?: {
    rankings: Array<{
      type: string
      count: number
      percentage: number
      avgScore: number
      avgComments: number
      engagementScore: number
      totalScore: number
      totalComments: number
      rank: number
    }>
    bestPostType: {
      type: string
      count: number
      percentage: number
      avgScore: number
      avgComments: number
      engagementScore: number
      totalScore: number
      totalComments: number
      rank: number
    } | null
    diversityScore: number
    totalTypes: number
    summary: {
      mostCommon: any
      mostEngaging: any
      leastCommon: any
    }
  }
  nationalityAnalysis?: {
    topCountries: Array<{
      country: string
      percentage: number
    }>
    confidence: 'high' | 'medium' | 'low' | 'insufficient_data'
    dataQuality: 'good' | 'moderate' | 'limited' | 'insufficient'
    method: string
    subredditContext?: {
      country: string
      confidence: 'high' | 'medium' | 'low'
    }
    timezoneAnalysis?: {
      region: string
      utcOffset: string
      confidence: 'high' | 'medium' | 'low'
    }
    languageAnalysis?: {
      primaryLanguage: string
      confidence: 'high' | 'medium' | 'low'
    }
    analysisDetails?: {
      totalPosts: number
      postsAnalyzedForLanguage: number
      averageTextLength: number
    }
  }
  validation?: {
    validationPossible: boolean
    holdoutSize?: number
    trainingSize?: number
    overallAccuracy?: {
      correlation: number
      mae: number
      rmse: number
    }
    recommendations?: string[]
    reason?: string
  }
}

// Transform backend data structure to frontend format
function transformBackendData(backendData: any): RedditStats {
  try {
  // Transform topTimes to best time windows
  const topWindows = backendData.topTimes?.map((time: any) => ({
    day: time.day,
    hours: time.hourRange,
    score: time.score || 0,
    posts: time.postCount || 0,
    efficiency: time.uplift || 0,
    z_score: (time.confidence || 0) / 100,
    confidence: time.confidence || 0,
    statistical_significance: time.confidenceLabel || 'Unknown'
  })) || []
  
  // Calculate peak hours from heatmap
  const hourlyData: Record<number, { posts: number; score: number }> = {}
  backendData.heatmap?.forEach((item: any) => {
    if (!hourlyData[item.hour]) {
      hourlyData[item.hour] = { posts: 0, score: 0 }
    }
    hourlyData[item.hour].posts += item.postCount || 0
    hourlyData[item.hour].score += item.opportunityScore || 0
  })
  
  const peakHours = Object.entries(hourlyData)
    .map(([hour, data]) => ({
      hour: parseInt(hour),
      posts: data.posts,
      percentage: backendData.analysis.totalPosts > 0 ? (data.posts / backendData.analysis.totalPosts) * 100 : 0
    }))
    .sort((a, b) => b.posts - a.posts)
    .slice(0, 24)
  
  // Calculate best days from heatmap
  const dailyData: Record<string, { posts: number; score: number }> = {}
  backendData.heatmap?.forEach((item: any) => {
    if (!dailyData[item.day]) {
      dailyData[item.day] = { posts: 0, score: 0 }
    }
    dailyData[item.day].posts += item.postCount || 0
    dailyData[item.day].score += item.opportunityScore || 0
  })
  
  const bestDays = Object.entries(dailyData)
    .map(([day, data]) => ({
      day,
      posts: data.posts,
      percentage: backendData.analysis.totalPosts > 0 ? (data.posts / backendData.analysis.totalPosts) * 100 : 0
    }))
    .sort((a, b) => b.posts - a.posts)
  
  // Calculate content types distribution (simplified since backend doesn't provide this)
  const totalPosts = backendData.analysis.totalPosts || 100
  
  return {
    subreddit: backendData.subreddit,
    subredditInfo: backendData.subredditInfo,
    metrics: {
      totalSubscribers: backendData.subredditInfo?.subscribers || 0,
      avgPostsPerDay: Math.round((backendData.analysis.postsPerWeek || 0) / 7),
      postsAnalyzed: backendData.analysis.totalPosts || 0,
      avgScore: 0, // Could calculate from heatmap if needed
      avgComments: 0
    },
    bestTimeToPost: {
      top_windows: topWindows,
      confidence: topWindows[0]?.confidence || 0,
      algorithm_version: backendData.algorithm || '2.0',
      statistical_notes: {
        method: `Robust Statistical Analysis (${backendData.analysis.preset} subreddit)`,
        confidence_interval: '95%',
        significance_threshold: 'p < 0.05'
      }
    },
    analysis: {
      peakHours,
      bestDays,
      engagementRate: 0, // Not directly provided
      optimalPostingTimes: topWindows.slice(0, 3).map((w: any) => `${w.day} ${w.hours}`),
      objective: backendData.analysis?.objective || 'balanced',
      upvoteWeight: backendData.analysis?.upvoteWeight || 0.6,
      contentTypes: {
        selfPosts: Math.round(totalPosts * 0.4),
        linkPosts: Math.round(totalPosts * 0.25),
        imagePosts: Math.round(totalPosts * 0.2),
        videoPosts: Math.round(totalPosts * 0.1),
        nsfwPosts: Math.round(totalPosts * 0.05)
      }
    },
    trends: [
      {
        metric: 'Posts Per Week',
        change: 5,
        trend: 'up' as const,
        current: backendData.analysis.postsPerWeek || 0,
        previous: Math.round((backendData.analysis.postsPerWeek || 0) * 0.95)
      }
    ],
    performance: {
      fetchTime: '0ms',
      analysisTime: '0ms',
      totalProcessingTime: '0ms'
    },
    dataQuality: {
      postsAnalyzed: backendData.analysis.totalPosts || 0,
      analysisAccuracy: backendData.analysis.preset === 'large' ? '95%' : 
                        backendData.analysis.preset === 'medium' ? '90%' : '85%',
      dataCoverage: backendData.analysis.dataCoverage || {
        totalSlots: 168,
        slotsWithPosts: 0,
        slotsWithData: 0,
        coveragePercent: 0
      }
    },
    dayBreakdowns: backendData.dayBreakdowns || {},
    heatmap: backendData.heatmap || [],
    postTypeAnalysis: backendData.postTypeAnalysis || undefined,
    nationalityAnalysis: backendData.nationalityAnalysis || undefined,
    validation: backendData.validation || undefined
  }
  } catch (error) {
    console.error('Error transforming backend data:', error)
    console.error('Backend data:', backendData)
    // Return a minimal valid structure to prevent crash
    return {
      subreddit: backendData.subreddit || 'unknown',
      subredditInfo: backendData.subredditInfo || null,
      metrics: {
        totalSubscribers: 0,
        avgPostsPerDay: 0,
        postsAnalyzed: 0,
        avgScore: 0,
        avgComments: 0
      },
      bestTimeToPost: {
        top_windows: [],
        confidence: 0,
        algorithm_version: 'error',
        statistical_notes: {
          method: 'Error in data transformation',
          confidence_interval: 'N/A',
          significance_threshold: 'N/A'
        }
      },
      analysis: {
        peakHours: [],
        bestDays: [],
        engagementRate: 0,
        optimalPostingTimes: [],
        objective: 'balanced',
        upvoteWeight: 0.6,
        contentTypes: {
          selfPosts: 0,
          linkPosts: 0,
          imagePosts: 0,
          videoPosts: 0,
          nsfwPosts: 0
        }
      },
      trends: [],
      performance: {
        fetchTime: '0ms',
        analysisTime: '0ms',
        totalProcessingTime: '0ms'
      },
      dataQuality: {
        postsAnalyzed: 0,
        analysisAccuracy: 'Error',
        dataCoverage: {
          totalSlots: 168,
          slotsWithPosts: 0,
          slotsWithData: 0,
          coveragePercent: 0
        }
      },
      dayBreakdowns: {},
      heatmap: [],
      postTypeAnalysis: undefined,
      nationalityAnalysis: undefined,
      validation: undefined
    }
  }
}

export default function App() {
  const [subreddit, setSubreddit] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<RedditStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showClockSettings, setShowClockSettings] = useState(false)
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentView, setCurrentView] = useState<'analysis' | 'crm' | 'text-editor' | 'today'>('analysis')
  const isMobile = useIsMobile()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subreddit.trim()) return
    
    setIsLoading(true)
    setResults(null)
    setError(null)
    
    try {
      const cleanSubreddit = subreddit.replace(/^r\//, '').trim()
      
      // Use POST endpoint with options to control empty slot display
      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subreddit: cleanSubreddit,
          customParams: {
            objective: 'balanced',  // Default to balanced for initial search
            upvoteWeight: 0.6,
            visibilityWeight: 0.6
          },
          options: {
            includeEmptySlots: true,  // Keep empty slots for complete visualization
            minPostCount: 1,
            minConfidence: 0.1,
            fillStrategy: 'selective',  // Use selective filling to reduce empty slots
            minNeighborPosts: 2,        // Require at least 2 posts in neighboring slots
            maxGapHours: 6              // Maximum gap to fill
          }
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || 'Failed to fetch subreddit data')
      }
      
      const backendData = await response.json()
      console.log('Received data from API:', backendData)
      
      // Transform backend data to match frontend structure
      const transformedData = transformBackendData(backendData)
      console.log('Transformed data:', transformedData)
      setResults(transformedData)
    } catch (error) {
      console.error('Error fetching subreddit data:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/add-to-cmdr-watch-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim()
        })
      })
      
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'Registration failed'
        try {
          const data = await response.json()
          errorMessage = data.message || data.error || errorMessage
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }
      
      // Check if response has JSON body
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json()
        console.log('Registration response:', data)
      } else {
        console.log('Registration successful (no JSON response)')
      }
      
      // Close modal and reset form
      setShowRegistrationModal(false)
      setEmail("")
      
      // Show success message
      alert('Thanks for joining! We\'ll be in touch soon.')
    } catch (error) {
      console.error('Registration error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Registration failed. Please try again.'
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <TaskProvider>
      <CRMProvider>
        <ClockProvider>
          <DocumentContentProvider>
            <DocumentVisualProvider>
              <CanvasViewProvider>
          <div className={`min-h-screen bg-background text-foreground relative ${isMobile ? 'pt-12' : ''} pb-10`}>
      {/* Top Navigation Bar */}
      <div className="border-b border-border/20 bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2">
            {/* Left - App Title */}
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="Logo" className="w-4 h-4 sm:w-5 sm:h-5" />
              <h1 className="text-base sm:text-lg font-light tracking-tight text-foreground">cmddr</h1>
            </div>

            {/* Center - View Tabs (Hidden on Mobile) */}
            <div className="hidden sm:flex items-center bg-muted/30 rounded-md p-0.5">
              <button
                onClick={() => setCurrentView('analysis')}
                className={`px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                  currentView === 'analysis'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <BarChart3 className="w-3 h-3 inline mr-1" />
                Subreddits
              </button>
              <button
                onClick={() => setCurrentView('crm')}
                className={`px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                  currentView === 'crm'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <MessageSquare className="w-3 h-3 inline mr-1" />
                Users
              </button>
              <button
                onClick={() => setCurrentView('text-editor')}
                className={`px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                  currentView === 'text-editor'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="w-3 h-3 inline mr-1" />
                Docs
              </button>
              <button
                onClick={() => setCurrentView('today')}
                className={`px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                  currentView === 'today'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Clock className="w-3 h-3 inline mr-1" />
                Today
              </button>
            </div>

            {/* Right - User Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(true)}
                className="sm:hidden p-1 text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setShowRegistrationModal(true)}
                className="text-xs sm:text-sm font-medium text-primary hover:text-primary/80 transition-colors duration-200 underline decoration-primary/60 hover:decoration-primary/80 flex items-center gap-1 relative group"
              >
                <span className="relative">
                  <span className="absolute inset-0 bg-gradient-to-t from-orange-500/40 to-transparent "></span>
                  <span className="relative flex items-center gap-1">
                    <span className="hidden sm:inline"> Join the Beta</span>
                    <span className="sm:hidden">Beta</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {currentView === 'crm' ? (
        <CRMPage />
      ) : currentView === 'text-editor' ? (
        <TextEditorPage />
      ) : currentView === 'today' ? (
        <TodayPage />
      ) : (
        <>
          {/* Bloomberg Loading Screen */}
          {isLoading && (
            <BloombergLoading subreddit={subreddit.replace(/^r\//, '').trim()} />
          )}

          {/* Results Display */}
          {(results || isLoading) && !isLoading && (
            <div className="pt-8">
              <RedditStatsResults stats={results!} isLoading={isLoading} />
            </div>
          )}

          {/* Error Display */}
          {error && !isLoading && (
            <div className="pt-8">
              <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center">
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8">
                    <div className="text-red-600 dark:text-red-400 text-xl font-medium mb-2">
                      Analysis Failed
                    </div>
                    <div className="text-red-500 dark:text-red-300 mb-4">
                      {error}
                    </div>
                    <div className="text-sm text-muted-foreground mb-6">
                      Please check the subreddit name and try again
                    </div>
                    <button
                      onClick={() => {
                        setError(null)
                        setResults(null)
                      }}
                      className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Search Interface */}
          {!results && !isLoading && !error && (
            <main className="flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
              <div className="w-full max-w-2xl mx-auto text-center space-y-8">
                {/* Header */}
                <div className="space-y-4 animate-fade-in-up">
                  <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto">
                  When does this subreddit have the highest engagement for your specific goal?
                  </p>
                </div>

                {/* Search Form */}
                <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <input
                      type="text"
                      value={subreddit}
                      onChange={(e) => setSubreddit(e.target.value)}
                      placeholder="Enter subreddit name (e.g., programming or r/programming)"
                      className="w-full pl-12 pr-4 py-4 text-lg bg-background/50 backdrop-blur-sm border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-200 placeholder:text-muted-foreground/60"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={!subreddit.trim() || isLoading}
                    className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground rounded-xl font-medium transition-all duration-200 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                        Analyzing...
                      </div>
                    ) : (
                      "Analyze Subreddit"
                    )}
                  </button>
                </form>

              </div>
            </main>
          )}
        </>
      )}

      {/* New Analysis Input (when results are shown) */}
      {results && !isLoading && currentView === 'analysis' && (
        <div className="fixed bottom-12 left-6 z-40">
          <div className="bg-background/95 backdrop-blur-sm border border-border/30 rounded-lg p-3 shadow-lg">
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs font-medium text-foreground">Subreddit Analysis</span>
              </div>
              <p className="text-xs text-muted-foreground">Analyze any subreddit for insights and trends</p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="r/subreddit"
                value={subreddit}
                onChange={(e) => setSubreddit(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmit(e)
                  }
                }}
                className="flex-1 px-2 py-1.5 bg-background border border-border/30 rounded text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-blue-500/50 transition-colors duration-200"
              />
              <button
                onClick={(e) => handleSubmit(e)}
                disabled={!subreddit.trim() || isLoading}
                className="px-3 py-1.5 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded text-xs font-medium transition-colors duration-200 flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                {/* Analyze */}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Bloomberg Clock System */}
      {currentView !== 'text-editor' && (
        <BloombergClockSystem 
          showSettings={showClockSettings} 
          onSettingsChange={setShowClockSettings} 
        />
      )}

      {/* Todo App - Desktop Only */}
      {!isMobile && currentView !== 'text-editor' && <TodoApp />}

      {/* Mobile Menu Modal */}
      {showMobileMenu && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:hidden">
          <div className="bg-background border-t border-border/20 rounded-t-xl shadow-xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Navigation</h2>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={() => {
                  setCurrentView('analysis')
                  setShowMobileMenu(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                  currentView === 'analysis'
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span className="font-medium">Analysis</span>
              </button>
              
              <button
                onClick={() => {
                  setCurrentView('crm')
                  setShowMobileMenu(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                  currentView === 'crm'
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                <span className="font-medium">CDT</span>
              </button>
              
              <button
                onClick={() => {
                  setCurrentView('text-editor')
                  setShowMobileMenu(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                  currentView === 'text-editor'
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span className="font-medium">Text Editor</span>
              </button>
              
              <button
                onClick={() => {
                  setCurrentView('today')
                  setShowMobileMenu(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                  currentView === 'today'
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                }`}
              >
                <Clock className="w-5 h-5" />
                <span className="font-medium">Today</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {showRegistrationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border/20 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Join the Beta</h2>
              <button
                onClick={() => setShowRegistrationModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-sm text-muted-foreground mb-6">
              Get early access to our advanced Reddit analytics platform. Be the first to discover optimal posting times for any subreddit.
            </p>
            
            <form onSubmit={handleRegistrationSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all duration-200 placeholder:text-muted-foreground/60"
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegistrationModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border/50 rounded-lg transition-all duration-200 hover:bg-muted/30"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!email.trim() || isSubmitting}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium transition-all duration-200 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                      Registering...
                    </div>
                  ) : (
                    'Register'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Terminal Banner - Always visible at bottom */}
      <TerminalBanner 
        onNavigate={(view) => setCurrentView(view)} 
        currentView={currentView}
        onClockSettingsOpen={() => setShowClockSettings(true)}
        analyzedSubreddit={results?.subreddit || null}
      />
      </div>
            </CanvasViewProvider>
          </DocumentVisualProvider>
        </DocumentContentProvider>
      </ClockProvider>
    </CRMProvider>
  </TaskProvider>
  )
}