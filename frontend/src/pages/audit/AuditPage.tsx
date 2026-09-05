import { useState, useEffect } from 'react'
import { 
  ScrollText, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Shield, 
  TrendingUp, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  Brain,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react'
import { auditTrailApi, type AuditTrailEntry } from '@/api/recoveryApi'
import { Button } from '@/components/ui/button'

/**
 * RECOVERY AUDIT TRAIL
 * 
 * Traceable, compliant activity log of every AI decision,
 * ML prediction, policy check, and Razorpay action executed across the portfolio.
 */
export function AuditPage() {
  const [entries, setEntries] = useState<AuditTrailEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [expandedRow, setExpandedRow] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadAuditData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await auditTrailApi.getAll()
      setEntries(data)
    } catch (err) {
      console.error('Failed to load audit trail:', err)
      setError('Unable to load audit trail from server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAuditData()
  }, [])

  const filteredEntries = entries.filter((item) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = 
      (item.paymentIdentifier && item.paymentIdentifier.toLowerCase().includes(q)) ||
      (item.actionType && item.actionType.toLowerCase().includes(q)) ||
      (item.details && item.details.toLowerCase().includes(q))

    const matchesFilter = actionFilter === 'all' || item.actionType.includes(actionFilter)
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading audit log entries...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
              Audit & Compliance
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {entries.length} Total Events Logged
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Recovery Decision Audit Trail
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Immutable, explainable record of every money-related action taken by Revive: ML probability predictions,
            AI root-cause diagnoses, deterministic guardrail evaluations, and gateway execution results.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={loadAuditData}
          className="gap-2 border-border text-foreground hover:bg-muted text-xs self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Log
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by payment identifier, action type, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          {[
            { key: 'all', label: 'All Events' },
            { key: 'ML_', label: 'ML Predictions' },
            { key: 'AI_', label: 'AI Diagnoses' },
            { key: 'POLICY_', label: 'Policy Checks' },
            { key: 'RECOVERY_', label: 'Executions' },
            { key: 'BATCH_', label: 'Batch Runs' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setActionFilter(f.key)}
              className={`px-3 py-2 rounded-xl font-semibold whitespace-nowrap transition-colors border ${
                actionFilter === f.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Events Table */}
      <div className="rounded-2xl glass-card border border-border overflow-hidden bg-card">
        {filteredEntries.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            <ScrollText className="w-10 h-10 mx-auto text-muted-foreground mb-2 opacity-60" />
            <p className="font-bold text-foreground text-sm">No Audit Events Found</p>
            <p className="mt-1">
              {searchQuery || actionFilter !== 'all'
                ? 'Try adjusting your search query or filter.'
                : 'No pipeline events have been recorded in this workspace yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/30 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-3 font-semibold">Timestamp</th>
                  <th className="px-6 py-3 font-semibold">Action Type</th>
                  <th className="px-6 py-3 font-semibold">Payment Identifier</th>
                  <th className="px-6 py-3 font-semibold">Outcome</th>
                  <th className="px-6 py-3 font-semibold">Details</th>
                  <th className="px-4 py-3 font-semibold text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredEntries.map((entry) => {
                  const isExpanded = expandedRow === entry.id
                  const isSuccess = entry.outcome === 'SUCCESS' || entry.outcome === 'RECOVERED' || entry.outcome === 'ALLOWED'
                  const isBlocked = entry.outcome === 'BLOCKED' || entry.actionType.includes('BLOCKED')

                  return (
                    <div key={entry.id} className="contents">
                      <tr
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => setExpandedRow(isExpanded ? null : entry.id)}
                      >
                        <td className="px-6 py-3.5 text-muted-foreground whitespace-nowrap font-medium">
                          {new Date(entry.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="font-semibold text-foreground flex items-center gap-1.5">
                            <EventIcon type={entry.actionType} />
                            {formatActionType(entry.actionType)}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 font-mono text-foreground font-semibold">
                          {entry.paymentIdentifier || 'Workspace System'}
                        </td>
                        <td className="px-6 py-3.5">
                          {entry.outcome ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isSuccess
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                : isBlocked
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                                : 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
                            }`}>
                              {entry.outcome}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 max-w-sm truncate text-muted-foreground font-medium">
                          {entry.details}
                        </td>
                        <td className="px-4 py-3.5 text-right text-muted-foreground">
                          {isExpanded ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />}
                        </td>
                      </tr>

                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <tr className="bg-muted/10">
                          <td colSpan={6} className="px-6 py-4 border-b border-border">
                            <div className="rounded-xl bg-muted/30 border border-border p-4 space-y-2 text-xs">
                              <div className="flex justify-between text-muted-foreground text-[11px]">
                                <span>Entity: <strong className="text-foreground">{entry.entityType || 'Event'} #{entry.entityId || entry.id}</strong></span>
                                <span>Timestamp: <strong className="text-foreground">{entry.timestamp}</strong></span>
                              </div>
                              <div>
                                <span className="text-muted-foreground font-medium block mb-1">Payload / Details:</span>
                                <pre className="p-3 rounded-lg bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed border border-border/40">
                                  {formatDetails(entry.details)}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </div>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function EventIcon({ type }: { type: string }) {
  if (type.includes('ML_')) return <Brain className="w-3.5 h-3.5 text-primary" />
  if (type.includes('AI_')) return <Sparkles className="w-3.5 h-3.5 text-blue-400" />
  if (type.includes('POLICY_')) return <Shield className="w-3.5 h-3.5 text-amber-400" />
  if (type.includes('BATCH_')) return <Layers className="w-3.5 h-3.5 text-purple-400" />
  if (type.includes('SUCCESS') || type.includes('RECOVERED')) return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
  return <Clock className="w-3.5 h-3.5 text-muted-foreground" />
}

function formatActionType(type: string): string {
  return type.replace(/_/g, ' ')
}

function formatDetails(raw: string): string {
  try {
    const parsed = JSON.parse(raw)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return raw
  }
}
