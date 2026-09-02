import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, TrendingUp, AlertCircle, CheckCircle2, Clock, Brain, ChevronRight, DollarSign } from 'lucide-react'

/**
 * REVIVE RECOVERY WORKSPACE
 * 
 * Completely new recovery case interface - NOT a traditional table.
 * Features glass case cards with AI diagnosis, expandable details, and progressive disclosure.
 * 
 * NOTE: Currently using development data structure.
 * Production will integrate with backend recovery APIs.
 */

// Development types
interface RecoveryCase {
  id: string
  amount: number
  currency: string
  customer: string
  customerEmail: string
  failureReason: string
  failureCode: string
  aiDiagnosis: string
  aiRecommendation: string
  confidence: number
  status: 'detecting' | 'diagnosed' | 'policy-check' | 'recovering' | 'recovered' | 'needs-review' | 'blocked'
  priority: 'high' | 'medium' | 'low'
  timestamp: string
  timeAgo: string
  policyStatus: 'allowed' | 'review-required' | 'blocked'
  retryAttempts: number
  maxRetries: number
  estimatedRecoveryTime?: string
}

// Mock data
const mockCases: RecoveryCase[] = [
  {
    id: 'RC-2024-001',
    amount: 18500,
    currency: 'INR',
    customer: 'Acme Corporation',
    customerEmail: 'billing@acmecorp.com',
    failureReason: 'Temporary issuer decline',
    failureCode: 'issuer_declined_temp',
    aiDiagnosis: 'Payment processor experienced temporary issues. Customer has strong payment history with 98% success rate over past 12 months.',
    aiRecommendation: 'High recovery probability. Retry recommended within next 2 hours.',
    confidence: 87,
    status: 'recovering',
    priority: 'high',
    timestamp: '2024-12-15T10:23:00Z',
    timeAgo: '8 minutes ago',
    policyStatus: 'allowed',
    retryAttempts: 1,
    maxRetries: 3,
    estimatedRecoveryTime: '~15 minutes'
  },
  {
    id: 'RC-2024-002',
    amount: 42300,
    currency: 'INR',
    customer: 'TechStart India Pvt Ltd',
    customerEmail: 'accounts@techstart.in',
    failureReason: 'Insufficient funds',
    failureCode: 'insufficient_funds',
    aiDiagnosis: 'Customer cash flow analysis shows funds typically available after 2 PM daily. Previous similar failures recovered within 24 hours.',
    aiRecommendation: 'Retry scheduled for 2:30 PM based on customer payment patterns.',
    confidence: 72,
    status: 'diagnosed',
    priority: 'high',
    timestamp: '2024-12-15T10:08:00Z',
    timeAgo: '23 minutes ago',
    policyStatus: 'allowed',
    retryAttempts: 0,
    maxRetries: 3,
    estimatedRecoveryTime: '~4 hours'
  },
  {
    id: 'RC-2024-003',
    amount: 9750,
    currency: 'INR',
    customer: 'Local Services LLC',
    customerEmail: 'admin@localservices.co',
    failureReason: 'Card expired',
    failureCode: 'expired_card',
    aiDiagnosis: 'Payment method expired last week. Customer notification sent via email and SMS. No response yet.',
    aiRecommendation: 'Manual intervention recommended. Customer needs to update payment method.',
    confidence: 65,
    status: 'needs-review',
    priority: 'medium',
    timestamp: '2024-12-15T09:31:00Z',
    timeAgo: '1 hour ago',
    policyStatus: 'review-required',
    retryAttempts: 0,
    maxRetries: 0
  },
  {
    id: 'RC-2024-004',
    amount: 156000,
    currency: 'INR',
    customer: 'Enterprise Solutions Group',
    customerEmail: 'finance@enterprisesg.com',
    failureReason: 'Payment limit exceeded',
    failureCode: 'amount_too_large',
    aiDiagnosis: 'Transaction exceeds customer daily limit. Similar high-value transactions typically succeed after limit reset at midnight.',
    aiRecommendation: 'Retry scheduled for 12:05 AM. Consider contacting customer to increase limit.',
    confidence: 81,
    status: 'policy-check',
    priority: 'high',
    timestamp: '2024-12-15T09:15:00Z',
    timeAgo: '1 hour ago',
    policyStatus: 'allowed',
    retryAttempts: 0,
    maxRetries: 2
  },
  {
    id: 'RC-2024-005',
    amount: 28900,
    currency: 'INR',
    customer: 'Digital Marketing Co',
    customerEmail: 'pay@digitalmarketing.io',
    failureReason: 'Do not honor',
    failureCode: 'generic_decline',
    aiDiagnosis: 'Generic decline from issuing bank. No specific reason provided. Customer payment history is mixed.',
    aiRecommendation: 'Medium recovery probability. Contact customer for alternative payment method.',
    confidence: 58,
    status: 'needs-review',
    priority: 'medium',
    timestamp: '2024-12-15T08:52:00Z',
    timeAgo: '1.5 hours ago',
    policyStatus: 'review-required',
    retryAttempts: 1,
    maxRetries: 3
  },
  {
    id: 'RC-2024-006',
    amount: 67500,
    currency: 'INR',
    customer: 'Cloud Systems International',
    customerEmail: 'billing@cloudsys.com',
    failureReason: 'Suspected fraud',
    failureCode: 'fraudulent',
    aiDiagnosis: 'Unusual transaction pattern detected by fraud system. Location mismatch: payment from new IP address.',
    aiRecommendation: 'Policy blocks automatic retry. Manual verification required before proceeding.',
    confidence: 92,
    status: 'blocked',
    priority: 'high',
    timestamp: '2024-12-15T08:30:00Z',
    timeAgo: '2 hours ago',
    policyStatus: 'blocked',
    retryAttempts: 0,
    maxRetries: 0
  },
  {
    id: 'RC-2024-007',
    amount: 5200,
    currency: 'INR',
    customer: 'Startup Hub',
    customerEmail: 'hello@startuphub.in',
    failureReason: 'Network error',
    failureCode: 'processing_error',
    aiDiagnosis: 'Gateway timeout during transaction. No actual payment attempt was made. Retry is safe.',
    aiRecommendation: 'High confidence retry. Network issues resolved.',
    confidence: 94,
    status: 'recovered',
    priority: 'low',
    timestamp: '2024-12-15T08:10:00Z',
    timeAgo: '2 hours ago',
    policyStatus: 'allowed',
    retryAttempts: 1,
    maxRetries: 3
  }
]

