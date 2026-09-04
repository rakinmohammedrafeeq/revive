import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, TrendingUp, AlertCircle, CheckCircle2, Clock, Brain, ChevronRight, DollarSign, RefreshCw, Loader2 } from 'lucide-react'
import { recoveryCaseApi, recoveryMetricsApi, type FailedPayment, type RecoveryMetrics } from '@/api/recoveryApi'
import { formatCurrency } from '@/lib/utils'

/**
 * REVIVE RECOVERY WORKSPACE
 * 
 * Real-time recovery case management with AI diagnosis and policy enforcement.
 * Integrated with backend recovery APIs for live data.
 */

const STATUS_MAP: Record<string, { label: string; class: string; icon: React.ReactNode }> = {
  FAILED: { 
    label: 'Ready', 
    class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    icon: <AlertCircle className="w-4 h-4" />
  },
  PENDING_RETRY: { 
    label: 'Scheduled', 
    class: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: <Clock className="w-4 h-4" />
  },
  RETRY_IN_PROGRESS: { 
    label: 'In Progress', 
    class: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    icon: <RefreshCw className="w-4 h-4" />
  },
  UNDER_REVIEW: { 
    label: 'Needs Review', 
    class: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    icon: <Brain className="w-4 h-4" />
  },
  RECOVERED: { 
    label: 'Recovered', 
    class: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    icon: <CheckCircle2 className="w-4 h-4" />
  },
  ABANDONED: { 
    label: 'Abandoned', 
    class: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    icon: <AlertCircle className="w-4 h-4" />
  },
}

export function RecoveryWorkspace() {
  const [cases, setCases] = useState<FailedPayment[]>([])
  const [metrics, setMetrics] = useState<RecoveryMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expandedCase, setExpandedCase] = useState<number | null>(null)

  const loadData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true)
      else setLoading(true)
      
      const [casesData, metricsData] = await Promise.all([
        recoveryCaseApi.getAll(),
        recoveryMetricsApi.get()
      ])
      
      setCases(casesData)
      setMetrics(metricsData)
    } catch (error) {
      console.error('Failed to load recovery data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredCases = cases.filter(case_ => {
    const matchesSearch = 
      case_.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      case_.paymentIdentifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      case_.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || case_.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-atmospheric flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-purple-400" />
          <p className="text-gray-400">Loading recovery cases...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-atmospheric p-6 md:p-8 lg:p-12">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Recovery Workspace
            </h1>
            <p className="text-gray-400">
              AI-powered payment recovery with real-time insights
            </p>
          </div>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-300 flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Overview */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Total at Risk</span>
                <DollarSign className="w-5 h-5 text-red-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(metrics.totalRevenueAtRisk, 'INR')}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {metrics.activeCases} active cases
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Recovered</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400">
                {formatCurrency(metrics.totalRecovered, 'INR')}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {metrics.recoveredCases} payments
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Recovery Rate</span>
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {metrics.recoveryRate.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {metrics.successfulRecoveries || 0} successful
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Needs Review</span>
                <Brain className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {metrics.pendingReviewCases}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Awaiting action
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by customer, payment ID, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                statusFilter === 'all'
                  ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('FAILED')}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                statusFilter === 'FAILED'
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
              }`}
            >
              Ready
            </button>
            <button
              onClick={() => setStatusFilter('UNDER_REVIEW')}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                statusFilter === 'UNDER_REVIEW'
                  ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
              }`}
            >
              Review
            </button>
            <button
              onClick={() => setStatusFilter('RECOVERED')}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                statusFilter === 'RECOVERED'
                  ? 'bg-teal-500/20 border-teal-500/30 text-teal-300'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
              }`}
            >
              Recovered
            </button>
          </div>
        </div>

        {/* Recovery Cases */}
        <div className="space-y-4">
          {filteredCases.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <AlertCircle className="w-16 h-16 mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No cases found</h3>
              <p className="text-gray-400">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'No failed payments to recover at this time'}
              </p>
            </div>
          ) : (
            filteredCases.map((case_) => {
              const statusInfo = STATUS_MAP[case_.status] || STATUS_MAP.FAILED
              const hoursAgo = Math.floor((Date.now() - new Date(case_.failedAt).getTime()) / 3_600_000)
              const timeAgo = hoursAgo === 0
                ? `${Math.max(1, Math.floor((Date.now() - new Date(case_.failedAt).getTime()) / 60_000))}min ago`
                : `${hoursAgo}h ago`

              return (
                <div key={case_.id} className="glass-card p-6 hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {case_.customerName || 'Unknown Customer'}
                        </h3>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${statusInfo.class}`}>
                          {statusInfo.icon}
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                        <span>{case_.paymentIdentifier}</span>
                        <span>•</span>
                        <span>{case_.customerEmail}</span>
                        <span>•</span>
                        <span>{timeAgo}</span>
                      </div>
                      <div className="text-sm text-gray-300 mb-2">
                        <span className="font-medium">Failure:</span> {case_.failureReason || case_.errorCode || 'Unknown error'}
                      </div>
                      {case_.retryCount > 0 && (
                        <div className="text-xs text-gray-500">
                          Retry attempts: {case_.retryCount}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white mb-1">
                        {formatCurrency(case_.amount, case_.currency)}
                      </div>
                      <Link
                        to={`/recovery/${case_.id}`}
                        className="inline-flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        View Details
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
