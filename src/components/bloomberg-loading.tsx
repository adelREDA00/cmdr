import React from 'react'

interface BloombergLoadingProps {
  subreddit: string
}

export function BloombergLoading({ subreddit }: BloombergLoadingProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="flex items-center justify-center gap-2 text-lg text-foreground">
          <div className="w-px h-5 bg-foreground animate-cursor-rotate" />
          <span>Collecting data</span>
        </div>
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
          Analyzing r/{subreddit} to provide you with the most accurate posting times. 
          This may take a moment as we process historical data for better insights.
        </p>
      </div>
    </div>
  )
}
