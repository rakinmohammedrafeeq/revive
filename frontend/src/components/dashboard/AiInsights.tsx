import { useEffect, useState } from 'react'
import { Sparkles, Loader2, TrendingUp, Lightbulb, ArrowRight, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getAiInsights } from '@/api/aiApi'
import type { AiInsightsResponse } from '@/api/aiApi'
import { Link } from 'react-router-dom'

export function AiInsights() {
  const [loading, setLoading] = useState(false)
  const [insights, setInsights] = useState<AiInsightsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showFullAnalysis, setShowFullAnalysis] = useState(false)

  const loadInsights = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getAiInsights()
      if (response.success) {
        setInsights(response)
      } else {
        // Parse error message for better user experience
        const errorMsg = String(response.error || 'Failed to load insights').toLowerCase()
        
        console.log('AI Insights error:', errorMsg) // Debug log
        
        // Check for rate limit error (check multiple indicators)
        if (errorMsg.includes('429') || 
            errorMsg.includes('quota') || 
            errorMsg.includes('rate limit') || 
            errorMsg.includes('exceeded') ||
            errorMsg.includes('resource_exhausted')) {
          setError('AI service rate limit reached. Please try again later.')
        } else if (errorMsg.includes('ai service not configured')) {
          setError('AI service is not configured. Please add your Gemini API key to the backend .env file.')
        } else {
          setError(response.error || 'Failed to load insights')
        }
      }
    } catch (err: any) {
      const errorMsg = String(err.response?.data?.error || err.response?.data?.message || 'Failed to load AI insights').toLowerCase()
      
      console.log('AI Insights error (catch):', errorMsg) // Debug log
      
      // Check for rate limit error
      if (errorMsg.includes('429') || 
          errorMsg.includes('quota') || 
          errorMsg.includes('rate limit') || 
          errorMsg.includes('exceeded') ||
          errorMsg.includes('resource_exhausted')) {
        setError('AI service rate limit reached. Please try again later.')
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || 'Failed to load AI insights')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Auto-load insights on mount
    loadInsights()
  }, [])

  // Get the most interesting insight for preview
  const getPreviewInsight = (): string => {
    if (!insights) return ''
    
    // Priority: summary > first key insight > first recommendation
    if (insights.summary && insights.summary !== 'No transactions yet in this workspace.') {
      return insights.summary
    }
    
    if (insights.keyInsights && insights.keyInsights.length > 0) {
      return insights.keyInsights[0]
    }
    
    if (insights.recommendations && insights.recommendations.length > 0) {
      return insights.recommendations[0]
    }
    
    return insights.summary || ''
  }

  // Compact loading state
  if (loading && !insights) {
    return (
      <Card className="glass-card">
        <CardContent className="py-6">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Analyzing your transactions...</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Compact error state
  if (error) {
    const isRateLimit = error.includes('rate limit') || error.includes('quota')
    
    return (
      <Card className="glass-card">
        <CardContent className="py-6">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                {isRateLimit 
                  ? 'AI insights temporarily unavailable (rate limit reached).' 
                  : 'Insights are temporarily unavailable.'}
              </p>
            </div>
            {!isRateLimit && (
              <Button
                onClick={loadInsights}
                variant="ghost"
                size="sm"
                className="flex-shrink-0 h-8 px-3 text-xs"
              >
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!insights) {
    return null
  }

  const previewInsight = getPreviewInsight()
  const isEmpty = insights.summary === 'No transactions yet in this workspace.'

  // Compact preview card
  return (
    <>
      <Card className="glass-card emerald-glow">
        <CardContent className="py-6">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground leading-relaxed">
                {isEmpty 
                  ? 'Add your first transaction to receive personalized AI insights.'
                  : previewInsight}
              </p>
            </div>
            {isEmpty ? (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="flex-shrink-0 h-8 px-3 text-xs gap-1.5 hover:bg-primary/10"
              >
                <Link to="/app/records?add=true">
                  <Plus className="h-3.5 w-3.5" />
                  Add Record
                </Link>
              </Button>
            ) : (
              <Button
                onClick={() => setShowFullAnalysis(true)}
                variant="ghost"
                size="sm"
                className="flex-shrink-0 h-8 px-3 text-xs gap-1.5 hover:bg-primary/10"
              >
                View Full Analysis
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Full Analysis Dialog */}
      <Dialog open={showFullAnalysis} onOpenChange={setShowFullAnalysis}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Financial Insights
            </DialogTitle>
            <DialogDescription>
              Personalized spending analysis powered by AI
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Summary */}
            {insights.summary && insights.summary !== 'No transactions yet in this workspace.' && (
              <div className="rounded-lg bg-background/80 p-4 border border-border/50">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Summary
                </h3>
                <p className="text-sm text-foreground/90">{insights.summary}</p>
              </div>
            )}

            {/* Spending Analysis */}
            {insights.spendingAnalysis && insights.spendingAnalysis.topCategory !== 'N/A' && (
              <div className="rounded-lg bg-background/80 p-4 border border-border/50">
                <h3 className="text-sm font-semibold mb-3">Spending Analysis</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Top Category:</span>
                    <span className="text-sm font-medium">{insights.spendingAnalysis.topCategory}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Change:</span>
                    <span className={`text-sm font-medium ${
                      insights.spendingAnalysis.percentageChange > 0 
                        ? 'text-destructive' 
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {insights.spendingAnalysis.percentageChange > 0 ? '+' : ''}
                      {insights.spendingAnalysis.percentageChange.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {insights.spendingAnalysis.comparisonPeriod}
                  </div>
                </div>
              </div>
            )}

            {/* Key Insights */}
            {insights.keyInsights && insights.keyInsights.length > 0 && 
             insights.keyInsights[0] !== 'Start adding transactions to get AI-powered insights.' && (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Key Insights
                </h3>
                <ul className="space-y-2">
                  {insights.keyInsights.map((insight, index) => (
                    <li key={index} className="flex gap-2 text-sm">
                      <span className="text-primary mt-1">•</span>
                      <span className="text-foreground/90">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {insights.recommendations && insights.recommendations.length > 0 && 
             insights.recommendations[0] !== 'Add your income and expenses to track your financial health.' && (
              <div className="rounded-lg bg-primary/10 p-4 border border-primary/20">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  Recommendations
                </h3>
                <ul className="space-y-2">
                  {insights.recommendations.map((rec, index) => (
                    <li key={index} className="flex gap-2 text-sm">
                      <span className="text-primary mt-1">→</span>
                      <span className="text-foreground/90">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Trend Analysis */}
            {insights.trendAnalysis && insights.trendAnalysis !== 'Add more transactions to see trends over time.' && (
              <div className="pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground italic">
                  {insights.trendAnalysis}
                </p>
              </div>
            )}

            {/* Refresh Button */}
            <div className="flex justify-end pt-2">
              <Button
                onClick={() => {
                  loadInsights()
                  setShowFullAnalysis(false)
                }}
                variant="outline"
                size="sm"
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Refresh Insights
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
