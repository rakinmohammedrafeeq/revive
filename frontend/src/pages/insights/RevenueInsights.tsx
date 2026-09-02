import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, DollarSign, Activity, Target, Zap } from 'lucide-react'

/**
 * REVIVE REVENUE INSIGHTS
 * 
 * Immersive revenue intelligence with glass-integrated analytics.
 * Visualizes recovery performance, failure patterns, and revenue impact.
 * 
 * NOTE: Currently using development data structure.
 * Production will integrate with backend analytics APIs and chart libraries.
 */

// Development types
interface RevenueMetrics {
  totalAtRisk: number
  totalRecovered: number
  recoveryRate: number
  averageRecoveryTime: string
  trend: 'up' | 'down' | 'stable'
  trendPercentage: number
}

interface FailureReason {
  reason: string
  count: number
  amount: number
  recoveryRate: number
  avgRecoveryTime: string
}

interface RecoveryOutcome {
  outcome: 'recovered' | 'in-progress' | 'needs-review' | 'blocked'
  count: number
  amount: number
  percentage: number
}

interface TimeSeriesPoint {
  date: string
  atRisk: number
  recovered: number
  failed: number
}

// Mock data
const mockMetrics: RevenueMetrics = {
  totalAtRisk: 847250,
  totalRecovered: 633180,
  recoveryRate: 74.7,
  averageRecoveryTime: '~18 min',
  trend: 'up',
  trendPercentage: 3.2
}

const mockFailureReasons: FailureReason[] = [
  {
    reason: 'Temporary issuer decline',
    count: 47,
    amount: 438500,
    recoveryRate: 89.2,
    avgRecoveryTime: '~15 min'
  },
  {
    reason: 'Insufficient funds',
    count: 32,
    amount: 245800,
    recoveryRate: 68.8,
    avgRecoveryTime: '~4 hours'
  },
  {
    reason: 'Card expired',
    count: 18,
    amount: 89200,
    recoveryRate: 45.5,
    avgRecoveryTime: '~2 days'
  },
  {
    reason: 'Do not honor',
    count: 15,
    amount: 54300,
    recoveryRate: 52.3,
    avgRecoveryTime: '~1 day'
  },
  {
    reason: 'Payment limit exceeded',
    count: 8,
    amount: 19450,
    recoveryRate: 91.7,
    avgRecoveryTime: '~8 hours'
  }
]

const mockOutcomes: RecoveryOutcome[] = [
  { outcome: 'recovered', count: 89, amount: 633180, percentage: 74.7 },
  { outcome: 'in-progress', count: 12, amount: 89650, percentage: 10.1 },
  { outcome: 'needs-review', count: 8, amount: 67420, percentage: 8.5 },
  { outcome: 'blocked', count: 3, amount: 57000, percentage: 6.7 }
]

const mockTimeSeries: TimeSeriesPoint[] = [
  { date: 'Dec 8', atRisk: 125000, recovered: 89000, failed: 36000 },
  { date: 'Dec 9', atRisk: 143000, recovered: 98000, failed: 45000 },
  { date: 'Dec 10', atRisk: 98000, recovered: 72000, failed: 26000 },
  { date: 'Dec 11', atRisk: 167000, recovered: 118000, failed: 49000 },
  { date: 'Dec 12', atRisk: 134000, recovered: 105000, failed: 29000 },
  { date: 'Dec 13', atRisk: 156000, recovered: 112000, failed: 44000 },
  { date: 'Dec 14', atRisk: 178000, recovered: 128000, failed: 50000 }
]

