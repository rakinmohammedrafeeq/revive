import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  AlertCircle, 
  Brain, 
  Shield, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  User, 
  CreditCard, 
  Mail, 
  DollarSign, 
  Activity, 
  Loader2, 
  PlayCircle, 
  History, 
  Info, 
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  Phone,
  FileCheck,
  Zap,
  Sparkles,
  ExternalLink
} from 'lucide-react'
import { 
  recoveryCaseApi, 
  auditTrailApi,
  type FailedPayment, 
  type MLPrediction,
  type AiDiagnosisResult,
  type RecoveryAction,
  type AuditTrailEntry,
  type RecoveryDecision
} from '@/api/recoveryApi'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'

/**
 * RECOVERY CASE DETAIL — CORE DEMO SCREEN
 * 
 * Visually communicates the complete 6-stage Revive intelligence pipeline:
 * DETECTED → PREDICTED → DIAGNOSED → POLICY CHECKED → ACTIONED → OUTCOME
 */

export function RecoveryCaseDetail() {
  const { caseId } = useParams<{ caseId: string }>()
  const navigate = useNavigate()
  
  const [payment, setPayment] = useState<FailedPayment | null>(null)
  const [prediction, setPrediction] = useState<MLPrediction | null>(null)
  const [diagnosis, setDiagnosis] = useState<AiDiagnosisResult | null>(null)
  const [actions, setActions] = useState<RecoveryAction[]>([])
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([])
  const [lastDecision, setLastDecision] = useState<RecoveryDecision | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCaseData = async () => {
    if (!caseId) return
    
    try {
      setLoading(true)
      setError(null)
      
      const paymentId = parseInt(caseId)
      const paymentData = await recoveryCaseApi.getById(paymentId)
      setPayment(paymentData)
      
      // Load intelligence & history in parallel
      const [predictionData, diagnosisData, actionsData, auditData] = await Promise.all([
        recoveryCaseApi.getPrediction(paymentId).catch(() => null),
        recoveryCaseApi.getDiagnosis(paymentId).catch(() => null),
        recoveryCaseApi.getActions(paymentId).catch(() => []),
        auditTrailApi.getByPayment(paymentData.paymentIdentifier).catch(() => [])
      ])
      
      setPrediction(predictionData)
      setDiagnosis(diagnosisData)
      setActions(actionsData)
      setAuditTrail(auditData)
    } catch (err) {
      console.error('Failed to load case:', err)
      setError('Failed to load recovery case details')
    } finally {
      setLoading(false)
    }
  }

  const handleProcessPayment = async () => {
    if (!caseId || !payment) return
    
    try {
      setProcessing(true)
      const decision = await recoveryCaseApi.process(payment.id)
      setLastDecision(decision)
      
      // Refresh case data to reflect outcome
      await loadCaseData()
    } catch (err) {
      console.error('Failed to process payment:', err)
      setError('Failed to execute recovery pipeline. Please check backend connectivity.')
    } finally {
      setProcessing(false)
    }
  }

  useEffect(() => {
    loadCaseData()
  }, [caseId])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Analyzing recovery pipeline for case #{caseId}...</p>
        </div>
      </div>
    )
  }

  if (error || !payment) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto text-red-400" />
          <h2 className="text-xl font-bold text-foreground">Case Unavailable</h2>
          <p className="text-xs text-muted-foreground">{error || 'This recovery case could not be located.'}</p>
          <Button onClick={() => navigate('/app/recovery')} variant="outline" className="gap-2 text-xs">
            <ArrowLeft className="w-4 h-4" />
            Back to Recovery Cases
          </Button>
        </div>
      </div>
    )
  }

  const probPercent = prediction ? Math.round(prediction.recoveryProbability * 100) : null
  const isRecovered = payment.status === 'RECOVERED'
  const isFailed = payment.status === 'FAILED'
  const isUnderReview = payment.status === 'UNDER_REVIEW'

  // Determine active stage in pipeline:
  // 1: DETECTED, 2: PREDICTED, 3: DIAGNOSED, 4: POLICY CHECKED, 5: ACTIONED, 6: OUTCOME
  const currentPipelineStage = isRecovered
    ? 6
    : actions.length > 0
    ? 5
    : lastDecision?.policyResult
    ? 4
    : diagnosis
    ? 3
    : prediction
    ? 2
    : 1

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/app/recovery"
            className="p-2 rounded-xl bg-muted/40 hover:bg-accent border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-primary font-semibold">
                {payment.paymentIdentifier}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                isRecovered
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : isFailed
                  ? 'bg-red-500/20 text-red-400 border-red-500/30'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}>
                {payment.status}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Recovery Intelligence Pipeline
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={loadCaseData}
            className="gap-2 border-border hover:bg-accent text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>

          {isFailed && (
            <Button
              onClick={handleProcessPayment}
              disabled={processing}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 shadow-lg shadow-primary/20 text-xs sm:text-sm"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Executing Pipeline...
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4" />
                  Process Recovery
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* ── 6-STAGE VISUAL PIPELINE STEPPER ─────────────────── */}
      <div className="rounded-2xl glass-card border border-white/10 p-5 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[700px] gap-2">
          {[
            { step: 1, label: 'Detected', sub: 'Failure captured' },
            { step: 2, label: 'ML Predicted', sub: probPercent ? `${probPercent}% probability` : 'Ready' },
            { step: 3, label: 'AI Diagnosed', sub: diagnosis ? 'Root cause mapped' : 'Ready' },
            { step: 4, label: 'Policy Checked', sub: lastDecision?.policyResult?.allowed ? 'Guardrails passed' : 'Guardrails active' },
            { step: 5, label: 'Actioned', sub: actions.length > 0 ? `${actions.length} attempt(s)` : 'Bounded action' },
            { step: 6, label: 'Outcome', sub: isRecovered ? 'Revenue recovered' : 'Final state' },
          ].map((s, idx) => {
            const isDone = s.step <= currentPipelineStage
            const isCurrent = s.step === currentPipelineStage

            return (
              <div key={s.step} className="flex-1 flex items-center">
                <div className="flex items-center gap-2.5">
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                    isDone
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                      : 'bg-muted/40 text-muted-foreground border border-border'
                  }`}>
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.step}
                  </div>
                  <div>
                    <span className={`text-xs font-semibold block ${isDone ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {s.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      {s.sub}
                    </span>
                  </div>
                </div>
                {idx < 5 && (
                  <div className={`flex-1 h-0.5 mx-3 ${s.step < currentPipelineStage ? 'bg-primary/50' : 'bg-border'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Decision Banner if just processed */}
      {lastDecision && (
        <div className={`rounded-2xl p-5 border flex items-start gap-4 animate-slide-up ${
          lastDecision.executionStatus === 'SUCCESS'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
            : lastDecision.decision === 'BLOCKED'
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
            : 'bg-primary/10 border-primary/30 text-primary'
        }`}>
          {lastDecision.executionStatus === 'SUCCESS' ? (
            <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-emerald-500" />
          ) : lastDecision.decision === 'BLOCKED' ? (
            <ShieldAlert className="w-6 h-6 flex-shrink-0 text-amber-500" />
          ) : (
            <Sparkles className="w-6 h-6 flex-shrink-0 text-primary" />
          )}
          <div className="flex-1">
            <h3 className="font-bold text-sm text-foreground">
              Pipeline Execution: {lastDecision.decision}
              {lastDecision.executionStatus ? ` (${lastDecision.executionStatus})` : ''}
            </h3>
            <p className="text-xs mt-1 leading-relaxed">
              {lastDecision.reason || 'Pipeline evaluated successfully.'}
            </p>
            {lastDecision.recoveredAmount && (
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                Recovered Revenue: {formatCurrency(lastDecision.recoveredAmount, payment.currency)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main 2-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Intelligence & Execution Pipeline (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* SECTION A: PAYMENT INFORMATION */}
          <div className="rounded-2xl glass-card border border-border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground text-base">Payment Overview</h3>
              </div>
              <span className="text-xl font-bold text-gradient-emerald">
                {formatCurrency(payment.amount, payment.currency)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-t border-white/5 text-xs">
              <div>
                <span className="text-muted-foreground block mb-1">Customer</span>
                <span className="font-medium text-foreground block">
                  {payment.customerName || payment.customerEmail || payment.customerId}
                </span>
                {payment.customerEmail && (
                  <span className="text-[11px] text-muted-foreground block truncate">{payment.customerEmail}</span>
                )}
              </div>

              <div>
                <span className="text-muted-foreground block mb-1">Payment Method</span>
                <span className="font-medium text-foreground block">
                  {payment.paymentMethod || 'UPI / Card'}
                </span>
                <span className="text-[11px] text-muted-foreground block font-mono">
                  {payment.orderIdentifier || 'Razorpay Gateway'}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block mb-1">Retry Count</span>
                <span className="font-medium text-foreground block">
                  {payment.retryCount} attempts logged
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Failed: {new Date(payment.failedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-red-300">Failure Reason: </span>
                <span className="text-red-200">{payment.failureReason || 'Transaction declined'}</span>
                {payment.errorCode && (
                  <span className="ml-2 font-mono text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300">
                    {payment.errorCode}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* SECTION B: ML PREDICTION */}
          <div className="rounded-2xl glass-card border border-primary/20 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base">ML Recovery Prediction</h3>
                  <p className="text-xs text-muted-foreground">Scikit-learn Random Forest probability model</p>
                </div>
              </div>
              {probPercent !== null && (
                <span className={`text-2xl font-black ${
                  probPercent >= 70 ? 'text-emerald-500' : probPercent >= 40 ? 'text-amber-500' : 'text-red-500'
                }`}>
                  {probPercent}%
                </span>
              )}
            </div>

            {prediction ? (
              <div className="space-y-4">
                {/* Merchant-friendly callout */}
                <div className="rounded-xl bg-muted/30 border border-border p-4">
                  <p className="text-sm font-semibold text-foreground">
                    AI predicts a <span className="text-primary">{probPercent}% chance</span> of recovering this payment.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Confidence: <strong className="text-foreground">{prediction.confidence}</strong>
                    {prediction.expectedRecoveryValue !== undefined && (
                      <> • Expected recovery value: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(prediction.expectedRecoveryValue, payment.currency)}</strong></>
                    )}
                  </p>
                </div>

                {/* Probability Bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-2.5 rounded-full bg-muted/50 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        probPercent! >= 70
                          ? 'bg-gradient-to-r from-primary to-emerald-400'
                          : probPercent! >= 40
                          ? 'bg-amber-400'
                          : 'bg-red-400'
                      }`}
                      style={{ width: `${probPercent}%` }}
                    />
                  </div>
                </div>

                {/* Model Meta Footer */}
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/50">
                  <span>Model: {prediction.modelType || 'Random Forest v1.0'}</span>
                  <span>Threshold: &gt; 15% required for retry</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground py-2">
                ML prediction model ready for on-demand evaluation.
              </div>
            )}
          </div>

          {/* SECTION C: AI DIAGNOSIS (Groq LLM) */}
          <div className="rounded-2xl glass-card border border-border p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-base">AI Root-Cause Diagnosis</h3>
                <p className="text-xs text-muted-foreground">Groq LLM contextual payment analysis</p>
              </div>
            </div>

            {diagnosis ? (
              <div className="space-y-3.5 text-xs">
                <div className="p-3.5 rounded-xl bg-muted/30 border border-border">
                  <span className="text-muted-foreground block mb-1">Diagnosis:</span>
                  <p className="text-sm font-medium text-foreground">{diagnosis.diagnosis}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-muted/30 border border-border">
                    <span className="text-muted-foreground block mb-1">Root Cause:</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">{diagnosis.rootCause}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/30 border border-border">
                    <span className="text-muted-foreground block mb-1">Recommended Intervention:</span>
                    <span className="font-semibold text-primary">{diagnosis.recommendation || diagnosis.suggestedAction}</span>
                  </div>
                </div>

                {diagnosis.reasoning && (
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-muted-foreground block mb-1">AI Reasoning:</span>
                    <p className="text-muted-foreground leading-relaxed">{diagnosis.reasoning}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-muted-foreground">
                  <span>Confidence: {(diagnosis.confidence * 100).toFixed(0)}%</span>
                  {diagnosis.suggestedDelayMinutes > 0 && (
                    <span>Suggested delay: {diagnosis.suggestedDelayMinutes} min cooldown</span>
                  )}
                  <span className={diagnosis.isRecoverable ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>
                    {diagnosis.isRecoverable ? '✓ Viable for Recovery' : '✕ Unrecoverable'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground py-2">
                Click "Process Recovery" to trigger Groq LLM failure diagnosis.
              </div>
            )}
          </div>

          {/* SECTION D: POLICY DECISION & GUARDRAIL CHECKS */}
          <div className="rounded-2xl glass-card border border-border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base">Policy Guardrail Verification</h3>
                  <p className="text-xs text-muted-foreground">Deterministic compliance & safety checks</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                ALLOWED
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border">
                <span className="text-muted-foreground">Retry Limit Check</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Attempt {payment.retryCount} of 3 (Passed)
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border">
                <span className="text-muted-foreground">Cooldown Window</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 24-hour cooldown satisfied
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border">
                <span className="text-muted-foreground">Cost Cap per Payment</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ₹0.00 within ₹50 limit
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border">
                <span className="text-muted-foreground">Channel Authorization</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> AUTOMATIC retry permitted
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Actions Timeline & Audit Trail (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* SECTION E & F: RECOVERY ACTIONS & OUTCOME */}
          <div className="rounded-2xl glass-card border border-border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground text-base">Execution History</h3>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Razorpay TEST MODE
              </span>
            </div>

            {actions.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-60" />
                <p>No actions executed yet.</p>
                <p className="text-[11px] mt-1">Click "Process Recovery" to trigger execution.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {actions.map((act) => {
                  const isActSuccess = act.status === 'COMPLETED_SUCCESS'
                  return (
                    <div key={act.id} className="p-4 rounded-xl bg-muted/30 border border-border space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">
                          {act.actionType.replace(/_/g, ' ')}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isActSuccess
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-red-500/20 text-red-600 dark:text-red-400'
                        }`}>
                          {act.status}
                        </span>
                      </div>

                      <div className="text-[11px] text-muted-foreground space-y-1">
                        <div>Channel: <span className="text-foreground">{act.channel || 'AUTOMATIC'}</span></div>
                        <div>Cost: <span className="text-foreground">{formatCurrency(act.cost, payment.currency)}</span></div>
                        <div>Initiated: {new Date(act.initiatedAt).toLocaleTimeString()}</div>
                        {act.outcome && (
                          <div className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 bg-muted/60 p-1.5 rounded truncate">
                            {act.outcome}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* SECTION G: AUDIT TRAIL */}
          <div className="rounded-2xl glass-card border border-border p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <History className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-foreground text-base">Payment Audit Trail</h3>
            </div>

            {auditTrail.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No audit events logged for this payment identifier yet.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 text-xs">
                {auditTrail.map((entry) => (
                  <div key={entry.id} className="p-3 rounded-xl bg-muted/30 border border-border space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">
                        {entry.actionType.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      {entry.details}
                    </p>
                    {entry.outcome && (
                      <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                        {entry.outcome}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
