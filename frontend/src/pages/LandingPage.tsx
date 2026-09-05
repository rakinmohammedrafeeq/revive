import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  ArrowRight, 
  CheckCircle2, 
  Shield, 
  Zap, 
  Play, 
  Sparkles, 
  Clock, 
  RotateCcw,
  Sliders,
  ChevronRight,
  AlertTriangle,
  Building2,
  Lock,
  Activity,
  Pause,
  Terminal,
  Check
} from 'lucide-react'
import { APP_LOGO_SRC } from '@/config/brandAssets'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

const AUTO_STREAM_EVENTS = [
  {
    code: 'GATEWAY_504_TIMEOUT',
    bank: 'HDFC Bank',
    method: 'Credit Card',
    amount: 4999,
    diagnosis: 'Temporary Bank Switch Latency (Transient Spike)',
    probability: 0.94,
    policy: 'Approved: Cooldown > 4h, Attempt 1/2',
    action: 'Deferred smart auto-retry scheduled during off-peak clearance',
    outcome: 'Successfully Captured (+₹4,999)',
  },
  {
    code: '3DS_AUTH_ABANDONED',
    bank: 'State Bank of India',
    method: 'UPI / Google Pay',
    amount: 14500,
    diagnosis: 'Customer 3DS OTP Session Dropped',
    probability: 0.88,
    policy: 'Approved: Daytime Outreach, Single Link',
    action: 'Dispatched 1-click WhatsApp payment link with saved basket',
    outcome: 'Customer Paid via 1-Click Link (+₹14,500)',
  },
  {
    code: 'ISSUER_MANDATE_EXPIRED',
    bank: 'ICICI Bank',
    method: 'Recurring Mandate',
    amount: 2499,
    diagnosis: 'Card Expired on Active Subscription Mandate',
    probability: 0.79,
    policy: 'Approved: Soft Renewal Notice, Zero Repeated Charges',
    action: 'Dispatched automated mandate renewal prompt with backup card capture',
    outcome: 'Mandate Restored & Payment Captured (+₹2,499)',
  },
  {
    code: 'TRANSIENT_SWITCH_FAILURE',
    bank: 'Axis Bank',
    method: 'NetBanking',
    amount: 8250,
    diagnosis: 'Issuer Bank Gateway Routing Drop',
    probability: 0.91,
    policy: 'Approved: Secondary Gateway Fallback Permitted',
    action: 'Smart route retry dispatched on secondary rail',
    outcome: 'Cleared on Secondary Gateway Rail (+₹8,250)',
  },
]

