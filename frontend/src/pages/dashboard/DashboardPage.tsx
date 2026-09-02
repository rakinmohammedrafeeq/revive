import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  TrendingUp,
  Activity,
  CheckCircle2,
  ArrowRight,
  Brain,
  Zap,
  Shield,
  Eye,
  Target,
  BarChart3
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useDashboardQuery } from '@/hooks'

// Demo recovery cases - UI ready for future recovery API
const DEMO_RECOVERY_CASES = [
  {
    id: 'RC-001',
    customer: 'Acme Corp',
    amount: 12500,
    reason: 'Card declined',
    aiDiagnosis: 'Temporary hold - high success rate with retry',
    aiReasoning: 'Similar patterns show 85% success on second attempt within 24h',
    status: 'ready',
    confidence: 0.89,
    timeAgo: '12min ago'
  },
  {
    id: 'RC-002',
    customer: 'Tech Solutions Inc',
    amount: 8200,
    reason: 'Insufficient funds',
    aiDiagnosis: 'Retry in 3 days - payment cycle detected',
    aiReasoning: 'Customer typically receives funds on the 15th',
    status: 'scheduled',
    confidence: 0.76,
    timeAgo: '1h ago'
  },
  {
    id: 'RC-003',
    customer: 'Global Services LLC',
    amount: 15750,
    reason: 'Expired card',
    aiDiagnosis: 'Contact recommended - high-value customer',
    aiReasoning: 'Manual outreach will preserve relationship and ensure update',
    status: 'needs_review',
    confidence: 0.92,
    timeAgo: '3h ago'
  },
]

