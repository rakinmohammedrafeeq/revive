import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Brain, 
  ChevronRight, 
  DollarSign, 
  RefreshCw, 
  Loader2,
  ArrowRight,
  ShieldCheck,
  CreditCard
} from 'lucide-react'
import { recoveryCaseApi, recoveryMetricsApi, type FailedPayment, type RecoveryMetrics } from '@/api/recoveryApi'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LivePaymentSimulator } from '@/components/recovery/LivePaymentSimulator'

/**
 * REVIVE RECOVERY CASES WORKSPACE
 * 
 * Lists all failed payments requiring recovery.
 * Filterable by status, searchable by customer or payment identifier.
 */

const STATUS_MAP: Record<string, { label: string; class: string; icon: typeof AlertCircle }> = {
  FAILED: { 
    label: 'Ready for Recovery', 
    class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    icon: AlertCircle
  },
  PENDING_RETRY: { 
    label: 'Scheduled Retry', 
    class: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: Clock
  },
  RETRY_IN_PROGRESS: { 
    label: 'In Progress', 
    class: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    icon: RefreshCw
  },
  UNDER_REVIEW: { 
    label: 'Needs Manual Review', 
    class: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    icon: Brain
  },
  RECOVERED: { 
    label: 'Recovered', 
    class: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    icon: CheckCircle2
  },
  ABANDONED: { 
    label: 'Abandoned', 
    class: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    icon: AlertCircle
  },
}