// Real-Time Autonomous Recovery Engine Stream (Runs automatically 24/7)
function AutonomousLiveStream() {
  const [eventIdx, setEventIdx] = useState(0)
  const [currentStep, setCurrentStep] = useState(0) // 0: Ingest, 1: ML Model, 2: Policy, 3: Captured
  const [recoveredTotal, setRecoveredTotal] = useState(542890)
  const [isPaused, setIsPaused] = useState(false)
  const [logs, setLogs] = useState<string[]>([
    '10:48:12 Engine initialized: Polling Razorpay Webhook Events',
    '10:48:15 Webhook payment.failed intercepted [TXN_8819] - ₹3,499 recovered',
    '10:48:21 ML Random Forest evaluation completed with 0.92 confidence',
    '10:48:28 Webhook payment.failed intercepted [TXN_8820] - ₹11,200 recovered',
  ])

  useEffect(() => {
    if (isPaused) return

    const timer = setInterval(() => {
      setCurrentStep((prevStep) => {
        if (prevStep < 3) {
          return prevStep + 1
        } else {
          // Finished step 3 (Captured), move to next event and add amount
          const currentEvt = AUTO_STREAM_EVENTS[eventIdx]
          setRecoveredTotal((prev) => prev + currentEvt.amount)
          const now = new Date().toLocaleTimeString('en-IN', { hour12: false })
          setLogs((prevLogs) => [
            `${now} [LIVE RECOVERY] ${currentEvt.bank} ${currentEvt.code}: Recaptured +₹${currentEvt.amount.toLocaleString('en-IN')} autonomously`,
            ...prevLogs.slice(0, 4),
          ])
          setEventIdx((prevIdx) => (prevIdx + 1) % AUTO_STREAM_EVENTS.length)
          return 0
        }
      })
    }, 2500)

    return () => clearInterval(timer)
  }, [isPaused, eventIdx])

  const event = AUTO_STREAM_EVENTS[eventIdx]

  const stages = [
    { step: 0, label: '01. Ingestion', desc: 'Webhook captured' },
    { step: 1, label: '02. ML Scoring', desc: `${(event.probability * 100).toFixed(0)}% Probability` },
    { step: 2, label: '03. Guardrails', desc: 'Policy verified' },
    { step: 3, label: '04. Recaptured', desc: `+₹${event.amount.toLocaleString('en-IN')}` },
  ]

  return (
    <div className="rounded-3xl border border-border bg-card/90 shadow-2xl backdrop-blur-xl overflow-hidden text-left relative">
      {/* Top Stream Header Bar */}
      <div className="px-6 py-4 bg-muted/40 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider text-foreground uppercase">
                Autonomous Recovery Stream
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30">
                ACTIVE 24/7
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Self-executing payment interception & automated resolution cycle
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 self-end sm:self-auto">
          {/* Live Tally Metric */}
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-muted-foreground block">Autonomous Tally</span>
            <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
              ₹{recoveredTotal.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Pause / Play Button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title={isPaused ? "Resume Live Stream" : "Pause Stream"}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-primary" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 4-Stage Automated Progress Tracker */}
      <div className="p-6 border-b border-border bg-muted/10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stages.map((st) => {
            const isDone = currentStep > st.step
            const isCurrent = currentStep === st.step
            return (
              <div
                key={st.step}
                className={`p-3 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                  isCurrent
                    ? 'border-primary bg-primary/10 shadow-md shadow-primary/10'
                    : isDone
                    ? 'border-emerald-500/40 bg-emerald-500/5 text-foreground'
                    : 'border-border/60 bg-muted/20 opacity-60'
                }`}
              >
                {/* Active pulsating beam indicator */}
                {isCurrent && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-emerald-400 to-primary animate-beam-drift" />
                )}
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">{st.label}</span>
                  {isDone ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : isCurrent ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                  ) : null}
                </div>
                <div className="text-xs font-semibold text-foreground truncate">
                  {st.desc}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Live Transaction Telemetry Box */}
      <div className="p-6 space-y-4">
        <div className="p-5 rounded-2xl border border-border bg-background/60 backdrop-blur-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-red-500/10 text-red-500 border border-red-500/20 font-bold">
                {event.code}
              </span>
              <span className="text-xs font-semibold text-foreground">
                {event.bank} • {event.method}
              </span>
            </div>
            <div className="text-sm font-mono font-bold text-foreground">
              Amount at Risk: ₹{event.amount.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3 rounded-xl border border-border/80 bg-muted/20 space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase block font-sans font-semibold">
                AI ML Diagnosis
              </span>
              <p className="text-foreground font-semibold text-[11px] leading-tight">
                {event.diagnosis}
              </p>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block pt-1">
                Score: {(event.probability * 100).toFixed(0)}% Probability
              </span>
            </div>

            <div className="p-3 rounded-xl border border-border/80 bg-muted/20 space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase block font-sans font-semibold">
                Deterministic Policy
              </span>
              <p className="text-foreground font-semibold text-[11px] leading-tight">
                {event.policy}
              </p>
              <span className="text-[10px] text-primary font-bold block pt-1">
                Guardrail Status: PASSED ✓
              </span>
            </div>

            <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1">
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 uppercase block font-sans font-semibold">
                Autonomous Outcome
              </span>
              <p className="text-foreground font-semibold text-[11px] leading-tight">
                {event.action}
              </p>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block pt-1">
                {event.outcome}
              </span>
            </div>
          </div>
        </div>

        {/* Live Terminal Log Box */}
        <div className="rounded-2xl border border-border bg-black/90 text-emerald-400 p-4 font-mono text-xs shadow-inner">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-emerald-500" />
              <span>revive-autonomous-telemetry.log</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>STREAMING</span>
            </div>
          </div>
          <div className="space-y-1.5 font-mono text-[11px] leading-relaxed">
            {logs.map((log, idx) => (
              <div key={idx} className="truncate flex items-center gap-2">
                <span className="text-emerald-500/60">&gt;</span>
                <span className={idx === 0 ? "text-emerald-300 font-semibold" : "text-emerald-400/80"}>
                  {log}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Interactive Live Payment Recovery Simulator (Docker / Stripe style demo)
function InteractiveRecoverySimulator() {
  const scenarios = [
    {
      id: 'bank-timeout',
      name: 'Bank Network Timeout',
      amount: 4999,
      customer: 'Rahul Verma',
      paymentMethod: 'HDFC Credit Card',
      cause: 'Issuer bank server timed out during flash checkout',
      category: 'Temporary Bank Glitch',
      strategy: 'Wait 8 minutes for bank server recovery & smart auto-retry',
      recoveryTime: '8 min',
      outcome: 'Payment Captured Successfully',
      customerImpact: 'Zero customer effort. No awkward text or drop-off.',
    },
    {
      id: '3ds-drop',
      name: '3D Secure OTP Dropped',
      amount: 14500,
      customer: 'Priya Sharma',
      paymentMethod: 'UPI / NetBanking',
      cause: 'Customer stepped away; OTP expired before submission',
      category: 'Authentication Timeout',
      strategy: 'Send gentle, branded 1-click WhatsApp payment link with saved basket',
      recoveryTime: '12 min',
      outcome: 'Customer Completed via 1-Click Link',
      customerImpact: 'Customer received instant link and completed checkout in 5 seconds.',
    },
    {
      id: 'card-expired',
      name: 'Card Expired / Soft Limit',
      amount: 2499,
      customer: 'Arun Kulkarni',
      paymentMethod: 'Recurring Mandate',
      cause: 'Customer replaced their card last month; renewal declined',
      category: 'Card Detail Update Required',
      strategy: 'Polite mandate update link sent within daytime hours',
      recoveryTime: '24 min',
      outcome: 'New Card Attached & Recurring Mandate Renewed',
      customerImpact: 'Subscription preserved without cancelling service or interrupting customer.',
    }
  ]

  const [selectedIdx, setSelectedIdx] = useState(0)
  const [step, setStep] = useState(0)
  const [isSimulating, setIsSimulating] = useState(false)

  const activeScenario = scenarios[selectedIdx]

  // Simulation step timer
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isSimulating) {
      if (step < 3) {
        timer = setTimeout(() => {
          setStep((prev) => prev + 1)
        }, 900)
      } else {
        setIsSimulating(false)
      }
    }
    return () => clearTimeout(timer)
  }, [isSimulating, step])

  const startSimulation = (idx: number) => {
    setSelectedIdx(idx)
    setStep(1)
    setIsSimulating(true)
  }

  return (
    <div className="w-full rounded-3xl bg-card border border-border shadow-xl overflow-hidden text-left">
      {/* Simulator Window Header (Browser / Terminal Mockup) */}
      <div className="px-5 py-3.5 bg-muted/40 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-400/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-400/80 inline-block" />
          </div>
          <span className="text-xs font-mono font-medium text-muted-foreground ml-2 hidden sm:inline-block">
            revive-live-recovery-demo
          </span>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">Interactive Simulator</span>
        </div>
      </div>

      {/* Scenario Tabs (Pick a failure type) */}
      <div className="p-4 border-b border-border bg-muted/20">
        <div className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-2">
          Select Failed Payment Scenario:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {scenarios.map((sc, i) => (
            <button
              key={sc.id}
              onClick={() => startSimulation(i)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left flex items-center justify-between ${
                selectedIdx === i
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-card hover:bg-accent border border-border text-foreground'
              }`}
            >
              <span className="truncate">{sc.name}</span>
              <span className="text-[10px] opacity-80 font-mono ml-2">₹{sc.amount.toLocaleString('en-IN')}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Simulation Body */}
      <div className="p-6 space-y-6">
        {/* Step 1: Initial Payment Failure */}
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">
                  Step 1: Payment Failed at Checkout
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-700 dark:text-red-300 font-mono">
                  {formatCurrency(activeScenario.amount, 'INR')}
                </span>
              </div>
              <p className="text-xs text-foreground font-medium mt-0.5">
                {activeScenario.customer} • {activeScenario.paymentMethod}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {activeScenario.cause}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider bg-red-500/10 px-2 py-1 rounded-md self-start sm:self-auto">
            Revenue at Risk
          </span>
        </div>

        {/* Step 2: Revive AI & Guardrails in Action */}
        <div className={`transition-all duration-500 ${step >= 1 ? 'opacity-100' : 'opacity-40 blur-[1px]'}`}>
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-primary uppercase tracking-wide">
                  Step 2: Revive Autonomous Recovery Activated
                </span>
              </div>
              <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                Zero Human Effort
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-card border border-border">
                <div className="text-[10px] uppercase font-bold text-muted-foreground">AI Diagnosis</div>
                <div className="text-foreground font-semibold mt-0.5">{activeScenario.category}</div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  Evaluated 94% recovery probability based on bank historical uptime.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-card border border-border">
                <div className="text-[10px] uppercase font-bold text-muted-foreground">Guardrail Check</div>
                <div className="text-foreground font-semibold mt-0.5">Policy Approved ✓</div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  1st attempt. Quiet hours respected. Zero extra merchant fees.
                </div>
              </div>
            </div>

            <div className="text-xs text-foreground p-2.5 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary flex-shrink-0" />
              <span>
                <strong>Smart Action:</strong> {activeScenario.strategy}
              </span>
            </div>
          </div>
        </div>

        {/* Step 3: Success Outcome */}
        <div className={`transition-all duration-500 ${step >= 2 ? 'opacity-100 scale-100' : 'opacity-40 scale-98'}`}>
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-2xl bg-emerald-500 text-black flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    Step 3: {activeScenario.outcome}
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-200">
                    +{formatCurrency(activeScenario.amount, 'INR')} Salvaged
                  </span>
                </div>
                <p className="text-xs text-foreground mt-1 font-medium">
                  {activeScenario.customerImpact}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Recovered in ~{activeScenario.recoveryTime} • Direct deposit to merchant payout account.
                </p>
              </div>
            </div>

            <button
              onClick={() => startSimulation(selectedIdx)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border hover:bg-accent text-xs font-semibold text-foreground transition-all shadow-xs self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5 text-primary" />
              Replay
            </button>
          </div>
        </div>
      </div>

      {/* Simulator Footer */}
      <div className="px-6 py-3.5 bg-muted/30 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span>Average Recovery Rate across merchants: <strong className="text-foreground">74.2%</strong></span>
        <Link to="/register" className="font-semibold text-primary hover:underline flex items-center gap-1">
          Recover your payments <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}

// Monthly Revenue Recovery Calculator for Merchants
function RevenueCalculator() {
  const [volume, setVolume] = useState(1000000) // 10 Lakhs default

  const failureRate = 0.15 // 15% average payment failure rate
  const recoveryRate = 0.72 // 72% Revive recovery success rate

  const revenueAtRisk = volume * failureRate
  const recoveredRevenue = revenueAtRisk * recoveryRate

  return (
    <div className="rounded-3xl bg-card border border-border p-8 shadow-xl max-w-4xl mx-auto">
      <div className="text-center max-w-xl mx-auto mb-8">
        <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
          Instant ROI Calculator
        </span>
        <h3 className="text-2xl font-bold text-foreground mt-3">
          See How Much Revenue Revive Will Put Back in Your Pocket
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          Most online stores lose 12% to 18% of all orders to bank glitches and card drops. Revive rescues the majority of them.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center text-sm font-semibold mb-2">
            <span className="text-foreground">Your Monthly Checkout Volume:</span>
            <span className="text-lg font-bold text-primary font-mono">{formatCurrency(volume, 'INR')} / month</span>
          </div>
          <input
            type="range"
            min={100000}
            max={10000000}
            step={100000}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full h-2.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-[11px] text-muted-foreground mt-1.5 font-mono">
            <span>₹1,00,000</span>
            <span>₹50,00,000</span>
            <span>₹1,00,00,000</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="p-4 rounded-2xl bg-muted/30 border border-border">
            <div className="text-xs text-muted-foreground">Estimated Failed Payments (15%)</div>
            <div className="text-xl font-bold text-foreground font-mono mt-1">
              {formatCurrency(revenueAtRisk, 'INR')}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">At risk of permanent loss</div>
          </div>

          <div className="p-4 rounded-2xl bg-muted/30 border border-border">
            <div className="text-xs text-muted-foreground">Estimated Recovery Rate</div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
              72.0%
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Average across active merchants</div>
          </div>

          <div className="p-4 rounded-2xl bg-primary/10 border border-primary/25">
            <div className="text-xs font-semibold text-primary">Recovered Monthly Cash Flow</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
              {formatCurrency(recoveredRevenue, 'INR')}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Direct into your merchant account</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Behind-Text Dynamic Heartbeat (ECG) Lifeline + Cyber Square Laser Grid + Ambient Cyber Pixels
function HeroDynamicBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      {/* 1. Cyber Square Grid with Drifting Laser Pulses */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.08)_1px,transparent_1px)] bg-[size:56px_56px]">
        {/* Horizontal Laser 1 - sweeps completely across screen */}
        <div className="absolute top-[180px] h-[3px] w-96 rounded-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_#10b981,0_0_40px_#34d399] animate-laser-pass-x" />
        
        {/* Horizontal Laser 2 - sweeps on lower grid row with offset */}
        <div className="absolute top-[392px] h-[2.5px] w-80 rounded-full bg-gradient-to-r from-transparent via-emerald-400/90 to-transparent shadow-[0_0_18px_#10b981] animate-laser-pass-x-delayed" />

        {/* Vertical Laser 1 - sweeps down left square column */}
        <div className="absolute left-[18%] w-[3px] h-80 rounded-full bg-gradient-to-b from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_#10b981,0_0_40px_#34d399] animate-laser-pass-y" />

        {/* Vertical Laser 2 - sweeps down right square column */}
        <div className="absolute right-[18%] w-[2.5px] h-72 rounded-full bg-gradient-to-b from-transparent via-emerald-400/90 to-transparent shadow-[0_0_18px_#10b981] animate-laser-pass-y-delayed" />

        {/* Square Circuit Pulse - scans along perimeter of grid */}
        <div className="absolute w-3.5 h-3.5 rounded-xs border-2 border-emerald-400 bg-emerald-500/40 shadow-[0_0_16px_#10b981] animate-square-circuit" />
      </div>

      {/* 2. Heartbeat (ECG Life-Pulse) Waveform Running Directly Behind the Headline */}
      <div className="absolute top-20 sm:top-28 left-0 right-0 h-48 sm:h-64 flex items-center justify-center opacity-45 dark:opacity-60">
        <svg
          viewBox="0 0 1400 160"
          preserveAspectRatio="none"
          className="w-full h-full text-emerald-500 overflow-visible"
        >
          <defs>
            <linearGradient id="ecgGlowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.1" />
              <stop offset="25%" stopColor="#34d399" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="1" />
              <stop offset="75%" stopColor="#34d399" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
            </linearGradient>
            <filter id="ecgNeonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Faint static lifeline baseline */}
          <path
            d="M 0 80 L 160 80 Q 185 68 200 80 L 230 80 L 245 94 L 265 16 L 285 144 L 300 80 L 325 80 Q 355 52 385 80 L 560 80 Q 585 68 600 80 L 630 80 L 645 94 L 665 16 L 685 144 L 700 80 L 725 80 Q 755 52 785 80 L 960 80 Q 985 68 1000 80 L 1030 80 L 1045 94 L 1065 16 L 1085 144 L 1100 80 L 1125 80 Q 1155 52 1185 80 L 1400 80"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeOpacity="0.25"
          />

          {/* Active sweeping ECG pulse line */}
          <path
            d="M 0 80 L 160 80 Q 185 68 200 80 L 230 80 L 245 94 L 265 16 L 285 144 L 300 80 L 325 80 Q 355 52 385 80 L 560 80 Q 585 68 600 80 L 630 80 L 645 94 L 665 16 L 685 144 L 700 80 L 725 80 Q 755 52 785 80 L 960 80 Q 985 68 1000 80 L 1030 80 L 1045 94 L 1065 16 L 1085 144 L 1100 80 L 1125 80 Q 1155 52 1185 80 L 1400 80"
            fill="none"
            stroke="url(#ecgGlowGrad)"
            strokeWidth="3.5"
            filter="url(#ecgNeonGlow)"
            className="animate-ecg-flow"
          />

          {/* Heartbeat pulse beacon nodes at peak R-spikes */}
          <circle cx="265" cy="16" r="5" fill="#34d399" className="animate-heartbeat-ping" />
          <circle cx="665" cy="16" r="5" fill="#34d399" className="animate-heartbeat-ping" />
          <circle cx="1065" cy="16" r="5" fill="#34d399" className="animate-heartbeat-ping" />
        </svg>
      </div>

      {/* 3. Floating Cyber Pixels with Emerald Glow & Data Badges */}
      <div className="absolute top-[18%] left-[8%] hidden md:flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-400 border border-emerald-300 shadow-[0_0_10px_#10b981] animate-pixel-flicker" />
        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold">
          PULSE: 72 BPM • RECOVERING
        </span>
      </div>

      <div className="absolute top-[22%] right-[10%] hidden md:flex items-center gap-2">
        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold">
          AUTOPILOT: ENGAGED
        </span>
        <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-400 border border-emerald-300 shadow-[0_0_10px_#10b981] animate-pixel-flicker" style={{ animationDelay: '1.4s' }} />
      </div>

      {/* Ambient Pixel Particles */}
      <div className="absolute top-[38%] left-[5%] w-2.5 h-2.5 rounded-[2px] bg-emerald-400/80 shadow-[0_0_10px_#10b981] animate-float" />
      <div className="absolute top-[60%] left-[12%] w-2 h-2 rounded-[1px] bg-emerald-400/70 shadow-[0_0_8px_#10b981] animate-float-delayed" />
      <div className="absolute top-[46%] right-[7%] w-2.5 h-2.5 rounded-[2px] bg-emerald-400/80 shadow-[0_0_10px_#10b981] animate-float-delayed" />
      <div className="absolute top-[72%] right-[14%] w-3 h-3 rounded-[2px] bg-emerald-400/90 shadow-[0_0_12px_#10b981] animate-pixel-flicker" style={{ animationDelay: '2s' }} />
      <div className="absolute top-[26%] left-[24%] w-2 h-2 rounded-[1px] bg-emerald-400/60 shadow-[0_0_8px_#10b981] animate-pixel-flicker" style={{ animationDelay: '0.8s' }} />
      <div className="absolute top-[32%] right-[24%] w-2 h-2 rounded-[1px] bg-emerald-400/60 shadow-[0_0_8px_#10b981] animate-pixel-flicker" style={{ animationDelay: '1.6s' }} />
    </div>
  )
}

export function LandingPage() {
  const { isAuthenticated } = useAuth()

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
      {/* ── Ambient Background Glow & Tech Grid ────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-primary/10 blur-[130px] rounded-full animate-pulse-slow" />
        <div className="absolute top-[30%] -left-32 w-[500px] h-[500px] bg-emerald-500/10 blur-[140px] rounded-full animate-float" />
        <div className="absolute top-[50%] -right-32 w-[500px] h-[500px] bg-primary/10 blur-[140px] rounded-full animate-float-delayed" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      {/* ── Fixed Sticky Navbar ────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          <Link to="/" onClick={scrollToTop} className="flex items-center gap-2.5 cursor-pointer">
            <img src={APP_LOGO_SRC} alt="Revive" className="h-7 w-7" />
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-foreground">REVIVE</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-primary">
                AI Revenue Recovery
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#live-stream" className="hover:text-foreground transition-colors flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Engine
            </a>
            <a href="#simulator" className="hover:text-foreground transition-colors">
              Interactive Demo
            </a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">
              How it Works
            </a>
            <a href="#calculator" className="hover:text-foreground transition-colors">
              ROI Calculator
            </a>
            <a href="#guardrails" className="hover:text-foreground transition-colors">
              Safety Guardrails
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle variant="ghost" className="h-9 w-9 rounded-xl" />
            {isAuthenticated ? (
              <Link to="/app/dashboard">
                <Button className="rounded-xl font-semibold bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm shadow-md shadow-primary/20 gap-2">
                  <span>Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-semibold text-foreground hover:text-primary px-3 py-2 transition-colors"
                >
                  Sign In
                </Link>
                <Link to="/register">
                  <Button className="rounded-xl font-semibold bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm shadow-md shadow-primary/20">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Section ──────────────────────────────────────────────── */}
      <section className="relative min-h-[calc(100vh-4rem)] mt-16 flex flex-col justify-center items-center py-12 sm:py-16 overflow-hidden">
        {/* Dynamic Background: ECG Heartbeat Life-Pulse + Square Grid Lasers + Cyber Pixels */}
        <HeroDynamicBackground />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10 w-full">
          {/* Value Headline */}
          <div className="max-w-4xl mx-auto space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              Recover 70%+ of failed payments.{' '}
              <span className="text-gradient-emerald">Completely on autopilot.</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              When a customer's payment fails due to bank downtime or temporary glitches, Revive steps in. We analyze the cause, pick the optimal retry moment, and recapture your revenue without bothering your customers.
            </p>
          </div>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            {isAuthenticated ? (
              <Link to="/app/dashboard">
                <Button size="lg" className="h-12 px-8 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground text-sm shadow-lg shadow-primary/25 gap-2">
                  Open Command Center
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <Link to="/register">
                <Button size="lg" className="h-12 px-8 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground text-sm shadow-lg shadow-primary/25 gap-2">
                  Start Free Recovery
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            )}
            <a href="#live-stream">
              <Button size="lg" variant="outline" className="h-12 px-8 rounded-xl font-semibold border-border text-foreground hover:bg-accent text-sm gap-2">
                <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                Watch Live Stream
              </Button>
            </a>
            <a href="#simulator">
              <Button size="lg" variant="ghost" className="h-12 px-6 rounded-xl font-medium text-muted-foreground hover:text-foreground text-sm gap-2">
                <Play className="w-4 h-4 text-primary" />
                Interactive Demo
              </Button>
            </a>
          </div>

          {/* Social Proof Strip */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-medium text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Razorpay Verified Integration</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Zero Disruption to Shoppers</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Strict Merchant Policy Guardrails</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Interactive Recovery Simulator Section ──────────────────── */}
      <section id="simulator" className="py-24 border-t border-border bg-background/60 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-xs font-mono text-primary font-semibold">
              <Play className="w-3.5 h-3.5 text-primary" />
              <span>INTERACTIVE RECOVERY LAB</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Experience Autonomous Recovery in Action
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Select any failed checkout scenario below to simulate how Revive diagnoses root causes, checks safety guardrails, and captures revenue without customer friction.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <InteractiveRecoverySimulator />
          </div>
        </div>
      </section>

      {/* ── Auto-Running Autonomous Engine Stream (Live Animation 24/7) ── */}
      <section id="live-stream" className="py-20 border-t border-border bg-muted/10 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-xs font-mono text-emerald-600 dark:text-emerald-400">
              <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span>Autonomous Engine • Running Live 24/7</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Watch Revive Recover Failed Payments In Real Time
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              No manual clicks required. Revive's autonomous loop ingests payment webhooks, runs Random Forest classification, checks deterministic merchant policy guardrails, and captures recovered funds automatically.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <AutonomousLiveStream />
          </div>
        </div>
      </section>

      {/* ── Problem Breakdown Section (Why Payments Fail) ─────────────── */}
      <section id="how-it-works" className="py-20 bg-muted/20 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Where Is Your Money Going?
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
              Most Payment Failures Are Not Intentional Abandonment
            </h2>
            <p className="text-base text-muted-foreground">
              Your customer already decided to purchase. The drop-off happens because of technical hiccups between the bank and gateway.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Bank & Gateway Timeouts (42%)</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Bank servers undergo temporary maintenance or drop packets under load. A simple naive retry immediately fails again, but waiting 5–10 minutes yields a 92% capture rate.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">3DS OTP Expirations (36%)</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Customers get distracted, SMS OTP arrives late, or mobile signal drops. Instead of losing the sale forever, Revive dispatches a zero-friction, branded 1-click link.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Sliders className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Expired Cards & Limits (22%)</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Subscription renewals silently drop because a card passed its expiration date. Revive enables instant payment method updates before the service ever gets interrupted.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Policy Guardrails Section (Safe for Merchants) ────────────── */}
      <section id="guardrails" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Merchant-Controlled Guardrails
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground leading-tight">
                Complete Peace of Mind.{' '}
                <span className="text-gradient-emerald">You Stay in 100% Control.</span>
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Autonomous recovery doesn't mean wild guessing. Every action taken by Revive is bounded by deterministic business policies that you define.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3.5">
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Strict Retry Caps</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Never trigger excessive decline penalties. We enforce strict caps (e.g. max 2 retries per payment).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Quiet Hours Enforcement</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      No middle-of-the-night pings. WhatsApp and SMS customer links are strictly held until polite daylight hours.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Immutable Audit Trail</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Every single attempt, decision, and rupee recovered is recorded in an immutable ledger with full timestamp history.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Guardrail Status Card */}
            <div className="lg:col-span-6">
              <div className="rounded-3xl bg-card border border-border p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">Active Merchant Protection Rule</h4>
                      <p className="text-xs text-muted-foreground">Enforced on all checkout transactions</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Active & Enforced
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border flex items-center justify-between">
                    <span className="text-muted-foreground">Max Automatic Retries</span>
                    <strong className="text-foreground">2 Attempts Max</strong>
                  </div>
                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border flex items-center justify-between">
                    <span className="text-muted-foreground">Mandatory Cooldown Window</span>
                    <strong className="text-foreground">4 Hours Minimum</strong>
                  </div>
                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border flex items-center justify-between">
                    <span className="text-muted-foreground">Allowed Recovery Channels</span>
                    <strong className="text-foreground">Gateway Auto + WhatsApp Link</strong>
                  </div>
                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border flex items-center justify-between">
                    <span className="text-muted-foreground">Quiet Hours Protected</span>
                    <strong className="text-foreground">10:00 PM – 8:00 AM IST</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Interactive ROI Calculator ─────────────────────────────────── */}
      <section id="calculator" className="py-20 bg-muted/20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevenueCalculator />
        </div>
      </section>

      {/* ── Bottom Call to Action ─────────────────────────────────────── */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-emerald-500/20 via-card to-primary/20 border border-emerald-500/30 p-10 sm:p-14 text-center space-y-6 relative">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
              Ready to Stop Losing 15% of Your Hard-Earned Revenue?
            </h2>
            <p className="text-base text-muted-foreground max-w-xl mx-auto">
              Connect your payment gateway in 2 minutes. Watch your first recovered transactions appear on your Command Center today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              {isAuthenticated ? (
                <Link to="/app/dashboard">
                  <Button size="lg" className="h-12 px-8 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground text-sm shadow-xl shadow-primary/30 gap-2">
                    Open Command Center
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/register">
                    <Button size="lg" className="h-12 px-8 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground text-sm shadow-xl shadow-primary/30 gap-2">
                      Create Your Free Account
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button size="lg" variant="outline" className="h-12 px-8 rounded-xl font-semibold border-border text-foreground hover:bg-accent text-sm">
                      Sign In to Dashboard
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="py-10 border-t border-border bg-card/50 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={scrollToTop}
            type="button"
            className="flex items-center gap-2.5 text-left hover:opacity-85 transition-opacity cursor-pointer group"
            aria-label="Revive - Back to top"
          >
            <img src={APP_LOGO_SRC} alt="Revive" className="h-5 w-5" />
            <span className="font-bold text-foreground group-hover:text-primary transition-colors">REVIVE</span>
            <span className="hidden sm:inline text-muted-foreground">• AI Revenue Recovery for Merchants</span>
          </button>
          <div className="flex items-center gap-6">
            <a
              href="/terms-and-privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors hover:underline"
            >
              Terms & Privacy
            </a>
            <span>© {new Date().getFullYear()} Revive Technologies Inc. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}