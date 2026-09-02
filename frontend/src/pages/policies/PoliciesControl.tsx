import { Shield, CheckCircle2, AlertCircle, XCircle, Clock, DollarSign, RefreshCw, Settings } from 'lucide-react'

/**
 * REVIVE POLICIES CONTROL CENTER
 * 
 * Visual guardrail management with allowed/review/blocked states.
 * Shows recovery rules, retry limits, timing constraints, approval requirements.
 * 
 * NOTE: Currently using development data structure.
 * Production will integrate with backend policy management APIs.
 */

// Development types
interface Policy {
  id: string
  name: string
  description: string
  category: 'retry' | 'timing' | 'amount' | 'approval'
  status: 'active' | 'inactive'
  rules: PolicyRule[]
}

interface PolicyRule {
  id: string
  condition: string
  action: 'allow' | 'review' | 'block'
  value?: string
  enabled: boolean
}

// Mock data
const mockPolicies: Policy[] = [
  {
    id: 'pol-retry-001',
    name: 'Retry Limits',
    description: 'Controls how many times Revive can retry failed payments',
    category: 'retry',
    status: 'active',
    rules: [
      {
        id: 'rule-1',
        condition: 'Temporary issuer decline',
        action: 'allow',
        value: '3 attempts',
        enabled: true
      },
      {
        id: 'rule-2',
        condition: 'Insufficient funds',
        action: 'allow',
        value: '2 attempts',
        enabled: true
      },
      {
        id: 'rule-3',
        condition: 'Suspected fraud',
        action: 'block',
        value: 'No retries',
        enabled: true
      },
      {
        id: 'rule-4',
        condition: 'Card expired',
        action: 'review',
        value: 'Manual approval required',
        enabled: true
      }
    ]
  },
  {
    id: 'pol-timing-001',
    name: 'Timing Rules',
    description: 'When Revive can retry payments based on failure type',
    category: 'timing',
    status: 'active',
    rules: [
      {
        id: 'rule-5',
        condition: 'First retry after temporary decline',
        action: 'allow',
        value: 'Wait 15 minutes',
        enabled: true
      },
      {
        id: 'rule-6',
        condition: 'Second retry after temporary decline',
        action: 'allow',
        value: 'Wait 1 hour',
        enabled: true
      },
      {
        id: 'rule-7',
        condition: 'Insufficient funds retry',
        action: 'allow',
        value: 'Wait 24 hours',
        enabled: true
      },
      {
        id: 'rule-8',
        condition: 'Payment limit exceeded',
        action: 'allow',
        value: 'Wait until midnight',
        enabled: true
      }
    ]
  },
  {
    id: 'pol-amount-001',
    name: 'Amount Thresholds',
    description: 'Automatic recovery limits based on transaction amount',
    category: 'amount',
    status: 'active',
    rules: [
      {
        id: 'rule-9',
        condition: 'Amount < ₹50,000',
        action: 'allow',
        value: 'Automatic recovery',
        enabled: true
      },
      {
        id: 'rule-10',
        condition: 'Amount ₹50,000 - ₹2,00,000',
        action: 'review',
        value: 'Analyst approval',
        enabled: true
      },
      {
        id: 'rule-11',
        condition: 'Amount > ₹2,00,000',
        action: 'review',
        value: 'Admin approval',
        enabled: true
      }
    ]
  },
  {
    id: 'pol-approval-001',
    name: 'Approval Workflow',
    description: 'When manual approval is required before recovery',
    category: 'approval',
    status: 'active',
    rules: [
      {
        id: 'rule-12',
        condition: 'Customer requested chargeback',
        action: 'block',
        value: 'No recovery attempt',
        enabled: true
      },
      {
        id: 'rule-13',
        condition: 'Multiple failed retries (>3)',
        action: 'review',
        value: 'Manager approval',
        enabled: true
      },
      {
        id: 'rule-14',
        condition: 'New customer (<3 transactions)',
        action: 'review',
        value: 'Risk assessment',
        enabled: true
      }
    ]
  }
]

