'use client'
import { useState } from "react"
import { X, Clock, TrendingUp, MessageSquare, BarChart3, Activity } from "lucide-react"

interface UserActivityData {
  username: string
  displayName: string
  avatar?: string
  analysis?: {
    totalPosts: number
    totalComments: number
    totalActivity: number
    windowDays: number
    dataQuality: 'high' | 'medium' | 'low'
  }
  activityPattern: {
    peakHours: Array<{ hour: number; activity: number; engagement: number }>
    bestDays: Array<{ day: string; activity: number; engagement: number }>
    responseRate: number
    avgResponseTime: string
    engagementScore: number
    activityLevel: 'high' | 'medium' | 'low'
    timezone: string
    preferredContentType: string
  }
  insights: {
    bestTimeToMessage: string
    bestTimeToMessageUTC?: string
    responseLikelihood: 'high' | 'medium' | 'low'
    preferredContentType: string
    timezone: string
    activityLevel: 'high' | 'medium' | 'low'
    confidence: 'high' | 'medium' | 'low'
    reasoning: string
  }
  recentActivity: Array<{
    type: 'post' | 'comment' | 'reply'
    subreddit: string
    timestamp: string
    engagement: number
  }>
  warning?: string
  error?: string
}

interface UserActivityModalProps {
  userData: UserActivityData
  onClose: () => void
  onAddToCRM?: (contact: Contact) => void
}

interface Contact {
  id: string
  nom: string
  contact: string
  chatUrl: string
  dateOfFirstContact: string
  messageSent: string
  response: string
}

