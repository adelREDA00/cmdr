'use client'
import React, { useState } from "react"
import { BarChart3, Clock, ChevronRight, TrendingUp, MessageSquare } from "lucide-react"
import { useTimezone } from "./timezone-clock"
import { DayTimeline } from "./day-timeline"
import { API_BASE_URL } from "../config"

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
      utcOffset: string
      region: string
      confidence: 'high' | 'medium' | 'low'
    }
    languageAnalysis?: {
      primaryLanguage: string
      confidence: 'high' | 'medium' | 'low'
    }
    signals?: {
      timezone: boolean
      language: boolean
    }
    analysisDetails?: {
      totalPosts: number
      postsAnalyzedForLanguage: number
      averageTextLength: number
    }
  }
}

interface RedditStatsResultsProps {
  stats: RedditStats
  isLoading?: boolean
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
        fetchTime: '1250ms',
        analysisTime: '45ms',
        totalProcessingTime: '1295ms'
      },
      dataQuality: {
        postsAnalyzed: backendData.analysis.totalPosts || 0,
        analysisAccuracy: 'Advanced Best-Time-to-Post algorithm v2.0',
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
      nationalityAnalysis: backendData.nationalityAnalysis || undefined
    }
  } catch (error) {
    console.error('Error transforming backend data:', error)
    throw error
  }
}

