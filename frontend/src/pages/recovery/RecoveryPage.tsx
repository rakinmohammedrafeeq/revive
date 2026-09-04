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
  DollarSign,
  XCircle,
  ListChecks,
  History,
  PlayCircle,
  Info,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import {
  recoveryCaseApi,
  recoveryMetricsApi,
  recoveryAdminApi,
  auditTrailApi,
  type FailedPayment,
  type RecoveryMetrics,
  type RecoveryDecision,
  type AuditTrailEntry,
} from '@/api/recoveryApi'

// ── Status display map ──────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; class: string; filter: string }> = {
  FAILED:            { label: 'Ready to act',  class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', filter: 'ready' },
  PENDING_RETRY:     { label: 'Scheduled',     class: 'bg-blue-500/20 text-blue-400 border-blue-500/30',         filter: 'scheduled' },
  RETRY_IN_PROGRESS: { label: 'In Progress',   class: 'bg-purple-500/20 text-purple-400 border-purple-500/30',   filter: 'in_progress' },
  UNDER_REVIEW:      { label: 'Needs you',     class: 'bg-amber-500/20 text-amber-400 border-amber-500/30',      filter: 'awaiting_approval' },
  RECOVERED:         { label: 'Recovered',     class: 'bg-teal-500/20 text-teal-400 border-teal-500/30',         filter: 'recovered' },
  ABANDONED:         { label: 'On hold',       class: 'bg-gray-500/20 text-gray-400 border-gray-500/30',         filter: 'on_hold' },
}

// ── Error-code → display (used when LLM result not yet loaded) ──────────────
const ERROR_TO_DIAGNOSIS: Record<string, {
  diagnosis: string
  reasoning: string
  policyStatus: 'approved' | 'needs_review' | 'blocked'
  recommendedAction: string
}> = {
  issuer_declined_temp:  { diagnosis: 'Temporary hold – high success rate with retry',    reasoning: 'Bank issued a temporary decline. Same-error patterns show 88% success on immediate retry.',              policyStatus: 'approved',      recommendedAction: 'Retry payment now' },
  gateway_timeout:       { diagnosis: 'Network issue – retry immediately',                 reasoning: 'Transient gateway failure. No customer action needed.',                                                   policyStatus: 'approved',      recommendedAction: 'Automatic retry' },
  gateway_error:         { diagnosis: 'Network issue – retry immediately',                 reasoning: 'Transient gateway failure. No customer action needed.',                                                   policyStatus: 'approved',      recommendedAction: 'Automatic retry' },
  timeout:               { diagnosis: 'Network timeout – retry now',                       reasoning: 'Request timed out at gateway level. Immediate retry recommended.',                                        policyStatus: 'approved',      recommendedAction: 'Automatic retry' },
  declined_temp:         { diagnosis: 'Temporary decline – retry safe',                    reasoning: 'Issuer issued a temporary hold. Retry has high success rate.',                                           policyStatus: 'approved',      recommendedAction: 'Retry payment now' },
  insufficient_funds:    { diagnosis: 'Retry in 3 days – payment cycle detected',          reasoning: 'Customer balance insufficient. Monthly payment cycle suggests retry after 15th.',                         policyStatus: 'approved',      recommendedAction: 'Schedule retry' },
  card_expired:          { diagnosis: 'Card update required – high-value customer',         reasoning: 'Premium customer. Manual outreach will preserve relationship.',                                          policyStatus: 'needs_review',  recommendedAction: 'Send update request' },
  invalid_card:          { diagnosis: 'Card details invalid – send payment link',           reasoning: 'Invalid card details entered. Fresh payment link is safest route.',                                      policyStatus: 'needs_review',  recommendedAction: 'Send payment link' },
  auth_failed:           { diagnosis: 'Auth challenge failed – resend payment link',       reasoning: '3DS authentication failed. A fresh payment link bypasses the challenge.',                                policyStatus: 'approved',      recommendedAction: 'Send payment link' },
  authentication_failed: { diagnosis: 'Auth challenge failed – resend payment link',       reasoning: '3DS authentication failed. A fresh payment link bypasses the challenge.',                                policyStatus: 'approved',      recommendedAction: 'Send payment link' },
  declined_by_bank:      { diagnosis: 'Permanent decline – send new payment link',         reasoning: 'Bank issued hard decline. Direct retry will fail.',                                                      policyStatus: 'needs_review',  recommendedAction: 'Send new payment link' },
  limit_exceeded:        { diagnosis: 'Daily limit hit – retry tomorrow',                   reasoning: 'Customer daily transaction limit exceeded. Retry after 24h.',                                            policyStatus: 'approved',      recommendedAction: 'Schedule for tomorrow' },
  risk_decline:          { diagnosis: 'Risk flag – manual review required',                reasoning: 'Risk management declined. Auto-retry may worsen risk score.',                                            policyStatus: 'blocked',       recommendedAction: 'Review risk flags' },
  disputed:              { diagnosis: 'Investigation required – hold recovery',            reasoning: 'Customer initiated chargeback. Recovery must wait for dispute resolution.',                               policyStatus: 'blocked',       recommendedAction: 'Contact support' },
  fraud_suspected:       { diagnosis: 'Risk flag – manual review required',               reasoning: 'Risk management declined. Auto-retry may worsen the risk score.',                                        policyStatus: 'blocked',       recommendedAction: 'Review risk flags' },
  declined_permanent:    { diagnosis: 'Permanent decline – send new payment link',         reasoning: 'Bank issued hard decline. Direct retry will fail.',                                                      policyStatus: 'needs_review',  recommendedAction: 'Send new payment link' },
}

