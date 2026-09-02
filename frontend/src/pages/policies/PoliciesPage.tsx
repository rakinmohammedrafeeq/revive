import { Shield, CheckCircle2, Clock, DollarSign, RefreshCw, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

// Mock policy data - will be replaced with real API
const policyGroups = [
  {
    id: 'retry',
    name: 'Retry Policies',
    icon: RefreshCw,
    policies: [
      {
        id: 'max-retries',
        name: 'Maximum Retry Attempts',
        description: 'Maximum number of automatic retry attempts per failed payment',
        value: '3 attempts',
        enabled: true,
      },
      {
        id: 'retry-delay',
        name: 'Retry Delay',
        description: 'Minimum time to wait between retry attempts',
        value: '24 hours',
        enabled: true,
      },
      {
        id: 'retry-window',
        name: 'Retry Window',
        description: 'Maximum duration for retry attempts before escalation',
        value: '7 days',
        enabled: true,
      },
    ],
  },
  {
    id: 'eligibility',
    name: 'Eligibility Rules',
    icon: CheckCircle2,
    policies: [
      {
        id: 'min-amount',
        name: 'Minimum Payment Amount',
        description: 'Minimum payment value eligible for automated recovery',
        value: '₹500',
        enabled: true,
      },
      {
        id: 'payment-methods',
        name: 'Eligible Payment Methods',
        description: 'Payment methods that support automated recovery',
        value: 'Card, UPI, Net Banking',
        enabled: true,
      },
      {
        id: 'customer-status',
        name: 'Customer Status Check',
        description: 'Only attempt recovery for active customers',
        value: 'Active only',
        enabled: true,
      },
    ],
  },
  {
    id: 'guardrails',
    name: 'Safety Guardrails',
    icon: Shield,
    policies: [
      {
        id: 'approval-threshold',
        name: 'Manual Approval Threshold',
        description: 'Payments above this amount require manual approval',
        value: '₹50,000',
        enabled: true,
      },
      {
        id: 'velocity-limit',
        name: 'Velocity Limit',
        description: 'Maximum recovery attempts per customer per day',
        value: '2 attempts',
        enabled: true,
      },
      {
        id: 'cooldown-period',
        name: 'Cooldown After Failure',
        description: 'Waiting period after multiple consecutive failures',
        value: '48 hours',
        enabled: true,
      },
    ],
  },
  {
    id: 'escalation',
    name: 'Escalation Rules',
    icon: AlertTriangle,
    policies: [
      {
        id: 'high-value-alert',
        name: 'High-Value Payment Alert',
        description: 'Notify team when high-value payment fails',
        value: '₹100,000',
        enabled: true,
      },
      {
        id: 'vip-customer',
        name: 'VIP Customer Handling',
        description: 'Prioritize and escalate VIP customer payment issues',
        value: 'Immediate escalation',
        enabled: true,
      },
      {
        id: 'repeated-failure',
        name: 'Repeated Failure Escalation',
        description: 'Escalate after multiple recovery failures',
        value: 'After 3 failures',
        enabled: true,
      },
    ],
  },
]

export function PoliciesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Set the boundaries</h1>
        <p className="text-muted-foreground mt-1">
          Recovery guardrails that tell Revive where to stop
        </p>
      </div>

      {/* Policy Status Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-card border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">14</div>
            <p className="text-xs text-muted-foreground mt-1">All enabled</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Actions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approvals Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
          </CardContent>
        </Card>
      </div>

      {/* Policy Groups */}
      <div className="space-y-6">
        {policyGroups.map((group) => (
          <Card key={group.id} className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <group.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>{group.name}</CardTitle>
                  <CardDescription>
                    {group.policies.length} policies configured
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {group.policies.map((policy) => (
                  <div
                    key={policy.id}
                    className="flex items-start justify-between gap-4 rounded-lg border border-border/50 bg-muted/30 p-4 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={policy.id} className="font-medium cursor-pointer">
                          {policy.name}
                        </Label>
                        {policy.enabled && (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{policy.description}</p>
                      <p className="text-sm font-medium text-primary mt-2">{policy.value}</p>
                    </div>
                    <Switch
                      id={policy.id}
                      checked={policy.enabled}
                      className="flex-shrink-0"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Policy Explanation */}
      <Card className="glass-card border-primary/20 emerald-glow">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-primary">Why boundaries matter</CardTitle>
              <CardDescription className="mt-1.5">
                Recovery policies ensure that automated actions are safe, compliant, and respectful of customer experience. Revive uses these guardrails to know which recovery actions are allowed and which need your approval.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Safety First</p>
                <p className="text-xs text-muted-foreground">Prevent over-aggressive retries</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Compliance</p>
                <p className="text-xs text-muted-foreground">Meet regulatory requirements</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <DollarSign className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Cost Control</p>
                <p className="text-xs text-muted-foreground">Optimize intervention costs</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Note */}
      <Card className="border-dashed glass">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium mb-1">Policy Configuration UI</p>
              <p className="text-xs text-muted-foreground">
                Policy toggles shown above are demonstration UI. Policy enforcement logic will be implemented in Phase 2 recovery-agent backend. Real policy CRUD operations and enforcement will be available once the RecoveryPolicy backend APIs are integrated.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
