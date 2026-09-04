import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, AlertCircle, Brain, Shield, CheckCircle2, Clock, 
  RefreshCw, User, CreditCard, Mail, DollarSign, Activity, 
  Loader2, PlayCircle, History, Info, TrendingUp
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
 * REVIVE RECOVERY CASE DETAIL
 * 
 * Complete recovery journey with real-time data:
 * - Payment details and customer info
 * - ML prediction and AI diagnosis
 * - Recovery actions and outcomes
 * - Full audit trail
 */

const STATUS_MAP: Record<string, { label: string; class: string; icon: React.ReactNode }> = {
  FAILED: { 
    label: 'Ready to Recover', 
    class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    icon: <AlertCircle className="w-5 h-5" />
  },
  PENDING_RETRY: { 
    label: 'Scheduled for Retry', 
    class: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: <Clock className="w-5 h-5" />
  },
  RETRY_IN_PROGRESS: { 
    label: 'Recovery in Progress', 
    class: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    icon: <RefreshCw className="w-5 h-5 animate-spin" />
  },
  UNDER_REVIEW: { 
    label: 'Needs Manual Review', 
    class: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    icon: <Brain className="w-5 h-5" />
  },
  RECOVERED: { 
    label: 'Successfully Recovered', 
    class: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    icon: <CheckCircle2 className="w-5 h-5" />
  },
  ABANDONED: { 
    label: 'Abandoned', 
    class: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    icon: <AlertCircle className="w-5 h-5" />
  },
}

