import { useState } from 'react'
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
  Filter
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'

// Extended mock recovery cases for impressive showcase
const RECOVERY_CASES = [
  {
    id: 'RC-001',
    customer: 'Acme Corp',
    amount: 12500,
    failureReason: 'Card declined',
    aiDiagnosis: 'Temporary hold - high success rate with retry',
    aiReasoning: 'Bank timeout detected. Similar patterns show 85% success on immediate retry.',
    recommendedAction: 'Retry payment now',
    policyStatus: 'approved',
    status: 'ready',
    confidence: 0.89,
    detectedAt: '12min ago',
    recoveryProbability: 85,
  },
  {
    id: 'RC-002',
    customer: 'Tech Solutions Inc',
    amount: 8200,
    failureReason: 'Insufficient funds',
    aiDiagnosis: 'Retry in 3 days - payment cycle detected',
    aiReasoning: 'Customer receives monthly payment on 15th. Balance will be available then.',
    recommendedAction: 'Schedule retry for 15th',
    policyStatus: 'approved',
    status: 'scheduled',
    confidence: 0.76,
    detectedAt: '1h ago',
    recoveryProbability: 76,
  },
  {
    id: 'RC-003',
    customer: 'Global Services LLC',
    amount: 15750,
    failureReason: 'Expired card',
    aiDiagnosis: 'Contact recommended - high-value customer',
    aiReasoning: 'Premium customer. Manual outreach will preserve relationship and ensure card update.',
    recommendedAction: 'Send payment update request',
    policyStatus: 'needs_review',
    status: 'awaiting_approval',
    confidence: 0.92,
    detectedAt: '3h ago',
    recoveryProbability: 92,
  },
  {
    id: 'RC-004',
    customer: 'StartupCo',
    amount: 4500,
    failureReason: 'Bank timeout',
    aiDiagnosis: 'Network issue - retry immediately',
    aiReasoning: 'Transient failure. No customer action needed.',
    recommendedAction: 'Automatic retry',
    policyStatus: 'approved',
    status: 'ready',
    confidence: 0.94,
    detectedAt: '45min ago',
    recoveryProbability: 94,
  },
  {
    id: 'RC-005',
    customer: 'Enterprise Solutions',
    amount: 25000,
    failureReason: 'Payment disputed',
    aiDiagnosis: 'Investigation required',
    aiReasoning: 'Customer initiated chargeback. Requires manual review before action.',
    recommendedAction: 'Contact customer support',
    policyStatus: 'blocked',
    status: 'on_hold',
    confidence: 0.45,
    detectedAt: '6h ago',
    recoveryProbability: 45,
  },
]

export function RecoveryPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCases = RECOVERY_CASES.filter(case_ => {
    const matchesStatus = statusFilter === 'all' || case_.status === statusFilter
    const matchesSearch = case_.customer.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          case_.id.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const statusCounts = {
    all: RECOVERY_CASES.length,
    ready: RECOVERY_CASES.filter(c => c.status === 'ready').length,
    scheduled: RECOVERY_CASES.filter(c => c.status === 'scheduled').length,
    awaiting_approval: RECOVERY_CASES.filter(c => c.status === 'awaiting_approval').length,
    on_hold: RECOVERY_CASES.filter(c => c.status === 'on_hold').length,
  }

  const totalAtRisk = RECOVERY_CASES.reduce((sum, c) => sum + c.amount, 0)
  const readyToRecover = RECOVERY_CASES.filter(c => c.status === 'ready').reduce((sum, c) => sum + c.amount, 0)

  const getStatusBadge = (status: string) => {
    const variants = {
      ready: { label: 'Ready to act', class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
      scheduled: { label: 'Scheduled', class: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      awaiting_approval: { label: 'Needs you', class: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
      on_hold: { label: 'On hold', class: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
    }
    const variant = variants[status as keyof typeof variants] || { label: status, class: '' }
    return <Badge className={`${variant.class} hover:${variant.class}`}>{variant.label}</Badge>
  }

  const getPolicyStatusIcon = (status: string) => {
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
      default:
        return null
    }
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
              {filteredCases.length} {filteredCases.length === 1 ? 'payment needs' : 'payments need'} attention
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4">
            <div className="glass-subtle rounded-xl px-4 py-3 min-w-[140px]">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Currently slipping</div>
              <div className="text-2xl font-bold text-amber-400">{formatCurrency(totalAtRisk)}</div>
            </div>
            <div className="glass-subtle rounded-xl px-4 py-3 min-w-[140px]">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Ready to act</div>
              <div className="text-2xl font-bold text-emerald-400">{formatCurrency(readyToRecover)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Notice */}
      <div className="glass-subtle rounded-xl px-4 py-3 border border-amber-500/20">
        <p className="text-xs text-amber-400">
          <span className="font-semibold">Demo Mode:</span> Recovery cases shown below use simulated data. 
          Connect recovery API for production cases.
        </p>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer or case ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 glass-subtle border-white/10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {[
            { key: 'all', label: 'All', count: statusCounts.all },
            { key: 'ready', label: 'Ready', count: statusCounts.ready },
            { key: 'scheduled', label: 'Scheduled', count: statusCounts.scheduled },
            { key: 'awaiting_approval', label: 'Awaiting', count: statusCounts.awaiting_approval },
            { key: 'on_hold', label: 'On hold', count: statusCounts.on_hold },
          ].map(({ key, label, count }) => (
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
          ))}
        </div>
      </div>

      {/* Recovery Cases - Card Layout */}
      <div className="space-y-4">
        {filteredCases.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center">
            <Filter className="h-16 w-16 text-muted-foreground/40 mb-4 mx-auto" />
            <h3 className="text-lg font-semibold mb-2">Nothing matches that search</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
          </div>
        ) : (
          filteredCases.map((case_) => (
            <div 
              key={case_.id}
              className="card-revive group cursor-pointer hover:border-primary/40"
            >
              {/* Header Row */}
              <div className="flex flex-col lg:flex-row lg:items-start gap-6 mb-6">
                {/* Amount & Customer */}
                <div className="flex-shrink-0 space-y-2">
                  <div className="text-4xl font-bold text-gradient-emerald">
                    {formatCurrency(case_.amount)}
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">{case_.customer}</div>
                    <div className="text-xs text-muted-foreground">{case_.id} · {case_.detectedAt}</div>
                  </div>
                  {getStatusBadge(case_.status)}
                </div>

                {/* Problem & Time */}
                <div className="flex-1 space-y-3">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Why it failed</div>
                    <div className="text-sm font-medium">{case_.failureReason}</div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Detected {case_.detectedAt}</span>
                  </div>
                </div>

                {/* Quick Action */}
                {case_.status === 'ready' && (
                  <div className="flex-shrink-0">
                    <Button className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white gap-2">
                      <Zap className="h-4 w-4" />
                      <span>Let's go</span>
                    </Button>
                  </div>
                )}
              </div>

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
                      <div className="text-sm font-medium mb-2">{case_.aiDiagnosis}</div>
                      <div className="text-xs text-muted-foreground leading-relaxed">{case_.aiReasoning}</div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-3 w-3 text-primary" />
                        <span className="text-muted-foreground">
                          {case_.recoveryProbability}% recovery probability
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-primary" />
                        <span className="text-muted-foreground">
                          {(case_.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
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
                    <span className="text-sm font-medium">{case_.recommendedAction}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Are we allowed?</div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    {getPolicyStatusIcon(case_.policyStatus)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Take a look</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