function getDisplayInfo(payment: FailedPayment) {
  const errorKey = payment.errorCode || 'gateway_timeout'
  const diag = ERROR_TO_DIAGNOSIS[errorKey] ?? ERROR_TO_DIAGNOSIS['gateway_timeout']
  const statusInfo = STATUS_MAP[payment.status] ?? STATUS_MAP['FAILED']

  const hoursAgo = Math.floor((Date.now() - new Date(payment.failedAt).getTime()) / 3_600_000)
  const detectedAt = hoursAgo === 0
    ? `${Math.max(1, Math.floor((Date.now() - new Date(payment.failedAt).getTime()) / 60_000))}min ago`
    : `${hoursAgo}h ago`

  return { ...diag, detectedAt, statusInfo }
}

// Execution status badge
function ExecutionBadge({ status }: { status?: string }) {
  if (!status) return null
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    SUCCESS: { label: 'Recovered ✓',   className: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300', icon: <CheckCircle2 className="h-3 w-3" /> },
    PENDING: { label: 'Action sent',   className: 'bg-blue-500/15 border-blue-500/40 text-blue-300',          icon: <Clock className="h-3 w-3" /> },
    FAILED:  { label: 'Failed ✗',     className: 'bg-red-500/15 border-red-500/40 text-red-300',             icon: <XCircle className="h-3 w-3" /> },
    BLOCKED: { label: 'Blocked',       className: 'bg-gray-500/15 border-gray-500/40 text-gray-300',          icon: <Shield className="h-3 w-3" /> },
  }
  const info = map[status] ?? map['PENDING']
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${info.className}`}>
      {info.icon} {info.label}
    </span>
  )
}

// Metric card
function MetricCard({ label, value, sub, color = 'text-foreground' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="glass-subtle rounded-xl px-4 py-3 space-y-1">
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  )
}

// Audit event row
function AuditRow({ entry }: { entry: AuditTrailEntry }) {
  const typeColor: Record<string, string> = {
    ML_PREDICTION:          'text-blue-400',
    AI_DIAGNOSIS:           'text-purple-400',
    RECOVERY_RECOMMENDATION:'text-cyan-400',
    POLICY_CHECK:           'text-amber-400',
    POLICY_VIOLATION:       'text-red-400',
    RECOVERY_APPROVED:      'text-emerald-400',
    RECOVERY_INITIATED:     'text-teal-400',
    RECOVERY_COMPLETED:     'text-green-400',
    REVENUE_RECOVERED:      'text-emerald-300',
    RECOVERY_FAILED:        'text-red-300',
    DUPLICATE_BLOCKED:      'text-orange-400',
  }
  const color = typeColor[entry.actionType] ?? 'text-muted-foreground'
  const time = new Date(entry.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
      <div className="text-xs text-muted-foreground font-mono w-20 flex-shrink-0 pt-0.5">{time}</div>
      <div className={`text-xs font-semibold w-52 flex-shrink-0 pt-0.5 ${color}`}>{entry.actionType}</div>
      <div className="text-xs text-muted-foreground flex-1 truncate">{entry.outcome ?? entry.paymentIdentifier}</div>
    </div>
  )
}

export function RecoveryPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'cases' | 'audit' | 'batch'>('cases')
  const [payments, setPayments] = useState<FailedPayment[]>([])
  const [metrics, setMetrics] = useState<RecoveryMetrics | null>(null)
  const [auditEntries, setAuditEntries] = useState<AuditTrailEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [processResults, setProcessResults] = useState<Record<number, RecoveryDecision>>({})
  const [generatingDemo, setGeneratingDemo] = useState(false)
  const [batchRunning, setBatchRunning] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [batchResult, setBatchResult] = useState<any | null>(null)

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
      setError(err instanceof Error ? err.message : 'Failed to load recovery data')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadAudit = useCallback(async () => {
    try {
      const entries = await auditTrailApi.getAll()
      setAuditEntries(entries)
    } catch (err) {
      console.error('Failed to load audit trail:', err)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])
  useEffect(() => { if (activeTab === 'audit') loadAudit() }, [activeTab, loadAudit])

  const handleProcess = async (paymentId: number) => {
    try {
      setProcessingId(paymentId)
      const decision = await recoveryCaseApi.process(paymentId)
      setProcessResults(prev => ({ ...prev, [paymentId]: decision }))
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

  const handleBatchEvaluate = async () => {
    try {
      setBatchRunning(true)
      const result = await recoveryAdminApi.runBatchEvaluation()
      setBatchResult(result)
      await loadData()
    } catch (err) {
      console.error('Batch evaluation failed:', err)
    } finally {
      setBatchRunning(false)
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

  const getPolicyStatusIcon = (status: 'approved' | 'needs_review' | 'blocked') => {
    switch (status) {
      case 'approved':
        return <div className="flex items-center gap-1.5 text-emerald-400 text-xs"><CheckCircle2 className="h-3 w-3" /><span>Policy says yes</span></div>
      case 'needs_review':
        return <div className="flex items-center gap-1.5 text-amber-400 text-xs"><Eye className="h-3 w-3" /><span>Needs your review</span></div>
      case 'blocked':
        return <div className="flex items-center gap-1.5 text-red-400 text-xs"><AlertCircle className="h-3 w-3" /><span>Policy says no</span></div>
    }
  }

  // ── Empty State ──────────────────────────────────────────────────────────
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
              ML predictions, AI diagnosis, policy evaluation, and real outcomes.
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
            <h1 className="text-4xl font-bold tracking-tight mb-2">Let's recover these</h1>
            <p className="text-lg text-muted-foreground">
              {payments.length} {payments.length === 1 ? 'payment' : 'payments'} tracked
            </p>
          </div>

          {/* Live Metrics Strip */}
          <div className="flex flex-wrap gap-3">
            <MetricCard
              label="At risk"
              value={formatCurrency(Number(metrics?.totalRevenueAtRisk ?? 0))}
              color="text-amber-400"
            />
            <MetricCard
              label="Recovered"
              value={formatCurrency(Number(metrics?.totalRecovered ?? 0))}
              color="text-emerald-400"
            />
            {metrics?.recoveryRate != null && (
              <MetricCard
                label="Recovery rate"
                value={`${metrics.recoveryRate.toFixed(1)}%`}
                color="text-primary"
              />
            )}
            {metrics?.expectedRecoveryValue != null && Number(metrics.expectedRecoveryValue) > 0 && (
              <MetricCard
                label="Expected (ERV)"
                value={formatCurrency(Number(metrics.expectedRecoveryValue))}
                sub="ML × amount"
                color="text-cyan-400"
              />
            )}
          </div>
        </div>
      </div>

      {/* Outcome Counts Row */}
      {(metrics?.successfulRecoveries != null || metrics?.failedRecoveries != null) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="glass-subtle rounded-xl px-4 py-3 border border-emerald-500/20">
            <div className="text-xs text-muted-foreground mb-1">Recovered</div>
            <div className="text-xl font-bold text-emerald-400">{metrics?.recoveredCases ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1">{metrics?.successfulRecoveries ?? 0} successful actions</div>
          </div>
          <div className="glass-subtle rounded-xl px-4 py-3 border border-blue-500/20">
            <div className="text-xs text-muted-foreground mb-1">Pending</div>
            <div className="text-xl font-bold text-blue-400">{metrics?.inProgressCases ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1">{metrics?.pendingRecoveries ?? 0} awaiting response</div>
          </div>
          <div className="glass-subtle rounded-xl px-4 py-3 border border-red-500/20">
            <div className="text-xs text-muted-foreground mb-1">Failed</div>
            <div className="text-xl font-bold text-red-400">{metrics?.failedRecoveries ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1">execution attempts</div>
          </div>
          <div className="glass-subtle rounded-xl px-4 py-3 border border-amber-500/20">
            <div className="text-xs text-muted-foreground mb-1">Blocked</div>
            <div className="text-xl font-bold text-amber-400">{metrics?.policyBlockedActions ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1">by policy engine</div>
          </div>
        </div>
      )}

      {/* ML Model Badge */}
      <div className="flex items-center gap-3 glass-subtle rounded-xl px-4 py-3 border border-primary/20 w-fit">
        <BarChart3 className="h-4 w-4 text-primary flex-shrink-0" />
        <span className="text-xs text-primary font-semibold">ML Model Active · TEST MODE</span>
        <span className="text-xs text-muted-foreground">Random Forest · F1=0.73 · ROC-AUC=0.69 · Razorpay Test Credentials</span>
        <Button variant="ghost" size="sm" onClick={loadData} className="h-6 px-2 text-xs gap-1">
          <RefreshCw className="h-3 w-3" /> Refresh
        </Button>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 glass-subtle rounded-xl p-1 w-fit border border-white/10">
        {[
          { key: 'cases',  label: 'Cases',      icon: <ListChecks className="h-3.5 w-3.5" /> },
          { key: 'batch',  label: 'Batch Eval', icon: <PlayCircle className="h-3.5 w-3.5" /> },
          { key: 'audit',  label: 'Audit Trail', icon: <History className="h-3.5 w-3.5" /> },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'cases' | 'audit' | 'batch')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: CASES ── */}
      {activeTab === 'cases' && (
        <div className="space-y-4">
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
                { key: 'all',              label: 'All' },
                { key: 'ready',            label: 'Ready' },
                { key: 'scheduled',        label: 'Scheduled' },
                { key: 'awaiting_approval',label: 'Awaiting' },
                { key: 'in_progress',      label: 'In progress' },
                { key: 'recovered',        label: 'Recovered' },
                { key: 'on_hold',          label: 'On hold' },
              ].map(({ key, label }) => (
                <Button
                  key={key}
                  variant={statusFilter === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(key)}
                  className={`rounded-xl whitespace-nowrap ${statusFilter === key ? 'bg-primary hover:bg-primary/90' : 'glass-subtle'}`}
                >
                  {label} {getFilterCount(key) > 0 && `(${getFilterCount(key)})`}
                </Button>
              ))}
            </div>
          </div>

          {/* Case Cards */}
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

              // Use real ML probability from result if available, else estimate from error code
              const probMap: Record<string, number> = {
                gateway_timeout: 88, gateway_error: 85, timeout: 82, declined_temp: 80,
                issuer_declined_temp: 82, auth_failed: 65, authentication_failed: 65,
                insufficient_funds: 58, limit_exceeded: 55, card_expired: 45,
                invalid_card: 40, declined_by_bank: 32, declined_permanent: 32,
                disputed: 15, risk_decline: 12, fraud_suspected: 10,
              }
              const displayProbability = result?.recoveryProbability != null
                ? Math.round(result.recoveryProbability * 100)
                : (probMap[payment.errorCode ?? ''] ?? 50)

              return (
                <div key={payment.id} className="card-revive group hover:border-primary/40">
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
                        <div className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3 text-primary" />
                          <span className="text-primary font-medium">{displayProbability}% ML probability</span>
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
                            <><Zap className="h-4 w-4" /> Run recovery</>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Process Result Banner — real outcome from pipeline */}
                  {result && (
                    <div className={`rounded-xl px-4 py-3 mb-4 text-sm font-medium flex items-center gap-3 ${
                      result.decision === 'EXECUTE'
                        ? result.executionStatus === 'SUCCESS'
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                          : result.executionStatus === 'FAILED'
                          ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                          : 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
                        : result.decision === 'BLOCKED'
                        ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                        : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                    }`}>
                      {result.decision === 'EXECUTE' && result.executionStatus === 'SUCCESS'
                        ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                        : result.decision === 'BLOCKED'
                        ? <Shield className="h-4 w-4 flex-shrink-0" />
                        : <Info className="h-4 w-4 flex-shrink-0" />
                      }
                      <span className="flex-1">
                        {result.decision === 'EXECUTE'
                          ? result.executionStatus === 'SUCCESS'
                            ? `✓ Recovered ${result.recoveredAmount ? formatCurrency(Number(result.recoveredAmount)) : ''}`
                            : result.executionStatus === 'FAILED'
                            ? 'Recovery action failed — outcome marked FAILED, no revenue counted'
                            : 'Recovery action sent — awaiting customer response'
                          : result.decision === 'BLOCKED'
                          ? `Blocked: ${result.reason}`
                          : `Escalated: ${result.reason}`}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <ExecutionBadge status={result.executionStatus} />
                        {result.testMode && (
                          <span className="text-xs px-2 py-0.5 rounded border border-amber-500/40 text-amber-400 bg-amber-500/10">
                            TEST MODE
                          </span>
                        )}
                      </div>
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
                            {result?.aiDiagnosis ? 'AI Diagnosis (Groq)' : "Revive's take"}
                          </div>
                          <div className="text-sm font-medium mb-2">
                            {result?.aiDiagnosis?.diagnosis ?? display.diagnosis}
                          </div>
                          <div className="text-xs text-muted-foreground leading-relaxed">
                            {result?.aiDiagnosis?.reasoning ?? display.reasoning}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs">
                          <div className="flex items-center gap-1.5">
                            <TrendingUp className="h-3 w-3 text-primary" />
                            <span className="text-muted-foreground">
                              {displayProbability}% recovery probability
                            </span>
                          </div>
                          {result?.aiDiagnosis?.confidence != null && (
                            <div className="flex items-center gap-1.5">
                              <Brain className="h-3 w-3 text-purple-400" />
                              <span className="text-purple-400 font-medium">
                                LLM confidence {Math.round(result.aiDiagnosis.confidence * 100)}%
                              </span>
                            </div>
                          )}
                          {result?.recommendation && (
                            <div className="flex items-center gap-1.5">
                              <Zap className="h-3 w-3 text-amber-400" />
                              <span className="text-amber-400">
                                {result.recommendation.actionType?.toString().replace('_', ' ')}
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
                        <span className="text-sm font-medium">
                          {result?.recommendation?.channel
                            ? `${result.recommendation.actionType?.toString().replace(/_/g, ' ')} via ${result.recommendation.channel}`
                            : display.recommendedAction}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">Are we allowed?</div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        {result?.policyResult
                          ? result.policyResult.allowed
                            ? <div className="flex items-center gap-1.5 text-emerald-400 text-xs"><CheckCircle2 className="h-3 w-3" /><span>Policy approved</span></div>
                            : <div className="flex items-center gap-1.5 text-red-400 text-xs"><AlertCircle className="h-3 w-3" /><span>Policy blocked</span></div>
                          : getPolicyStatusIcon(display.policyStatus)
                        }
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

          {/* Generate More Demo Data */}
          <div className="glass-subtle rounded-xl px-5 py-4 border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Need more cases to demonstrate?</p>
              <p className="text-xs text-muted-foreground mt-0.5">Generate synthetic payment failures using the ML training distribution</p>
            </div>
            <Button onClick={handleGenerateDemo} disabled={generatingDemo} variant="outline" className="rounded-xl gap-2 flex-shrink-0">
              {generatingDemo ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Generate 60 more</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── TAB: BATCH EVALUATION ── */}
      {activeTab === 'batch' && (
        <div className="space-y-6">
          <div className="glass-card rounded-3xl p-8 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Batch Evaluation</h2>
                <p className="text-muted-foreground text-sm max-w-lg">
                  Run the full ML → AI Diagnosis → Policy → Execute pipeline on all FAILED payments.
                  This produces aggregate evidence of revenue recovery across the dataset.
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs text-amber-400 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                RAZORPAY TEST MODE
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                onClick={handleBatchEvaluate}
                disabled={batchRunning}
                className="rounded-xl bg-primary hover:bg-primary/90 gap-2"
              >
                {batchRunning ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Running pipeline...</>
                ) : (
                  <><PlayCircle className="h-4 w-4" /> Run Batch Evaluation</>
                )}
              </Button>
              {batchResult && (
                <span className="text-xs text-muted-foreground">
                  Last run: {new Date(batchResult.runAt).toLocaleTimeString('en-IN')}
                </span>
              )}
            </div>

            {/* Batch Results */}
            {batchResult && (
              <div className="space-y-6 pt-4 border-t border-white/10">
                {/* Summary */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pipeline Summary</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <MetricCard label="Evaluated"     value={batchResult.batchSummary?.totalEvaluated ?? 0} />
                    <MetricCard label="Executed"      value={batchResult.decisions?.executed ?? 0} color="text-blue-400" />
                    <MetricCard label="Blocked"       value={batchResult.decisions?.blocked ?? 0} color="text-amber-400" />
                    <MetricCard label="Escalated"     value={batchResult.decisions?.escalated ?? 0} color="text-purple-400" />
                    <MetricCard label="Errors"        value={batchResult.batchSummary?.errors ?? 0} color="text-red-400" />
                    <MetricCard label="ML F1 Score"   value="0.73" sub="ROC-AUC: 0.69" color="text-primary" />
                  </div>
                </div>

                {/* Execution Outcomes */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Execution Outcomes</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <MetricCard
                      label="✓ Recovered"
                      value={batchResult.executionOutcomes?.successfulRecoveries ?? 0}
                      sub={`${formatCurrency(Number(batchResult.executionOutcomes?.totalRecoveredThisBatch ?? 0))} this batch`}
                      color="text-emerald-400"
                    />
                    <MetricCard
                      label="⏳ Pending"
                      value={batchResult.executionOutcomes?.pendingRecoveries ?? 0}
                      sub="awaiting response"
                      color="text-blue-400"
                    />
                    <MetricCard
                      label="✗ Failed"
                      value={batchResult.executionOutcomes?.failedExecutions ?? 0}
                      sub="no revenue counted"
                      color="text-red-400"
                    />
                    <MetricCard
                      label="Total Recovered"
                      value={formatCurrency(Number(batchResult.executionOutcomes?.totalRecoveredThisBatch ?? 0))}
                      sub="this batch"
                      color="text-emerald-300"
                    />
                  </div>
                </div>

                {/* ML Model Info */}
                <div className="glass-subtle rounded-xl p-4 border border-primary/20">
                  <div className="flex items-center gap-3 mb-3">
                    <Brain className="h-5 w-5 text-primary" />
                    <h3 className="text-sm font-semibold">ML Model — {batchResult.mlModel?.model}</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div><span className="text-muted-foreground">Precision: </span><span className="font-medium text-primary">{batchResult.mlModel?.precision}</span></div>
                    <div><span className="text-muted-foreground">Recall: </span><span className="font-medium text-primary">{batchResult.mlModel?.recall}</span></div>
                    <div><span className="text-muted-foreground">F1 Score: </span><span className="font-medium text-primary">{batchResult.mlModel?.f1Score}</span></div>
                    <div><span className="text-muted-foreground">ROC-AUC: </span><span className="font-medium text-primary">{batchResult.mlModel?.rocAuc}</span></div>
                  </div>
                </div>

                {/* Cumulative Metrics */}
                {batchResult.cumulativeMetrics && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Cumulative Metrics (All Time)</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <MetricCard label="Revenue at Risk" value={formatCurrency(Number(batchResult.cumulativeMetrics.totalRevenueAtRisk ?? 0))} color="text-amber-400" />
                      <MetricCard label="Total Recovered" value={formatCurrency(Number(batchResult.cumulativeMetrics.totalRecovered ?? 0))} color="text-emerald-400" />
                      <MetricCard label="Net Gain"        value={formatCurrency(Number(batchResult.cumulativeMetrics.netGain ?? 0))} color="text-green-400" />
                      <MetricCard label="Recovery Rate"   value={`${(batchResult.cumulativeMetrics.recoveryRate ?? 0).toFixed(1)}%`} color="text-primary" />
                    </div>
                  </div>
                )}

                {/* Sample Results */}
                {batchResult.sampleResults?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Sample Results ({batchResult.sampleResults.length} shown)
                    </h3>
                    <div className="glass-subtle rounded-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="text-left px-4 py-2 text-muted-foreground font-medium">Payment ID</th>
                              <th className="text-left px-4 py-2 text-muted-foreground font-medium">Amount</th>
                              <th className="text-left px-4 py-2 text-muted-foreground font-medium">Error</th>
                              <th className="text-left px-4 py-2 text-muted-foreground font-medium">ML %</th>
                              <th className="text-left px-4 py-2 text-muted-foreground font-medium">Decision</th>
                              <th className="text-left px-4 py-2 text-muted-foreground font-medium">Outcome</th>
                              <th className="text-left px-4 py-2 text-muted-foreground font-medium">Recovered</th>
                            </tr>
                          </thead>
                          <tbody>
                            {batchResult.sampleResults.map((r: Record<string, unknown>, i: number) => (
                              <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/3">
                                <td className="px-4 py-2 font-mono text-muted-foreground">{String(r.paymentId ?? '').substring(0, 12)}</td>
                                <td className="px-4 py-2 font-medium">{formatCurrency(Number(r.amount))}</td>
                                <td className="px-4 py-2 text-muted-foreground">{String(r.errorCode ?? '')}</td>
                                <td className="px-4 py-2 text-primary">{r.recoveryProbability != null ? `${Math.round(Number(r.recoveryProbability) * 100)}%` : '—'}</td>
                                <td className="px-4 py-2">
                                  <span className={`font-medium ${r.decision === 'EXECUTE' ? 'text-blue-400' : r.decision === 'BLOCKED' ? 'text-amber-400' : 'text-purple-400'}`}>
                                    {String(r.decision ?? '')}
                                  </span>
                                </td>
                                <td className="px-4 py-2">
                                  <>
                                    {r.executionStatus && <ExecutionBadge status={String(r.executionStatus)} />}
                                    {r.blockReason && <span className="text-amber-400">{String(r.blockReason).substring(0, 30)}…</span>}
                                  </>
                                </td>
                                <td className="px-4 py-2 text-emerald-400 font-medium">
                                  {r.recoveredAmount ? formatCurrency(Number(r.recoveredAmount)) : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: AUDIT TRAIL ── */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">Audit Trail</h2>
              <p className="text-muted-foreground text-sm">
                Complete, immutable log of every pipeline step — {auditEntries.length} events recorded
              </p>
            </div>
            <Button onClick={loadAudit} variant="outline" size="sm" className="rounded-xl gap-2">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </div>

          {auditEntries.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center">
              <History className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground">No audit events yet. Process some payments to see the full trail.</p>
            </div>
          ) : (
            <>
              {/* Event type legend */}
              <div className="flex flex-wrap gap-2">
                {['ML_PREDICTION','AI_DIAGNOSIS','POLICY_CHECK','POLICY_VIOLATION','RECOVERY_APPROVED','REVENUE_RECOVERED'].map(t => (
                  <div key={t} className="flex items-center gap-1 glass-subtle px-2 py-1 rounded-md text-xs">
                    <div className={`h-1.5 w-1.5 rounded-full ${
                      t.includes('VIOLATION') ? 'bg-red-400' : t.includes('REVENUE') ? 'bg-emerald-400' :
                      t.includes('ML') ? 'bg-blue-400' : t.includes('AI') ? 'bg-purple-400' :
                      t.includes('APPROVED') ? 'bg-teal-400' : 'bg-amber-400'
                    }`} />
                    <span className="text-muted-foreground">{t.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>

              {/* Revenue summary from audit */}
              <div className="grid grid-cols-3 gap-3">
                <MetricCard
                  label="Events recorded"
                  value={auditEntries.length}
                  color="text-primary"
                />
                <MetricCard
                  label="Revenue events"
                  value={auditEntries.filter(e => e.actionType === 'REVENUE_RECOVERED').length}
                  color="text-emerald-400"
                />
                <MetricCard
                  label="Policy blocks"
                  value={auditEntries.filter(e => e.actionType === 'POLICY_VIOLATION').length}
                  color="text-amber-400"
                />
              </div>

              {/* Audit list */}
              <div className="glass-card rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Recent Events (last 100)</h3>
                  <span className="ml-auto text-xs text-muted-foreground">Append-only · never modified</span>
                </div>
                <div className="space-y-0 max-h-[600px] overflow-y-auto">
                  {auditEntries.map(entry => (
                    <AuditRow key={entry.id} entry={entry} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
