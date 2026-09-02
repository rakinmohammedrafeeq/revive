import { AlertCircle, TrendingUp, TrendingDown, DollarSign, CheckCircle2, Clock, Shield, Brain, Activity } from 'lucide-react'
import { Link } from 'react-router-dom'

/**
 * REVIVE REVENUE RECOVERY COMMAND CENTER
 * 
 * Completely new dashboard design - NOT the old 4-card grid layout.
 * Features asymmetric layout with massive hero metric and floating glass panels.
 * 
 * NOTE: Currently using development data structure.
 * Production will integrate with backend recovery APIs.
 */

// Development data structure - will be replaced with API types
interface RecoveryMetrics {
  revenueAtRisk: number
  revenueRecovered: number
  recoveryRate: number
  activeCases: number
  pendingReview: number
  avgRecoveryTime: string
}

interface RecoveryCase {
  id: string
  amount: number
  customer: string
  failureReason: string
  aiDiagnosis: string
  confidence: number
  status: 'detecting' | 'diagnosed' | 'recovering' | 'recovered' | 'needs-review'
  timestamp: string
}

// Mock data for UI demonstration
const mockMetrics: RecoveryMetrics = {
  revenueAtRisk: 247850,
  revenueRecovered: 183200,
  recoveryRate: 74.2,
  activeCases: 12,
  pendingReview: 3,
  avgRecoveryTime: '~18 min'
}

const mockRecentCases: RecoveryCase[] = [
  {
    id: 'RC-001',
    amount: 18500,
    customer: 'Acme Corp',
    failureReason: 'Temporary issuer decline',
    aiDiagnosis: 'High recovery probability. Customer has strong payment history.',
    confidence: 87,
    status: 'recovering',
    timestamp: '8 minutes ago'
  },
  {
    id: 'RC-002',
    amount: 42300,
    customer: 'TechStart Inc',
    failureReason: 'Insufficient funds',
    aiDiagnosis: 'Retry recommended after 24 hours based on customer cash flow patterns.',
    confidence: 72,
    status: 'diagnosed',
    timestamp: '23 minutes ago'
  },
  {
    id: 'RC-003',
    amount: 9750,
    customer: 'Local Services LLC',
    failureReason: 'Card expired',
    aiDiagnosis: 'Customer notification sent. Awaiting updated payment method.',
    confidence: 65,
    status: 'needs-review',
    timestamp: '1 hour ago'
  }
]

