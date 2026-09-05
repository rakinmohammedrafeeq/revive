import { useState, useEffect } from 'react'
import { 
  CreditCard, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  Loader2, 
  ChevronDown, 
  ChevronUp, 
  ShieldAlert, 
  Clock, 
  ExternalLink,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { failedPaymentsApi, type FailedPayment } from '@/api/recoveryApi'
import { REVIVE_LOGO_DATA_URI } from '@/config/brandAssets'

interface LivePaymentSimulatorProps {
  onPaymentCreated?: (payment: FailedPayment) => void
  className?: string
  defaultExpanded?: boolean
}

export function LivePaymentSimulator({
  onPaymentCreated,
  className = '',
  defaultExpanded = true
}: LivePaymentSimulatorProps) {
  const [isOpen, setIsOpen] = useState(defaultExpanded)
  const [keyId, setKeyId] = useState('rzp_test_TXxKvihM0gEmF9')
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [launchingRzp, setLaunchingRzp] = useState(false)
  const [simulating, setSimulating] = useState<string | null>(null)
  const [copiedCard, setCopiedCard] = useState<string | null>(null)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      setLoadingConfig(true)
      const cfg = await failedPaymentsApi.getConfig()
      if (cfg?.keyId) {
        setKeyId(cfg.keyId)
      }
    } catch (err) {
      console.warn('Failed to load Razorpay config from backend, using default test key:', err)
    } finally {
      setLoadingConfig(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCard(label)
    toast.success(`Copied ${label} to clipboard`)
    setTimeout(() => setCopiedCard(null), 2500)
  }

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true)
        return
      }
      const existing = document.getElementById('razorpay-checkout-script')
      if (existing) {
        existing.addEventListener('load', () => resolve(true))
        existing.addEventListener('error', () => resolve(false))
        return
      }
      const script = document.createElement('script')
      script.id = 'razorpay-checkout-script'
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handleLaunchRazorpay = async () => {
    try {
      setLaunchingRzp(true)
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        toast.error('Unable to load Razorpay script. Check adblockers or use instant simulation below.')
        return
      }

      const randomOrderId = `order_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`

      const options = {
        key: keyId,
        amount: 100, // 100 paise = INR 1.00
        currency: 'INR',
        name: 'Revive Autonomous Recovery',
        description: 'Live Test Payment (Test Mode)',
        image: REVIVE_LOGO_DATA_URI,
        prefill: {
          name: 'Demo Evaluator',
          email: 'evaluator@revive.test',
          contact: '+919876543210'
        },
        theme: {
          color: '#10b981' // Revive emerald
        },
        handler: function (response: any) {
          toast.success(`Payment Succeeded! Payment ID: ${response.razorpay_payment_id}. Successful transactions do not require recovery.`)
        },
        modal: {
          ondismiss: function () {
            toast.info('Razorpay test checkout window dismissed.')
          }
        }
      }

      const rzp = new (window as any).Razorpay(options)

      rzp.on('payment.failed', async function (response: any) {
        const error = response.error || {}
        const paymentIdentifier = error.metadata?.payment_id || `pay_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
        const errorCode = error.code || 'PAYMENT_FAILED'
        const failureReason = error.description || 'Payment was declined by issuing bank in Razorpay Sandbox'
        
        try {
          toast.loading('Capturing failed payment and triggering AI recovery pipeline...', { id: 'rzp-fail' })
          const created = await failedPaymentsApi.create({
            paymentIdentifier,
            orderIdentifier: error.metadata?.order_id || randomOrderId,
            customerId: 'cust_live_evaluator',
            customerName: 'Demo Evaluator',
            customerEmail: 'evaluator@revive.test',
            customerPhone: '+919876543210',
            amount: 1.00,
            currency: 'INR',
            failureReason,
            errorCode,
            paymentMethod: error.source || 'card',
            metadata: {
              source: 'razorpay_test_checkout',
              step: error.step || 'payment_authorization',
              reason: error.reason,
              rawError: error
            }
          })
          toast.success(`Failed payment captured (${paymentIdentifier})! Recovery case created and analyzed by AI.`, { id: 'rzp-fail' })
          onPaymentCreated?.(created)
        } catch (err: any) {
          toast.error(`Error saving payment: ${err?.response?.data?.message || err.message}`, { id: 'rzp-fail' })
        }
      })

      rzp.open()
    } catch (err: any) {
      console.error('Error opening Razorpay checkout:', err)
      toast.error('Failed to launch Razorpay checkout: ' + (err.message || 'Unknown error'))
    } finally {
      setLaunchingRzp(false)
    }
  }

  const handleSimulateScenario = async (scenario: {
    id: string
    title: string
    reason: string
    code: string
    amount: number
    method: string
    customerName: string
    customerEmail: string
  }) => {
    try {
      setSimulating(scenario.id)
      const timestamp = Date.now().toString(36)
      const randomSuffix = Math.random().toString(36).slice(2, 6)
      const paymentIdentifier = `pay_sim_${timestamp}_${randomSuffix}`

      toast.loading(`Injecting ${scenario.title} into recovery pipeline...`, { id: 'sim-load' })

      const payment = await failedPaymentsApi.create({
        paymentIdentifier,
        orderIdentifier: `order_sim_${timestamp}`,
        customerId: `cust_${randomSuffix}`,
        customerName: scenario.customerName,
        customerEmail: scenario.customerEmail,
        customerPhone: '+919876543210',
        amount: scenario.amount,
        currency: 'INR',
        failureReason: scenario.reason,
        errorCode: scenario.code,
        paymentMethod: scenario.method,
        metadata: {
          simulationScenario: scenario.id,
          source: 'instant_sandbox_simulator',
          simulatedAt: new Date().toISOString()
        }
      })

      toast.success(`Live failure simulated! Case created and evaluated by AI model.`, { id: 'sim-load' })
      onPaymentCreated?.(payment)
    } catch (err: any) {
      toast.error(`Failed to simulate scenario: ${err?.response?.data?.message || err.message}`, { id: 'sim-load' })
    } finally {
      setSimulating(null)
    }
  }

  const SCENARIOS = [
    {
      id: 'timeout',
      title: 'Bank Gateway Timeout',
      badge: 'High ML Recovery (88%)',
      badgeColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      reason: 'Bank gateway timed out during authorization handshake (GATEWAY_TIMEOUT)',
      code: 'GATEWAY_TIMEOUT',
      amount: 4499.00,
      method: 'netbanking',
      customerName: 'Aarav Sharma',
      customerEmail: 'aarav.sharma@example.in',
      icon: Clock,
      suggestedAction: 'Smart Scheduled Retry (+15m)'
    },
    {
      id: 'insufficient_funds',
      title: 'Insufficient Balance',
      badge: 'Medium ML Recovery (54%)',
      badgeColor: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      reason: 'Card issuer returned 51: Insufficient funds in customer account',
      code: 'INSUFFICIENT_FUNDS',
      amount: 8950.00,
      method: 'card',
      customerName: 'Priya Iyer',
      customerEmail: 'priya.iyer@example.com',
      icon: CreditCard,
      suggestedAction: 'SMS PayLink + UPI Fallback'
    },
    {
      id: 'auth_drop',
      title: '3DS OTP Abandonment',
      badge: 'High ML Recovery (81%)',
      badgeColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      reason: 'Customer dropped session before submitting 3D Secure OTP verification',
      code: 'AUTHENTICATION_ABANDONED',
      amount: 12499.00,
      method: 'upi',
      customerName: 'Vikram Mehta',
      customerEmail: 'vikram.mehta@enterprise.org',
      icon: ShieldAlert,
      suggestedAction: 'Interactive WhatsApp 1-Click Pay'
    },
    {
      id: 'risk_flag',
      title: 'Velocity Risk Alert',
      badge: 'Policy Escalation (Review)',
      badgeColor: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      reason: 'Multi-card velocity threshold exceeded. High-value enterprise order flagged.',
      code: 'RISK_POLICY_ESCALATION',
      amount: 49999.00,
      method: 'card',
      customerName: 'Nexus Global Ltd',
      customerEmail: 'billing@nexusglobal.io',
      icon: AlertTriangle,
      suggestedAction: 'Escalate to Analyst Review'
    }
  ]

  return (
    <div className={`rounded-3xl border border-primary/25 bg-card/90 dark:bg-card/70 backdrop-blur-xl shadow-xl overflow-hidden transition-all duration-300 ${className}`}>
      {/* Simulator Cockpit Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="px-5 sm:px-6 py-4 flex items-center justify-between cursor-pointer border-b border-border/50 hover:bg-muted/30 transition-colors select-none"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                Live Payment Sandbox & Gateway Simulator
              </h3>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                Razorpay Test Active
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Trigger real Razorpay Test Mode transactions or instant failure scenarios to verify AI diagnosis in real-time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2 py-1 rounded-lg bg-muted text-muted-foreground border border-border text-[11px] hidden md:inline">
            Key: {keyId.slice(0, 8)}...{keyId.slice(-4)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(!isOpen)
            }}
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Simulator Cockpit Body */}
      {isOpen && (
        <div className="p-5 sm:p-6 space-y-6 animate-fade-in">
          {/* Main Action Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Real Razorpay Modal Trigger (5 cols) */}
            <div className="lg:col-span-5 rounded-2xl border border-border/80 bg-muted/20 p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <h4 className="text-sm font-semibold text-foreground">Real Razorpay Checkout</h4>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    Popup Modal
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Opens the real Razorpay payment window. Choose <strong className="text-foreground">Netbanking → Demo Bank</strong> and click <span className="font-semibold text-red-500 dark:text-red-400">[Failure]</span> to immediately trigger an authentic live failure event!
                </p>

                {/* Quick Copy Test Cards with Tabs and Details */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                    <span>Razorpay Official Test Cards</span>
                    <span className="text-[10px] text-primary/80 font-mono">Any future date & 3-digit CVV</span>
                  </div>

                  {/* Card Selector Pills */}
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-background/60 rounded-xl border border-border">
                    {[
                      { id: 'decline', label: 'Decline Card', num: '4100280000060003', display: '4100 2800 0006 0003', color: 'text-red-500' },
                      { id: 'insufficient', label: 'Low Balance', num: '4100280000080001', display: '4100 2800 0008 0001', color: 'text-amber-500' },
                      { id: 'success', label: 'Success Card', num: '4100280000001007', display: '4100 2800 0000 1007', color: 'text-emerald-500' },
                    ].map((card) => (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => copyToClipboard(card.num, card.label)}
                        className="flex flex-col items-center justify-center p-2 rounded-lg bg-card/80 border border-border hover:border-primary/40 transition-all text-center group cursor-pointer"
                        title={`Click to copy ${card.label}`}
                      >
                        <span className={`text-[10px] font-bold ${card.color} flex items-center gap-1`}>
                          {card.label}
                          {copiedCard === card.label ? (
                            <Check className="w-2.5 h-2.5 text-emerald-500 inline" />
                          ) : (
                            <Copy className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 inline" />
                          )}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground mt-0.5">
                          {card.num.slice(0, 4)} •••• {card.num.slice(-4)}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Expiry & CVV Helper (No redundant card number) */}
                  <div className="p-2.5 rounded-xl bg-card border border-border flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground font-medium">Expiry:</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('12/28', 'Expiry 12/28')}
                        className="font-mono text-foreground hover:text-primary font-semibold flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/60 transition-colors"
                        title="Copy Expiry: 12/28 (any future date works)"
                      >
                        12/28
                        {copiedCard === 'Expiry 12/28' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                      </button>
                    </div>

                    <div className="h-4 w-px bg-border" />

                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground font-medium">CVV:</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('123', 'CVV 123')}
                        className="font-mono text-foreground hover:text-primary font-semibold flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/60 transition-colors"
                        title="Copy CVV: 123 (any 3 digits work)"
                      >
                        123
                        {copiedCard === 'CVV 123' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                      </button>
                    </div>

                    <div className="h-4 w-px bg-border hidden sm:block" />

                    <span className="text-[10px] text-muted-foreground hidden sm:inline font-mono">
                      (any future date & 3 digits)
                    </span>
                  </div>

                  {/* Helpful Quick Tip */}
                  <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/15 text-[11px] text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      <Info className="w-3.5 h-3.5 text-primary" />
                      <span>Razorpay Modal Instructions</span>
                    </div>
                    <p className="leading-relaxed">
                      1. Click a card above to copy, paste it into the popup with expiry <code className="px-1 py-0.5 rounded bg-muted font-mono text-[10px] text-foreground">12/28</code> and CVV <code className="px-1 py-0.5 rounded bg-muted font-mono text-[10px] text-foreground">123</code>.
                    </p>
                    <p className="leading-relaxed">
                      2. Click <strong>Pay</strong> &rarr; On the mock bank screen, click the red <strong>[Failure]</strong> button to trigger the failure event!
                    </p>
                    <p className="leading-relaxed text-emerald-600 dark:text-emerald-400 font-medium pt-0.5">
                      ⚡ <em>Fast Demo Shortcut:</em> Click <strong>Netbanking &rarr; Demo Bank</strong> on the left of the modal and click <strong>[Failure]</strong> — zero card typing required!
                    </p>
                  </div>
                </div>
              </div>

              {/* Launch Button */}
              <Button
                onClick={handleLaunchRazorpay}
                disabled={launchingRzp || loadingConfig}
                className="w-full gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-2.5 shadow-md shadow-emerald-500/20 text-xs sm:text-sm"
              >
                {launchingRzp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Launching Razorpay Popup...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    Pay ₹1 (Razorpay Test Mode)
                  </>
                )}
              </Button>

              {/* Transparency Disclosure */}
              <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[11px] text-muted-foreground space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>What's Real vs. Sandbox</span>
                </div>
                <p className="leading-relaxed">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Real:</span>{' '}
                  Payment link dispatch, Razorpay SDK popup, webhook ingestion, ML scoring, policy evaluation, and audit logging.
                </p>
                <p className="leading-relaxed">
                  <span className="text-amber-500 font-semibold">Sandboxed:</span>{' '}
                  Auto-retry card charging uses probability simulation — real card re-charging requires a live mandate or customer re-auth, which is the payment-link recovery path above.
                </p>
              </div>
            </div>

            {/* Right: Instant 1-Click Simulated Scenarios (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h4 className="text-sm font-semibold text-foreground">Instant 1-Click Failure Scenarios</h4>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Adblock-safe & Zero Latency
                </span>
              </div>

              {/* Transparency note for instant scenarios */}
              <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-muted/30 border border-border/60 rounded-lg px-3 py-2">
                <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span>
                  Each scenario creates a <span className="font-semibold text-foreground">real DB record</span> and runs the full ML scoring + policy pipeline. Recovery outcome (success/fail) uses <span className="font-semibold text-amber-500">probability simulation</span> — identical behavior to how Razorpay Sandbox works.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SCENARIOS.map((sc) => {
                  const Icon = sc.icon
                  const isThisSimulating = simulating === sc.id
                  return (
                    <div
                      key={sc.id}
                      className="p-3.5 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all space-y-2 flex flex-col justify-between group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                            <Icon className="w-3.5 h-3.5 text-primary" />
                            <span>{sc.title}</span>
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${sc.badgeColor}`}>
                            ₹{sc.amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                          {sc.reason}
                        </p>
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-border/50">
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {sc.suggestedAction}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={simulating !== null}
                          onClick={() => handleSimulateScenario(sc)}
                          className="h-7 px-2.5 text-[11px] gap-1.5 border-primary/30 hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          {isThisSimulating ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Zap className="w-3 h-3 text-amber-500" />
                          )}
                          Trigger
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
