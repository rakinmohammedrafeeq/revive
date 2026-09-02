import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, AlertCircle, Brain, Shield, CheckCircle2, Clock, RefreshCw, User, CreditCard, Mail, DollarSign, Activity } from 'lucide-react'

/**
 * REVIVE RECOVERY CASE DETAIL
 * 
 * Timeline-based narrative showing the complete recovery journey.
 * Each step shows WHY decisions were made with contextual AI insights.
 * 
 * NOTE: Currently using development data structure.
 * Production will integrate with backend recovery APIs.
 */

// Development types
interface TimelineStep {
  id: string
  type: 'detection' | 'diagnosis' | 'policy-check' | 'decision' | 'action' | 'outcome'
  title: string
  description: string
  timestamp: string
  status: 'completed' | 'in-progress' | 'pending' | 'failed'
  aiInsight?: string
  metadata?: Record<string, any>
}

interface CaseDetail {
  id: string
  amount: number
  currency: string
  customer: {
    name: string
    email: string
    phone?: string
    customerId: string
    paymentHistory: {
      totalTransactions: number
      successRate: number
      averageAmount: number
    }
  }
  payment: {
    method: string
    last4: string
    brand: string
    expiryMonth: number
    expiryYear: number
  }
  failure: {
    reason: string
    code: string
    gatewayResponse: string
    timestamp: string
  }
  recovery: {
    status: 'detecting' | 'diagnosed' | 'recovering' | 'recovered' | 'needs-review' | 'blocked'
    confidence: number
    aiDiagnosis: string
    recommendation: string
    policyStatus: 'allowed' | 'review-required' | 'blocked'
    retryAttempts: number
    maxRetries: number
    estimatedRecoveryTime?: string
  }
  timeline: TimelineStep[]
}

// Mock data for a specific case
const mockCaseDetail: CaseDetail = {
  id: 'RC-2024-001',
  amount: 18500,
  currency: 'INR',
  customer: {
    name: 'Acme Corporation',
    email: 'billing@acmecorp.com',
    phone: '+91 98765 43210',
    customerId: 'CUST-12345',
    paymentHistory: {
      totalTransactions: 48,
      successRate: 98.2,
      averageAmount: 22300
    }
  },
  payment: {
    method: 'card',
    last4: '4242',
    brand: 'Visa',
    expiryMonth: 12,
    expiryYear: 2026
  },
  failure: {
    reason: 'Temporary issuer decline',
    code: 'issuer_declined_temp',
    gatewayResponse: 'The card issuer declined this transaction temporarily. This is often due to temporary security measures or processing issues.',
    timestamp: '2024-12-15T10:23:00Z'
  },
  recovery: {
    status: 'recovering',
    confidence: 87,
    aiDiagnosis: 'Payment processor experienced temporary issues. Customer has strong payment history with 98% success rate over past 12 months. Similar temporary declines typically resolve within 1-2 hours.',
    recommendation: 'High recovery probability. Retry recommended within next 2 hours using exponential backoff strategy.',
    policyStatus: 'allowed',
    retryAttempts: 1,
    maxRetries: 3,
    estimatedRecoveryTime: '~15 minutes'
  },
  timeline: [
    {
      id: 'step-1',
      type: 'detection',
      title: 'Payment failed',
      description: 'Transaction was declined by the payment gateway. Revive captured the failure in real-time.',
      timestamp: '2024-12-15T10:23:00Z',
      status: 'completed',
      metadata: {
        gateway: 'Payment Gateway',
        transactionId: 'pay_abc123xyz',
        attemptNumber: 1
      }
    },
    {
      id: 'step-2',
      type: 'diagnosis',
      title: 'AI analyzed the failure',
      description: 'Revive AI examined the failure reason, customer payment history, and similar past cases.',
      timestamp: '2024-12-15T10:23:15Z',
      status: 'completed',
      aiInsight: 'This is a temporary issuer decline. Analysis of 2,847 similar cases shows 89% recovery rate when retried within 2 hours. Customer has excellent payment history (98.2% success rate, 48 transactions). No fraud indicators detected.',
      metadata: {
        analysisTime: '3.2s',
        similarCasesAnalyzed: 2847,
        confidenceScore: 87
      }
    },
    {
      id: 'step-3',
      type: 'policy-check',
      title: 'Policy verification',
      description: 'Checked recovery policies: retry limits, timing rules, and approval requirements.',
      timestamp: '2024-12-15T10:23:18Z',
      status: 'completed',
      aiInsight: 'Retry is allowed by policy. Customer has not exceeded retry limits (0 of 3 attempts used). Amount is within automatic recovery threshold (₹50,000). No manual approval required.',
      metadata: {
        policyId: 'POL-RETRY-001',
        rulesChecked: 5,
        rulesPassed: 5,
        autoApproved: true
      }
    },
    {
      id: 'step-4',
      type: 'decision',
      title: 'Recovery strategy determined',
      description: 'Revive decided to retry payment with optimized timing strategy.',
      timestamp: '2024-12-15T10:23:20Z',
      status: 'completed',
      aiInsight: 'Recommended strategy: Retry in 15 minutes using exponential backoff. This timing optimizes for issuer recovery windows while respecting rate limits. If first retry fails, wait 1 hour before second attempt.',
      metadata: {
        strategy: 'exponential-backoff',
        initialDelay: '15m',
        maxAttempts: 3,
        estimatedSuccessRate: 87
      }
    },
    {
      id: 'step-5',
      type: 'action',
      title: 'Retry scheduled',
      description: 'Payment retry has been scheduled according to the recovery strategy.',
      timestamp: '2024-12-15T10:23:25Z',
      status: 'in-progress',
      metadata: {
        scheduledFor: '2024-12-15T10:38:25Z',
        retryAttempt: 1,
        maxRetries: 3
      }
    },
    {
      id: 'step-6',
      type: 'outcome',
      title: 'Awaiting retry execution',
      description: 'Waiting for scheduled retry time. You\'ll be notified of the outcome.',
      timestamp: '2024-12-15T10:38:25Z',
      status: 'pending'
    }
  ]
}