export function PoliciesControl() {
  const policyStats = {
    totalPolicies: mockPolicies.length,
    totalRules: mockPolicies.reduce((sum, p) => sum + p.rules.length, 0),
    activeRules: mockPolicies.reduce((sum, p) => sum + p.rules.filter(r => r.enabled).length, 0),
    allowedByDefault: mockPolicies.reduce((sum, p) => sum + p.rules.filter(r => r.action === 'allow' && r.enabled).length, 0)
  }

  return (
    <div className="min-h-screen bg-atmospheric p-6 md:p-8 lg:p-12">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* Header */}
        <div className="animate-slide-up">
          <h1 className="text-h1 mb-2">Recovery Policies</h1>
          <p className="text-body text-text-secondary">Guardrails that control how Revive recovers revenue</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="card-glass hover-lift">
            <div className="text-label text-text-tertiary mb-2">TOTAL POLICIES</div>
            <div className="text-metric text-text-primary">{policyStats.totalPolicies}</div>
          </div>
          <div className="card-glass hover-lift">
            <div className="text-label text-text-tertiary mb-2">TOTAL RULES</div>
            <div className="text-metric text-text-primary">{policyStats.totalRules}</div>
          </div>
          <div className="card-glass hover-lift">
            <div className="text-label text-text-tertiary mb-2">ACTIVE RULES</div>
            <div className="text-metric text-emerald-400">{policyStats.activeRules}</div>
          </div>
          <div className="card-glass hover-lift">
            <div className="text-label text-text-tertiary mb-2">AUTO-APPROVED</div>
            <div className="text-metric text-emerald-400">{policyStats.allowedByDefault}</div>
          </div>
        </div>

        {/* Policy Cards */}
        <div className="space-y-6">
          {mockPolicies.map((policy, idx) => (
            <div
              key={policy.id}
              className="panel-glass-lg hover-lift animate-slide-up"
              style={{ animationDelay: `${200 + idx * 100}ms` }}
            >
              {/* Policy Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-glass-border">
                <div className="flex items-start gap-4">
                  <div className="glass-emerald h-12 w-12 rounded-xl flex items-center justify-center glow-emerald-soft flex-shrink-0">
                    {policy.category === 'retry' && <RefreshCw className="h-6 w-6 text-emerald-400" />}
                    {policy.category === 'timing' && <Clock className="h-6 w-6 text-emerald-400" />}
                    {policy.category === 'amount' && <DollarSign className="h-6 w-6 text-emerald-400" />}
                    {policy.category === 'approval' && <Shield className="h-6 w-6 text-emerald-400" />}
                  </div>
                  <div>
                    <h2 className="text-h3 mb-1">{policy.name}</h2>
                    <p className="text-body-sm text-text-secondary">{policy.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="glass-subtle px-3 py-1 rounded-full text-xs font-semibold text-emerald-400 capitalize">
                    {policy.status}
                  </span>
                  <button className="glass hover:glass-strong px-4 py-2 rounded-lg text-body-sm font-medium text-text-secondary hover:text-text-primary transition-all inline-flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Configure
                  </button>
                </div>
              </div>

              {/* Policy Rules */}
              <div className="space-y-3">
                {policy.rules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`glass-subtle p-4 rounded-lg transition-all ${
                      rule.enabled ? 'opacity-100' : 'opacity-50'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      
                      {/* Rule Condition */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-body font-medium text-text-primary">{rule.condition}</span>
                          {!rule.enabled && (
                            <span className="text-xs text-text-quaternary">(Disabled)</span>
                          )}
                        </div>
                        {rule.value && (
                          <p className="text-body-sm text-text-secondary">{rule.value}</p>
                        )}
                      </div>

                      {/* Action Badge */}
                      <div className="flex items-center gap-3">
                        <ActionBadge action={rule.action} />
                        
                        {/* Toggle (visual only - no functionality) */}
                        <button
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            rule.enabled ? 'bg-emerald-500' : 'bg-glass-white-20'
                          }`}
                          aria-label="Toggle rule"
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              rule.enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                    </div>
                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>

        {/* Policy Explainer */}
        <div className="panel-glass-lg animate-slide-up" style={{ animationDelay: '600ms' }}>
          <div className="flex items-start gap-4 mb-6">
            <div className="glass-emerald h-12 w-12 rounded-xl flex items-center justify-center glow-emerald-soft flex-shrink-0">
              <Shield className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-h3 mb-2">How policies work</h2>
              <p className="text-body text-text-secondary">Understanding Revive's guardrail system</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="glass-subtle p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                <span className="text-label text-emerald-400">ALLOWED</span>
              </div>
              <p className="text-body-sm text-text-secondary">
                Revive can proceed automatically. No manual approval needed. Recovery happens within policy limits.
              </p>
            </div>

            <div className="glass-subtle p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="h-6 w-6 text-warning" />
                <span className="text-label text-warning">REVIEW REQUIRED</span>
              </div>
              <p className="text-body-sm text-text-secondary">
                Recovery is paused for manual review. Someone from your team needs to approve before Revive proceeds.
              </p>
            </div>

            <div className="glass-subtle p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <XCircle className="h-6 w-6 text-error" />
                <span className="text-label text-error">BLOCKED</span>
              </div>
              <p className="text-body-sm text-text-secondary">
                Recovery is not allowed. Policy prevents any automatic or manual retry. Case is stopped.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}

// Action Badge Component
function ActionBadge({ action }: { action: 'allow' | 'review' | 'block' }) {
  const config = {
    allow: {
      label: '✓ Allowed',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      icon: CheckCircle2
    },
    review: {
      label: '⚠ Review Required',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      icon: AlertCircle
    },
    block: {
      label: '✕ Blocked',
      color: 'text-error',
      bgColor: 'bg-error/10',
      icon: XCircle
    }
  }

  const { label, color, bgColor, icon: Icon } = config[action]

  return (
    <div className={`${bgColor} ${color} px-4 py-2 rounded-lg flex items-center gap-2 min-w-[140px]`}>
      <Icon className="h-4 w-4" />
      <span className="text-xs font-semibold">{label}</span>
    </div>
  )
}
