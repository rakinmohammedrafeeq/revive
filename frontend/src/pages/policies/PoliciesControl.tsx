import { useState, useEffect } from 'react'
import { 
  Shield, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  RefreshCw, 
  ShieldCheck, 
  ShieldAlert, 
  Sliders, 
  Loader2,
  Lock,
  Zap,
  Info
} from 'lucide-react'
import { 
  recoveryPolicyApi, 
  recoveryMetricsApi, 
  type RecoveryPolicy, 
  type RecoveryMetrics 
} from '@/api/recoveryApi'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'

/**
 * RECOVERY POLICIES & GUARDRAILS
 * 
 * Displays active recovery guardrails, deterministic safety rules,
 * cooldown limits, cost thresholds, and policy enforcement statistics.
 * Connected to live backend policy APIs.
 */
export function PoliciesControl() {
  const [policies, setPolicies] = useState<RecoveryPolicy[]>([])
  const [activePolicy, setActivePolicy] = useState<RecoveryPolicy | null>(null)
  const [metrics, setMetrics] = useState<RecoveryMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [policiesData, activeData, metricsData] = await Promise.all([
        recoveryPolicyApi.getAll().catch(() => []),
        recoveryPolicyApi.getActive().catch(() => null),
        recoveryMetricsApi.get().catch(() => null)
      ])
      
      setPolicies(policiesData)
      setActivePolicy(activeData || policiesData[0] || null)
      setMetrics(metricsData)
    } catch (err) {
      console.error('Failed to load policies:', err)
      setError('Unable to load recovery policies from server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading guardrail policies...</p>
        </div>
      </div>
    )
  }

  const current = activePolicy || {
    id: 1,
    name: 'Standard Merchant Recovery Guardrail',
    description: 'Default autonomous recovery policy bounding retry volume, spacing, and channel costs.',
    maxRetryCount: 3,
    cooldownHours: 24,
    maxRecoveryCostPerPayment: 50,
    maxTotalRecoveryBudget: 10000,
    allowedChannels: 'AUTOMATIC, EMAIL, SMS, PAYMENT_LINK',
    isActive: true,
    priority: 100,
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
              Safety Guardrails
            </span>
            <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Active Enforcement
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Recovery Guardrails & Policies
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Deterministic boundaries that constrain AI recovery actions. Guarantees that every retry or customer
            intervention strictly adheres to merchant retry limits, cooldowns, and budget thresholds.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={loadData}
          className="gap-2 border-border text-foreground hover:bg-muted text-xs self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Guardrails
        </Button>
      </div>

      {/* Enforcement Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl glass-card p-5 border border-primary/20 bg-card">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Enforcement Status</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            Active & Strict
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 font-medium">
            Zero actions bypass policy engine
          </p>
        </div>

        <div className="rounded-2xl glass-card p-5 border border-border bg-card">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Interventions Blocked</span>
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-foreground">
            {metrics?.policyBlockedActions || 0}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Unsafe or redundant attempts blocked
          </p>
        </div>

        <div className="rounded-2xl glass-card p-5 border border-border bg-card">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Configured Policies</span>
            <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-foreground">
            {policies.length > 0 ? policies.length : 1}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Workspace guardrail rulesets
          </p>
        </div>
      </div>

      {/* Active Policy Card */}
      <div className="rounded-2xl glass-card border border-primary/30 p-6 space-y-6 bg-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-foreground text-base">{current.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {current.description || 'Controls maximum retries, cooldown spacing, and channel allocations.'}
              </p>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Priority: <strong className="text-foreground">{current.priority || 100}</strong>
          </div>
        </div>

        {/* 4 Guardrail Boundary Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Max Retries */}
          <div className="rounded-xl bg-muted/40 border border-border p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Max Retries</span>
              <RefreshCw className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {current.maxRetryCount} <span className="text-xs font-normal text-muted-foreground">attempts</span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Hard limit per failed payment
            </p>
          </div>

          {/* Cooldown Hours */}
          <div className="rounded-xl bg-muted/40 border border-border p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Cooldown Period</span>
              <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {current.cooldownHours} <span className="text-xs font-normal text-muted-foreground">hours</span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Minimum delay between attempts
            </p>
          </div>

          {/* Cost Cap */}
          <div className="rounded-xl bg-muted/40 border border-border p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Cost Cap</span>
              <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {current.maxRecoveryCostPerPayment ? formatCurrency(current.maxRecoveryCostPerPayment, 'INR') : '₹50.00'}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Max expenditure per recovery
            </p>
          </div>

          {/* Total Budget */}
          <div className="rounded-xl bg-muted/40 border border-border p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Total Budget</span>
              <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {current.maxTotalRecoveryBudget ? formatCurrency(current.maxTotalRecoveryBudget, 'INR') : '₹10,000'}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Workspace spending ceiling
            </p>
          </div>
        </div>

        {/* Allowed Channels */}
        <div className="rounded-xl bg-muted/30 border border-border p-4 space-y-2">
          <span className="text-xs font-semibold text-foreground block">Authorized Recovery Channels</span>
          <div className="flex flex-wrap gap-2">
            {(current.allowedChannels || 'AUTOMATIC, EMAIL, SMS, PAYMENT_LINK')
              .split(',')
              .map((ch) => (
                <span
                  key={ch.trim()}
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-primary/10 border border-primary/20 text-primary"
                >
                  {ch.trim()}
                </span>
              ))}
          </div>
        </div>
      </div>

      {/* Deterministic Guardrail Explanations */}
      <div className="rounded-2xl glass-card border border-border p-6 space-y-4 bg-card">
        <h3 className="font-bold text-foreground text-base flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          Deterministic Guardrail Rules Enforced by Policy Engine
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Retry Exhaustion Stopping Rule</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              If a payment reaches <strong className="text-foreground">{current.maxRetryCount} attempts</strong>, the pipeline halts automatic actions
              and transitions the case to <strong className="text-foreground">ABANDONED</strong> or <strong className="text-foreground">UNDER_REVIEW</strong>, protecting customer goodwill.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Mandatory Spacing & Cooldown</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Retries are blocked if less than <strong className="text-foreground">{current.cooldownHours} hours</strong> have elapsed since the prior attempt,
              preventing repeated bank decline fees and spamming payment gateways.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Idempotency & Duplicate Guard</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              If a payment is already <strong className="text-foreground">RECOVERED</strong> or currently in progress, repeated actions are deterministically blocked
              at the policy gateway.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Economic Cost Thresholds</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Discounts or outreach costs exceeding <strong className="text-foreground">{current.maxRecoveryCostPerPayment ? formatCurrency(current.maxRecoveryCostPerPayment, 'INR') : '₹50'}</strong> are
              blocked, ensuring recovery always yields positive net revenue for the merchant.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