export function DashboardPage() {
  const { user } = useAuth()
  const { data, isLoading, error } = useDashboardQuery()

  // Calculate recovery metrics from existing financial data
  const recoveryMetrics = useMemo(() => {
    if (!data) return null
    
    const totalExpenses = Number(data.totalExpenses) || 0
    // Simulate revenue at risk (~7% typical)
    const revenueAtRisk = totalExpenses * 0.07
    // Simulate recovered (~65% recovery rate)
    const revenueRecovered = revenueAtRisk * 0.65
    const recoveryRate = revenueAtRisk > 0 ? (revenueRecovered / revenueAtRisk) * 100 : 0
    
    return {
      revenueAtRisk,
      revenueRecovered,
      recoveryRate,
      activeCases: DEMO_RECOVERY_CASES.length,
      readyToAct: DEMO_RECOVERY_CASES.filter(c => c.status === 'ready').length,
    }
  }, [data])

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error || !data || !recoveryMetrics) {
    return (
      <div className="space-y-6">
        <div className="glass-card rounded-3xl p-12 text-center">
          <Activity className="h-16 w-16 text-muted-foreground/40 mb-4 mx-auto" />
          <h3 className="text-lg font-semibold mb-2">No recovery data available</h3>
          <p className="text-sm text-muted-foreground">Revenue recovery metrics will appear once payment data is available.</p>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30">Ready to act</Badge>
      case 'scheduled':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30">Scheduled</Badge>
      case 'needs_review':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30">Needs review</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <Zap className="h-4 w-4 text-emerald-400" />
      case 'scheduled':
        return <Activity className="h-4 w-4 text-blue-400" />
      case 'needs_review':
        return <Eye className="h-4 w-4 text-amber-400" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section - NOT traditional header */}
      <div className="space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">REVIVE</span>
          <span>/</span>
          <span>Revenue Recovery</span>
        </div>

        {/* Welcome Message */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0] || 'there'}.
          </h1>
          <p className="text-xl text-muted-foreground">
            Here's what needs attention.
          </p>
        </div>
      </div>

      {/* Primary Alert - Money at Risk (HERO CARD) */}
      <div className="glass-card emerald-glow-soft rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 glass-subtle rounded-full px-3 py-1.5 text-xs font-semibold">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-amber-400">Revenue at risk</span>
            </div>
            <div>
              <div className="text-6xl font-bold text-gradient-emerald mb-2">
                {formatCurrency(recoveryMetrics.revenueAtRisk)}
              </div>
              <p className="text-lg text-muted-foreground">
                is slipping away right now.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/app/recovery">
              <Button size="lg" className="rounded-xl bg-primary hover:bg-primary/90 gap-2">
                <span>View recovery queue</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Recovery Metrics - Horizontal Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Money Recovered */}
        <div className="card-revive group">
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-all">
              <TrendingUp className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Recovered</div>
              <div className="text-3xl font-bold text-emerald-400">{formatCurrency(recoveryMetrics.revenueRecovered)}</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Money we brought back</p>
        </div>

        {/* Recovery Rate */}
        <div className="card-revive group">
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-all">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Success rate</div>
              <div className="text-3xl font-bold text-primary">{recoveryMetrics.recoveryRate.toFixed(1)}%</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Of cases we win</p>
        </div>

        {/* Active Cases */}
        <div className="card-revive group">
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-all">
              <Activity className="h-6 w-6 text-blue-400" />
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Active cases</div>
              <div className="text-3xl font-bold text-blue-400">{recoveryMetrics.activeCases}</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {recoveryMetrics.readyToAct > 0 ? (
              <span className="text-emerald-400">{recoveryMetrics.readyToAct} ready to act</span>
            ) : (
              'Being monitored'
            )}
          </p>
        </div>
      </div>

      {/* Recovery Queue Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Payments that need a second chance</h2>
            <p className="text-sm text-muted-foreground">Cases requiring attention</p>
          </div>
          <Link to="/app/recovery">
            <Button variant="outline" className="rounded-xl gap-2">
              <span>View all</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Demo Notice */}
        <div className="glass-subtle rounded-xl px-4 py-3 border border-amber-500/20">
          <p className="text-xs text-amber-400">
            <span className="font-semibold">Demo Mode:</span> Recovery cases shown below use simulated data. 
            Connect to recovery API for production cases.
          </p>
        </div>

        {/* Recovery Cases */}
        <div className="space-y-4">
          {DEMO_RECOVERY_CASES.map((case_) => (
            <div 
              key={case_.id} 
              className="card-revive group cursor-pointer hover:border-primary/40"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                {/* Left: Amount & Status */}
                <div className="flex-shrink-0 space-y-3">
                  <div>
                    <div className="text-4xl font-bold text-gradient-emerald mb-1">
                      {formatCurrency(case_.amount)}
                    </div>
                    <div className="text-xs text-muted-foreground">{case_.customer}</div>
                  </div>
                  {getStatusBadge(case_.status)}
                </div>

                {/* Middle: Problem & Diagnosis */}
                <div className="flex-1 space-y-3">
                  {/* Problem */}
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Why it failed</div>
                    <div className="text-sm font-medium">{case_.reason}</div>
                  </div>

                  {/* AI Diagnosis */}
                  <div className="glass-subtle rounded-xl p-4 border border-primary/20">
                    <div className="flex items-start gap-3">
                      <Brain className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0 space-y-2">
                        <div>
                          <div className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">AI Diagnosis</div>
                          <div className="text-sm font-medium">{case_.aiDiagnosis}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">{case_.aiReasoning}</div>
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-3 w-3 text-primary" />
                            <span className="text-muted-foreground">Confidence: {(case_.confidence * 100).toFixed(0)}%</span>
                          </div>
                          <div className="text-muted-foreground">{case_.timeAgo}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Action */}
                <div className="flex-shrink-0 flex items-center gap-3">
                  {getStatusIcon(case_.status)}
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Policy Status */}
      <div className="glass-card rounded-3xl p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Recovery guardrails active</h2>
            </div>
            <p className="text-sm text-muted-foreground">Policies protecting your recovery operations</p>
          </div>
          <Link to="/app/policies">
            <Button variant="outline" size="sm" className="rounded-xl">
              Manage policies
            </Button>
          </Link>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="glass-subtle rounded-xl p-4 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Max retries</div>
            </div>
            <div className="text-2xl font-bold text-emerald-400">3</div>
          </div>
          <div className="glass-subtle rounded-xl p-4 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Min amount</div>
            </div>
            <div className="text-2xl font-bold text-emerald-400">{formatCurrency(100)}</div>
          </div>
          <div className="glass-subtle rounded-xl p-4 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-amber-400" />
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Needs approval</div>
            </div>
            <div className="text-2xl font-bold text-amber-400">&gt; {formatCurrency(10000)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
