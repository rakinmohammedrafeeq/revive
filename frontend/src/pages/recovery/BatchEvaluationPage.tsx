import { useState, useEffect, useRef } from 'react'
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
  RefreshCw,
  History,
  ShieldCheck,
  Info,
  StopCircle
} from 'lucide-react'
import { toast } from 'sonner'
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
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [checkingRecent, setCheckingRecent] = useState(false)
  const [seedingData, setSeedingData] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    let interval: any = null
    if (running) {
      setElapsedSeconds(0)
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      setElapsedSeconds(0)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [running])

  // Cleanup: Cancel batch evaluation when user navigates away from the page
  useEffect(() => {
    return () => {
      // Component is unmounting (user navigated away)
      if (abortControllerRef.current && running) {
        console.log('User navigated away - cancelling batch evaluation')
        abortControllerRef.current.abort()
        toast.info('Batch evaluation cancelled (page navigation)')
      }
    }
  }, [running])

  const handleRunBatch = async () => {
    try {
      setRunning(true)
      setError(null)
      setCancelling(false)
      
      // Create new AbortController for this request
      abortControllerRef.current = new AbortController()
      
      const data = await recoveryAdminApi.runBatchEvaluation()
      setResult(data)
      abortControllerRef.current = null
    } catch (err: any) {
      console.error('Batch evaluation failed:', err)
      if (err.name === 'AbortError' || err.message?.includes('cancel')) {
        setError('Batch evaluation was cancelled.')
        toast.info('Batch evaluation cancelled by user')
      } else {
        setError(err?.response?.data?.message || err?.message || 'Batch evaluation failed to complete. Please try again.')
      }
      abortControllerRef.current = null
    } finally {
      setRunning(false)
      setCancelling(false)
    }
  }

  const handleCancelBatch = () => {
    if (abortControllerRef.current && running) {
      setCancelling(true)
      abortControllerRef.current.abort()
      toast.info('Cancelling batch evaluation...')
    }
  }

  const handleCheckRecent = async () => {
    try {
      setCheckingRecent(true)
      const history = await recoveryAdminApi.getBatchHistory()
      if (history && history.length > 0) {
        setResult(history[0])
        setError(null)
      } else {
        setError('No previous batch evaluation runs found. Please run a new batch.')
      }
    } catch (err: any) {
      setError('Could not retrieve recent batch history: ' + (err?.message || 'Network error'))
    } finally {
      setCheckingRecent(false)
    }
  }

  const handleSeedData = async () => {
    try {
      setSeedingData(true)
      setError(null)
      toast.loading('Generating synthetic test data...', { id: 'seed-data' })
      const response = await recoveryAdminApi.generateDemoData(60)
      // Show success toast notification
      toast.success(`✅ Successfully generated ${response.generated} test failed payments! You can now run batch evaluation.`, { id: 'seed-data' })
    } catch (err: any) {
      console.error('Failed to seed data:', err)
      toast.error(`Failed to generate test data: ${err?.response?.data?.message || err?.message || 'Unknown error'}`, { id: 'seed-data' })
      setError(err?.response?.data?.message || err?.message || 'Failed to generate test data. Please try again.')
    } finally {
      setSeedingData(false)
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
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              ~90-120s per batch (10 cases)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Batch Evaluation
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Execute the full intelligence pipeline across pending failed payments. Demonstrates autonomous 
            ML probability scoring, Groq & Gemini multi-model AI failure diagnosis, deterministic policy guardrails, and Razorpay test-mode execution.
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

          {running && (
            <Button
              variant="outline"
              onClick={handleCancelBatch}
              disabled={cancelling}
              className="gap-2 border-red-500/30 hover:bg-red-500/10 text-red-400 hover:text-red-300"
            >
              {cancelling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <StopCircle className="w-4 h-4" />
                  Cancel Batch
                </>
              )}
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
                Evaluating Batch ({elapsedSeconds}s)...
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

      {/* Error state with History Recovery */}
      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-red-300">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
            <div>
              <h3 className="font-semibold text-sm">Batch Run Notice</h3>
              <p className="text-xs text-red-300/80 mt-1">{error}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckRecent}
              disabled={checkingRecent}
              className="text-xs border-red-500/30 hover:bg-red-500/20 text-red-200"
            >
              {checkingRecent ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <History className="w-3.5 h-3.5 mr-1" />}
              Check Recent Result
            </Button>
            {error.toLowerCase().includes('no') && error.toLowerCase().includes('found') && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeedData}
                disabled={seedingData}
                className="text-xs border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-200"
              >
                {seedingData ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
                Seed Test Data
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRunBatch}
              className="text-xs text-red-200 hover:bg-red-500/20"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Empty State before first run */}
      {!result && !running && (
        <div className="space-y-4">
          {/* Info callout about seeding data */}
          <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5 flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-400 mb-1.5">Need Test Data First?</h4>
              <p className="text-xs text-blue-300/90 leading-relaxed mb-3">
                Batch evaluation requires failed payment records in your workspace. If you don't have any real failed payments yet, 
                click <strong className="text-blue-200">"Seed Test Data"</strong> below to generate 60 realistic synthetic failed payments. 
                This will populate your workspace with diverse payment scenarios (timeouts, insufficient funds, auth failures, etc.) 
                so you can see the full ML → AI → Policy → Recovery pipeline in action.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-blue-400/80">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Each seed generates ~60 cases • Takes ~2-3 seconds • Safe to run multiple times</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-dashed border-border p-8 sm:p-12 text-center max-w-3xl mx-auto space-y-5 bg-card/50">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 mx-auto flex items-center justify-center shadow-lg shadow-primary/5">
              <Layers className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
                <Clock className="w-3.5 h-3.5" />
                <span>Typical Run Time: ~90–120s (10 cases • ~10s/case)</span>
              </div>
              <h3 className="text-xl font-bold text-foreground">Ready for Batch Evaluation</h3>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                Executes autonomous pipeline: ML probability scoring → Groq & Gemini multi-model AI diagnosis → Deterministic guardrails → Razorpay test execution.
                Processes up to 10 eligible cases per execution for steady, reliable completion.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button onClick={handleRunBatch} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6">
                <PlayCircle className="w-4 h-4" />
                Start Batch Validation
              </Button>
              <Button 
                variant="outline" 
                onClick={handleSeedData} 
                disabled={seedingData}
                className="gap-2 border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs"
              >
                {seedingData ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Data...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Seed Test Data (60 cases)
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Running State with Live Timer and Progress */}
      {running && (
        <div className="rounded-3xl border border-primary/25 bg-card/90 backdrop-blur-md p-8 sm:p-10 max-w-2xl mx-auto space-y-6 shadow-2xl relative overflow-hidden animate-slide-up">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  Running Recovery Pipeline
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-normal">
                    Case {Math.min(10, Math.floor(elapsedSeconds / 10.5) + 1)} of ~10
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Autonomous ML scoring, Groq & Gemini AI diagnosis, policy guardrails & test recovery
                </p>
              </div>
            </div>

            {/* Live Elapsed & Estimated Timer */}
            <div className="text-right">
              <div className="text-xs text-muted-foreground font-mono flex items-center gap-1.5 justify-end">
                <Clock className="w-3.5 h-3.5 text-primary animate-pulse" />
                <span>Elapsed: <strong className="text-foreground font-semibold">{elapsedSeconds}s</strong></span>
              </div>
              <div className="text-[11px] text-muted-foreground/80 mt-0.5">
                Estimated: ~90–120s (10 cases)
              </div>
            </div>
          </div>

          {/* Animated Progress Bar */}
          <div className="space-y-2">
            <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden p-0.5 border border-border/40">
              <div
                className="h-full bg-gradient-to-r from-primary via-emerald-500 to-primary rounded-full transition-all duration-500 animate-pulse"
                style={{
                  width: `${Math.min(95, Math.max(6, Math.round((elapsedSeconds / 105) * 100)))}%`
                }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Evaluating case {Math.min(10, Math.floor(elapsedSeconds / 10.5) + 1)} of ~10</span>
              <span>{Math.min(95, Math.max(6, Math.round((elapsedSeconds / 105) * 100)))}% estimated</span>
            </div>
          </div>

          {/* Pipeline Stage Cards - Dynamic Per-Case Cycle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className={`p-3 rounded-xl border text-xs transition-all ${
              (elapsedSeconds % 9) < 2
                ? 'bg-primary/10 border-primary/40 text-primary shadow-sm ring-1 ring-primary/30' 
                : 'bg-muted/20 border-border/60 text-muted-foreground'
            }`}>
              <div className="flex items-center gap-2 font-medium mb-1">
                {(elapsedSeconds % 9) < 2 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                1. ML Probability Scoring
              </div>
              <p className="text-[11px] opacity-80">
                Random Forest & calibrated logistic weights
              </p>
            </div>

            <div className={`p-3 rounded-xl border text-xs transition-all ${
              (elapsedSeconds % 9) >= 2 && (elapsedSeconds % 9) < 5
                ? 'bg-primary/10 border-primary/40 text-primary shadow-sm ring-1 ring-primary/30' 
                : 'bg-muted/20 border-border/60 text-muted-foreground'
            }`}>
              <div className="flex items-center gap-2 font-medium mb-1">
                {(elapsedSeconds % 9) >= 2 && (elapsedSeconds % 9) < 5 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                2. AI Root-Cause Diagnosis
              </div>
              <p className="text-[11px] opacity-80">
                Groq & Gemini multi-model auto-fallback
              </p>
            </div>

            <div className={`p-3 rounded-xl border text-xs transition-all ${
              (elapsedSeconds % 9) >= 5 && (elapsedSeconds % 9) < 7
                ? 'bg-primary/10 border-primary/40 text-primary shadow-sm ring-1 ring-primary/30' 
                : 'bg-muted/20 border-border/60 text-muted-foreground'
            }`}>
              <div className="flex items-center gap-2 font-medium mb-1">
                {(elapsedSeconds % 9) >= 5 && (elapsedSeconds % 9) < 7 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                3. Guardrail & Policy Check
              </div>
              <p className="text-[11px] opacity-80">
                Verifying cooldowns, retries & terminal states
              </p>
            </div>

            <div className={`p-3 rounded-xl border text-xs transition-all ${
              (elapsedSeconds % 9) >= 7
                ? 'bg-primary/10 border-primary/40 text-primary shadow-sm ring-1 ring-primary/30' 
                : 'bg-muted/20 border-border/60 text-muted-foreground'
            }`}>
              <div className="flex items-center gap-2 font-medium mb-1">
                {(elapsedSeconds % 9) >= 7 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                4. Razorpay Test Simulation
              </div>
              <p className="text-[11px] opacity-80">
                Simulating retry/links & writing audit logs
              </p>
            </div>
          </div>

          <p className="text-[11px] text-center text-muted-foreground/80 bg-muted/20 py-2 px-3 rounded-lg border border-border/40">
            💡 Processing full cloud pipeline in background. Please keep this browser tab open — results will display automatically when complete.
          </p>
        </div>
      )}

      {/* Results Dashboard */}
      {result && !running && (
        <div className="space-y-8 animate-slide-up">
          {/* Next Batch remaining notification */}
          {result.eligibleRecoveryCount > result.processedCount && (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">
                    Batch Complete ({result.processedCount} of {result.eligibleRecoveryCount} eligible cases processed)
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {result.eligibleRecoveryCount - result.processedCount} additional failed payments remain in the workspace pool.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={handleRunBatch}
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs shadow-md shadow-primary/15 whitespace-nowrap"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                Run Next Batch (~{Math.min(10, result.eligibleRecoveryCount - result.processedCount)} cases)
              </Button>
            </div>
          )}

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
