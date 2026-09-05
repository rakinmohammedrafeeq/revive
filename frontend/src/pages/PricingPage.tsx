import { useNavigate } from 'react-router-dom'
import { APP_LOGO_SRC } from '@/config/brandAssets'
import { APP_NAME } from '@/config/appInfo'
import { Check, Zap, Shield, TrendingUp } from 'lucide-react'

export const PricingPage = () => {
  const navigate = useNavigate()

  const tiers = [
    {
      name: 'Starter',
      price: '₹4,999',
      period: '/month',
      description: 'Perfect for small businesses getting started with payment recovery',
      features: [
        'Up to 500 recovery cases/month',
        'AI-powered failure diagnosis',
        'Basic retry policies',
        'Email support',
        'Dashboard analytics',
        'Razorpay integration'
      ],
      cta: 'Start Free Trial',
      highlighted: false
    },
    {
      name: 'Professional',
      price: '₹14,999',
      period: '/month',
      description: 'For growing businesses with higher transaction volumes',
      features: [
        'Up to 5,000 recovery cases/month',
        'Advanced ML predictions',
        'Custom retry policies',
        'SMS + Email notifications',
        'Priority support',
        'Multi-gateway support',
        'API access',
        'Audit trails'
      ],
      cta: 'Start Free Trial',
      highlighted: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'Tailored solutions for large-scale operations',
      features: [
        'Unlimited recovery cases',
        'Dedicated ML models',
        'White-glove onboarding',
        'WhatsApp notifications',
        '24/7 phone support',
        'Custom integrations',
        'SLA guarantees',
        'Compliance consulting'
      ],
      cta: 'Contact Sales',
      highlighted: false
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img src={APP_LOGO_SRC} alt={APP_NAME} className="h-6 w-6" />
            <span className="font-bold text-lg">{APP_NAME}</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your business. All plans include a 14-day free trial.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`border rounded-lg p-8 ${
                tier.highlighted
                  ? 'border-primary bg-primary/5 shadow-lg scale-105'
                  : 'border-border bg-card'
              }`}
            >
              {tier.highlighted && (
                <div className="text-xs font-semibold text-primary mb-4 uppercase tracking-wide">
                  Most Popular
                </div>
              )}
              
              <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold">{tier.price}</span>
                <span className="text-muted-foreground">{tier.period}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">{tier.description}</p>
              
              <button
                onClick={() => navigate('/register')}
                className={`w-full py-3 px-6 rounded-lg font-semibold mb-6 transition-colors ${
                  tier.highlighted
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {tier.cta}
              </button>
              
              <ul className="space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Value Props */}
        <div className="border-t border-border pt-16">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Revive?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
              <p className="text-sm text-muted-foreground">
                AI-powered recovery in under 15 minutes on average
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure & Compliant</h3>
              <p className="text-sm text-muted-foreground">
                Bank-grade security with full PCI DSS compliance
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Proven Results</h3>
              <p className="text-sm text-muted-foreground">
                Average recovery rate of 74% across all customers
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 border-t border-border pt-16">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h3 className="font-semibold mb-2">What happens after the free trial?</h3>
              <p className="text-sm text-muted-foreground">
                You can continue using Revive on a paid plan, or cancel anytime with no charges.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I change plans later?</h3>
              <p className="text-sm text-muted-foreground">
                Yes! You can upgrade or downgrade your plan at any time from your dashboard.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-sm text-muted-foreground">
                We accept all major credit/debit cards, UPI, and net banking through Razorpay.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is there a setup fee?</h3>
              <p className="text-sm text-muted-foreground">
                No setup fees for Starter and Professional plans. Enterprise plans include white-glove onboarding.
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
