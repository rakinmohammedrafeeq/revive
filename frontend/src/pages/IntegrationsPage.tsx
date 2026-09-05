import { useNavigate } from 'react-router-dom'
import { APP_LOGO_SRC } from '@/config/brandAssets'
import { APP_NAME } from '@/config/appInfo'
import { CheckCircle2, ExternalLink } from 'lucide-react'

export const IntegrationsPage = () => {
  const navigate = useNavigate()

  const integrations = [
    {
      name: 'Razorpay',
      logo: '💳',
      description: 'Payment gateway integration for transaction processing and recovery',
      status: 'Live',
      category: 'Payments'
    },
    {
      name: 'PostgreSQL',
      logo: '🐘',
      description: 'Database for audit trails, recovery cases, and ML telemetry',
      status: 'Live',
      category: 'Database'
    },
    {
      name: 'Groq',
      logo: '⚡',
      description: 'Fast LLM inference for AI-powered failure diagnosis',
      status: 'Live',
      category: 'AI/ML'
    },
    {
      name: 'Google Gemini',
      logo: '🤖',
      description: 'Multimodal AI for receipt scanning and categorization',
      status: 'Live',
      category: 'AI/ML'
    },
    {
      name: 'SMS Gateway',
      logo: '📱',
      description: 'SMS delivery for payment link notifications',
      status: 'Live',
      category: 'Communications'
    },
    {
      name: 'WhatsApp Business API',
      logo: '💬',
      description: 'WhatsApp notifications for high-priority recovery attempts',
      status: 'Planned',
      category: 'Communications'
    },
    {
      name: 'Stripe',
      logo: '💸',
      description: 'Alternative payment gateway support',
      status: 'Planned',
      category: 'Payments'
    },
    {
      name: 'Slack',
      logo: '💼',
      description: 'Team notifications for recovery milestones',
      status: 'Planned',
      category: 'Communications'
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
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Integrations
          </h1>
          <p className="text-lg text-muted-foreground">
            Connect Revive with your existing tools and services
          </p>
        </div>

        {/* Integration Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration, index) => (
            <div
              key={index}
              className="border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-4xl">{integration.logo}</div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  integration.status === 'Live' 
                    ? 'bg-green-500/10 text-green-600' 
                    : 'bg-yellow-500/10 text-yellow-600'
                }`}>
                  {integration.status}
                </span>
              </div>
              <h3 className="font-semibold text-lg mb-2">{integration.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {integration.description}
              </p>
              <span className="text-xs text-muted-foreground/70">
                {integration.category}
              </span>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 border border-border rounded-lg p-8 text-center bg-card/30">
          <h2 className="text-2xl font-bold mb-4">Need a Custom Integration?</h2>
          <p className="text-muted-foreground mb-6">
            We can build custom integrations for enterprise customers. Contact our team to discuss your requirements.
          </p>
          <button
            onClick={() => navigate('/contact')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Contact Sales
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  )
}
