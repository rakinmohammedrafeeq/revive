import { useState, useEffect, useCallback } from 'react'
import { 
  AlertCircle, 
  TrendingUp, 
  CheckCircle2, 
  Brain, 
  Shield,
  Zap,
  Clock,
  Eye,
  ArrowRight,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Database,
  Sparkles,
  BarChart3,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import { 
  recoveryCaseApi, 
  recoveryMetricsApi,
  recoveryAdminApi,
  type FailedPayment,
  type RecoveryMetrics,
  type RecoveryDecision,
} from '@/api/recoveryApi'

// Map backend status → frontend display
const STATUS_MAP: Record<string, { label: string; class: string; filter: string }> = {
  FAILED:           { label: 'Ready to act',  class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', filter: 'ready' },
  PENDING_RETRY:    { label: 'Scheduled',      class: 'bg-blue-500/20 text-blue-400 border-blue-500/30',         filter: 'scheduled' },
  RETRY_IN_PROGRESS:{ label: 'In Progress',   class: 'bg-purple-500/20 text-purple-400 border-purple-500/30',   filter: 'in_progress' },
  UNDER_REVIEW:     { label: 'Needs you',     class: 'bg-amber-500/20 text-amber-400 border-amber-500/30',      filter: 'awaiting_approval' },
  RECOVERED:        { label: 'Recovered',      class: 'bg-teal-500/20 text-teal-400 border-teal-500/30',         filter: 'recovered' },
  ABANDONED:        { label: 'On hold',        class: 'bg-gray-500/20 text-gray-400 border-gray-500/30',         filter: 'on_hold' },
}

const ERROR_TO_DIAGNOSIS: Record<string, { diagnosis: string; reasoning: string; policyStatus: 'approved' | 'needs_review' | 'blocked'; recommendedAction: string }> = {
  issuer_declined_temp:  { diagnosis: 'Temporary hold – high success rate with retry',    reasoning: 'Bank issued a temporary decline. Same-error patterns show 88% success on immediate retry.',              policyStatus: 'approved', recommendedAction: 'Retry payment now'            },
  gateway_timeout:       { diagnosis: 'Network issue – retry immediately',                 reasoning: 'Transient gateway failure. No customer action needed. Auto-retry recommended within 5 minutes.',           policyStatus: 'approved', recommendedAction: 'Automatic retry'             },
  insufficient_funds:    { diagnosis: 'Retry in 3 days – payment cycle detected',         reasoning: 'Customer balance insufficient. Monthly payment cycle suggests funds available after 15th.',                policyStatus: 'approved', recommendedAction: 'Schedule retry for 15th'      },
  card_expired:          { diagnosis: 'Card update required – high-value customer',        reasoning: 'Premium customer. Manual outreach will preserve relationship and ensure card update.',                     policyStatus: 'needs_review', recommendedAction: 'Send payment update request' },
  authentication_failed: { diagnosis: 'Auth challenge failed – resend payment link',      reasoning: '3DS authentication failed. A fresh payment link bypasses the challenge without re-entering card details.', policyStatus: 'approved', recommendedAction: 'Send payment link'           },
  disputed:              { diagnosis: 'Investigation required – hold recovery',            reasoning: 'Customer initiated chargeback. Recovery must wait for dispute resolution.',                               policyStatus: 'blocked',  recommendedAction: 'Contact customer support'    },
  fraud_suspected:       { diagnosis: 'Risk flag – manual review required',               reasoning: 'Risk management declined. Auto-retry may worsen the risk score. Manual review needed.',                   policyStatus: 'blocked',  recommendedAction: 'Review risk flags'           },
  declined_permanent:    { diagnosis: 'Permanent decline – send new payment link',        reasoning: 'Bank issued hard decline. Direct retry will fail. Fresh payment link is the safest recovery route.',       policyStatus: 'needs_review', recommendedAction: 'Send new payment link'   },
}

function getDisplayInfo(payment: FailedPayment) {
  const errorKey = payment.errorCode || 'gateway_timeout'
  const diag = ERROR_TO_DIAGNOSIS[errorKey] ?? ERROR_TO_DIAGNOSIS['gateway_timeout']
  
  // Estimate recovery probability from error type
  const probMap: Record<string, number> = {
    gateway_timeout: 88, issuer_declined_temp: 82, authentication_failed: 65,
    insufficient_funds: 58, card_expired: 45, declined_permanent: 32,
    disputed: 15, fraud_suspected: 10,
  }
  const recoveryProbability = probMap[errorKey] ?? 50

  const hoursAgo = Math.floor((Date.now() - new Date(payment.failedAt).getTime()) / 3_600_000)
  const detectedAt = hoursAgo === 0
    ? `${Math.max(1, Math.floor((Date.now() - new Date(payment.failedAt).getTime()) / 60_000))}min ago`
    : `${hoursAgo}h ago`

  const statusInfo = STATUS_MAP[payment.status] ?? STATUS_MAP['FAILED']

  return { ...diag, recoveryProbability, detectedAt, statusInfo }
}

export function RecoveryPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [payments, setPayments] = useState<FailedPayment[]>([])
  const [metrics, setMetrics] = useState<RecoveryMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [processResults, setProcessResults] = useState<Record<number, RecoveryDecision>>({})
  const [generatingDemo, setGeneratingDemo] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [paymentsData, metricsData] = await Promise.all([
        recoveryCaseApi.getAll(),
        recoveryMetricsApi.get(),
      ])
      setPayments(paymentsData)
      setMetrics(metricsData)
    } catch (err: unknown) {
      console.error('Failed to load recovery data:', err)
      const msg = err instanceof Error ? err.message : 'Failed to load recovery data'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleProcess = async (paymentId: number) => {
    try {
      setProcessingId(paymentId)
      const decision = await recoveryCaseApi.process(paymentId)
      setProcessResults(prev => ({ ...prev, [paymentId]: decision }))
      // Reload to get updated statuses
      setTimeout(loadData, 800)
    } catch (err) {
      console.error('Failed to process payment:', err)
    } finally {
      setProcessingId(null)
    }
  }

  const handleGenerateDemo = async () => {
    try {
      setGeneratingDemo(true)
      await recoveryAdminApi.generateDemoData(60)
      await loadData()
    } catch (err) {
      console.error('Failed to generate demo data:', err)
    } finally {
      setGeneratingDemo(false)
    }
  }

  const filteredPayments = payments.filter(payment => {
    const display = getDisplayInfo(payment)
    const matchesStatus = statusFilter === 'all' || display.statusInfo.filter === statusFilter
    const query = searchQuery.toLowerCase()
    const matchesSearch = !query || 
      (payment.customerName ?? '').toLowerCase().includes(query) ||
      payment.paymentIdentifier.toLowerCase().includes(query) ||
      (payment.customerId ?? '').toLowerCase().includes(query)
    return matchesStatus && matchesSearch
  })

  const getFilterCount = (filter: string) => {
    if (filter === 'all') return payments.length
    return payments.filter(p => getDisplayInfo(p).statusInfo.filter === filter).length
  }

  const totalAtRisk = metrics?.totalRevenueAtRisk ?? 0
  const totalRecovered = metrics?.totalRecovered ?? 0

  const getPolicyStatusIcon = (status: 'approved' | 'needs_review' | 'blocked') => {
    switch (status) {
      case 'approved':
        return <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
          <CheckCircle2 className="h-3 w-3" />
          <span>Policy says yes</span>
        </div>
      case 'needs_review':
        return <div className="flex items-center gap-1.5 text-amber-400 text-xs">
          <Eye className="h-3 w-3" />
          <span>Needs your review</span>
        </div>
      case 'blocked':
        return <div className="flex items-center gap-1.5 text-red-400 text-xs">
          <AlertCircle className="h-3 w-3" />
          <span>Policy says no</span>
        </div>
    }
  }

  // ── Empty State ────────────────────────────────────────────────────────────
  if (!loading && !error && payments.length === 0) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">REVIVE</span>
            <span>/</span>
            <span>Revenue Recovery</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Recovery Queue</h1>
        </div>
        <div className="glass-card rounded-3xl p-16 text-center space-y-6">
          <div className="h-20 w-20 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Database className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">No recovery cases yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Generate demo data to see the full recovery pipeline in action — 
              ML predictions, AI diagnosis, and policy evaluation.
            </p>
          </div>
          <Button 
            onClick={handleGenerateDemo}
            disabled={generatingDemo}
            className="rounded-xl bg-primary hover:bg-primary/90 gap-2"
          >
            {generatingDemo ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Generate Demo Data (60 payments)</>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // ── Loading / Error ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading recovery cases...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-4xl font-bold tracking-tight">Recovery Queue</h1>
        <div className="glass-card rounded-3xl p-10 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
          <p className="text-red-400">{error}</p>
          <Button onClick={loadData} variant="outline" className="rounded-xl gap-2">
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">REVIVE</span>
          <span>/</span>
          <span>Revenue Recovery</span>
          <span>/</span>
          <span className="text-foreground">Recovery Queue</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              Let's recover these
            </h1>
            <p className="text-lg text-muted-foreground">
              {filteredPayments.length} {filteredPayments.length === 1 ? 'payment needs' : 'payments need'} attention
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4">
            <div className="glass-subtle rounded-xl px-4 py-3 min-w-[140px]">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Currently slipping</div>
              <div className="text-2xl font-bold text-amber-400">{formatCurrency(Number(totalAtRisk))}</div>
            </div>
            <div className="glass-subtle rounded-xl px-4 py-3 min-w-[140px]">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Recovered</div>
              <div className="text-2xl font-bold text-emerald-400">{formatCurrency(Number(totalRecovered))}</div>
            </div>
            {metrics?.recoveryRate != null && (
              <div className="glass-subtle rounded-xl px-4 py-3 min-w-[120px]">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Recovery rate</div>
                <div className="text-2xl font-bold text-primary">{metrics.recoveryRate.toFixed(1)}%</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ML Model Badge */}
      <div className="flex items-center gap-3 glass-subtle rounded-xl px-4 py-3 border border-primary/20 w-fit">
        <BarChart3 className="h-4 w-4 text-primary flex-shrink-0" />
        <span className="text-xs text-primary font-semibold">ML Model Active</span>
        <span className="text-xs text-muted-foreground">Random Forest · F1=0.73 · ROC-AUC=0.69 · 800 training samples</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadData}
          className="h-6 px-2 text-xs gap-1"
        >
          <RefreshCw className="h-3 w-3" /> Refresh
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer or payment ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 glass-subtle border-white/10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {[
            { key: 'all', label: 'All' },
            { key: 'ready', label: 'Ready' },
            { key: 'scheduled', label: 'Scheduled' },
            { key: 'awaiting_approval', label: 'Awaiting' },
            { key: 'in_progress', label: 'In progress' },
            { key: 'on_hold', label: 'On hold' },
          ].map(({ key, label }) => {
            const count = getFilterCount(key)
            return (
              <Button
                key={key}
                variant={statusFilter === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(key)}
                className={`rounded-xl whitespace-nowrap ${
                  statusFilter === key ? 'bg-primary hover:bg-primary/90' : 'glass-subtle'
                }`}
              >
                {label} {count > 0 && `(${count})`}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Recovery Cases */}
      <div className="space-y-4">
        {filteredPayments.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center">
            <Filter className="h-16 w-16 text-muted-foreground/40 mb-4 mx-auto" />
            <h3 className="text-lg font-semibold mb-2">Nothing matches that search</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
          </div>
        ) : (
          filteredPayments.map((payment) => {
            const display = getDisplayInfo(payment)
            const result = processResults[payment.id]
            const isProcessing = processingId === payment.id
            const isReady = payment.status === 'FAILED' || payment.status === 'PENDING_RETRY'

            return (
              <div 
                key={payment.id}
                className="card-revive group cursor-pointer hover:border-primary/40"
              >
                {/* Header Row */}
                <div className="flex flex-col lg:flex-row lg:items-start gap-6 mb-6">
                  {/* Amount & Customer */}
                  <div className="flex-shrink-0 space-y-2">
                    <div className="text-4xl font-bold text-gradient-emerald">
                      {formatCurrency(Number(payment.amount))}
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">{payment.customerName ?? payment.customerId}</div>
                      <div className="text-xs text-muted-foreground">
                        {payment.paymentIdentifier} · {display.detectedAt}
                      </div>
                    </div>
                    <Badge className={`${display.statusInfo.class} hover:${display.statusInfo.class}`}>
                      {display.statusInfo.label}
                    </Badge>
                  </div>

                  {/* Problem & Method */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Why it failed</div>
                      <div className="text-sm font-medium">{payment.failureReason ?? payment.errorCode}</div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {payment.paymentMethod && (
                        <span className="glass-subtle px-2 py-1 rounded-md">{payment.paymentMethod}</span>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Retry #{payment.retryCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action button */}
                  {isReady && (
                    <div className="flex-shrink-0">
                      <Button 
                        className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
                        disabled={isProcessing}
                        onClick={() => handleProcess(payment.id)}
                      >
                        {isProcessing ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                        ) : (
                          <><Zap className="h-4 w-4" /> Let's go</>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Process Result Banner */}
                {result && (
                  <div className={`rounded-xl px-4 py-3 mb-4 text-sm font-medium flex items-center gap-2 ${
                    result.decision === 'EXECUTE' 
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                      : result.decision === 'BLOCKED'
                      ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                      : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                  }`}>
                    {result.decision === 'EXECUTE' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    <span>
                      {result.decision === 'EXECUTE' 
                        ? 'Recovery action initiated' 
                        : result.decision === 'BLOCKED' 
                        ? `Blocked: ${result.reason}` 
                        : `Escalated: ${result.reason}`}
                    </span>
                    {result.recoveryProbability != null && (
                      <span className="ml-auto text-xs opacity-75">
                        {(result.recoveryProbability * 100).toFixed(0)}% probability
                      </span>
                    )}
                  </div>
                )}

                {/* AI Diagnosis Section */}
                <div className="glass-subtle rounded-xl p-5 border border-primary/20 mb-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Brain className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <div className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">
                          Revive's take
                        </div>
                        <div className="text-sm font-medium mb-2">{display.diagnosis}</div>
                        <div className="text-xs text-muted-foreground leading-relaxed">{display.reasoning}</div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="h-3 w-3 text-primary" />
                          <span className="text-muted-foreground">
                            {display.recoveryProbability}% recovery probability
                          </span>
                        </div>
                        {result?.recoveryProbability != null && (
                          <div className="flex items-center gap-1.5">
                            <BarChart3 className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400 font-medium">
                              ML: {(result.recoveryProbability * 100).toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action & Policy Row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">What we should do</div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{display.recommendedAction}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Are we allowed?</div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      {getPolicyStatusIcon(display.policyStatus)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Take a look</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Generate More Demo Data */}
      <div className="glass-subtle rounded-xl px-5 py-4 border border-white/5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Need more cases to demonstrate?</p>
          <p className="text-xs text-muted-foreground mt-0.5">Generate synthetic payment failures using the ML training distribution</p>
        </div>
        <Button 
          onClick={handleGenerateDemo}
          disabled={generatingDemo}
          variant="outline"
          className="rounded-xl gap-2 flex-shrink-0"
        >
          {generatingDemo ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
          ) : (
            <><Sparkles className="h-4 w-4" /> Generate 60 more</>
          )}
        </Button>
      </div>
    </div>
  )
}
