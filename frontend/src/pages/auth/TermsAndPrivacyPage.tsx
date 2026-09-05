import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Shield, 
  Lock, 
  Scale, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  Server, 
  Brain, 
  Sliders, 
  ScrollText, 
  Users, 
  CreditCard, 
  ArrowLeft,
  KeyRound,
  ExternalLink,
  ShieldCheck,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { APP_LOGO_SRC } from '@/config/brandAssets'
import { APP_NAME } from '@/config/appInfo'
import { useAuth } from '@/contexts/AuthContext'

export function TermsAndPrivacyPage() {
  const { isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState<string>('terms')

  const handleLogoClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const currentDate = new Date().toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  })

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
          <Link 
            to="/" 
            onClick={handleLogoClick}
            className="flex items-center gap-3 group cursor-pointer"
          >
            <div className="relative">
              <img src={APP_LOGO_SRC} alt={APP_NAME} className="h-9 w-9 flex-shrink-0" />
              <div className="absolute -inset-1 rounded-full bg-primary/20 blur-sm -z-10 group-hover:bg-primary/30 transition-colors" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-foreground group-hover:text-primary transition-colors">
                {APP_NAME}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Autonomous AI Payment Recovery
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <ThemeToggle />
            {isAuthenticated ? (
              <Button asChild variant="outline" size="sm" className="gap-1.5 border-border/80">
                <Link to="/app/dashboard">
                  <ArrowLeft className="h-4 w-4 text-primary" />
                  <span>Return to Command Center</span>
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm" className="gap-1.5 border-border/80">
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 text-primary" />
                  <span>Back to Home</span>
                </Link>
              </Button>
            )}
          </div>
        </header>

        {/* Page Title & Status Banner */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Legal Documentation
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Terms of Service, Privacy Policy & Security Architecture for {APP_NAME}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary text-xs py-1 px-2.5">
                <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                PCI-DSS Level 1 Gateway Partner
              </Badge>
              <Badge variant="outline" className="border-border text-muted-foreground text-xs py-1 px-2.5">
                Last updated: {currentDate}
              </Badge>
            </div>
          </div>

          {/* Quick Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-foreground block">Zero Unmasked Card Storage</span>
                <span className="text-muted-foreground">PANs, CVVs, & PINs are never captured or saved.</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm flex items-start gap-3">
              <Brain className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-foreground block">AI Failure Diagnostics</span>
                <span className="text-muted-foreground">Root-cause classification via machine learning models.</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm flex items-start gap-3">
              <Sliders className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-foreground block">Deterministic Guardrails</span>
                <span className="text-muted-foreground">Enforced cooldowns, attempt ceilings & quiet hours.</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm flex items-start gap-3">
              <ScrollText className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-foreground block">Immutable Audit Trail</span>
                <span className="text-muted-foreground">Full traceability of automated retries and admin actions.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Legal Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/70 p-1 rounded-xl border border-border/60 w-full sm:w-auto flex flex-wrap">
            <TabsTrigger value="terms" className="flex items-center gap-2 flex-1 sm:flex-initial">
              <Scale className="h-4 w-4" />
              <span>Terms of Service</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2 flex-1 sm:flex-initial">
              <Lock className="h-4 w-4" />
              <span>Privacy Policy</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2 flex-1 sm:flex-initial">
              <Shield className="h-4 w-4" />
              <span>Security & Compliance</span>
            </TabsTrigger>
          </TabsList>

          {/* ========================================================================= */}
          {/* TAB 1: TERMS OF SERVICE                                                   */}
          {/* ========================================================================= */}
          <TabsContent value="terms" className="space-y-6 outline-none">
            <Card className="border-border/80 bg-card/90 shadow-xl backdrop-blur-md">
              <CardHeader className="border-b border-border/60 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-foreground">Terms of Service</CardTitle>
                    <CardDescription className="mt-1">
                      Terms governing the use of {APP_NAME}&apos;s autonomous revenue recovery engine, machine learning models, and telemetry services.
                    </CardDescription>
                  </div>
                  <Scale className="h-7 w-7 text-primary/80 hidden sm:block" />
                </div>
              </CardHeader>
              <CardContent className="space-y-8 pt-6 text-sm">
                {/* 1. Acceptance */}
                <div className="space-y-2.5">
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <span className="text-primary font-mono text-sm">01.</span> Acceptance of Terms
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    By registering an account, integrating your payment gateway, or accessing the {APP_NAME} platform, you enter into a legally binding agreement with {APP_NAME} Technologies. If you are accepting on behalf of a business, merchant, or digital organization, you represent that you possess the legal authority to bind that entity to these Terms. If you do not agree to these terms, you must refrain from accessing or utilizing the service.
                  </p>
                </div>

                {/* 2. Platform Architecture & Modules */}
                <div className="space-y-2.5">
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <span className="text-primary font-mono text-sm">02.</span> Platform Architecture & Capabilities
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {APP_NAME} delivers an autonomous intelligence suite designed to diagnose transaction drops, orchestrate smart retry schedules, and maximize merchant revenue recovery. The platform encompasses the following core operational modules:
                  </p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <li className="p-3 rounded-lg border border-border/60 bg-muted/30">
                      <span className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
                        <Activity className="h-4 w-4 text-emerald-500" /> Command Center
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Real-time revenue metrics, failure cause distribution, recovered sum tracking, and autonomous recovery stream telemetry.
                      </span>
                    </li>
                    <li className="p-3 rounded-lg border border-border/60 bg-muted/30">
                      <span className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
                        <Zap className="h-4 w-4 text-emerald-500" /> Recovery Operations
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Active case tracking, failure event ingestion, smart retry dispatch, and multi-stage lifecycle state management.
                      </span>
                    </li>
                    <li className="p-3 rounded-lg border border-border/60 bg-muted/30">
                      <span className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
                        <Brain className="h-4 w-4 text-emerald-500" /> ML Diagnostic Engine
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Root-cause classification heuristics analyzing error codes, payment instruments, temporal patterns, and bank switch latency.
                      </span>
                    </li>
                    <li className="p-3 rounded-lg border border-border/60 bg-muted/30">
                      <span className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
                        <Sliders className="h-4 w-4 text-emerald-500" /> Policy Engine & Guardrails
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Deterministic controls governing retry cooldown periods, maximum attempt limits, quiet hours, and value thresholds.
                      </span>
                    </li>
                    <li className="p-3 rounded-lg border border-border/60 bg-muted/30">
                      <span className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
                        <FileText className="h-4 w-4 text-emerald-500" /> Batch Evaluation
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Bulk failure dataset stress testing, simulation of policy rule permutations, and scale validation.
                      </span>
                    </li>
                    <li className="p-3 rounded-lg border border-border/60 bg-muted/30">
                      <span className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
                        <ScrollText className="h-4 w-4 text-emerald-500" /> Immutable Audit Trail
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Append-only tamper-evident logging of every automated retry, policy modification, and analyst intervention.
                      </span>
                    </li>
                  </ul>
                </div>

                {/* 3. Cardholder Data Exemption & PCI-DSS */}
                <div className="space-y-2.5">
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <span className="text-primary font-mono text-sm">03.</span> Payment Cardholder Data Exemption & PCI-DSS Scope
                  </h3>
                  <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
                    <p className="text-foreground font-medium">
                      Critical Card Security Guarantee:
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      {APP_NAME} operates strictly out of scope for unmasked cardholder data. <strong>We do not intercept, ingest, parse, process, or store unmasked Primary Account Numbers (PAN), Card Verification Values (CVV), expiration dates, or card PINs.</strong> All live payment transactions, card tokenizations, and retry dispatches are executed directly through certified, PCI-DSS Level 1 compliant gateway partners (such as Razorpay).
                    </p>
                    <p className="text-xs text-muted-foreground">
                      In the developer Test Sandbox, transactions utilize designated test card instruments solely within simulated sandbox environments to evaluate recovery workflows without financial liability.
                    </p>
                  </div>
                </div>

                {/* 4. User Accounts & RBAC */}
                <div className="space-y-2.5">
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <span className="text-primary font-mono text-sm">04.</span> Account Access & Role-Based Access Control (RBAC)
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Access to {APP_NAME} is partitioned through three distinct role tiers:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                    <div className="p-3 rounded-lg border border-border/80 bg-card">
                      <span className="font-bold text-foreground block text-sm">ADMIN</span>
                      <span className="text-muted-foreground mt-1 block">
                        Full administrative authority: user creation, role assignment, policy configuration, demo seed triggers, and audit oversight.
                      </span>
                    </div>
                    <div className="p-3 rounded-lg border border-border/80 bg-card">
                      <span className="font-bold text-foreground block text-sm">ANALYST</span>
                      <span className="text-muted-foreground mt-1 block">
                        Operational recovery access: case evaluation, retry dispatch, batch simulation, and telemetry inspection.
                      </span>
                    </div>
                    <div className="p-3 rounded-lg border border-border/80 bg-card">
                      <span className="font-bold text-foreground block text-sm">VIEWER</span>
                      <span className="text-muted-foreground mt-1 block">
                        Read-only telemetry access: Command Center charts, recovery rate metrics, and model performance logs.
                      </span>
                    </div>
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-xs pt-1">
                    You are solely responsible for maintaining the confidentiality of your account credentials, secret keys, and webhook signing tokens. Any action executed through your authenticated credentials is deemed authorized by your organization.
                  </p>
                </div>

                {/* 5. Heuristic Nature & Disclaimer */}
                <div className="space-y-2.5">
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <span className="text-primary font-mono text-sm">05.</span> Machine Learning Heuristics & Recovery Disclaimer
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {APP_NAME}&apos;s failure diagnoses and retry timings are probabilistic recommendations generated by machine learning models and heuristics trained on historic payment telemetry. 
                  </p>
                  <div className="p-3.5 rounded-lg border border-amber-500/20 bg-amber-500/5 text-xs text-muted-foreground space-y-1">
                    <div className="font-semibold text-amber-500 flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" /> No Guarantee of 100% Payment Recovery
                    </div>
                    <p>
                      While {APP_NAME} optimizes retry execution to recover legitimate drop-offs, payment finality depends on external variables beyond our control, including issuing bank authorization switches, cardholder account balance, mandate validity, and customer authentication. {APP_NAME} does not warrant that every failed transaction can or will be successfully recovered.
                    </p>
                  </div>
                </div>

                {/* 6. Acceptable Use */}
                <div className="space-y-2.5">
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <span className="text-primary font-mono text-sm">06.</span> Acceptable Merchant Usage
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    You agree that you will not:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2 text-xs">
                    <li>Inject synthetic fraudulent payment payloads or spoofed card telemetry into production rails</li>
                    <li>Utilize the platform to bypass bank velocity checks, card network fraud rules, or chargeback thresholds</li>
                    <li>Attempt unauthorized reverse engineering, decompilation, or scraping of ML scoring algorithms</li>
                    <li>Configure aggressive retry policies that violate quiet hours or consumer harassment guidelines</li>
                  </ul>
                </div>

                {/* 7. Termination */}
                <div className="space-y-2.5">
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <span className="text-primary font-mono text-sm">07.</span> Account Deactivation & Service Disconnection
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    You may terminate your service access and disconnect payment gateway webhooks at any time. Administrators can deactivate user accounts via the Admin Management console. {APP_NAME} reserves the right to suspend or terminate accounts that breach acceptable use standards or introduce platform security vulnerabilities.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========================================================================= */}
          {/* TAB 2: PRIVACY POLICY                                                     */}
          {/* ========================================================================= */}
          <TabsContent value="privacy" className="space-y-6 outline-none">
            <Card className="border-border/80 bg-card/90 shadow-xl backdrop-blur-md">
              <CardHeader className="border-b border-border/60 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-foreground">Privacy Policy</CardTitle>
                    <CardDescription className="mt-1">
                      How {APP_NAME} collects, analyzes, protects, and handles merchant account data and payment failure telemetry.
                    </CardDescription>
                  </div>
                  <Lock className="h-7 w-7 text-primary/80 hidden sm:block" />
                </div>
              </CardHeader>
              <CardContent className="space-y-8 pt-6 text-sm">
                {/* 1. Information Collected */}
                <div className="space-y-2.5">
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <span className="text-primary font-mono text-sm">01.</span> Categories of Data Collected
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    To deliver autonomous failure diagnosis and retry orchestration, {APP_NAME} processes specific, limited categories of operational data:
                  </p>
                  
                  <div className="space-y-3 pt-1">
                    <div className="p-3 rounded-lg border border-border/70 bg-muted/20">
                      <span className="font-semibold text-foreground block text-xs uppercase tracking-wider text-primary">
                        A. Account & Credential Telemetry
                      </span>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Merchant representative full name, business email address, cryptographically salted password hashes (BCrypt), assigned platform role (<code className="text-[11px] bg-muted px-1 py-0.5 rounded">ADMIN</code>, <code className="text-[11px] bg-muted px-1 py-0.5 rounded">ANALYST</code>, <code className="text-[11px] bg-muted px-1 py-0.5 rounded">VIEWER</code>), and Google OAuth2 profile identifiers if Single Sign-On is utilized.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border border-border/70 bg-muted/20">
                      <span className="font-semibold text-foreground block text-xs uppercase tracking-wider text-primary">
                        B. Transaction Failure Telemetry
                      </span>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Webhook failure payloads including payment gateway transaction identifiers (e.g. <code className="text-[11px] bg-muted px-1 py-0.5 rounded">pay_...</code>, <code className="text-[11px] bg-muted px-1 py-0.5 rounded">order_...</code>), failure reason codes (e.g. <code className="text-[11px] bg-muted px-1 py-0.5 rounded">GATEWAY_TIMEOUT</code>, <code className="text-[11px] bg-muted px-1 py-0.5 rounded">INSUFFICIENT_FUNDS</code>), payment instrument categories (<code className="text-[11px] bg-muted px-1 py-0.5 rounded">Credit Card</code>, <code className="text-[11px] bg-muted px-1 py-0.5 rounded">UPI</code>, <code className="text-[11px] bg-muted px-1 py-0.5 rounded">NetBanking</code>), transaction amounts, currency codes, and error timestamps.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border border-border/70 bg-muted/20">
                      <span className="font-semibold text-foreground block text-xs uppercase tracking-wider text-primary">
                        C. System & Audit Records
                      </span>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Append-only operational logs capturing retry dispatch outcomes, policy configuration changes, manual recovery overrides, batch evaluation executions, and authentication session events.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                      <span className="font-semibold text-destructive block text-xs uppercase tracking-wider">
                        Explicit Exclusion: Zero Raw Financial Credentials
                      </span>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {APP_NAME} does <strong>NOT</strong> collect, view, or retain 16-digit cardholder numbers, CVVs, expiration dates, card PINs, netbanking passwords, or one-time passwords (OTPs).
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. How Data is Used */}
                <div className="space-y-2.5">
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <span className="text-primary font-mono text-sm">02.</span> How We Utilize Information
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    All ingested operational data is used exclusively to deliver and refine revenue recovery services:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 text-muted-foreground ml-2 text-xs">
                    <li>Evaluating payment error codes and transaction attributes to categorize failure causes via ML models</li>
                    <li>Validating deterministic merchant guardrails (cooldown periods, retry caps, quiet hour boundaries)</li>
                    <li>Calculating Command Center analytics: recovery rates, recovered revenue sums, and model accuracy benchmarks</li>
                    <li>Maintaining an immutable, chronological audit trail for governance, compliance, and dispute resolution</li>
                    <li>Administering secure platform access, role provisioning, and password recovery verification</li>
                  </ul>
                </div>

                {/* 3. Information Sharing */}
                <div className="space-y-2.5">
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <span className="text-primary font-mono text-sm">03.</span> Information Sharing & Third-Party Disclosure
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong>We do not sell, rent, monetize, or trade your organization&apos;s data or customer transaction records.</strong> Telemetry is shared only under the following strictly defined conditions:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2 text-xs">
                    <li><strong>Certified Payment Gateways:</strong> Transmitting tokenized retry requests to your designated payment gateway provider (e.g. Razorpay) to complete recovery charges.</li>
                    <li><strong>Infrastructure Hosting:</strong> Storing telemetry on enterprise cloud infrastructure protected by multi-tenant access controls and encryption at rest.</li>
                    <li><strong>Legal Mandates:</strong> Where disclosure is required to comply with court orders, banking regulations, or governing laws.</li>
                  </ul>
                </div>

                {/* 4. Security Architecture */}
                <div className="space-y-2.5">
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <span className="text-primary font-mono text-sm">04.</span> Technical Security Safeguards
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We maintain comprehensive administrative and technical controls to safeguard your data:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-lg border border-border/70 bg-card text-xs">
                      <span className="font-semibold text-foreground block mb-1">Transit Encryption</span>
                      <span className="text-muted-foreground">Enforced TLS 1.3 encryption across all client-server and webhook communication channels.</span>
                    </div>
                    <div className="p-3 rounded-lg border border-border/70 bg-card text-xs">
                      <span className="font-semibold text-foreground block mb-1">Cryptographic Hashing</span>
                      <span className="text-muted-foreground">User passwords are hashed using salted BCrypt with high work factors before database persistence.</span>
                    </div>
                    <div className="p-3 rounded-lg border border-border/70 bg-card text-xs">
                      <span className="font-semibold text-foreground block mb-1">Stateless JWT Authentication</span>
                      <span className="text-muted-foreground">Session tokens are digitally signed with secret keys, featuring automatic expiration and role verification.</span>
                    </div>
                    <div className="p-3 rounded-lg border border-border/70 bg-card text-xs">
                      <span className="font-semibold text-foreground block mb-1">Immutable Audit Logging</span>
                      <span className="text-muted-foreground">System actions are committed to an append-only audit log with timestamped actor attribution.</span>
                    </div>
                  </div>
                </div>

                {/* 5. User Rights */}
                <div className="space-y-2.5">
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <span className="text-primary font-mono text-sm">05.</span> Data Rights & Administrative Requests
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    You possess the right to inspect platform telemetry, verify your organization&apos;s recovery records via the Audit Trail, and request account deactivation or telemetry purging. These requests can be fulfilled directly by your organization&apos;s designated Administrator via the Admin Users panel or by contacting our team.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========================================================================= */}
          {/* TAB 3: SECURITY & COMPLIANCE SUMMARY                                      */}
          {/* ========================================================================= */}
          <TabsContent value="security" className="space-y-6 outline-none">
            <Card className="border-border/80 bg-card/90 shadow-xl backdrop-blur-md">
              <CardHeader className="border-b border-border/60 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-foreground">Security & Compliance Overview</CardTitle>
                    <CardDescription className="mt-1">
                      Comprehensive technical safeguards, governance protocols, and data protection mechanisms.
                    </CardDescription>
                  </div>
                  <Shield className="h-7 w-7 text-primary/80 hidden sm:block" />
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-border/70 bg-card space-y-2">
                    <div className="flex items-center gap-2 text-primary font-semibold text-base">
                      <CreditCard className="h-5 w-5" /> PCI-DSS Isolation
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      By delegating all card authorization, tokenization, and recurring credential storage to certified Level 1 payment gateways (such as Razorpay), {APP_NAME} eliminates the risk of card data breaches. No unmasked card PAN or CVV is ever visible to Revive servers or personnel.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-border/70 bg-card space-y-2">
                    <div className="flex items-center gap-2 text-primary font-semibold text-base">
                      <Users className="h-5 w-5" /> Role-Based Access Control
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Strict role boundaries (<code className="text-[11px] bg-muted px-1 rounded">ADMIN</code>, <code className="text-[11px] bg-muted px-1 rounded">ANALYST</code>, <code className="text-[11px] bg-muted px-1 rounded">VIEWER</code>) ensure least-privilege operations. Sensitive administrative controls, user provisioning, and policy changes are gated exclusively to verified Administrators.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-border/70 bg-card space-y-2">
                    <div className="flex items-center gap-2 text-primary font-semibold text-base">
                      <Lock className="h-5 w-5" /> Cryptographic Integrity
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      All platform data in transit is protected via modern TLS 1.3 encryption. Passwords and credentials are never stored in plaintext and are protected using BCrypt hashing with cryptographic salting.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-border/70 bg-card space-y-2">
                    <div className="flex items-center gap-2 text-primary font-semibold text-base">
                      <ScrollText className="h-5 w-5" /> Audit Traceability
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Every retry attempt, manual override, simulation run, and policy configuration change is written to an immutable audit trail, complete with timestamp, actor attribution, and execution outcome for compliance transparency.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3 mt-4">
                  <KeyRound className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <span className="font-semibold text-foreground block">Questions regarding Security or Privacy?</span>
                    <span className="text-muted-foreground block">
                      For compliance inquiries, data protection audits, or administrative deletion requests, please contact our security team or your designated platform Administrator.
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="border-t border-border/60 pt-6 pb-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} {APP_NAME} Technologies. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" /> Autonomous Recovery Platform
            </span>
            <span>•</span>
            <Link to="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span>•</span>
            <Link to="/app/dashboard" className="hover:text-foreground transition-colors">
              Command Center
            </Link>
          </div>
        </footer>
      </div>
    </div>
  )
}


