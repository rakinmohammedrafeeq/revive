import { useNavigate } from 'react-router-dom'
import { APP_LOGO_SRC } from '@/config/brandAssets'
import { APP_NAME } from '@/config/appInfo'
import { ShoppingCart, CreditCard, Repeat, TrendingUp, Building2, Users } from 'lucide-react'

export const UseCasesPage = () => {
  const navigate = useNavigate()

  const useCases = [
    {
      icon: <ShoppingCart className="w-8 h-8 text-primary" />,
      title: 'E-commerce Checkout Recovery',
      description: 'Recover abandoned carts and failed checkouts with AI-powered retry logic and smart payment link delivery.',
      results: ['74% recovery rate', '₹2.4M salvaged annually', '< 15 min avg recovery time'],
      industries: ['Retail', 'Fashion', 'Electronics']
    },
    {
      icon: <Repeat className="w-8 h-8 text-primary" />,
      title: 'Subscription Retention',
      description: 'Prevent churn from failed recurring payments with intelligent retry scheduling and alternative payment method fallbacks.',
      results: ['82% retention rate', '67% fewer cancellations', 'Automatic card updater'],
      industries: ['SaaS', 'Streaming', 'Memberships']
    },
    {
      icon: <CreditCard className="w-8 h-8 text-primary" />,
      title: 'Payment Failure Recovery',
      description: 'Diagnose and recover from payment gateway timeouts, issuer declines, and authorization failures in real-time.',
      results: ['18% success rate', 'Multi-gateway routing', 'Policy-driven retries'],
      industries: ['Fintech', 'Gaming', 'Education']
    },
    {
      icon: <Building2 className="w-8 h-8 text-primary" />,
      title: 'B2B Invoice Collection',
      description: 'Automate dunning workflows for overdue invoices with compliant escalation and promise-to-pay tracking.',
      results: ['45-day reduction in DSO', '₹8.5M collected', 'Automated reminders'],
      industries: ['Manufacturing', 'Wholesale', 'Services']
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-primary" />,
      title: 'Revenue Intelligence',
      description: 'Gain insights into payment failure patterns, recovery effectiveness, and intervention ROI with ML-powered analytics.',
      results: ['Real-time dashboards', 'Predictive analytics', 'Audit trails'],
      industries: ['All Industries']
    },
    {
      icon: <Users className="w-8 h-8 text-primary" />,
      title: 'High-Value Customer Recovery',
      description: 'Prioritize and personalize recovery attempts for premium customers with manual review workflows and white-glove service.',
      results: ['VIP escalation', 'Account managers', 'Custom policies'],
      industries: ['Luxury', 'Enterprise', 'Healthcare']
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
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Use Cases
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how businesses across industries use Revive to recover lost revenue and improve payment success rates
          </p>
        </div>

        {/* Use Cases Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {useCases.map((useCase, index) => (
            <div
              key={index}
              className="border border-border rounded-lg p-8 hover:border-primary/50 transition-colors"
            >
              <div className="mb-6">{useCase.icon}</div>
              <h3 className="text-2xl font-bold mb-3">{useCase.title}</h3>
              <p className="text-muted-foreground mb-6">{useCase.description}</p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Key Results</h4>
                  <ul className="space-y-2">
                    {useCase.results.map((result, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {result}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Industries</h4>
                  <div className="flex flex-wrap gap-2">
                    {useCase.industries.map((industry, i) => (
                      <span
                        key={i}
                        className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary"
                      >
                        {industry}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Recover Your Revenue?</h2>
          <p className="text-muted-foreground mb-6">
            Join businesses recovering millions in lost revenue with AI-powered payment recovery
          </p>
          <button
            onClick={() => navigate('/register')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Start Free Trial
          </button>
        </div>
      </main>
    </div>
  )
}
