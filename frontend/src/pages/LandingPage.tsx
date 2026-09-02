import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, TrendingUp, Shield, Zap, Eye, Brain, RefreshCw, Sparkles } from 'lucide-react'
import { APP_LOGO_SRC } from '@/config/brandAssets'
import { useState, useEffect } from 'react'

// Animated orbital recovery journey component
function OrbitalRecoveryJourney() {
  const [activeStep, setActiveStep] = useState(0)
  const [hoveredStep, setHoveredStep] = useState<number | null>(null)
  
  const steps = [
    {
      id: 1,
      label: 'Payment failed',
      description: '₹18,500 didn\'t go through',
      detail: 'Something didn\'t complete. Revive noticed it immediately.',
      icon: Zap,
      color: 'text-red-400',
      glowColor: 'shadow-red-500/20'
    },
    {
      id: 2,
      label: 'Revive noticed',
      description: 'Failure detected',
      detail: 'Captured in real-time from your payment gateway.',
      icon: Eye,
      color: 'text-blue-400',
      glowColor: 'shadow-blue-500/20'
    },
    {
      id: 3,
      label: 'We figured it out',
      description: 'Temporary issuer decline',
      detail: 'AI diagnosis: Recovery looks promising. Similar cases recover well.',
      icon: Brain,
      color: 'text-purple-400',
      glowColor: 'shadow-purple-500/20'
    },
    {
      id: 4,
      label: 'Policy check',
      description: 'Retry allowed',
      detail: 'Revive checks your rules before acting. This one passed.',
      icon: Shield,
      color: 'text-emerald-400',
      glowColor: 'shadow-emerald-500/20'
    },
    {
      id: 5,
      label: 'Recovery action',
      description: 'Retrying payment',
      detail: 'Recovery action stays inside configured guardrails.',
      icon: RefreshCw,
      color: 'text-cyan-400',
      glowColor: 'shadow-cyan-500/20'
    },
    {
      id: 6,
      label: 'Recovered',
      description: 'Payment successful',
      detail: 'The payment completed successfully. Revenue recovered.',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      glowColor: 'shadow-emerald-500/30'
    }
  ]

  // Auto-advance animation
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [steps.length])

  // Calculate orbital positions with moderate radius
  const getOrbitalPosition = (index: number, total: number) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2
    const radius = 160 // Reduced from 220
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    return { x, y, angle }
  }

  return (
    <div className="relative w-full h-[560px] flex items-center justify-center"> {/* Reduced height */}
      {/* Central Revive core */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {/* Rotating ring */}
          <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 w-32 h-32 -left-16 -top-16 animate-[spin_20s_linear_infinite]" />
          <div className="absolute inset-0 rounded-full border border-emerald-500/10 w-36 h-36 -left-18 -top-18 animate-[spin_30s_linear_infinite_reverse]" />
          
          {/* Central logo */}
          <div className="relative glass-emerald-strong rounded-2xl p-5 glow-emerald-strong z-10"> {/* Reduced padding */}
            <img src={APP_LOGO_SRC} alt="Revive" className="h-10 w-10" /> {/* Reduced size */}
            <div className="absolute inset-0 rounded-2xl bg-emerald-500/10 animate-pulse" style={{ animationDuration: '3s' }} />
          </div>

          {/* Orbiting particles */}
          <div className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-emerald-400 -ml-1 -mt-1 animate-[spin_8s_linear_infinite]" style={{ transformOrigin: '0 0 0', transform: 'rotate(0deg) translateX(90px)' }} />
          <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400/60 -ml-0.75 -mt-0.75 animate-[spin_12s_linear_infinite]" style={{ transformOrigin: '0 0 0', transform: 'rotate(120deg) translateX(105px)' }} />
          <div className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full bg-emerald-400/40 -ml-0.5 -mt-0.5 animate-[spin_15s_linear_infinite]" style={{ transformOrigin: '0 0 0', transform: 'rotate(240deg) translateX(120px)' }} />
        </div>
      </div>

      {/* Orbital step cards */}
      {steps.map((step, index) => {
        const { x, y } = getOrbitalPosition(index, steps.length)
        const isActive = activeStep === index
        const isHovered = hoveredStep === index
        const Icon = step.icon

        return (
          <div
            key={step.id}
            className="absolute transition-all duration-500 ease-out cursor-pointer"
            style={{
              transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
              zIndex: isActive || isHovered ? 20 : 10
            }}
            onMouseEnter={() => setHoveredStep(index)}
            onMouseLeave={() => setHoveredStep(null)}
          >
            {/* Connection line to center */}
            <div 
              className={`absolute top-1/2 left-1/2 h-0.5 origin-right transition-all duration-500 pointer-events-none ${
                isActive ? 'bg-gradient-to-l from-emerald-500/60 to-transparent' : 'bg-gradient-to-l from-emerald-500/20 to-transparent'
              }`}
              style={{
                width: `${Math.sqrt(x * x + y * y)}px`,
                transform: `rotate(${Math.atan2(-y, -x)}rad)`
              }}
            />

            {/* Step card - moderate size */}
            <div 
              className={`
                glass transition-all duration-500 rounded-xl p-3.5 min-w-[180px]
                ${isActive ? 'glass-strong scale-110 glow-emerald' : 'glass-subtle scale-100'}
                ${isHovered ? 'glass-strong scale-105 glow-emerald-soft' : ''}
                ${step.glowColor}
              `}
            >
              <div className="flex items-start gap-2.5">
                <div className={`
                  glass-emerald rounded-lg p-2 flex-shrink-0 transition-all duration-500
                  ${isActive ? 'glow-emerald scale-110' : ''}
                `}>
                  <Icon className={`h-4 w-4 ${step.color} ${isActive ? 'animate-pulse' : ''}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-text-primary mb-0.5">
                    {step.label}
                  </div>
                  <div className="text-[11px] text-text-secondary leading-tight">
                    {step.description}
                  </div>
                  {(isActive || isHovered) && (
                    <div className="text-[11px] text-text-tertiary mt-1.5 animate-fade-in leading-tight">
                      {step.detail}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Progress indicator */}
              {isActive && (
                <div className="mt-2 h-0.5 bg-glass-white-10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full animate-[progress_2.5s_linear]"
                    style={{
                      animation: 'progress 2.5s linear forwards'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* Ambient light effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute top-1/2 left-1/2 w-80 h-80 -translate-x-1/2 -translate-y-1/2 bg-emerald-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '4s' }}
        />
      </div>

      {/* Label */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
        <div className="glass-subtle px-4 py-2 rounded-full">
          <span className="text-xs text-text-tertiary">Example recovery flow</span>
        </div>
      </div>
    </div>
  )
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-atmospheric overflow-x-hidden">
      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-emerald-500/8 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-emerald-500/6 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-emerald-500/4 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '4s' }} />
      </div>

      {/* Floating Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 animate-fade-in">
        <div className="container-revive py-4">
          <div className="glass-strong rounded-full px-5 py-2.5 flex items-center justify-between max-w-6xl mx-auto">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <img src={APP_LOGO_SRC} alt="Revive" className="h-7 w-7" />
              <span className="text-h4 font-bold">Revive</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <a href="#how-it-works" className="text-body-sm text-text-secondary hover:text-text-primary transition-colors">
                How it works
              </a>
              <a href="#features" className="text-body-sm text-text-secondary hover:text-text-primary transition-colors">
                Features
              </a>
              <Link
                to="/login"
                className="glass-emerald px-4 py-1.5 rounded-full text-sm font-semibold text-text-primary hover:glass-emerald-strong transition-all hover-lift inline-flex items-center gap-2"
              >
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <Link
              to="/login"
              className="md:hidden glass-emerald px-4 py-1.5 rounded-full text-sm font-semibold"
            >
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section — Two Column Orbital Layout */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-20 min-h-screen flex items-center">
        <div className="container-revive">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center max-w-7xl mx-auto">
            
            {/* LEFT: Product Message + CTA */}
            <div className="lg:col-span-5 space-y-6 animate-slide-up max-w-xl">
              
              {/* Headline */}
              <div className="space-y-3">
                <h1 className="text-display text-balance">
                  Revenue is slipping.
                  <br />
                  <span className="text-gradient-emerald">Revive catches it.</span>
                </h1>
                <p className="text-body-lg text-text-secondary text-balance">
                  Failed payments happen. Lost revenue doesn't have to. Revive detects what's slipping away, figures out why, and brings it back.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-start gap-3.5">
                <Link
                  to="/register"
                  className="glass-emerald-strong px-6 py-3 rounded-xl text-body font-semibold hover-lift glow-emerald-pulse inline-flex items-center gap-2.5 group"
                >
                  Start recovering revenue
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#how-it-works"
                  className="glass px-6 py-3 rounded-xl text-body font-semibold hover-glass-intense inline-flex items-center gap-2.5"
                >
                  See how it works
                </a>
              </div>

              {/* Product Values */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-sm text-text-secondary">AI-powered</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-sm text-text-secondary">Policy-first</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-sm text-text-secondary">Automated</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-sm text-text-secondary">Auditable</span>
                </div>
              </div>
            </div>

            {/* RIGHT: Animated Orbital Recovery Journey */}
            <div className="lg:col-span-7 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <div className="relative lg:ml-48 xl:ml-56 2xl:ml-64">
                {/* Ambient glow behind visualization */}
                <div className="absolute inset-0 bg-emerald-500/5 rounded-3xl blur-3xl -z-10" />
                
                {/* Orbital visualization */}
                <OrbitalRecoveryJourney />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* How It Works — Detailed Flow */}
      <section id="how-it-works" className="py-16 md:py-20 relative">
        <div className="container-revive">
          <div className="text-center mb-12 animate-slide-up">
            <h2 className="text-h1 mb-3">Here's what happens</h2>
            <p className="text-body-lg text-text-secondary max-w-2xl mx-auto">
              Every failed payment goes through Revive's recovery journey.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            
            {/* Step 1 */}
            <div className="panel-glass hover-lift animate-slide-up group">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="glass-emerald h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 glow-emerald-soft group-hover:glow-emerald transition-all">
                  <Zap className="h-6 w-6 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <div className="text-label text-emerald-400 mb-1.5">DETECT</div>
                  <h3 className="text-h3 mb-1.5">Something's slipping</h3>
                  <p className="text-body text-text-secondary">
                    Revive monitors your payment gateway in real-time. The moment a payment fails, we catch it.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="h-8 w-px bg-gradient-to-b from-emerald-500/30 to-transparent" />
            </div>

            {/* Step 2 */}
            <div className="panel-glass hover-lift animate-slide-up group" style={{ animationDelay: '100ms' }}>
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="glass-emerald h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 glow-emerald-soft group-hover:glow-emerald transition-all">
                  <Brain className="h-6 w-6 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <div className="text-label text-emerald-400 mb-1.5">DIAGNOSE</div>
                  <h3 className="text-h3 mb-1.5">Revive figures out why</h3>
                  <p className="text-body text-text-secondary">
                    AI analyzes failure reason, payment history, customer behavior, and recovery probability.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="h-8 w-px bg-gradient-to-b from-emerald-500/30 to-transparent" />
            </div>

            {/* Step 3 */}
            <div className="panel-glass hover-lift animate-slide-up group" style={{ animationDelay: '200ms' }}>
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="glass-emerald h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 glow-emerald-soft group-hover:glow-emerald transition-all">
                  <Shield className="h-6 w-6 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <div className="text-label text-emerald-400 mb-1.5">GUARDRAIL</div>
                  <h3 className="text-h3 mb-1.5">Are we allowed to act?</h3>
                  <p className="text-body text-text-secondary">
                    Revive checks your policies: retry limits, timing rules, approval requirements. We only act when your rules say it's safe.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="h-8 w-px bg-gradient-to-b from-emerald-500/30 to-transparent" />
            </div>

            {/* Step 4 */}
            <div className="panel-glass hover-lift animate-slide-up group" style={{ animationDelay: '300ms' }}>
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="glass-emerald h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 glow-emerald-soft group-hover:glow-emerald transition-all">
                  <RefreshCw className="h-6 w-6 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <div className="text-label text-emerald-400 mb-1.5">RECOVER</div>
                  <h3 className="text-h3 mb-1.5">Let's bring it back</h3>
                  <p className="text-body text-text-secondary">
                    Revive takes the recommended action: retry payment, notify customer, or escalate to your team.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="h-8 w-px bg-gradient-to-b from-emerald-500/30 to-transparent" />
            </div>

            {/* Step 5 */}
            <div className="panel-glass hover-lift animate-slide-up glass-emerald-strong glow-emerald group" style={{ animationDelay: '400ms' }}>
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="glass-emerald h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 glow-emerald-strong">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <div className="text-label text-emerald-400 mb-1.5">MEASURE</div>
                  <h3 className="text-h3 mb-1.5">Nice. We got it back</h3>
                  <p className="text-body text-text-secondary">
                    Payment successful. Revenue is back where it belongs. Every action is logged for audit and compliance.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Features — Glass Cards */}
      <section id="features" className="py-16 md:py-20 bg-atmospheric-intense">
        <div className="container-revive">
          <div className="text-center mb-12 animate-slide-up">
            <h2 className="text-h1 mb-3">Built to recover what matters</h2>
            <p className="text-body-lg text-text-secondary max-w-2xl mx-auto">
              Revive combines AI intelligence with compliance guardrails to bring your revenue back safely.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
            
            <div className="card-glass hover-lift animate-slide-up">
              <div className="glass-emerald h-10 w-10 rounded-lg flex items-center justify-center mb-3 glow-emerald-soft">
                <Eye className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="text-h4 mb-2">Revive catches it</h3>
              <p className="text-body-sm text-text-secondary">
                Real-time detection captures every failed payment instantly. No revenue slips through unnoticed.
              </p>
            </div>

            <div className="card-glass hover-lift animate-slide-up" style={{ animationDelay: '50ms' }}>
              <div className="glass-emerald h-10 w-10 rounded-lg flex items-center justify-center mb-3 glow-emerald-soft">
                <Brain className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="text-h4 mb-2">Revive's take</h3>
              <p className="text-body-sm text-text-secondary">
                AI diagnosis understands why payments fail and predicts recovery probability with confidence scores.
              </p>
            </div>

            <div className="card-glass hover-lift animate-slide-up" style={{ animationDelay: '100ms' }}>
              <div className="glass-emerald h-10 w-10 rounded-lg flex items-center justify-center mb-3 glow-emerald-soft">
                <Shield className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="text-h4 mb-2">Set the boundaries</h3>
              <p className="text-body-sm text-text-secondary">
                Policy guardrails ensure recovery respects your rules: retry limits, timing constraints, approvals.
              </p>
            </div>

            <div className="card-glass hover-lift animate-slide-up" style={{ animationDelay: '150ms' }}>
              <div className="glass-emerald h-10 w-10 rounded-lg flex items-center justify-center mb-3 glow-emerald-soft">
                <RefreshCw className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="text-h4 mb-2">Smart recovery</h3>
              <p className="text-body-sm text-text-secondary">
                Intelligent retry strategies that maximize success rates by acting at optimal times.
              </p>
            </div>

            <div className="card-glass hover-lift animate-slide-up" style={{ animationDelay: '200ms' }}>
              <div className="glass-emerald h-10 w-10 rounded-lg flex items-center justify-center mb-3 glow-emerald-soft">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="text-h4 mb-2">See the bigger picture</h3>
              <p className="text-body-sm text-text-secondary">
                Track recovery rates, failure patterns, and revenue impact in real-time dashboards.
              </p>
            </div>

            <div className="card-glass hover-lift animate-slide-up" style={{ animationDelay: '250ms' }}>
              <div className="glass-emerald h-10 w-10 rounded-lg flex items-center justify-center mb-3 glow-emerald-soft">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="text-h4 mb-2">Everything that happened</h3>
              <p className="text-body-sm text-text-secondary">
                Complete audit trail. Every detection, decision, and action is logged for compliance.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-20">
        <div className="container-revive">
          <div className="max-w-3xl mx-auto text-center">
            <div className="panel-glass-lg glow-emerald-pulse animate-scale-in">
              <h2 className="text-h1 mb-3">Start recovering revenue today</h2>
              <p className="text-body-lg text-text-secondary mb-6 max-w-2xl mx-auto">
                Join businesses using Revive to intelligently recover failed payments and protect their revenue.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/register"
                  className="glass-emerald-strong px-6 py-3 rounded-xl text-body font-semibold hover-lift glow-emerald inline-flex items-center gap-2.5 group"
                >
                  Create account
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/login"
                  className="glass px-6 py-3 rounded-xl text-body font-semibold hover-glass-intense"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-glass-border py-8">
        <div className="container-revive">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <img src={APP_LOGO_SRC} alt="Revive" className="h-5 w-5" />
              <span className="text-body font-semibold">Revive</span>
              <span className="text-body-sm text-text-tertiary">AI Revenue Recovery</span>
            </Link>
            
            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a 
                href="https://www.linkedin.com/in/rakinmohammedrafeeq" 
                target="_blank" 
                rel="noopener noreferrer"
                className="glass-subtle p-2 rounded-lg hover:glass transition-all hover-lift"
                aria-label="LinkedIn"
              >
                <svg className="h-5 w-5 text-text-secondary hover:text-text-primary transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a 
                href="https://github.com/rakinmohammedrafeeq/revive" 
                target="_blank" 
                rel="noopener noreferrer"
                className="glass-subtle p-2 rounded-lg hover:glass transition-all hover-lift"
                aria-label="GitHub"
              >
                <svg className="h-5 w-5 text-text-secondary hover:text-text-primary transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
                </svg>
              </a>
              <a 
                href="https://buymeacoffee.com/rakinmohammedrafeeq" 
                target="_blank" 
                rel="noopener noreferrer"
                className="glass-emerald px-3 py-2 rounded-lg hover:glass-emerald-strong transition-all hover-lift inline-flex items-center gap-2"
              >
                <svg className="h-4 w-4 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.216 6.415l-.132-.666c-.119-.598-.388-1.163-1.001-1.379-.197-.069-.42-.098-.57-.241-.152-.143-.196-.366-.231-.572-.065-.378-.125-.756-.192-1.133-.057-.325-.102-.69-.25-.987-.195-.4-.597-.634-.996-.788a5.723 5.723 0 00-.626-.194c-1-.263-2.05-.36-3.077-.416a25.834 25.834 0 00-3.7.062c-.915.083-1.88.184-2.75.5-.318.116-.646.256-.888.501-.297.302-.393.77-.177 1.146.154.267.415.456.692.58.36.162.737.284 1.123.366 1.075.238 2.189.331 3.287.37 1.218.05 2.437.01 3.65-.118.299-.033.598-.073.896-.119.352-.054.578-.513.474-.834-.124-.383-.457-.531-.834-.473-.466.074-.96.108-1.382.146-1.177.08-2.358.082-3.536.006a22.228 22.228 0 01-1.157-.107c-.086-.01-.18-.025-.258-.036-.243-.036-.484-.08-.724-.13-.111-.027-.111-.185 0-.212h.005c.277-.06.557-.108.838-.147h.002c.131-.009.263-.032.394-.048a25.076 25.076 0 013.426-.12c.674.019 1.347.067 2.017.144l.228.031c.267.04.533.088.798.145.392.085.895.113 1.07.542.055.137.08.288.111.431l.319 1.484a.237.237 0 01-.199.284h-.003c-.037.006-.075.01-.112.015a36.704 36.704 0 01-4.743.295 37.059 37.059 0 01-4.699-.304c-.14-.017-.293-.042-.417-.06-.326-.048-.649-.108-.973-.161-.393-.065-.768-.032-1.123.161-.29.16-.527.404-.675.701-.154.316-.199.66-.267 1-.069.34-.176.707-.135 1.056.087.753.613 1.365 1.37 1.502a39.69 39.69 0 0011.343.376.483.483 0 01.535.53l-.071.697-1.018 9.907c-.041.41-.047.832-.125 1.237-.122.637-.553 1.028-1.182 1.171-.577.131-1.165.2-1.756.205-.656.004-1.31-.025-1.966-.022-.699.004-1.556-.06-2.095-.58-.475-.458-.54-1.174-.605-1.793l-.731-7.013-.322-3.094c-.037-.351-.286-.695-.678-.678-.336.015-.718.3-.678.679l.228 2.185.949 9.112c.147 1.344 1.174 2.068 2.446 2.272.742.12 1.503.144 2.257.156.966.016 1.942.053 2.892-.122 1.408-.258 2.465-1.198 2.616-2.657.34-3.332.683-6.663 1.024-9.995l.215-2.087a.484.484 0 01.39-.426c.402-.078.787-.212 1.074-.518.455-.488.546-1.124.385-1.766zm-1.478.772c-.145.137-.363.201-.578.233-2.416.359-4.866.54-7.308.46-1.748-.06-3.477-.254-5.207-.498-.17-.024-.353-.055-.47-.18-.22-.236-.111-.71-.054-.995.052-.26.152-.609.463-.646.484-.057 1.046.148 1.526.22.577.088 1.156.159 1.737.212 2.48.226 5.002.19 7.472-.14.45-.06.899-.13 1.345-.21.399-.072.84-.206 1.08.206.166.281.188.657.162.974a.544.544 0 01-.169.364z"/>
                </svg>
                <span className="text-xs font-semibold text-emerald-400">Buy me a coffee</span>
              </a>
            </div>
            
            <div className="text-body-sm text-text-tertiary">
              Built to recover the revenue that matters
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-20px) translateX(10px); }
          66% { transform: translateY(10px) translateX(-10px); }
        }
        
        .animate-float-slow {
          animation: float-slow 20s ease-in-out infinite;
        }
      `}</style>

    </div>
  )
}
