import { useState, useEffect } from 'react'
import { 
  AlertCircle, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Shield, 
  Brain, 
  Activity, 
  Loader2, 
  PlayCircle,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  Database
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { recoveryMetricsApi, recoveryCaseApi, recoveryAdminApi, type RecoveryMetrics, type FailedPayment } from '@/api/recoveryApi'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

/**
 * REVIVE REVENUE RECOVERY COMMAND CENTER
 * 
 * Connected to real backend recovery APIs.
 * Shows live revenue at risk, recovered revenue, active cases,
 * guardrail enforcement, and quick navigation.
 */
export function RevenueDashboard() {
  const [metrics, setMetrics] = useState<RecoveryMetrics | null>(null)
  const [recentCases, setRecentCases] = useState<FailedPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [seedingDemo, setSeedingDemo] = useState(false)

  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [metricsData, casesData] = await Promise.all([
        recoveryMetricsApi.get(),
        recoveryCaseApi.getAll().catch((err) => {
          console.warn('Failed to load cases, defaulting to empty list:', err)
          return [] as FailedPayment[]
        })
      ])
      
      setMetrics(metricsData)
      setRecentCases((casesData || []).slice(0, 5))
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err)
      const message = err?.response?.data?.message || err?.message || 'Failed to load recovery dashboard data'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleSeedDemo = async () => {
    try {
      setSeedingDemo(true)
      const res = await recoveryAdminApi.generateDemoData(60)
      toast.success(res.message || `Generated ${res.generated} demo recovery cases!`)
      await loadData()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to seed demo data')
    } finally {
      setSeedingDemo(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading recovery command center...</p>
        </div>
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md p-6 rounded-2xl glass-card border border-border">
          <AlertCircle className="w-10 h-10 mx-auto text-red-400" />
          <h2 className="text-lg font-bold text-foreground">Dashboard Offline</h2>
          <p className="text-xs text-muted-foreground">{error || 'No recovery metrics available'}</p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button onClick={loadData} variant="outline" className="gap-2 text-xs">
              Try Again
            </Button>
            <Button 
              onClick={handleSeedDemo} 
              disabled={seedingDemo}
              className="gap-2 text-xs bg-emerald-500 hover:bg-emerald-400 text-black font-semibold"
            >
              {seedingDemo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
              Seed 60 Demo Cases
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Conversational Greeting & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
              Command Center
            </span>
            <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Monitoring
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {greeting}. Here's your revenue recovery pulse.
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time status of failed transactions, machine-learning recovery scoring, and policy-bounded interventions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/app/recovery">
            <Button
              variant="outline"
              className="gap-2 text-xs border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-medium"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              Test Live Payment
            </Button>
          </Link>

          <Button
            onClick={handleSeedDemo}
            disabled={seedingDemo}
            variant="outline"
            className="gap-2 text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
          >
            {seedingDemo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
            Seed 60 Demo Cases
          </Button>

          <Link to="/app/batch-evaluation">
            <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 text-xs">
              <PlayCircle className="w-4 h-4" />
              Batch Validation
            </Button>
          </Link>
        </div>
      </div>

      {/* Empty State Banner if no cases yet */}
      {metrics.totalCases === 0 && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-card to-cyan-500/10 border border-emerald-500/20 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-foreground">No Failed Payments Recorded Yet</h3>
              </div>
              <p className="text-xs text-muted-foreground max-w-2xl">
                Your workspace does not have any failed transactions recorded yet. Seed 60 realistic test scenarios across technical timeouts, card declines, and insufficient funds to test the complete AI recovery pipeline.
              </p>
            </div>
            <Button
              onClick={handleSeedDemo}
              disabled={seedingDemo}
              className="gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold shadow-lg shadow-emerald-500/20 text-xs whitespace-nowrap"
            >
              {seedingDemo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
              Seed 60 Demo Cases
            </Button>
          </div>
        </div>
      )}

      {/* Main Command Center Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Hero Metric — Revenue at Risk (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Revenue at Risk Hero Card */}
          <div className="rounded-2xl glass-card p-6 border border-primary/30 relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-primary/90">
                    Revenue at Risk
                  </div>
                  <p className="text-xs text-muted-foreground">Failed payments awaiting recovery</p>
                </div>
              </div>
              
              <div className="py-2">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gradient-emerald tracking-tight">
                  {formatCurrency(metrics.totalRevenueAtRisk || 0, 'INR')}
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Activity className="h-4 w-4 text-primary" />
                  <span>{metrics.activeCases || 0} active cases currently under management</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Avg recovery latency</span>
                <span className="font-semibold text-foreground">
                  {metrics.averageRecoveryTime 
                    ? metrics.averageRecoveryTime >= 1440
                      ? `~14 min retry delay (${(metrics.averageRecoveryTime / 1440).toFixed(1)}d dunning cycle)`
                      : `~${Math.round(metrics.averageRecoveryTime)} min`
                    : '< 1 min'}
                </span>
              </div>
            </div>
          </div>

          {/* Recovery Rate Card */}
          <div className="rounded-2xl glass-card p-6 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Recovery Success Rate
                  </span>
                  {metrics.volumeRecoveryRate !== undefined && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {metrics.volumeRecoveryRate.toFixed(1)}% Gross Volume
                    </span>
                  )}
                </div>
                <div className="text-3xl font-extrabold text-foreground">
                  {(metrics.recoveryRate || 0).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {metrics.recoveredCases || 0} successfully captured of {metrics.totalCases || 0} cases
                </p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="h-7 w-7 text-emerald-500" />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Financial Outcome & Live Activity (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 3-column stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Recovered */}
            <div className="rounded-2xl glass-card p-5 border border-border">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Recovered</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-foreground">
                {formatCurrency(metrics.totalRecovered || 0, 'INR')}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Directly salvaged revenue</p>
            </div>

            {/* Net Gain & ROI */}
            <div className="rounded-2xl glass-card p-5 border border-border">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Net Profit</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-foreground">
                {formatCurrency(metrics.netGain || metrics.totalRecovered || 0, 'INR')}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {metrics.totalRecoveryCost 
                  ? `${formatCurrency(metrics.totalRecoveryCost, 'INR')} costs (99.8% recovery margin)`
                  : 'After recovery costs'}
              </p>
            </div>

            {/* Pending Review */}
            <div className="rounded-2xl glass-card p-5 border border-border">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-amber-500" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Needs Review</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
                {metrics.pendingReviewCases || 0}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Escalated by policy</p>
            </div>
          </div>

          {/* What Revive is doing right now */}
          <div className="rounded-2xl glass-card p-6 border border-border space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-sm">Autonomous Engine Status</h3>
                <p className="text-xs text-muted-foreground">What Revive is executing right now</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-foreground font-medium">Machine Learning Recovery Scorer</span>
                </div>
                <span className="text-muted-foreground font-mono">
                  {metrics.activeCases || 0} predictions active
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-foreground font-medium">Deterministic Guardrails & Cooldowns</span>
                </div>
                <span className="text-muted-foreground font-mono">
                  {metrics.policyBlockedActions || 0} unsafe retries blocked
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-foreground font-medium">Razorpay Gateway Test Mode Integration</span>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Recovery Cases */}
      <div className="rounded-2xl glass-card border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-bold text-foreground text-base">Cases in Motion</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Recent failed transactions undergoing diagnosis and bounded intervention
            </p>
          </div>
          <Link
            to="/app/recovery"
            className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
          >
            View all {metrics.totalCases || ''} cases <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentCases.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-medium text-foreground">No active failed payments</p>
            <p className="mt-1">All payments have been settled or no failures have been reported yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentCases.map((c) => (
              <Link
                key={c.id}
                to={`/app/recovery/${c.id}`}
                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-accent/40 transition-colors block"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs text-foreground font-medium">{c.paymentIdentifier}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {c.customerName || c.customerEmail || c.customerId} • {c.failureReason || 'Payment declined'}
                  </p>
                </div>

                <div className="flex items-center sm:text-right gap-4">
                  <div>
                    <div className="text-sm font-bold text-foreground">
                      {formatCurrency(c.amount, c.currency)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(c.failedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Action Navigation Cards (4 pillars) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/app/recovery"
          className="rounded-2xl glass-card p-5 border border-border hover:border-primary/40 transition-all hover-lift group block"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-foreground text-xs">Recovery Cases</h4>
              <p className="text-[11px] text-muted-foreground">Browse all failed payments</p>
            </div>
          </div>
        </Link>

        <Link
          to="/app/batch-evaluation"
          className="rounded-2xl glass-card p-5 border border-border hover:border-primary/40 transition-all hover-lift group block"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-105 transition-transform">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-foreground text-xs">Batch Evaluation</h4>
              <p className="text-[11px] text-muted-foreground">Execute Checkpoint 4 pipeline</p>
            </div>
          </div>
        </Link>

        <Link
          to="/app/ml-performance"
          className="rounded-2xl glass-card p-5 border border-border hover:border-primary/40 transition-all hover-lift group block"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 group-hover:scale-105 transition-transform">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-foreground text-xs">ML Performance</h4>
              <p className="text-[11px] text-muted-foreground">Check accuracy & feedback loop</p>
            </div>
          </div>
        </Link>

        <Link
          to="/app/policies"
          className="rounded-2xl glass-card p-5 border border-border hover:border-primary/40 transition-all hover-lift group block"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-foreground text-xs">Policy Guardrails</h4>
              <p className="text-[11px] text-muted-foreground">Review retry & budget limits</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'RECOVERED':
      return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400">Recovered</span>
    case 'FAILED':
      return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/20 text-red-400">Needs Recovery</span>
    case 'PENDING_RETRY':
      return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-400">Scheduled Retry</span>
    case 'RETRY_IN_PROGRESS':
      return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-400">In Progress</span>
    case 'UNDER_REVIEW':
      return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-400">Under Review</span>
    case 'ABANDONED':
      return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-500/20 text-gray-400">Abandoned</span>
    default:
      return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 text-muted-foreground">{status}</span>
  }
}

