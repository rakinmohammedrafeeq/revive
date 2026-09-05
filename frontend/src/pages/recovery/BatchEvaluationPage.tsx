import { useState } from 'react'
import { 
  PlayCircle, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  FileCheck, 
  AlertCircle, 
  Loader2, 
  Download, 
  Brain, 
  Sparkles,
  RefreshCw
} from 'lucide-react'
import { recoveryAdminApi, type BatchValidationResult } from '@/api/recoveryApi'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'

/**
 * BATCH EVALUATION — CHECKPOINT 4
 * 
 * Runs the complete autonomous revenue recovery pipeline across all eligible
 * failed payments: ML Predict → AI Diagnose → Policy Guard → Execute (Razorpay TEST MODE).
 * Produces deterministic, verifiable evidence.
 */
export function BatchEvaluationPage() {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<BatchValidationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRunBatch = async () => {
    try {
      setRunning(true)
      setError(null)
      const data = await recoveryAdminApi.runBatchEvaluation()
      setResult(data)
    } catch (err: any) {
      console.error('Batch evaluation failed:', err)
      setError(err?.response?.data?.message || 'Batch evaluation failed to complete. Please try again.')
    } finally {
      setRunning(false)
    }
  }

  const handleDownloadEvidence = () => {
    if (!result) return
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `revive-batch-validation-${new Date().toISOString().slice(0, 19)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header & Trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Razorpay TEST MODE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Batch Evaluation
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Execute the full intelligence pipeline across all pending failed payments. Demonstrates autonomous 
            ML probability scoring, Groq LLM failure diagnosis, deterministic policy guardrails, and Razorpay test-mode execution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {result && (
            <Button
              variant="outline"
              onClick={handleDownloadEvidence}
              className="gap-2 border-border hover:bg-accent text-xs sm:text-sm"
            >
              <Download className="w-4 h-4" />
              Export Evidence JSON
            </Button>
          )}

          <Button
            onClick={handleRunBatch}
            disabled={running}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 shadow-lg shadow-primary/20"
          >
            {running ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Evaluating Batch...
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4" />
                Run Batch Evaluation
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 flex items-start gap-4 text-red-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-sm">Batch Run Interrupted</h3>
            <p className="text-xs text-red-300/80 mt-1">{error}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRunBatch}
            className="text-xs text-red-200 hover:bg-red-500/20"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Empty State before first run */}
      {!result && !running && (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center max-w-3xl mx-auto space-y-4 bg-card/50">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 mx-auto flex items-center justify-center">
            <Layers className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Ready for Batch Evaluation</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Clicking <strong>Run Batch Evaluation</strong> will iterate through all eligible FAILED payments in the workspace,
            evaluating ML recovery probability, calling AI diagnosis, testing guardrails, and capturing Razorpay test-mode results.
          </p>
          <div className="pt-2">
            <Button onClick={handleRunBatch} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              <PlayCircle className="w-4 h-4" />
              Start Batch Validation
            </Button>
          </div>
        </div>
      )}

      {/* Running State */}
      {running && (
        <div className="rounded-3xl border border-primary/20 bg-primary/[0.03] p-12 text-center max-w-xl mx-auto space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <h3 className="text-lg font-bold text-foreground">Running Recovery Pipeline</h3>
          <p className="text-xs text-muted-foreground">
            Processing failed payments: ML recovery prediction → Groq AI root-cause diagnosis → Guardrail verification → Razorpay test execution...
          </p>
        </div>
      )}

      {/* Results Dashboard */}
      {result && !running && (
        <div className="space-y-8 animate-slide-up">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Recovered Revenue */}
            <div className="rounded-2xl glass-card p-5 border border-primary/25 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Revenue Recovered</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gradient-emerald">
                {formatCurrency(result.recoveredRevenue || 0, 'INR')}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                From {result.successfulRecoveries || 0} recovered cases
              </p>
            </div>

            {/* Recovery Rate */}
            <div className="rounded-2xl glass-card p-5 border border-border">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Recovery Rate</span>
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                {(result.recoveryRate || 0).toFixed(1)}%
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {result.successfulRecoveries || 0} of {result.executedCount || 0} executed
              </p>
            </div>

            {/* Cases Evaluated */}
            <div className="rounded-2xl glass-card p-5 border border-border">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Cases Processed</span>
                <Layers className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                {result.processedCount || 0}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Eligible pool: {result.eligibleRecoveryCount || 0} failed payments
              </p>
            </div>

            {/* Guardrail Blocks */}
            <div className="rounded-2xl glass-card p-5 border border-border">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Policy Guard Blocks</span>
                <ShieldAlert className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                {result.blockedCases || 0}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {result.policyBlockedCount || 0} policy limits, {result.duplicateBlockedCount || 0} duplicates
              </p>
            </div>
          </div>

          {/* Breakdown Pills & Pipeline Meta */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-card border border-border p-4 flex items-center gap-3">
              <Brain className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="text-xs">
                <span className="text-muted-foreground block">Model Employed:</span>
                <span className="text-foreground font-medium font-mono text-[11px] truncate block">
                  {result.modelUsed || 'Random Forest v1.0'}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-card border border-border p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <div className="text-xs">
                <span className="text-muted-foreground block">Avg Recovery Time:</span>
                <span className="text-foreground font-medium">
                  {result.averageRecoveryTimeMinutes ? `${result.averageRecoveryTimeMinutes.toFixed(1)} minutes` : '< 1 minute'}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-card border border-border p-4 flex items-center gap-3">
              <FileCheck className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <div className="text-xs">
                <span className="text-muted-foreground block">Audit Entries Generated:</span>
                <span className="text-foreground font-medium">
                  +{result.auditEventsCreated || 0} traceable events logged
                </span>
              </div>
            </div>
          </div>

          {/* Sample Results Table */}
          {result.sampleResults && result.sampleResults.length > 0 && (
            <div className="rounded-2xl glass-card border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground text-base">Sample Pipeline Executions</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Detailed evidence showing ML probability, AI diagnosis, and execution outcomes
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  Showing {result.sampleResults.length} cases
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Payment Identifier</th>
                      <th className="px-6 py-3 font-semibold">Amount</th>
                      <th className="px-6 py-3 font-semibold">ML Score</th>
                      <th className="px-6 py-3 font-semibold">AI Diagnosis</th>
                      <th className="px-6 py-3 font-semibold">Decision</th>
                      <th className="px-6 py-3 font-semibold">Execution Status</th>
                      <th className="px-6 py-3 font-semibold text-right">Recovered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {result.sampleResults.map((record, idx) => {
                      const prob = typeof record.recoveryProbability === 'number' 
                        ? (record.recoveryProbability * 100).toFixed(0) + '%'
                        : '—'
                      const isSuccess = record.executionStatus === 'SUCCESS'
                      const isBlocked = record.decision === 'BLOCKED'

                      return (
                        <tr key={idx} className="hover:bg-accent/40 transition-colors">
                          <td className="px-6 py-3.5 font-mono font-medium text-foreground">
                            {String(record.paymentIdentifier || '')}
                          </td>
                          <td className="px-6 py-3.5 font-semibold text-foreground">
                            {formatCurrency(Number(record.amount || 0), 'INR')}
                          </td>
                          <td className="px-6 py-3.5">
                            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                              {prob}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 max-w-xs truncate text-muted-foreground">
                            {String(record.aiDiagnosis || record.failureReason || 'Temporary issue')}
                          </td>
                          <td className="px-6 py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              record.decision === 'EXECUTE'
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                                : record.decision === 'BLOCKED'
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                                : 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/20'
                            }`}>
                              {String(record.decision || 'EXECUTE')}
                            </span>
                          </td>
                          <td className="px-6 py-3.5">
                            <span className={`flex items-center gap-1.5 font-semibold ${
                              isSuccess
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : isBlocked
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {isSuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : isBlocked ? <ShieldAlert className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                              {String(record.executionStatus || record.decision || 'COMPLETED')}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            {record.recoveredAmount ? formatCurrency(Number(record.recoveredAmount), 'INR') : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Exceptions / Blocked Cases Table */}
          {result.exceptionCases && result.exceptionCases.length > 0 && (
            <div className="rounded-2xl glass-card border border-amber-500/30 overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-amber-500/10">
                <h3 className="font-bold text-amber-700 dark:text-amber-400 text-sm flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  Policy Guardrail Blocks & Exceptions ({result.exceptionCases.length})
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Payments where recovery actions were safely blocked by safety rules (retry limits, cooldowns, terminal state)
                </p>
              </div>

              <div className="divide-y divide-border">
                {result.exceptionCases.map((exc, idx) => (
                  <div key={idx} className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="font-mono text-foreground font-medium">
                      {String(exc.paymentIdentifier || `Payment #${idx + 1}`)}
                    </div>
                    <div className="text-amber-700 dark:text-amber-300 font-semibold">
                      {String(exc.blockReason || exc.escalateReason || exc.error || 'Blocked by policy guardrails')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