export function UserActivityModal({ userData, onClose, onAddToCRM }: UserActivityModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'timing' | 'activity'>('overview')

  const getLikelihoodColor = (likelihood: string) => {
    switch (likelihood) {
      case 'high':
        return 'bg-green-500/10 text-green-600 border-green-500/20'
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
      case 'low':
        return 'bg-red-500/10 text-red-600 border-red-500/20'
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
    }
  }

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:00 ${period}`
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border/20 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-border/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-light tracking-tight text-foreground">{userData.displayName}</h2>
              <p className="text-muted-foreground">@{userData.username}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:opacity-70 transition-opacity duration-200"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border/20 px-6">
          <div className="flex gap-6">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'timing', label: 'Timing', icon: Clock },
              { id: 'activity', label: 'Activity', icon: Activity }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2 px-0 py-4 text-sm font-medium transition-colors duration-200 ${
                  activeTab === id
                    ? 'text-foreground border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Warning/Error Banner */}
          {(userData.warning || userData.error) && (
            <div className={`mb-6 p-4 rounded-lg border ${
              userData.error 
                ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400' 
                : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  userData.error ? 'bg-red-500' : 'bg-yellow-500'
                }`}></div>
                <span className="font-medium">
                  {userData.error ? 'Analysis Error' : 'Analysis Warning'}
                </span>
              </div>
              <p className="text-sm mt-1">
                {userData.error || userData.warning}
              </p>
            </div>
          )}
          
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Key Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="pb-6 border-b border-border/20">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Best Time to Message</h3>
                  <div className="text-lg font-light text-emerald-600 dark:text-emerald-400 mb-1">
                    {userData.insights.bestTimeToMessage}
                  </div>
                  {userData.insights.bestTimeToMessageUTC && (
                    <div className="text-sm text-muted-foreground mb-2">
                      ({userData.insights.bestTimeToMessageUTC} UTC)
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    Based on peak activity and engagement patterns
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Local time estimated from activity patterns
                  </div>
                </div>

                <div className="pb-6 border-b border-border/20">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Response Likelihood</h3>
                  <div className={`inline-flex items-center gap-2 text-sm font-medium ${getLikelihoodColor(userData.insights.responseLikelihood)}`}>
                    <div className={`w-2 h-2 rounded-full ${
                      userData.insights.responseLikelihood === 'high' ? 'bg-green-500' :
                      userData.insights.responseLikelihood === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    {userData.insights.responseLikelihood.charAt(0).toUpperCase() + userData.insights.responseLikelihood.slice(1)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Based on activity patterns and engagement
                  </div>
                </div>
              </div>

              {/* Activity Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="pb-6 border-b border-border/20">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Engagement Score</h3>
                  <div className="text-2xl font-light text-purple-600 dark:text-purple-400">
                    {userData.activityPattern.engagementScore}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Based on upvotes + comments
                  </div>
                </div>

                <div className="pb-6 border-b border-border/20">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Confidence</h3>
                  <div className={`inline-flex items-center gap-2 text-sm font-medium ${getLikelihoodColor(userData.insights.confidence)}`}>
                    <div className={`w-2 h-2 rounded-full ${
                      userData.insights.confidence === 'high' ? 'bg-green-500' :
                      userData.insights.confidence === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    {userData.insights.confidence.charAt(0).toUpperCase() + userData.insights.confidence.slice(1)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Based on data quality
                  </div>
                </div>
              </div>

              {/* Analysis Details */}
              {userData.analysis && (
                <div className="pb-6 border-b border-border/20">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Analysis Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Activity</div>
                      <div className="text-lg font-light text-foreground">{userData.analysis.totalActivity}</div>
                      <div className="text-xs text-muted-foreground">{userData.analysis.totalPosts} posts, {userData.analysis.totalComments} comments</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Analysis Window</div>
                      <div className="text-lg font-light text-foreground">{userData.analysis.windowDays} days</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Data Quality</div>
                      <div className={`inline-flex items-center gap-2 text-sm font-medium ${getLikelihoodColor(userData.analysis.dataQuality)}`}>
                        <div className={`w-2 h-2 rounded-full ${
                          userData.analysis.dataQuality === 'high' ? 'bg-green-500' :
                          userData.analysis.dataQuality === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        {userData.analysis.dataQuality.charAt(0).toUpperCase() + userData.analysis.dataQuality.slice(1)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Reasoning */}
              {userData.insights.reasoning && (
                <div className="pb-6 border-b border-border/20">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Analysis Reasoning</h3>
                  <div className="text-sm text-muted-foreground">
                    {userData.insights.reasoning}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'timing' && (
            <div className="space-y-8">
              {/* Peak Hours */}
              <div className="pb-8 border-b border-border/20">
                <h3 className="text-sm font-medium text-muted-foreground mb-6">Peak Activity Hours</h3>
                
                <div className="space-y-4">
                  {userData.activityPattern.peakHours.map((hour, index) => {
                    const maxActivity = Math.max(...userData.activityPattern.peakHours.map(h => h.activity))
                    const activityPercentage = maxActivity > 0 ? (hour.activity / maxActivity) * 100 : 0
                    return (
                      <div key={hour.hour} className="flex items-center gap-4">
                        <div className="w-20 text-sm font-medium text-muted-foreground">
                          {formatHour(hour.hour)}
                        </div>
                        <div className="flex-1 bg-muted/20 rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                            style={{ width: `${activityPercentage}%` }}
                          ></div>
                        </div>
                        <div className="w-16 text-sm text-muted-foreground text-right">
                          {hour.activity}
                        </div>
                        <div className="w-20 text-sm text-muted-foreground text-right">
                          {Math.round(hour.engagement)} avg
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Best Days */}
              <div className="pb-8 border-b border-border/20">
                <h3 className="text-sm font-medium text-muted-foreground mb-6">Best Days for Engagement</h3>
                
                <div className="space-y-4">
                  {userData.activityPattern.bestDays.map((day, index) => {
                    const maxActivity = Math.max(...userData.activityPattern.bestDays.map(d => d.activity))
                    const activityPercentage = maxActivity > 0 ? (day.activity / maxActivity) * 100 : 0
                    return (
                      <div key={day.day} className="flex items-center gap-4">
                        <div className="w-24 text-sm font-medium text-muted-foreground">
                          {day.day}
                        </div>
                        <div className="flex-1 bg-muted/20 rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-500"
                            style={{ width: `${activityPercentage}%` }}
                          ></div>
                        </div>
                        <div className="w-16 text-sm text-muted-foreground text-right">
                          {day.activity}
                        </div>
                        <div className="w-20 text-sm text-muted-foreground text-right">
                          {Math.round(day.engagement)} avg
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-8">
              {/* Recent Activity */}
              <div className="pb-8 border-b border-border/20">
                <h3 className="text-sm font-medium text-muted-foreground mb-6">Recent Activity</h3>
                
                <div className="space-y-4">
                  {userData.recentActivity.map((activity, index) => (
                    <div key={index} className={`py-4 ${index !== userData.recentActivity.length - 1 ? 'border-b border-border/20' : ''}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          activity.type === 'post' ? 'bg-blue-500/10 text-blue-500' :
                          activity.type === 'comment' ? 'bg-green-500/10 text-green-500' :
                          'bg-purple-500/10 text-purple-500'
                        }`}>
                          {activity.type === 'post' ? <MessageSquare className="w-4 h-4" /> :
                           activity.type === 'comment' ? <MessageSquare className="w-4 h-4" /> :
                           <MessageSquare className="w-4 h-4" />}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium capitalize">{activity.type}</span>
                            <span className="text-sm text-muted-foreground">in</span>
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{activity.subreddit}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {activity.timestamp} • {activity.engagement} engagement
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/20 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Analysis based on {userData.analysis?.totalActivity || 'recent'} activities over {userData.analysis?.windowDays || 90} days
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  if (onAddToCRM) {
                    const newContact: Contact = {
                      id: Date.now().toString(),
                      nom: userData.displayName,
                      contact: `u/${userData.username}`,
                      chatUrl: `https://reddit.com/user/${userData.username}`,
                      dateOfFirstContact: new Date().toISOString().split('T')[0],
                      messageSent: '',
                      response: ''
                    }
                    onAddToCRM(newContact)
                    onClose() // Close the modal after adding
                  }
                }}
                className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Add to CRM
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