const ACTION_STATUS_MAP: Record<string, { label: string; class: string }> = {
  INITIATED: { label: 'Initiated', class: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  IN_PROGRESS: { label: 'In Progress', class: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  COMPLETED_SUCCESS: { label: 'Success', class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  COMPLETED_FAILURE: { label: 'Failed', class: 'bg-red-500/20 text-red-400 border-red-500/30' },
  BLOCKED: { label: 'Blocked', class: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  FAILED: { label: 'Error', class: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

export function RecoveryCaseDetail() {
  const { caseId } = useParams<{ caseId: string }>()
  const navigate = useNavigate()
  
  const [payment, setPayment] = useState<FailedPayment | null>(null)
  const [prediction, setPrediction] = useState<MLPrediction | null>(null)
  const [diagnosis, setDiagnosis] = useState<AiDiagnosisResult | null>(null)
  const [actions, setActions] = useState<RecoveryAction[]>([])
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([])
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
      
      // Load additional data in parallel
      const [predictionData, actionsData, auditData] = await Promise.all([
        recoveryCaseApi.getPrediction(paymentId).catch(() => null),
        recoveryCaseApi.getActions(paymentId).catch(() => []),
        auditTrailApi.getByPayment(paymentData.paymentIdentifier).catch(() => [])
      ])
      
      setPrediction(predictionData)
      setActions(actionsData)
      setAuditTrail(auditData)
      
      // Load diagnosis if not already loaded
      if (!diagnosis) {
        recoveryCaseApi.getDiagnosis(paymentId)
          .then(setDiagnosis)
          .catch(() => null)
      }
      
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
      
      // Reload data to show updated state
      await loadCaseData()
      
      // Show outcome message
      if (decision.executionStatus === 'SUCCESS') {
        alert(`✅ Payment recovered successfully! Amount: ${formatCurrency(decision.recoveredAmount || 0, payment.currency)}`)
      } else if (decision.decision === 'BLOCKED') {
        alert(`⚠️ Recovery blocked: ${decision.reason}`)
      } else if (decision.decision === 'ESCALATE') {
        alert(`⏸️ Manual review required: ${decision.reason}`)
      } else {
        alert(`✓ Recovery action initiated`)
      }
    } catch (err) {
      console.error('Failed to process payment:', err)
      alert('Failed to process recovery. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  useEffect(() => {
    loadCaseData()
  }, [caseId])

  if (loading) {
    return (
      <div className="min-h-screen bg-atmospheric flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-purple-400" />
          <p className="text-gray-400">Loading recovery case...</p>
        </div>
      </div>
    )
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen bg-atmospheric flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 mx-auto text-red-400" />
          <h2 className="text-2xl font-bold text-white">Case Not Found</h2>
          <p className="text-gray-400">{error || 'The recovery case could not be loaded'}</p>
          <Button onClick={() => navigate('/recovery')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Recovery
          </Button>
        </div>
      </div>
    )
  }

  const statusInfo = STATUS_MAP[payment.status] || STATUS_MAP.FAILED
  const hoursAgo = Math.floor((Date.now() - new Date(payment.failedAt).getTime()) / 3_600_000)
  const timeAgo = hoursAgo === 0
    ? `${Math.max(1, Math.floor((Date.now() - new Date(payment.failedAt).getTime()) / 60_000))} minutes ago`
    : `${hoursAgo} hours ago`

  return (
    <div className="min-h-screen bg-atmospheric p-6 md:p-8 lg:p-12">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/recovery"
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-400" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                {payment.paymentIdentifier}
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Recovery case details
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadCaseData}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            {payment.status === 'FAILED' && (
              <button
                onClick={handleProcessPayment}
                disabled={processing}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4" />
                    Process Recovery
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Status Banner */}
        <div className={`glass-card p-6 border-2 ${statusInfo.class}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {statusInfo.icon}
              <div>
                <h3 className="text-lg font-semibold text-white">{statusInfo.label}</h3>
                <p className="text-sm text-gray-400">Failed {timeAgo}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">
                {formatCurrency(payment.amount, payment.currency)}
              </div>
              {payment.recoveredAt && (
                <p className="text-sm text-emerald-400 mt-1">
                  Recovered on {new Date(payment.recoveredAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Payment Details */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-400" />
                Payment Details
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Payment Method:</span>
                  <span className="text-white">{payment.paymentMethod || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Failure Reason:</span>
                  <span className="text-white">{payment.failureReason || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Error Code:</span>
                  <span className="text-white font-mono text-sm">{payment.errorCode || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Retry Count:</span>
                  <span className="text-white">{payment.retryCount}</span>
                </div>
                {payment.orderIdentifier && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Order ID:</span>
                    <span className="text-white font-mono text-sm">{payment.orderIdentifier}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Info */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-purple-400" />
                Customer Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Name:</span>
                  <span className="text-white">{payment.customerName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Email:</span>
                  <span className="text-white">{payment.customerEmail || 'N/A'}</span>
                </div>
                {payment.customerPhone && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Phone:</span>
                    <span className="text-white">{payment.customerPhone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Customer ID:</span>
                  <span className="text-white font-mono text-sm">{payment.customerId}</span>
                </div>
              </div>
            </div>

            {/* ML Prediction */}
            {prediction && (
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  ML Recovery Prediction
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400">Recovery Probability</span>
                      <span className={`text-lg font-bold ${
                        prediction.recoveryProbability > 0.7 ? 'text-emerald-400' :
                        prediction.recoveryProbability > 0.4 ? 'text-amber-400' :
                        'text-red-400'
                      }`}>
                        {(prediction.recoveryProbability * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          prediction.recoveryProbability > 0.7 ? 'bg-emerald-500' :
                          prediction.recoveryProbability > 0.4 ? 'bg-amber-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${prediction.recoveryProbability * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Confidence:</span>
                    <span className="text-white">{prediction.confidence}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Model:</span>
                    <span className="text-white text-sm">{prediction.modelType}</span>
                  </div>
                  {prediction.expectedRecoveryValue !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Expected Value:</span>
                      <span className="text-white">
                        {formatCurrency(prediction.expectedRecoveryValue, payment.currency)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Diagnosis */}
            {diagnosis && (
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  AI Diagnosis
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Diagnosis</h4>
                    <p className="text-white">{diagnosis.diagnosis}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Root Cause</h4>
                    <p className="text-white">{diagnosis.rootCause}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Recommendation</h4>
                    <p className="text-white">{diagnosis.recommendation}</p>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Confidence:</span>
                    <span className="text-white">{(diagnosis.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Recoverable:</span>
                    <span className={diagnosis.isRecoverable ? 'text-emerald-400' : 'text-red-400'}>
                      {diagnosis.isRecoverable ? 'Yes' : 'No'}
                    </span>
                  </div>
                  {diagnosis.suggestedDelayMinutes > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Suggested Delay:</span>
                      <span className="text-white">{diagnosis.suggestedDelayMinutes} minutes</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recovery Actions */}
            {actions.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  Recovery Actions
                </h3>
                <div className="space-y-3">
                  {actions.map((action) => {
                    const actionStatus = ACTION_STATUS_MAP[action.status] || ACTION_STATUS_MAP.INITIATED
                    return (
                      <div key={action.id} className="bg-white/5 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="text-white font-medium">{action.actionType.replace(/_/g, ' ')}</h4>
                            <p className="text-sm text-gray-400">
                              {new Date(action.initiatedAt).toLocaleString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs border ${actionStatus.class}`}>
                            {actionStatus.label}
                          </span>
                        </div>
                        <div className="text-sm text-gray-400 space-y-1">
                          <div>Channel: {action.channel || 'AUTOMATIC'}</div>
                          <div>Cost: {formatCurrency(action.cost, payment.currency)}</div>
                          {action.completedAt && (
                            <div>Completed: {new Date(action.completedAt).toLocaleString()}</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Audit Trail */}
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-purple-400" />
                Audit Trail
              </h3>
              <div className="space-y-3 max-h-[800px] overflow-y-auto">
                {auditTrail.length === 0 ? (
                  <p className="text-gray-400 text-sm">No audit events yet</p>
                ) : (
                  auditTrail.map((entry) => (
                    <div key={entry.id} className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white">
                            {entry.actionType.replace(/_/g, ' ')}
                          </h4>
                          <p className="text-xs text-gray-400 mt-1">
                            {entry.details}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(entry.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
