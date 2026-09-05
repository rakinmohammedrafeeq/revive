import { useNavigate } from 'react-router-dom'
import { APP_LOGO_SRC } from '@/config/brandAssets'
import { APP_NAME } from '@/config/appInfo'
import { Book, Code, Zap, Shield, Database } from 'lucide-react'

export const DocumentationPage = () => {
  const navigate = useNavigate()

  const sections = [
    {
      icon: <Zap className="w-6 h-6 text-primary" />,
      title: 'Getting Started',
      description: 'Quick start guide to integrate Revive into your application',
      topics: ['Installation', 'Authentication', 'First Recovery Case', 'Dashboard Setup']
    },
    {
      icon: <Code className="w-6 h-6 text-primary" />,
      title: 'API Reference',
      description: 'Complete REST API documentation with examples',
      topics: ['Recovery API', 'Webhooks', 'Authentication', 'Error Handling']
    },
    {
      icon: <Shield className="w-6 h-6 text-primary" />,
      title: 'Recovery Policies',
      description: 'Configure intelligent retry strategies and escalation rules',
      topics: ['Policy Types', 'Retry Logic', 'Escalation Rules', 'Best Practices']
    },
    {
      icon: <Database className="w-6 h-6 text-primary" />,
      title: 'Integrations',
      description: 'Connect Revive with your existing payment stack',
      topics: ['Razorpay', 'Stripe', 'SMS Gateway', 'Webhooks']
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
        <div className="mb-16 text-center">
          <div className="flex justify-center mb-4">
            <Book className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Documentation
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to integrate and optimize Revive for your business
          </p>
        </div>

        {/* Quick Links */}
        <div className="mb-16 p-6 bg-primary/5 border border-primary/20 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <a href="#getting-started" className="text-sm text-primary hover:underline">→ Getting Started</a>
            <a href="#api-reference" className="text-sm text-primary hover:underline">→ API Reference</a>
            <a href="#webhooks" className="text-sm text-primary hover:underline">→ Webhooks</a>
            <a href="#policies" className="text-sm text-primary hover:underline">→ Recovery Policies</a>
          </div>
        </div>

        {/* Documentation Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {sections.map((section) => (
            <div key={section.title} className="border border-border rounded-lg p-6 bg-card hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                {section.icon}
                <h3 className="text-xl font-bold">{section.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{section.description}</p>
              <ul className="space-y-2">
                {section.topics.map((topic) => (
                  <li key={topic} className="text-sm flex items-center gap-2">
                    <span className="text-primary">→</span>
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Code Example */}
        <div className="border border-border rounded-lg overflow-hidden mb-16">
          <div className="bg-card px-6 py-4 border-b border-border">
            <h3 className="font-semibold">Quick Start Example</h3>
          </div>
          <div className="bg-muted p-6">
            <pre className="text-sm font-mono overflow-x-auto">
              <code>{`// Initialize Revive SDK
import { Revive } from '@revive/sdk';

const revive = new Revive({
  apiKey: 'your_api_key',
  environment: 'production'
});

// Create a recovery case
const recoveryCase = await revive.recovery.create({
  paymentId: 'pay_123',
  amount: 99900,
  currency: 'INR',
  customer: {
    email: 'customer@example.com',
    phone: '+919876543210'
  },
  metadata: {
    orderId: 'order_456'
  }
});

console.log('Recovery case created:', recoveryCase.id);`}</code>
            </pre>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="border-t border-border pt-16">
          <h2 className="text-2xl font-bold mb-8">Additional Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-border rounded-lg p-6 bg-card">
              <h3 className="font-semibold mb-2">API Reference</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Detailed API endpoints and parameters
              </p>
              <a href="/api-reference" className="text-sm text-primary hover:underline">
                View API Docs →
              </a>
            </div>
            <div className="border border-border rounded-lg p-6 bg-card">
              <h3 className="font-semibold mb-2">GitHub Repository</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Browse source code and examples
              </p>
              <a href="https://github.com/rakinmohammedrafeeq/revive" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                View on GitHub →
              </a>
            </div>
            <div className="border border-border rounded-lg p-6 bg-card">
              <h3 className="font-semibold mb-2">Support</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get help from our support team
              </p>
              <a href="/contact" className="text-sm text-primary hover:underline">
                Contact Support →
              </a>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