export function RecoveryWorkspace() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expandedCase, setExpandedCase] = useState<string | null>(null)

  const filteredCases = mockCases.filter(case_ => {
    const matchesSearch = case_.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         case_.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || case_.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: mockCases.length,
    recovering: mockCases.filter(c => c.status === 'recovering').length,
    needsReview: mockCases.filter(c => c.status === 'needs-review').length,
    recovered: mockCases.filter(c => c.status === 'recovered').length,
    totalAtRisk: mockCases.filter(c => c.status !== 'recovered').reduce((sum, c) => sum + c.amount, 0)
  }

  return (
    <div className="min-h-screen bg-atmospheric p-6 md:p-8 lg:p-12">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* Header */}
        <div className="animate-slide-up">
          <h1 className="text-h1 mb-2">Recovery Queue</h1>
          <p className="text-body text-text-secondary">Payments that need another chance</p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="card-glass hover-lift">
            <div className="text-label text-text-tertiary mb-2">TOTAL AT RISK</div>
            <div className="text-metric text-gradient-emerald">₹{stats.totalAtRisk.toLocaleString()}</div>
          </div>
          <div className="card-glass hover-lift">
            <div className="text-label text-text-tertiary mb-2">RECOVERING</div>
            <div className="text-metric text-text-primary">{stats.recovering}</div>
          </div>
          <div className="card-glass hover-lift">
            <div className="text-label text-text-tertiary mb-2">NEEDS REVIEW</div>
            <div className="text-metric text-warning">{stats.needsReview}</div>
          </div>
          <div className="card-glass hover-lift">
            <div className="text-label text-text-tertiary mb-2">RECOVERED</div>
            <div className="text-metric text-emerald-400">{stats.recovered}</div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary pointer-events-none" />
            <input
              type="text"
              placeholder="Search by customer, case ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 glass rounded-xl text-body text-text-primary placeholder:text-text-quaternary focus:glass-strong focus:glow-emerald-soft transition-all outline-none"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-12 pl-12 pr-10 glass rounded-xl text-body text-text-primary focus:glass-strong focus:glow-emerald-soft transition-all outline-none appearance-none cursor-pointer min-w-[200px]"
            >
              <option value="all">All statuses</option>
              <option value="recovering">Recovering</option>
              <option value="diagnosed">Diagnosed</option>
              <option value="needs-review">Needs Review</option>
              <option value="recovered">Recovered</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>

        {/* Recovery Cases — Glass Cards */}
        <div className="space-y-4">
          {filteredCases.map((case_, idx) => {
            const isExpanded = expandedCase === case_.id
            
            return (
              <div
                key={case_.id}
                className="panel-glass hover-lift animate-slide-up"
                style={{ animationDelay: `${300 + idx * 50}ms` }}
              >
                {/* Main Card Content */}
                <div className="space-y-4">
                  
                  {/* Header Row */}
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-6">
                    
                    {/* Left: Case Info */}
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-center flex-wrap gap-3">
                        <span className="text-mono text-sm text-text-tertiary">{case_.id}</span>
                        <span className="text-body-sm text-text-quaternary">·</span>
                        <span className="text-body-sm text-text-tertiary">{case_.timeAgo}</span>
                        <StatusBadge status={case_.status} />
                        <PolicyBadge status={case_.policyStatus} />
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-metric-sm text-text-primary">₹{case_.amount.toLocaleString()}</div>
                        <PriorityIndicator priority={case_.priority} />
                      </div>

                      <div>
                        <div className="text-body font-medium text-text-primary">{case_.customer}</div>
                        <div className="text-body-sm text-text-secondary">{case_.customerEmail}</div>
                      </div>
                    </div>

                    {/* Right: Confidence Score */}
                    <div className="flex flex-row lg:flex-col items-center gap-4">
                      <div className="text-center">
                        <div className="text-label text-text-tertiary mb-2">AI CONFIDENCE</div>
                        <div className="glass-emerald h-20 w-20 rounded-2xl flex items-center justify-center glow-emerald-soft">
                          <div className="text-center">
                            <div className="text-h3 text-emerald-400">{case_.confidence}%</div>
                          </div>
                        </div>
                      </div>
                      {case_.estimatedRecoveryTime && (
                        <div className="text-center lg:mt-2">
                          <div className="text-label text-text-tertiary mb-1">EST. TIME</div>
                          <div className="text-body-sm text-text-secondary">{case_.estimatedRecoveryTime}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Failure Info */}
                  <div className="glass-subtle p-4 rounded-lg space-y-3">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-body-sm font-medium text-text-primary mb-1">{case_.failureReason}</div>
                        <div className="text-mono text-xs text-text-tertiary">{case_.failureCode}</div>
                      </div>
                    </div>
                  </div>

                  {/* AI Diagnosis — Always Visible */}
                  <div className="glass-emerald p-4 rounded-lg space-y-3">
                    <div className="flex items-start gap-3">
                      <Brain className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-label text-emerald-400 mb-2">REVIVE DIAGNOSIS</div>
                        <p className="text-body-sm text-text-secondary">{case_.aiDiagnosis}</p>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Details */}
                  {isExpanded && (
                    <div className="space-y-4 pt-4 border-t border-glass-border animate-slide-up">
                      
                      {/* AI Recommendation */}
                      <div className="glass-subtle p-4 rounded-lg">
                        <div className="text-label text-text-tertiary mb-2">AI RECOMMENDATION</div>
                        <p className="text-body-sm text-text-secondary">{case_.aiRecommendation}</p>
                      </div>

                      {/* Retry Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="glass-subtle p-4 rounded-lg">
                          <div className="text-label text-text-tertiary mb-2">RETRY ATTEMPTS</div>
                          <div className="text-body text-text-primary">
                            {case_.retryAttempts} of {case_.maxRetries} attempts
                          </div>
                        </div>
                        <div className="glass-subtle p-4 rounded-lg">
                          <div className="text-label text-text-tertiary mb-2">POLICY STATUS</div>
                          <div className="text-body text-text-primary capitalize">
                            {case_.policyStatus.replace('-', ' ')}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3 pt-2">
                        <Link
                          to={`/app/recovery/${case_.id}`}
                          className="glass-emerald px-6 py-3 rounded-lg text-body-sm font-semibold hover-lift glow-emerald-soft inline-flex items-center gap-2"
                        >
                          View full timeline
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                        {case_.status === 'needs-review' && (
                          <button className="glass px-6 py-3 rounded-lg text-body-sm font-semibold hover-glass-intense">
                            Take action
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Expand/Collapse Button */}
                  <button
                    onClick={() => setExpandedCase(isExpanded ? null : case_.id)}
                    className="w-full glass-subtle hover:glass px-4 py-3 rounded-lg text-body-sm font-medium text-text-secondary hover:text-text-primary transition-all flex items-center justify-center gap-2"
                  >
                    {isExpanded ? 'Show less' : 'Show more details'}
                    <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>

                </div>
              </div>
            )
          })}
        </div>

        {filteredCases.length === 0 && (
          <div className="panel-glass-lg text-center py-16 animate-scale-in">
            <DollarSign className="h-16 w-16 text-text-tertiary mx-auto mb-4 opacity-50" />
            <h3 className="text-h3 mb-2">No cases found</h3>
            <p className="text-body text-text-secondary">
              {searchQuery ? 'Try adjusting your search or filters' : 'You\'re all caught up!'}
            </p>
          </div>
        )}

      </div>
    </div>
  )
}

// Status Badge Component
function StatusBadge({ status }: { status: RecoveryCase['status'] }) {
  const config = {
    detecting: { label: 'Detecting', color: 'text-info', bgColor: 'bg-info/10' },
    diagnosed: { label: 'Diagnosed', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
    'policy-check': { label: 'Policy Check', color: 'text-warning', bgColor: 'bg-warning/10' },
    recovering: { label: 'Recovering', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
    recovered: { label: 'Recovered', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
    'needs-review': { label: 'Needs Review', color: 'text-warning', bgColor: 'bg-warning/10' },
    blocked: { label: 'Blocked', color: 'text-error', bgColor: 'bg-error/10' }
  }

  const { label, color, bgColor } = config[status]

  return (
    <span className={`${bgColor} ${color} px-3 py-1 rounded-full text-xs font-semibold`}>
      {label}
    </span>
  )
}

// Policy Badge Component
function PolicyBadge({ status }: { status: RecoveryCase['policyStatus'] }) {
  const config = {
    allowed: { label: '✓ Allowed', color: 'text-emerald-400' },
    'review-required': { label: '⚠ Review Required', color: 'text-warning' },
    blocked: { label: '✕ Blocked', color: 'text-error' }
  }

  const { label, color } = config[status]

  return (
    <span className={`glass-subtle px-3 py-1 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  )
}

// Priority Indicator Component
function PriorityIndicator({ priority }: { priority: RecoveryCase['priority'] }) {
  const config = {
    high: { label: 'High Priority', color: 'text-error', icon: '⬆' },
    medium: { label: 'Medium', color: 'text-warning', icon: '→' },
    low: { label: 'Low', color: 'text-info', icon: '⬇' }
  }

  const { label, color, icon } = config[priority]

  return (
    <span className={`text-xs font-medium ${color} flex items-center gap-1`}>
      <span>{icon}</span>
      {label}
    </span>
  )
}