export function RedditStatsResults({ stats, isLoading }: RedditStatsResultsProps) {
  
  // State for expandable days
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({})
  
  // State for objective controls
  const [currentObjective, setCurrentObjective] = useState<'reach' | 'discussion' | 'balanced'>('balanced')
  const [upvoteWeight, setUpvoteWeight] = useState(0.6)
  const [isReanalyzing, setIsReanalyzing] = useState(false)
  const [currentStats, setCurrentStats] = useState(stats)
  const [reanalysisError, setReanalysisError] = useState<string | null>(null)
  
  // Initialize objective from stats
  React.useEffect(() => {
    if (stats?.analysis?.objective) {
      const newObjective = stats.analysis.objective as 'reach' | 'discussion' | 'balanced'
      setCurrentObjective(newObjective)
      setUpvoteWeight(stats.analysis.upvoteWeight || 0.6)
      setCurrentStats(stats)
    }
  }, [stats])
  
  // Re-analyze with new objective (using cached data for speed)
  const handleReanalyze = async (objectiveOverride?: string) => {
    if (!stats?.subreddit) return
    
    const objectiveToUse = objectiveOverride || currentObjective
    
    setIsReanalyzing(true)
    setReanalysisError(null)
    try {
      // Try fast re-analysis first (uses cached data)
      let response = await fetch(`${API_BASE_URL}/api/reanalyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subreddit: currentStats.subreddit,
          customParams: {
            objective: objectiveToUse,
            upvoteWeight: objectiveToUse === 'balanced' ? upvoteWeight : undefined,
            visibilityWeight: 0.6
          },
          options: {
            includeEmptySlots: true,
            minPostCount: 1,
            minConfidence: 0.1,
            fillStrategy: 'selective',
            minNeighborPosts: 2,
            maxGapHours: 6,
            testMode: false  // Enable test mode to amplify differences
          }
        })
      })
      
      // If fast re-analysis fails (no cached data), fall back to full analysis
      if (!response.ok && response.status === 500) {
        console.log('No cached data found, falling back to full analysis...')
        response = await fetch(`${API_BASE_URL}/api/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subreddit: currentStats.subreddit,
            customParams: {
              objective: objectiveToUse,
              upvoteWeight: objectiveToUse === 'balanced' ? upvoteWeight : undefined,
              visibilityWeight: 0.6
            },
            options: {
              includeEmptySlots: true,
              minPostCount: 1,
              minConfidence: 0.1,
              fillStrategy: 'selective',
              minNeighborPosts: 2,
              maxGapHours: 6,
              testMode: false  // Enable test mode to amplify differences
            }
          })
        })
      }
      
      if (response.ok) {
        const backendData = await response.json()
        // Transform and update stats
        const transformedData = transformBackendData(backendData)
        setCurrentStats(transformedData)
      } else {
        const errorData = await response.json()
        console.error('Re-analysis failed:', errorData.message)
        setReanalysisError(errorData.message || errorData.error || 'Re-analysis failed')
      }
    } catch (error) {
      console.error('Re-analysis failed:', error)
      setReanalysisError(error instanceof Error ? error.message : 'Re-analysis failed')
    } finally {
      setIsReanalyzing(false)
    }
  }
  
  // Toggle expansion for a specific day (only one card open at a time)
  const toggleDayExpansion = (day: string) => {
    setExpandedDays(prev => {
      // If clicking the same day, toggle it
      if (prev[day]) {
        return { [day]: false }
      }
      // If clicking a different day, close all others and open this one
      return { [day]: true }
    })
  }
  
  // Timezone management
  const { selectedTimezone, formatTimeWindow } = useTimezone()
  
  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-muted/20 rounded-lg w-1/3 mx-auto"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted/20 rounded-xl"></div>
            ))}
          </div>
          <div className="h-64 bg-muted/20 rounded-xl"></div>
        </div>
      </div>
    )
  }

  // Safety check for stats
  if (!stats || !currentStats) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-red-500">
          <h2 className="text-xl font-medium mb-2">No data received</h2>
          <p className="text-sm">Please try again or check the console for errors.</p>
        </div>
      </div>
    )
  }

  // Safety checks for data
  const bestTimeToPost = currentStats.bestTimeToPost || null

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-border/20">
        <h1 className="text-2xl font-light tracking-tight text-foreground">
            r/{currentStats.subreddit} Analytics
        </h1>
        <div className="text-sm text-muted-foreground">
          Times shown in {selectedTimezone.abbreviation}
        </div>
      </div>


      {/* Stats Sections Container */}
      <div className="relative">
        {/* Loading Overlay for Stats Sections */}
        {isReanalyzing && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-40 flex items-center justify-center rounded-xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <div className="text-lg font-medium text-foreground mb-2">Re-analyzing...</div>
              <div className="text-sm text-muted-foreground">Optimizing for {currentObjective === 'reach' ? 'maximum reach' : currentObjective === 'discussion' ? 'maximum discussion' : 'balanced engagement'}</div>
            </div>
          </div>
        )}

        {/* Key Metrics - Simplified */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        <div className="text-center">
          <div className="text-3xl font-light text-foreground mb-1">
            {(currentStats.metrics?.totalSubscribers || 0).toLocaleString()}
            </div>
          <div className="text-sm text-muted-foreground">Subscribers</div>
        </div>

            <div className="text-center">
          <div className="text-3xl font-light text-emerald-600 dark:text-emerald-400 mb-1">
            {currentStats.dataQuality?.postsAnalyzed || 0}
              </div>
          <div className="text-sm text-muted-foreground">Posts Analyzed</div>
            </div>
            
            <div className="text-center">
          <div className="text-3xl font-light text-blue-600 dark:text-blue-400 mb-1">
            {bestTimeToPost?.top_windows.length || 0}
              </div>
          <div className="text-sm text-muted-foreground">Time Windows</div>
            </div>
            
            <div className="text-center">
          <div className="text-3xl font-light text-purple-600 dark:text-purple-400 mb-1">
            {currentStats.dataQuality?.dataCoverage?.coveragePercent || 0}%
              </div>
          <div className="text-sm text-muted-foreground">Data Coverage</div>
            </div>
          </div>

      {/* Optimization Settings - Compact */}
      <div className="bg-gradient-to-r from-background/80 to-background/60 backdrop-blur-sm border border-border/20 rounded-xl p-4 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Optimize Results</h3>
          <div className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-full">
            {currentStats.analysis.objective === 'reach' ? '🚀 Reach' : 
             currentStats.analysis.objective === 'discussion' ? '💬 Discussion' : 
             '⚖️ Balanced'}
          </div>
        </div>
        
        {/* Compact Objective Selection */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              setCurrentObjective('reach')
              if (currentObjective !== 'reach') {
                handleReanalyze('reach')
              }
            }}
            disabled={isReanalyzing}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
              currentObjective === 'reach'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border/30 bg-background/50 text-muted-foreground hover:border-border/50 hover:text-foreground'
            } ${isReanalyzing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Reach</span>
          </button>
          
          <button
            onClick={() => {
              setCurrentObjective('discussion')
              if (currentObjective !== 'discussion') {
                handleReanalyze('discussion')
              }
            }}
            disabled={isReanalyzing}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
              currentObjective === 'discussion'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border/30 bg-background/50 text-muted-foreground hover:border-border/50 hover:text-foreground'
            } ${isReanalyzing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm font-medium">Discussion</span>
          </button>
          
          <button
            onClick={() => {
              setCurrentObjective('balanced')
              if (currentObjective !== 'balanced') {
                handleReanalyze('balanced')
              }
            }}
            disabled={isReanalyzing}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
              currentObjective === 'balanced'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border/30 bg-background/50 text-muted-foreground hover:border-border/50 hover:text-foreground'
            } ${isReanalyzing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm font-medium">Balanced</span>
          </button>
        </div>
      </div>

      {/* Re-analysis Error Display */}
      {reanalysisError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <div>
                <div className="text-red-600 dark:text-red-400 font-medium text-sm">
                  Re-analysis Failed
                </div>
                <div className="text-red-500 dark:text-red-300 text-xs">
                  {reanalysisError}
                </div>
              </div>
            </div>
            <button
              onClick={() => setReanalysisError(null)}
              className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 text-xs font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay for Stats Sections */}
      {isReanalyzing && (
        <div className="relative">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-40 flex items-center justify-center rounded-xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <div className="text-lg font-medium text-foreground mb-2">Re-analyzing...</div>
              <div className="text-sm text-muted-foreground">Optimizing for {currentObjective === 'reach' ? 'maximum reach' : currentObjective === 'discussion' ? 'maximum discussion' : 'balanced engagement'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Best Posting Times - Day Cards */}
      <div className="space-y-0">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/20">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-primary to-primary/60 rounded-full"></div>
            <h2 className="text-xl font-semibold text-foreground">Best Days to Post</h2>
          </div>
          <div className="text-sm text-muted-foreground bg-muted/20 px-3 py-1 rounded-full">
            Ranked by performance
          </div>
        </div>
        
        {bestTimeToPost && bestTimeToPost.top_windows.length > 0 ? (
          <div className="space-y-4">
            {(() => {
              // Get current day
              const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' })
              
              // Get day breakdowns
              const dayBreakdowns = currentStats.dayBreakdowns || {}
              
              // Group windows by day and calculate day rankings
              const dayGroups: Record<string, typeof bestTimeToPost.top_windows> = {}
              bestTimeToPost.top_windows.forEach(window => {
                if (!dayGroups[window.day]) {
                  dayGroups[window.day] = []
                }
                dayGroups[window.day].push(window)
              })
              
              // Calculate day rankings based on best window score for each day
              const dayRankings = Object.entries(dayGroups)
                .map(([day, windows]) => {
                  // Calculate total posts for this day from dayBreakdowns (same data as timeline)
                  const dayBreakdown = dayBreakdowns[day]
                  const totalPostsFromBreakdown = dayBreakdown?.blocks?.reduce((sum: number, block: any) => sum + (block.postCount || 0), 0) || 0
                  
                  // Use ONLY dayBreakdowns data to match timeline exactly
                  const finalTotalPosts = totalPostsFromBreakdown
                  
                  return {
                    day,
                    windows,
                    bestScore: Math.max(...windows.map(w => w.score)),
                    bestWindow: windows.find(w => w.score === Math.max(...windows.map(w => w.score)))!,
                    totalPosts: finalTotalPosts,
                    avgEfficiency: windows.reduce((sum, w) => sum + w.efficiency, 0) / windows.length
                  }
                })
                .sort((a, b) => b.bestScore - a.bestScore)
              
              return dayRankings.map((dayData, index) => {
                const rank = index + 1
                const isCurrentDay = dayData.day === currentDay
                const convertedHours = formatTimeWindow(dayData.bestWindow.hours)
                const dayHourlyData = dayBreakdowns[dayData.day]?.blocks || []
                
                return (
                <div key={dayData.day}>
                  <div 
                    className={`py-6 ${index !== dayRankings.length - 1 ? 'border-b border-border/20' : ''} hover:bg-muted/30 transition-colors duration-200 cursor-pointer`}
                    onClick={() => toggleDayExpansion(dayData.day)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium text-foreground">{dayData.day}</h3>
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded ${
                            rank === 1 
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                              : rank === 2 
                                ? 'bg-emerald-500/5 text-emerald-600 border border-emerald-500/15' 
                                : rank === 3 
                                  ? 'bg-emerald-500/3 text-emerald-600 border border-emerald-500/10' 
                                  : 'bg-muted/50 text-muted-foreground'
                          }`}>
                            #{rank}
                            </span>
                          {isCurrentDay && (
                            <span className="text-xs text-red-600 dark:text-red-400 font-medium">(Today)</span>
                          )}
                      </div>
                      
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
                          <span>Best time: {convertedHours}</span>
                          <span>•</span>
                          <span>+{Math.round(dayData.avgEfficiency)}% uplift</span>
                          <span>•</span>
                          <span>{dayData.totalPosts} posts analyzed</span>
                        </div>
                        
                          {dayData.windows.length > 1 && (
                          <div className="text-sm text-muted-foreground">
                            Other good times: {dayData.windows.slice(1).map(w => formatTimeWindow(w.hours)).join(', ')}
                          </div>
                          )}
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm text-muted-foreground">Click to expand</span>
                        <ChevronRight 
                          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                            expandedDays[dayData.day] ? 'rotate-90' : ''
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Expandable timeline - outside the card background */}
                  {dayHourlyData.length > 0 && expandedDays[dayData.day] && (
                    <div className="mt-4 animate-fade-in-up">
                      <DayTimeline
                        day={dayData.day}
                        blocks={dayHourlyData}
                        blockSize={dayBreakdowns[dayData.day]?.blockSize || 2}
                        isExpanded={true}
                        onToggle={() => toggleDayExpansion(dayData.day)}
                        timezone={selectedTimezone.abbreviation}
                      />
                    </div>
                  )}
                </div>
                )
              })
            })()}
            
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No posting time data available</p>
          </div>
        )}
      </div>

      {/* Best Post Type Section */}
      {currentStats.postTypeAnalysis && (
        <div className="space-y-0">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/20">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-to-b from-green-500 to-green-400 rounded-full"></div>
              <h2 className="text-xl font-semibold text-foreground">Best Post Type</h2>
            </div>
            <div className="text-sm text-muted-foreground bg-muted/20 px-3 py-1 rounded-full">
              Based on engagement analysis
            </div>
          </div>
          
          {currentStats.postTypeAnalysis.bestPostType ? (
            <div className="space-y-6">
              {/* Best Type Highlight */}
              <div className="py-6 border-b border-border/20">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-foreground">{currentStats.postTypeAnalysis.bestPostType.type}</h3>
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded bg-purple-500/10 text-purple-600 border border-purple-500/20">
                        Best Type
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
                      <span>Avg engagement: {currentStats.postTypeAnalysis.bestPostType.engagementScore}</span>
                      <span>•</span>
                      <span>Avg score: {currentStats.postTypeAnalysis.bestPostType.avgScore}</span>
                      <span>•</span>
                      <span>{currentStats.postTypeAnalysis.bestPostType.count} posts analyzed</span>
                  </div>
                </div>
                
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
                        {currentStats.postTypeAnalysis.bestPostType.percentage}% of posts
                    </div>
                      <div className="text-xs text-muted-foreground">
                        Avg {currentStats.postTypeAnalysis.bestPostType.avgComments} comments
                  </div>
                    </div>
                  </div>
                    </div>
                  </div>
              
              {/* All Types Comparison */}
              <div className="space-y-0">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/20">
                  <h4 className="text-lg font-medium text-foreground">All Post Types Performance</h4>
                  <div className="text-sm text-muted-foreground">
                    Ranked by engagement
                </div>
              </div>
              
                <div className="space-y-0">
                  {currentStats.postTypeAnalysis.rankings.map((ranking, index) => {
                      const isBest = ranking.type === currentStats.postTypeAnalysis?.bestPostType?.type;
                      return (
                        <div 
                          key={ranking.type}
                          className={`py-6 ${index !== (currentStats.postTypeAnalysis?.rankings?.length || 0) - 1 ? 'border-b border-border/20' : ''} hover:bg-muted/30 transition-colors duration-200`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <h5 className="text-lg font-medium text-foreground">{ranking.type}</h5>
                                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded ${
                              isBest 
                                    ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20' 
                                    : 'bg-muted/50 text-muted-foreground'
                            }`}>
                                  #{index + 1}
                                  {isBest && <span className="ml-1">(Best)</span>}
                                </span>
                            </div>
                              
                              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
                                <span>Avg engagement: {ranking.engagementScore}</span>
                                <span>•</span>
                                <span>Avg score: {ranking.avgScore}</span>
                                <span>•</span>
                                <span>{ranking.count} posts</span>
                              </div>
                              </div>
                            
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className="text-right">
                                <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
                                  {ranking.percentage}% of posts
                            </div>
                                <div className="text-xs text-muted-foreground">
                                  Avg {ranking.avgComments} comments
                          </div>
                            </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No post type data available</p>
            </div>
          )}
        </div>
      )}

      {/* Geography Analysis Section */}
      {currentStats.nationalityAnalysis && (
        <div className="space-y-0">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/20">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-blue-400 rounded-full"></div>
              <h2 className="text-xl font-semibold text-foreground">Audience Geography</h2>
            </div>
            <div className="text-sm text-muted-foreground bg-muted/20 px-3 py-1 rounded-full">
              Estimated from public signals
            </div>
          </div>
          
          {currentStats.nationalityAnalysis.topCountries.length > 0 ? (
            <div className="space-y-6">
              {/* Analysis Quality Indicators */}
              <div className="py-6 border-b border-border/20">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                  {/* Overall Confidence */}
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                    currentStats.nationalityAnalysis.confidence === 'high' 
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                      : currentStats.nationalityAnalysis.confidence === 'medium'
                        ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20'
                        : 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      currentStats.nationalityAnalysis.confidence === 'high' 
                        ? 'bg-green-500'
                        : currentStats.nationalityAnalysis.confidence === 'medium'
                          ? 'bg-yellow-500'
                          : 'bg-orange-500'
                    }`}></div>
                    <span>
                      {currentStats.nationalityAnalysis.confidence === 'high' 
                        ? 'High Confidence'
                        : currentStats.nationalityAnalysis.confidence === 'medium'
                          ? 'Medium Confidence'
                          : 'Low Confidence'
                      }
                    </span>
                  </div>

                  {/* Subreddit Context Signal */}
                  {currentStats.nationalityAnalysis.subredditContext && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <span>Subreddit: {currentStats.nationalityAnalysis.subredditContext.country}</span>
                    </div>
                  )}

                  {/* Timezone Signal */}
                  {currentStats.nationalityAnalysis.timezoneAnalysis && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                      <span>Timezone: {currentStats.nationalityAnalysis.timezoneAnalysis.region} (UTC{currentStats.nationalityAnalysis.timezoneAnalysis.utcOffset})</span>
                    </div>
                  )}

                  {/* Language Signal */}
                  {currentStats.nationalityAnalysis.languageAnalysis && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                      <span>Language: {currentStats.nationalityAnalysis.languageAnalysis.primaryLanguage}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Top Countries */}
              <div className="space-y-0">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/20">
                  <h3 className="text-lg font-medium text-foreground">Top Countries/Regions</h3>
                  <div className="text-sm text-muted-foreground">
                    Estimated audience percentage
                  </div>
                </div>
                
                <div className="space-y-0">
                  {currentStats.nationalityAnalysis.topCountries.map((country, index) => (
                    <div 
                      key={country.country}
                      className={`py-6 ${index !== (currentStats.nationalityAnalysis?.topCountries?.length || 0) - 1 ? 'border-b border-border/20' : ''} hover:bg-muted/30 transition-colors duration-200`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-medium text-foreground">{country.country}</h4>
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded bg-blue-500/10 text-blue-600 border border-blue-500/20">
                              #{index + 1}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                            <span>Estimated audience percentage</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="flex-1 w-32 bg-muted/20 rounded-full h-2 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                              style={{ width: `${country.percentage}%` }}
                            ></div>
                          </div>
                          <div className="text-right min-w-[50px]">
                            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              {country.percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Analysis Details */}
              {currentStats.nationalityAnalysis.analysisDetails && (
                <div className="py-6 border-b border-border/20">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      <span>{currentStats.nationalityAnalysis.analysisDetails.totalPosts} posts analyzed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                      <span>{currentStats.nationalityAnalysis.analysisDetails.postsAnalyzedForLanguage} for language</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                      <span>Avg {currentStats.nationalityAnalysis.analysisDetails.averageTextLength} chars/post</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Methodology Note */}
              <div className="py-6">
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    <strong>📊 Methodology:</strong> {currentStats.nationalityAnalysis.method}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Insufficient data to determine audience geography</p>
              <p className="text-xs mt-1">Need more users with location signals for reliable analysis</p>
            </div>
          )}
        </div>
      )}
      </div>

          





    </div>
  )
}

// Mock data generator
export function generateMockStats(subreddit: string): RedditStats {
  const baseSubscribers = Math.floor(Math.random() * 5000000) + 100000
  const basePosts = Math.floor(Math.random() * 200) + 50
  
  return {
    subreddit,
    subredditInfo: {
      displayName: subreddit,
      title: `${subreddit.charAt(0).toUpperCase() + subreddit.slice(1)} Community`,
      description: `Welcome to r/${subreddit}`,
      subscribers: baseSubscribers,
      activeUsers: Math.floor(baseSubscribers * (0.01 + Math.random() * 0.02)), // 1-3% of subscribers
      iconImg: ''
    },
    metrics: {
      totalSubscribers: baseSubscribers,
      avgPostsPerDay: basePosts,
      postsAnalyzed: Math.floor(Math.random() * 200) + 100,
      avgScore: Math.floor(Math.random() * 50) + 10,
      avgComments: Math.floor(Math.random() * 20) + 5
    },
    bestTimeToPost: {
      top_windows: [
        {
          day: 'Tuesday',
          hours: '08:00–10:00',
          score: 0.87,
          posts: 45,
          efficiency: 0.92
        },
        {
          day: 'Thursday',
          hours: '18:00–20:00',
          score: 0.82,
          posts: 38,
          efficiency: 0.89
        },
        {
          day: 'Wednesday',
          hours: '14:00–16:00',
          score: 0.78,
          posts: 42,
          efficiency: 0.85
        }
      ],
      confidence: 0.9,
      algorithm_version: '2.0_advanced'
    },
    analysis: {
      peakHours: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        posts: Math.floor(Math.random() * 50) + (i >= 9 && i <= 17 ? 20 : 5),
        percentage: Math.floor(Math.random() * 20) + (i >= 9 && i <= 17 ? 10 : 2)
      })),
      bestDays: [
        { day: 'Monday', posts: 25, percentage: 15 },
        { day: 'Tuesday', posts: 35, percentage: 20 },
        { day: 'Wednesday', posts: 40, percentage: 25 },
        { day: 'Thursday', posts: 38, percentage: 22 },
        { day: 'Friday', posts: 45, percentage: 28 },
        { day: 'Saturday', posts: 20, percentage: 12 },
        { day: 'Sunday', posts: 18, percentage: 10 }
      ],
      engagementRate: Math.floor(Math.random() * 10) + 15,
      optimalPostingTimes: [
        'Tuesday 10:00 AM - 12:00 PM',
        'Wednesday 2:00 PM - 4:00 PM',
        'Thursday 9:00 AM - 11:00 AM',
        'Friday 1:00 PM - 3:00 PM'
      ],
      objective: 'balanced',
      upvoteWeight: 0.6,
      contentTypes: {
        selfPosts: Math.floor(Math.random() * 100) + 50,
        linkPosts: Math.floor(Math.random() * 100) + 50,
        imagePosts: Math.floor(Math.random() * 50) + 20,
        videoPosts: Math.floor(Math.random() * 30) + 10,
        nsfwPosts: Math.floor(Math.random() * 10) + 2
      }
    },
    trends: [
      { metric: 'Post Engagement', change: Math.floor(Math.random() * 20) + 5, trend: 'up' as const, current: 45, previous: 39 },
      { metric: 'Comment Activity', change: Math.floor(Math.random() * 15) + 3, trend: 'up' as const, current: 23, previous: 20 },
      { metric: 'Upvote Rate', change: Math.floor(Math.random() * 10) + 2, trend: 'up' as const, current: 12, previous: 10 },
      { metric: 'Downvote Rate', change: Math.floor(Math.random() * 5) + 1, trend: 'down' as const, current: 2, previous: 3 }
    ],
    performance: {
      fetchTime: '1250ms',
      analysisTime: '45ms',
      totalProcessingTime: '1295ms'
    },
    dataQuality: {
      postsAnalyzed: Math.floor(Math.random() * 200) + 100,
      analysisAccuracy: 'Advanced Best-Time-to-Post algorithm v2.0',
      dataCoverage: {
        totalSlots: 168,
        slotsWithPosts: Math.floor(Math.random() * 50) + 30,
        slotsWithData: Math.floor(Math.random() * 30) + 20,
        coveragePercent: Math.floor(Math.random() * 30) + 20
      }
    },
    postTypeAnalysis: {
      rankings: [
        {
          type: 'Image Posts',
          count: Math.floor(Math.random() * 30) + 10,
          percentage: Math.floor(Math.random() * 20) + 15,
          avgScore: Math.floor(Math.random() * 25) + 8,
          avgComments: Math.floor(Math.random() * 20) + 5,
          engagementScore: Math.floor(Math.random() * 35) + 12,
          totalScore: Math.floor(Math.random() * 1200) + 300,
          totalComments: Math.floor(Math.random() * 600) + 150,
          rank: 1
        },
        {
          type: 'Video Posts',
          count: Math.floor(Math.random() * 20) + 5,
          percentage: Math.floor(Math.random() * 15) + 10,
          avgScore: Math.floor(Math.random() * 30) + 10,
          avgComments: Math.floor(Math.random() * 25) + 8,
          engagementScore: Math.floor(Math.random() * 40) + 15,
          totalScore: Math.floor(Math.random() * 1000) + 200,
          totalComments: Math.floor(Math.random() * 500) + 100,
          rank: 2
        },
        {
          type: 'Text Posts',
          count: Math.floor(Math.random() * 50) + 20,
          percentage: Math.floor(Math.random() * 30) + 25,
          avgScore: Math.floor(Math.random() * 20) + 5,
          avgComments: Math.floor(Math.random() * 15) + 3,
          engagementScore: Math.floor(Math.random() * 25) + 8,
          totalScore: Math.floor(Math.random() * 1000) + 200,
          totalComments: Math.floor(Math.random() * 500) + 100,
          rank: 3
        },
        {
          type: 'Link Posts',
          count: Math.floor(Math.random() * 40) + 15,
          percentage: Math.floor(Math.random() * 25) + 20,
          avgScore: Math.floor(Math.random() * 15) + 3,
          avgComments: Math.floor(Math.random() * 10) + 2,
          engagementScore: Math.floor(Math.random() * 20) + 5,
          totalScore: Math.floor(Math.random() * 800) + 150,
          totalComments: Math.floor(Math.random() * 400) + 80,
          rank: 4
        }
      ],
      bestPostType: {
        type: 'Image Posts',
        count: Math.floor(Math.random() * 30) + 10,
        percentage: Math.floor(Math.random() * 20) + 15,
        avgScore: Math.floor(Math.random() * 25) + 8,
        avgComments: Math.floor(Math.random() * 20) + 5,
        engagementScore: Math.floor(Math.random() * 35) + 12,
        totalScore: Math.floor(Math.random() * 1200) + 300,
        totalComments: Math.floor(Math.random() * 600) + 150,
        rank: 1
      },
      diversityScore: Math.floor(Math.random() * 40) + 60,
      totalTypes: 4,
      summary: {
        mostCommon: null,
        mostEngaging: null,
        leastCommon: null
      }
    },
    nationalityAnalysis: {
      topCountries: [
        {
          country: 'United States (Eastern)',
          percentage: Math.floor(Math.random() * 15) + 40
        },
        {
          country: 'United Kingdom',
          percentage: Math.floor(Math.random() * 8) + 18
        },
        {
          country: 'Canada',
          percentage: Math.floor(Math.random() * 6) + 12
        },
        {
          country: 'Australia',
          percentage: Math.floor(Math.random() * 5) + 8
        },
        {
          country: 'Germany',
          percentage: Math.floor(Math.random() * 4) + 6
        }
      ],
      confidence: 'high' as const,
      dataQuality: 'good' as const,
      method: 'Based on subreddit context, posting time patterns, and language detection from post content. Provides directional insights, not exact user locations.',
      timezoneAnalysis: {
        utcOffset: '-5',
        region: 'Americas',
        confidence: 'high' as const
      },
      languageAnalysis: {
        primaryLanguage: 'English',
        confidence: 'high' as const
      },
      signals: {
        timezone: true,
        language: true
      },
      analysisDetails: {
        totalPosts: Math.floor(Math.random() * 200) + 100,
        postsAnalyzedForLanguage: Math.floor(Math.random() * 150) + 100,
        averageTextLength: Math.floor(Math.random() * 100) + 200
      }
    }
  }
}