export function RevenueDashboard() {
  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="min-h-screen bg-atmospheric p-6 md:p-8 lg:p-12">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* Conversational Greeting */}
        <div className="animate-slide-up">
          <h1 className="text-h2 mb-2">{greeting}.</h1>
          <p className="text-body text-text-secondary">Here's your recovery pulse.</p>
        </div>

        {/* Main Dashboard Grid — Asymmetric Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: Hero Metric — Revenue at Risk */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Massive At-Risk Card */}
            <div className="panel-glass-lg glow-emerald-soft hover-lift animate-slide-up" style={{ animationDelay: '100ms' }}>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="glass-emerald h-12 w-12 rounded-xl flex items-center justify-center glow-emerald-soft">
                    <AlertCircle className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-label text-text-tertiary">WHAT'S SLIPPING</div>
                    <p className="text-body-sm text-text-secondary">Payments that need attention</p>
                  </div>
                </div>
                
                <div className="py-6">
                  <div className="text-metric-hero text-gradient-emerald">
                    ₹{mockMetrics.revenueAtRisk.toLocaleString()}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-body-sm text-text-tertiary">
                    <Activity className="h-4 w-4" />
                    <span>{mockMetrics.activeCases} active cases being processed</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-glass-border flex items-center justify-between">
                  <span className="text-body-sm text-text-secondary">Avg recovery time</span>
                  <span className="text-body font-semibold text-text-primary">{mockMetrics.avgRecoveryTime}</span>
                </div>
              </div>
            </div>

            {/* Recovery Rate Card */}
            <div className="panel-glass hover-lift animate-slide-up" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-label text-text-tertiary mb-1">HOW MUCH WE'RE WINNING BACK</div>
                  <div className="text-metric text-gradient-emerald">{mockMetrics.recoveryRate}%</div>
                  <p className="text-body-sm text-text-secondary mt-2">Success rate this month</p>
                </div>
                <div className="glass-emerald h-16 w-16 rounded-xl flex items-center justify-center glow-emerald-soft">
                  <TrendingUp className="h-8 w-8 text-emerald-400" />
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT: Recovery Stats & Activity */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Two-column stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Recovered Revenue */}
              <div className="card-glass hover-lift animate-slide-up" style={{ animationDelay: '300ms' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="glass-emerald h-10 w-10 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="text-label text-text-tertiary">WHAT WE BROUGHT BACK</div>
                </div>
                <div className="text-metric-lg text-text-primary">₹{mockMetrics.revenueRecovered.toLocaleString()}</div>
                <p className="text-body-sm text-text-secondary mt-2">Revenue back where it belongs</p>
              </div>

              {/* Pending Review */}
              <div className="card-glass hover-lift animate-slide-up" style={{ animationDelay: '400ms' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="glass-emerald h-10 w-10 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="text-label text-text-tertiary">NEEDS ATTENTION</div>
                </div>
                <div className="text-metric-lg text-text-primary">{mockMetrics.pendingReview}</div>
                <p className="text-body-sm text-text-secondary mt-2">Waiting for you</p>
              </div>

            </div>

            {/* What Revive is doing */}
            <div className="panel-glass hover-lift animate-slide-up" style={{ animationDelay: '500ms' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="glass-emerald h-10 w-10 rounded-lg flex items-center justify-center glow-emerald-soft">
                  <Brain className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-h4">What Revive is doing</h3>
                  <p className="text-body-sm text-text-secondary">AI recovery in progress</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Activity item 1 */}
                <div className="flex items-start gap-4 p-4 glass-subtle rounded-lg hover-glass-intense transition-all">
                  <div className="status-dot status-dot-success mt-1.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-body-sm font-medium text-text-primary">Diagnosing payment failures</span>
                      <span className="text-mono text-xs text-text-tertiary">Live</span>
                    </div>
                    <p className="text-body-sm text-text-secondary">AI analyzing {mockMetrics.activeCases} active cases</p>
                  </div>
                </div>

                {/* Activity item 2 */}
                <div className="flex items-start gap-4 p-4 glass-subtle rounded-lg hover-glass-intense transition-all">
                  <div className="status-dot status-dot-info mt-1.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-body-sm font-medium text-text-primary">Policy verification</span>
                      <span className="text-mono text-xs text-text-tertiary">Active</span>
                    </div>
                    <p className="text-body-sm text-text-secondary">Checking retry limits and guardrails</p>
                  </div>
                </div>

                {/* Activity item 3 */}
                <div className="flex items-start gap-4 p-4 glass-subtle rounded-lg hover-glass-intense transition-all">
                  <div className="status-dot status-dot-warning mt-1.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-body-sm font-medium text-text-primary">Awaiting your review</span>
                      <span className="text-mono text-xs text-text-tertiary">{mockMetrics.pendingReview} cases</span>
                    </div>
                    <p className="text-body-sm text-text-secondary">These need manual approval</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Recent Recovery Cases */}
        <div className="animate-slide-up" style={{ animationDelay: '600ms' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-h3 mb-1">Cases in motion</h2>
              <p className="text-body-sm text-text-secondary">What Revive is working on</p>
            </div>
            <Link
              to="/app/recovery"
              className="glass-emerald px-4 py-2 rounded-lg text-body-sm font-semibold hover-lift glow-emerald-soft transition-all"
            >
              See all →
            </Link>
          </div>

          <div className="space-y-4">
            {mockRecentCases.map((case_, idx) => (
              <Link
                key={case_.id}
                to={`/app/recovery/${case_.id}`}
                className="block"
              >
                <div 
                  className="panel-glass card-glass-interactive"
                  style={{ animationDelay: `${700 + idx * 100}ms` }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    
                    {/* Left: Case Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-mono text-sm text-text-tertiary">{case_.id}</span>
                        <span className="text-body-sm text-text-quaternary">·</span>
                        <span className="text-body-sm text-text-tertiary">{case_.timestamp}</span>
                        <StatusBadge status={case_.status} />
                      </div>
                      
                      <div className="mb-3">
                        <div className="text-h4 mb-1">₹{case_.amount.toLocaleString()}</div>
                        <div className="text-body-sm text-text-secondary">{case_.customer}</div>
                      </div>

                      <div className="glass-subtle p-3 rounded-lg space-y-2">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-text-tertiary mt-0.5 flex-shrink-0" />
                          <span className="text-body-sm text-text-secondary">{case_.failureReason}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Brain className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                          <span className="text-body-sm text-text-secondary">{case_.aiDiagnosis}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Confidence & Action */}
                    <div className="flex flex-row lg:flex-col items-center gap-4 lg:gap-3">
                      <div className="text-center">
                        <div className="text-label text-text-tertiary mb-2">CONFIDENCE</div>
                        <div className="glass-emerald h-16 w-16 rounded-xl flex items-center justify-center glow-emerald-soft">
                          <span className="text-h4 text-emerald-400">{case_.confidence}%</span>
                        </div>
                      </div>
                      <div className="text-body-sm text-emerald-400 font-medium">
                        Take a look →
                      </div>
                    </div>

                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '1000ms' }}>
          
          <Link to="/app/recovery" className="card-glass hover-lift group">
            <div className="flex items-center gap-4">
              <div className="glass-emerald h-12 w-12 rounded-xl flex items-center justify-center glow-emerald-soft">
                <DollarSign className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <div className="text-h4 mb-1">Let's recover these</div>
                <p className="text-body-sm text-text-secondary">See all active cases</p>
              </div>
            </div>
          </Link>

          <Link to="/app/policies" className="card-glass hover-lift group">
            <div className="flex items-center gap-4">
              <div className="glass-emerald h-12 w-12 rounded-xl flex items-center justify-center glow-emerald-soft">
                <Shield className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <div className="text-h4 mb-1">Set the boundaries</div>
                <p className="text-body-sm text-text-secondary">Manage guardrails</p>
              </div>
            </div>
          </Link>

          <Link to="/app/insights" className="card-glass hover-lift group">
            <div className="flex items-center gap-4">
              <div className="glass-emerald h-12 w-12 rounded-xl flex items-center justify-center glow-emerald-soft">
                <TrendingUp className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <div className="text-h4 mb-1">See the bigger picture</div>
                <p className="text-body-sm text-text-secondary">Revenue analytics</p>
              </div>
            </div>
          </Link>

        </div>

      </div>
    </div>
  )
}

// Status Badge Component
function StatusBadge({ status }: { status: RecoveryCase['status'] }) {
  const config = {
    detecting: { label: 'Detecting', color: 'text-info' },
    diagnosed: { label: "Revive's take", color: 'text-emerald-400' },
    recovering: { label: 'In motion', color: 'text-emerald-400' },
    recovered: { label: 'Recovered', color: 'text-emerald-400' },
    'needs-review': { label: 'Needs you', color: 'text-warning' }
  }

  const { label, color } = config[status]

  return (
    <span className={`glass-subtle px-2 py-1 rounded text-xs font-medium ${color}`}>
      {label}
    </span>
  )
}