export function RevenueInsights() {
  return (
    <div className="min-h-screen bg-atmospheric p-6 md:p-8 lg:p-12">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* Header */}
        <div className="animate-slide-up">
          <h1 className="text-h1 mb-2">Revenue Intelligence</h1>
          <p className="text-body text-text-secondary">Deep insights into your recovery performance</p>
        </div>

        {/* Key Metrics — Hero Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Total At Risk */}
          <div className="panel-glass hover-lift glow-emerald-soft animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="glass-emerald h-10 w-10 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="text-label text-text-tertiary">AT RISK</div>
            </div>
            <div className="text-metric text-text-primary">₹{mockMetrics.totalAtRisk.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-3">
              {mockMetrics.trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-error" />
              ) : (
                <TrendingDown className="h-4 w-4 text-emerald-400" />
              )}
              <span className={`text-body-sm ${mockMetrics.trend === 'up' ? 'text-error' : 'text-emerald-400'}`}>
                {mockMetrics.trendPercentage}% from last week
              </span>
            </div>
          </div>

          {/* Total Recovered */}
          <div className="panel-glass hover-lift glow-emerald-soft animate-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="glass-emerald h-10 w-10 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="text-label text-text-tertiary">RECOVERED</div>
            </div>
            <div className="text-metric text-gradient-emerald">₹{mockMetrics.totalRecovered.toLocaleString()}</div>
            <p className="text-body-sm text-text-secondary mt-3">Money we brought back</p>
          </div>

          {/* Recovery Rate */}
          <div className="panel-glass hover-lift glow-emerald-soft animate-slide-up" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="glass-emerald h-10 w-10 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="text-label text-text-tertiary">SUCCESS RATE</div>
            </div>
            <div className="text-metric text-gradient-emerald">{mockMetrics.recoveryRate}%</div>
            <p className="text-body-sm text-text-secondary mt-3">Recovery success this month</p>
          </div>

          {/* Average Recovery Time */}
          <div className="panel-glass hover-lift glow-emerald-soft animate-slide-up" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="glass-emerald h-10 w-10 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="text-label text-text-tertiary">AVG TIME</div>
            </div>
            <div className="text-metric text-text-primary">{mockMetrics.averageRecoveryTime}</div>
            <p className="text-body-sm text-text-secondary mt-3">Time to recover revenue</p>
          </div>

        </div>

        {/* Recovery Trend — Simplified Visualization */}
        <div className="panel-glass-lg animate-slide-up" style={{ animationDelay: '500ms' }}>
          <div className="mb-6">
            <h2 className="text-h3 mb-2">Recovery trend</h2>
            <p className="text-body-sm text-text-secondary">Daily revenue at risk vs recovered (last 7 days)</p>
          </div>
          
          {/* Simple Bar Chart Representation */}
          <div className="space-y-4">
            {mockTimeSeries.map((point, idx) => {
              const maxValue = Math.max(...mockTimeSeries.map(p => p.atRisk))
              const atRiskWidth = (point.atRisk / maxValue) * 100
              const recoveredWidth = (point.recovered / maxValue) * 100
              
              return (
                <div key={point.date} className="space-y-2">
                  <div className="flex items-center justify-between text-body-sm">
                    <span className="text-text-tertiary font-medium w-16">{point.date}</span>
                    <div className="flex items-center gap-4 text-text-secondary">
                      <span className="text-xs">At risk: ₹{(point.atRisk / 1000).toFixed(0)}K</span>
                      <span className="text-xs">Recovered: ₹{(point.recovered / 1000).toFixed(0)}K</span>
                    </div>
                  </div>
                  <div className="relative h-10 glass-subtle rounded-lg overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-error/20 transition-all duration-500"
                      style={{ width: `${atRiskWidth}%`, animationDelay: `${idx * 50}ms` }}
                    />
                    <div 
                      className="absolute inset-y-0 left-0 bg-emerald-500/30 transition-all duration-500"
                      style={{ width: `${recoveredWidth}%`, animationDelay: `${idx * 50 + 100}ms` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-glass-border">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-error/20" />
              <span className="text-body-sm text-text-secondary">Revenue at risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-emerald-500/30" />
              <span className="text-body-sm text-text-secondary">Revenue recovered</span>
            </div>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Failure Reasons */}
          <div className="panel-glass-lg animate-slide-up" style={{ animationDelay: '600ms' }}>
            <div className="mb-6">
              <h2 className="text-h3 mb-2">Top failure reasons</h2>
              <p className="text-body-sm text-text-secondary">What causes payments to fail</p>
            </div>

            <div className="space-y-4">
              {mockFailureReasons.map((reason, idx) => (
                <div key={reason.reason} className="glass-subtle p-4 rounded-lg hover-glass-intense transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-body font-medium text-text-primary mb-1">{reason.reason}</div>
                      <div className="text-body-sm text-text-secondary">{reason.count} cases · ₹{reason.amount.toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-body font-semibold text-emerald-400">{reason.recoveryRate}%</div>
                      <div className="text-xs text-text-tertiary">recovery</div>
                    </div>
                  </div>
                  
                  {/* Recovery Rate Bar */}
                  <div className="relative h-2 bg-glass-white-10 rounded-full overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
                      style={{ width: `${reason.recoveryRate}%`, animationDelay: `${idx * 100}ms` }}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <Activity className="h-3 w-3 text-text-tertiary" />
                    <span className="text-xs text-text-tertiary">Avg recovery: {reason.avgRecoveryTime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recovery Outcomes */}
          <div className="panel-glass-lg animate-slide-up" style={{ animationDelay: '700ms' }}>
            <div className="mb-6">
              <h2 className="text-h3 mb-2">Recovery outcomes</h2>
              <p className="text-body-sm text-text-secondary">Where cases end up</p>
            </div>

            <div className="space-y-6">
              {mockOutcomes.map((outcome, idx) => {
                const config = {
                  recovered: { 
                    label: 'Recovered', 
                    icon: CheckCircle2, 
                    color: 'text-emerald-400', 
                    bgColor: 'bg-emerald-500/10',
                    barColor: 'bg-emerald-500'
                  },
                  'in-progress': { 
                    label: 'In Progress', 
                    icon: Activity, 
                    color: 'text-info', 
                    bgColor: 'bg-info/10',
                    barColor: 'bg-info'
                  },
                  'needs-review': { 
                    label: 'Needs Review', 
                    icon: AlertCircle, 
                    color: 'text-warning', 
                    bgColor: 'bg-warning/10',
                    barColor: 'bg-warning'
                  },
                  blocked: { 
                    label: 'Blocked', 
                    icon: AlertCircle, 
                    color: 'text-error', 
                    bgColor: 'bg-error/10',
                    barColor: 'bg-error'
                  }
                }

                const { label, icon: Icon, color, bgColor, barColor } = config[outcome.outcome]

                return (
                  <div key={outcome.outcome}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`${bgColor} h-10 w-10 rounded-lg flex items-center justify-center`}>
                          <Icon className={`h-5 w-5 ${color}`} />
                        </div>
                        <div>
                          <div className="text-body font-medium text-text-primary">{label}</div>
                          <div className="text-body-sm text-text-secondary">{outcome.count} cases</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-h4 text-text-primary">₹{(outcome.amount / 1000).toFixed(0)}K</div>
                        <div className="text-xs text-text-tertiary">{outcome.percentage}%</div>
                      </div>
                    </div>
                    
                    {/* Percentage Bar */}
                    <div className="relative h-2 bg-glass-white-10 rounded-full overflow-hidden">
                      <div 
                        className={`absolute inset-y-0 left-0 ${barColor} rounded-full transition-all duration-700`}
                        style={{ width: `${outcome.percentage}%`, animationDelay: `${idx * 150}ms` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Summary */}
            <div className="mt-6 pt-6 border-t border-glass-border">
              <div className="flex items-center justify-between">
                <span className="text-body text-text-secondary">Total cases</span>
                <span className="text-h4 text-text-primary">{mockOutcomes.reduce((sum, o) => sum + o.count, 0)}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Recovery Performance Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '800ms' }}>
          
          <div className="card-glass hover-lift">
            <div className="flex items-center gap-4 mb-4">
              <div className="glass-emerald h-12 w-12 rounded-xl flex items-center justify-center glow-emerald-soft">
                <TrendingUp className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="text-label text-text-tertiary">BEST PERFORMING</div>
            </div>
            <div className="text-h4 mb-1">Temporary declines</div>
            <p className="text-body-sm text-text-secondary">89.2% recovery rate with fastest turnaround</p>
          </div>

          <div className="card-glass hover-lift">
            <div className="flex items-center gap-4 mb-4">
              <div className="glass-emerald h-12 w-12 rounded-xl flex items-center justify-center glow-emerald-soft">
                <Target className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="text-label text-text-tertiary">OPPORTUNITY</div>
            </div>
            <div className="text-h4 mb-1">Card expiry cases</div>
            <p className="text-body-sm text-text-secondary">Lower recovery rate - proactive renewal could help</p>
          </div>

          <div className="card-glass hover-lift">
            <div className="flex items-center gap-4 mb-4">
              <div className="glass-emerald h-12 w-12 rounded-xl flex items-center justify-center glow-emerald-soft">
                <DollarSign className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="text-label text-text-tertiary">REVENUE IMPACT</div>
            </div>
            <div className="text-h4 mb-1">₹633K recovered</div>
            <p className="text-body-sm text-text-secondary">74.7% of at-risk revenue brought back</p>
          </div>

        </div>

      </div>
    </div>
  )
}