export function RecoveryCaseDetail() {
  const { caseId } = useParams<{ caseId: string }>()
  
  // In production, fetch case detail from API using caseId
  const caseDetail = mockCaseDetail

  return (
    <div className="min-h-screen bg-atmospheric p-6 md:p-8 lg:p-12">
      <div className="max-w-[1200px] mx-auto space-y-8">
        
        {/* Back Navigation */}
        <div className="animate-slide-up">
          <Link
            to="/app/recovery"
            className="inline-flex items-center gap-2 text-body text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to recovery queue
          </Link>
        </div>

        {/* Header */}
        <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-h1 mb-2">Recovery Case</h1>
              <p className="text-mono text-text-tertiary">{caseDetail.id}</p>
            </div>
            <div className="text-right">
              <div className="text-label text-text-tertiary mb-1">AI CONFIDENCE</div>
              <div className="text-metric text-gradient-emerald">{caseDetail.recovery.confidence}%</div>
            </div>
          </div>
          <StatusBanner status={caseDetail.recovery.status} />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Timeline */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Recovery Journey Title */}
            <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
              <h2 className="text-h2 mb-2">Recovery journey</h2>
              <p className="text-body text-text-secondary">Every step Revive took to recover this payment</p>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              {caseDetail.timeline.map((step, idx) => (
                <div
                  key={step.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${300 + idx * 100}ms` }}
                >
                  <TimelineStepCard step={step} isLast={idx === caseDetail.timeline.length - 1} />
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: Case Info */}
          <div className="space-y-6">
            
            {/* Payment Amount Card */}
            <div className="panel-glass glow-emerald-soft animate-slide-up" style={{ animationDelay: '400ms' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="glass-emerald h-10 w-10 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="text-label text-text-tertiary">PAYMENT AMOUNT</div>
              </div>
              <div className="text-metric-lg text-text-primary">₹{caseDetail.amount.toLocaleString()}</div>
              <p className="text-body-sm text-text-secondary mt-2">{caseDetail.currency} · {caseDetail.customer.name}</p>
            </div>

            {/* Customer Info */}
            <div className="card-glass animate-slide-up" style={{ animationDelay: '500ms' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="glass-emerald h-10 w-10 rounded-lg flex items-center justify-center">
                  <User className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="text-label text-text-tertiary">CUSTOMER</div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-body font-medium text-text-primary">{caseDetail.customer.name}</div>
                  <div className="text-mono text-xs text-text-tertiary">{caseDetail.customer.customerId}</div>
                </div>
                <div className="space-y-2 text-body-sm">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Mail className="h-4 w-4" />
                    {caseDetail.customer.email}
                  </div>
                  {caseDetail.customer.phone && (
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Activity className="h-4 w-4" />
                      {caseDetail.customer.phone}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment History */}
            <div className="card-glass animate-slide-up" style={{ animationDelay: '600ms' }}>
              <div className="text-label text-text-tertiary mb-4">PAYMENT HISTORY</div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-body-sm text-text-secondary">Total transactions</span>
                  <span className="text-body-sm font-semibold text-text-primary">{caseDetail.customer.paymentHistory.totalTransactions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-body-sm text-text-secondary">Success rate</span>
                  <span className="text-body-sm font-semibold text-emerald-400">{caseDetail.customer.paymentHistory.successRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-body-sm text-text-secondary">Average amount</span>
                  <span className="text-body-sm font-semibold text-text-primary">₹{caseDetail.customer.paymentHistory.averageAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="card-glass animate-slide-up" style={{ animationDelay: '700ms' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="glass-emerald h-10 w-10 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="text-label text-text-tertiary">PAYMENT METHOD</div>
              </div>
              <div className="space-y-2">
                <div className="text-body font-medium text-text-primary">{caseDetail.payment.brand} •••• {caseDetail.payment.last4}</div>
                <div className="text-body-sm text-text-secondary">Expires {caseDetail.payment.expiryMonth}/{caseDetail.payment.expiryYear}</div>
              </div>
            </div>

            {/* Failure Details */}
            <div className="card-glass animate-slide-up" style={{ animationDelay: '800ms' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="glass h-10 w-10 rounded-lg flex items-center justify-center border-error/30">
                  <AlertCircle className="h-5 w-5 text-error" />
                </div>
                <div className="text-label text-text-tertiary">FAILURE REASON</div>
              </div>
              <div className="space-y-2">
                <div className="text-body font-medium text-text-primary">{caseDetail.failure.reason}</div>
                <div className="text-mono text-xs text-text-tertiary">{caseDetail.failure.code}</div>
                <p className="text-body-sm text-text-secondary pt-2">{caseDetail.failure.gatewayResponse}</p>
              </div>
            </div>

            {/* Recovery Info */}
            <div className="card-glass animate-slide-up" style={{ animationDelay: '900ms' }}>
              <div className="text-label text-text-tertiary mb-4">RECOVERY STATUS</div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-body-sm text-text-secondary">Retry attempts</span>
                  <span className="text-body-sm font-semibold text-text-primary">
                    {caseDetail.recovery.retryAttempts} / {caseDetail.recovery.maxRetries}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-body-sm text-text-secondary">Policy status</span>
                  <span className="text-body-sm font-semibold text-emerald-400 capitalize">
                    {caseDetail.recovery.policyStatus.replace('-', ' ')}
                  </span>
                </div>
                {caseDetail.recovery.estimatedRecoveryTime && (
                  <div className="flex items-center justify-between">
                    <span className="text-body-sm text-text-secondary">Est. recovery time</span>
                    <span className="text-body-sm font-semibold text-text-primary">{caseDetail.recovery.estimatedRecoveryTime}</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}

// Timeline Step Card Component
function TimelineStepCard({ step, isLast }: { step: TimelineStep; isLast: boolean }) {
  const icon = {
    detection: AlertCircle,
    diagnosis: Brain,
    'policy-check': Shield,
    decision: CheckCircle2,
    action: RefreshCw,
    outcome: CheckCircle2
  }[step.type]

  const Icon = icon

  const statusConfig = {
    completed: { color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    'in-progress': { color: 'text-warning', bgColor: 'bg-warning/10', border: 'border-warning/30' },
    pending: { color: 'text-text-tertiary', bgColor: 'bg-glass-white-20', border: 'border-glass-border' },
    failed: { color: 'text-error', bgColor: 'bg-error/10', border: 'border-error/30' }
  }

  const { color, bgColor, border } = statusConfig[step.status]

  return (
    <div className="relative">
      {/* Connector Line */}
      {!isLast && (
        <div className="absolute left-6 top-16 bottom-0 w-px bg-glass-border translate-y-2" />
      )}

      {/* Card */}
      <div className={`panel-glass hover-lift ${step.status === 'in-progress' ? 'glow-emerald-soft' : ''}`}>
        <div className="flex gap-6">
          
          {/* Icon */}
          <div className={`${bgColor} ${border} h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 border`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-h4">{step.title}</h3>
                {step.status === 'in-progress' && (
                  <span className="text-xs font-medium text-warning flex items-center gap-1">
                    <Clock className="h-3 w-3 animate-pulse" />
                    In progress
                  </span>
                )}
              </div>
              <p className="text-body-sm text-text-secondary">{step.description}</p>
              <p className="text-xs text-text-tertiary mt-2">
                {new Date(step.timestamp).toLocaleString('en-IN', { 
                  dateStyle: 'medium', 
                  timeStyle: 'short' 
                })}
              </p>
            </div>

            {/* AI Insight */}
            {step.aiInsight && (
              <div className="glass-emerald p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Brain className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-label text-emerald-400 mb-2">REVIVE AI</div>
                    <p className="text-body-sm text-text-secondary">{step.aiInsight}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Metadata */}
            {step.metadata && Object.keys(step.metadata).length > 0 && (
              <details className="glass-subtle rounded-lg">
                <summary className="px-4 py-3 cursor-pointer text-body-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                  Technical details
                </summary>
                <div className="px-4 pb-4 space-y-2">
                  {Object.entries(step.metadata).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between text-xs">
                      <span className="text-text-tertiary capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className="text-mono text-text-secondary">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Status Banner Component
function StatusBanner({ status }: { status: string }) {
  const config = {
    detecting: { label: 'Detecting failure', color: 'text-info', bgColor: 'bg-info/10' },
    diagnosed: { label: 'AI diagnosis complete', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
    recovering: { label: 'Recovery in progress', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
    recovered: { label: 'Revenue recovered', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
    'needs-review': { label: 'Needs your review', color: 'text-warning', bgColor: 'bg-warning/10' },
    blocked: { label: 'Blocked by policy', color: 'text-error', bgColor: 'bg-error/10' }
  }

  const { label, color, bgColor } = config[status as keyof typeof config] || config.detecting

  return (
    <div className={`${bgColor} ${color} px-6 py-4 rounded-xl text-center`}>
      <span className="text-body font-semibold">{label}</span>
    </div>
  )
}
