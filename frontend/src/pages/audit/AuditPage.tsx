import { ScrollText, CheckCircle2, XCircle, Clock, Shield, TrendingUp, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// Mock audit trail data - will be replaced with real API
const auditEvents = [
  {
    id: '1',
    timestamp: '2026-09-01 14:32:15',
    event: 'Payment Detected',
    actor: 'System',
    target: 'Payment #12458',
    details: 'Failed payment detected: ₹12,500 - Insufficient funds',
    outcome: 'detected',
  },
  {
    id: '2',
    timestamp: '2026-09-01 14:32:16',
    event: 'AI Diagnosis',
    actor: 'Revive AI',
    target: 'Payment #12458',
    details: 'Analyzed failure pattern: Temporary cash flow issue',
    outcome: 'success',
  },
  {
    id: '3',
    timestamp: '2026-09-01 14:32:17',
    event: 'Policy Evaluation',
    actor: 'System',
    target: 'Recovery Policy #3',
    details: 'Checked eligibility: Passed all guardrails',
    outcome: 'eligible',
  },
  {
    id: '4',
    timestamp: '2026-09-01 14:32:18',
    event: 'Action Proposed',
    actor: 'Revive AI',
    target: 'Payment #12458',
    details: 'Recommended: Retry after 24 hours',
    outcome: 'pending',
  },
  {
    id: '5',
    timestamp: '2026-09-01 14:45:22',
    event: 'Action Approved',
    actor: 'admin@revive.com',
    target: 'Recovery Action #891',
    details: 'Manual approval: Recovery action authorized',
    outcome: 'approved',
  },
  {
    id: '6',
    timestamp: '2026-09-02 14:32:20',
    event: 'Recovery Executed',
    actor: 'System',
    target: 'Payment #12458',
    details: 'Retry attempt executed via payment gateway',
    outcome: 'executed',
  },
  {
    id: '7',
    timestamp: '2026-09-02 14:32:45',
    event: 'Payment Recovered',
    actor: 'System',
    target: 'Payment #12458',
    details: 'Payment successful: ₹12,500 recovered',
    outcome: 'recovered',
  },
  {
    id: '8',
    timestamp: '2026-09-02 15:18:33',
    event: 'Payment Detected',
    actor: 'System',
    target: 'Payment #12462',
    details: 'Failed payment detected: ₹85,000 - Card expired',
    outcome: 'detected',
  },
  {
    id: '9',
    timestamp: '2026-09-02 15:18:34',
    event: 'AI Diagnosis',
    actor: 'Revive AI',
    target: 'Payment #12462',
    details: 'Payment method requires update',
    outcome: 'success',
  },
  {
    id: '10',
    timestamp: '2026-09-02 15:18:35',
    event: 'Policy Evaluation',
    actor: 'System',
    target: 'Recovery Policy #7',
    details: 'High-value payment flagged for manual review',
    outcome: 'requires_approval',
  },
]

const getEventIcon = (event: string) => {
  if (event.includes('Detected')) return AlertCircle
  if (event.includes('Diagnosis')) return TrendingUp
  if (event.includes('Policy')) return Shield
  if (event.includes('Approved')) return CheckCircle2
  if (event.includes('Recovered')) return CheckCircle2
  if (event.includes('Failed')) return XCircle
  return Clock
}

const getOutcomeColor = (outcome: string) => {
  switch (outcome) {
    case 'success':
    case 'recovered':
    case 'approved':
    case 'eligible':
      return 'bg-primary/10 text-primary border-primary/20'
    case 'detected':
    case 'pending':
    case 'executed':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
    case 'requires_approval':
      return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20'
    case 'failed':
    case 'blocked':
      return 'bg-destructive/10 text-destructive border-destructive/20'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

export function AuditPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit</h1>
        <p className="text-muted-foreground mt-1">
          Complete operational timeline of recovery decisions and actions
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <ScrollText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Decisions</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">892</div>
            <p className="text-xs text-muted-foreground mt-1">Automated decisions</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manual Reviews</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground mt-1">Approved actions</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Policy Blocks</CardTitle>
            <Shield className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground mt-1">Actions prevented</p>
          </CardContent>
        </Card>
      </div>

      {/* Audit Trail */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
          <CardDescription>
            Chronological record of all recovery detection, decisions, and outcomes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Outcome</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditEvents.map((event) => {
                const Icon = getEventIcon(event.event)
                return (
                  <TableRow key={event.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {event.timestamp}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="font-medium">{event.event}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {event.actor === 'System' || event.actor === 'Revive AI' ? (
                        <Badge variant="outline" className="text-xs">
                          {event.actor}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">{event.actor}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {event.target}
                    </TableCell>
                    <TableCell className="text-sm">{event.details}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getOutcomeColor(event.outcome)}>
                        {event.outcome.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {/* Load More */}
          <div className="mt-4 text-center">
            <button className="text-sm text-primary hover:underline">
              Load more events
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Explanation */}
      <Card className="glass-card border-primary/20 emerald-glow">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <ScrollText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-primary">Complete Audit Trail</CardTitle>
              <CardDescription className="mt-1.5">
                Every recovery detection, AI decision, policy evaluation, manual review, and action outcome is permanently recorded. This audit trail ensures transparency, compliance, and accountability for all automated and manual recovery interventions.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Implementation Note */}
      <Card className="border-dashed glass">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium mb-1">Demo Audit Data</p>
              <p className="text-xs text-muted-foreground">
                The audit events shown above are demonstration data. Real audit trail data will be recorded by the backend AuditTrail service once Phase 2 recovery-agent APIs are implemented.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