export function RecoveryWorkspace() {
  const [cases, setCases] = useState<FailedPayment[]>([])
  const [metrics, setMetrics] = useState<RecoveryMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [environmentMode, setEnvironmentMode] = useState<'test' | 'live'>(() => {
    return (localStorage.getItem('revive_environment_mode') as 'test' | 'live') || 'test'
  })

  const handleModeChange = (mode: 'test' | 'live') => {
    setEnvironmentMode(mode)
    localStorage.setItem('revive_environment_mode', mode)
  }

  const loadData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true)
      else setLoading(true)
      
      const [casesData, metricsData] = await Promise.all([
        recoveryCaseApi.getAll(),
        recoveryMetricsApi.get()
      ])
      
      setCases(casesData)
      setMetrics(metricsData)
    } catch (error) {
      console.error('Failed to load recovery data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredCases = cases.filter(case_ => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = 
      (case_.customerName && case_.customerName.toLowerCase().includes(q)) ||
      (case_.paymentIdentifier && case_.paymentIdentifier.toLowerCase().includes(q)) ||
      (case_.customerEmail && case_.customerEmail.toLowerCase().includes(q)) ||
      (case_.failureReason && case_.failureReason.toLowerCase().includes(q))
    
    const matchesStatus = statusFilter === 'all' || case_.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading recovery cases...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
              Recovery Pipeline
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {cases.length} Total Failed Payments
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Recovery Cases
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor, inspect, and process failed transactions through AI diagnosis and bounded recovery actions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Stripe-style Environment Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-card border border-border shadow-xs text-xs">
            <button
              type="button"
              onClick={() => handleModeChange('live')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                environmentMode === 'live'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${environmentMode === 'live' ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/40'}`} />
              Live Mode
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('test')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                environmentMode === 'test'
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${environmentMode === 'test' ? 'bg-amber-500 animate-ping' : 'bg-muted-foreground/40'}`} />
              Test Sandbox
            </button>
          </div>

          <Button
            variant="outline"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="gap-2 border-border hover:bg-accent text-xs h-8 sm:h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Cases
          </Button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl glass-card p-5 border border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Total at Risk</span>
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {formatCurrency(metrics.totalRevenueAtRisk || 0, 'INR')}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {metrics.activeCases || 0} active cases
            </p>
          </div>

          <div className="rounded-2xl glass-card p-5 border border-emerald-500/20">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Recovered Revenue</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(metrics.totalRecovered || 0, 'INR')}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {metrics.recoveredCases || 0} payments captured
            </p>
          </div>

          <div className="rounded-2xl glass-card p-5 border border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Recovery Rate</span>
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400">
              {(metrics.recoveryRate || 0).toFixed(1)}%
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Success rate across portfolio
            </p>
          </div>

          <div className="rounded-2xl glass-card p-5 border border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Awaiting Review</span>
              <Brain className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {metrics.pendingReviewCases || 0}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Policy-escalated decisions
            </p>
          </div>
        </div>
      )}

      {/* Environment-Aware Gateway View: Simulator vs Production Listener */}
      {environmentMode === 'test' ? (
        <LivePaymentSimulator
          onPaymentCreated={(_payment) => {
            loadData(true)
          }}
        />
      ) : (
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">Production Webhook Ingestion Active</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Live Gateway
                </span>
              </div>
              <p className="text-muted-foreground mt-0.5">
                Revive is continuously listening for live customer payment failure events via endpoint <code className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded text-foreground">/api/webhooks/razorpay</code>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleModeChange('test')}
            className="px-3 py-1.5 rounded-lg bg-card border border-border text-primary hover:bg-accent font-semibold whitespace-nowrap self-start sm:self-auto transition-colors cursor-pointer"
          >
            Open Test Sandbox &rarr;
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by customer, payment ID, or failure reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors shadow-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          {[
            { key: 'all', label: `All (${cases.length})` },
            { key: 'FAILED', label: 'Ready' },
            { key: 'PENDING_RETRY', label: 'Scheduled' },
            { key: 'UNDER_REVIEW', label: 'Review' },
            { key: 'RECOVERED', label: 'Recovered' },
            { key: 'ABANDONED', label: 'Abandoned' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setStatusFilter(item.key)}
              className={`px-3 py-2 rounded-xl font-medium whitespace-nowrap transition-colors border ${
                statusFilter === item.key
                  ? 'bg-primary/20 border-primary/30 text-primary'
                  : 'bg-card/50 border-border text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cases List */}
      <div className="space-y-3">
        {filteredCases.length === 0 ? (
          <div className="rounded-3xl border border-border glass-card p-12 text-center max-w-lg mx-auto space-y-3">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto opacity-70" />
            <h3 className="text-base font-bold text-foreground">No Matching Cases Found</h3>
            <p className="text-xs text-muted-foreground">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search query or filter criteria.'
                : 'No failed payments registered in this workspace yet.'}
            </p>
          </div>
        ) : (
          filteredCases.map((c) => {
            const statusCfg = STATUS_MAP[c.status] || STATUS_MAP.FAILED
            const StatusIcon = statusCfg.icon

            return (
              <Link
                key={c.id}
                to={`/app/recovery/${c.id}`}
                className="rounded-2xl glass-card border border-border p-5 hover:border-primary/40 transition-all hover-lift block group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Identifiers & Customer info */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                        {c.paymentIdentifier}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusCfg.class}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusCfg.label}
                      </span>
                      {c.paymentMethod && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-muted/60 text-muted-foreground">
                          {c.paymentMethod}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.failedAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <span className="text-foreground font-medium">
                        {c.customerName || c.customerEmail || c.customerId}
                      </span>
                      {c.customerEmail && c.customerName && (
                        <span> • {c.customerEmail}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="text-red-500 dark:text-red-400 font-medium">{c.failureReason || 'Declined by issuer'}</span>
                      {c.errorCode && (
                        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground">
                          {c.errorCode}
                        </span>
                      )}
                      {c.retryCount > 0 && (
                        <span>• {c.retryCount} retries</span>
                      )}
                    </div>
                  </div>

                  {/* Right: Amount & Action Link */}
                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-border/50">
                    <div className="text-left md:text-right">
                      <div className="text-lg sm:text-xl font-bold text-foreground">
                        {formatCurrency(c.amount, c.currency)}
                      </div>
                      {c.recoveredAt ? (
                        <div className="text-[10px] text-emerald-500 font-medium">
                          Captured {new Date(c.recoveredAt).toLocaleDateString()}
                        </div>
                      ) : (
                        <div className="text-[10px] text-muted-foreground">
                          Revenue at risk
                        </div>
                      )}
                    </div>

                    <div className="h-9 w-9 rounded-xl bg-muted/50 border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 group-hover:border-primary/20 transition-all flex-shrink-0">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
