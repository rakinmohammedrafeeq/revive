import { useNavigate } from 'react-router-dom'
import { APP_LOGO_SRC } from '@/config/brandAssets'
import { APP_NAME } from '@/config/appInfo'
import { Code, Key, Send, Webhook } from 'lucide-react'

export const ApiReferencePage = () => {
  const navigate = useNavigate()

  const endpoints = [
    {
      method: 'POST',
      path: '/api/v1/recovery/cases',
      description: 'Create a new recovery case',
      auth: 'Required'
    },
    {
      method: 'GET',
      path: '/api/v1/recovery/cases/:id',
      description: 'Retrieve a recovery case by ID',
      auth: 'Required'
    },
    {
      method: 'GET',
      path: '/api/v1/recovery/cases',
      description: 'List all recovery cases with pagination',
      auth: 'Required'
    },
    {
      method: 'POST',
      path: '/api/v1/recovery/cases/:id/retry',
      description: 'Manually trigger a retry attempt',
      auth: 'Required'
    },
    {
      method: 'POST',
      path: '/api/v1/webhooks/configure',
      description: 'Configure webhook endpoints',
      auth: 'Required'
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
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <Code className="w-10 h-10 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">
              API Reference
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            RESTful API for programmatic access to Revive recovery platform
          </p>
        </div>

        {/* Authentication */}
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <Key className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Authentication</h2>
          </div>
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-card p-6">
              <p className="text-sm text-muted-foreground mb-4">
                All API requests require authentication using an API key passed in the Authorization header.
              </p>
              <div className="bg-muted p-4 rounded font-mono text-sm">
                <div className="text-muted-foreground">Authorization: Bearer YOUR_API_KEY</div>
              </div>
            </div>
          </div>
        </div>

        {/* Base URL */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Base URL</h2>
          <div className="bg-muted p-4 rounded font-mono text-sm border border-border">
            https://api.revive.com/v1
          </div>
        </div>

        {/* Endpoints */}
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <Send className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Endpoints</h2>
          </div>
          <div className="space-y-4">
            {endpoints.map((endpoint, idx) => (
              <div key={idx} className="border border-border rounded-lg overflow-hidden bg-card">
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <span className={`px-3 py-1 rounded text-xs font-bold ${
                      endpoint.method === 'GET' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'
                    }`}>
                      {endpoint.method}
                    </span>
                    <div className="flex-1">
                      <code className="text-sm font-mono text-foreground">{endpoint.path}</code>
                      <p className="text-sm text-muted-foreground mt-2">{endpoint.description}</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    🔒 Authentication: {endpoint.auth}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Example Request */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Example Request</h2>
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-card px-6 py-4 border-b border-border">
              <h3 className="font-semibold">POST /api/v1/recovery/cases</h3>
            </div>
            <div className="bg-muted p-6">
              <pre className="text-sm font-mono overflow-x-auto">
                <code>{`curl -X POST https://api.revive.com/v1/recovery/cases \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "paymentId": "pay_123",
    "amount": 99900,
    "currency": "INR",
    "customer": {
      "email": "customer@example.com",
      "phone": "+919876543210"
    },
    "metadata": {
      "orderId": "order_456"
    }
  }'`}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Example Response */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Example Response</h2>
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-card px-6 py-4 border-b border-border">
              <h3 className="font-semibold">200 OK</h3>
            </div>
            <div className="bg-muted p-6">
              <pre className="text-sm font-mono overflow-x-auto">
                <code>{`{
  "id": "case_789",
  "status": "PENDING",
  "paymentId": "pay_123",
  "amount": 99900,
  "currency": "INR",
  "customer": {
    "email": "customer@example.com",
    "phone": "+919876543210"
  },
  "attempts": 0,
  "createdAt": "2026-09-05T10:30:00Z",
  "updatedAt": "2026-09-05T10:30:00Z"
}`}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Webhooks */}
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <Webhook className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Webhooks</h2>
          </div>
          <div className="border border-border rounded-lg p-6 bg-card">
            <p className="text-sm text-muted-foreground mb-4">
              Revive sends webhook events to notify your application about recovery case updates.
            </p>
            <h3 className="font-semibold mb-3">Available Events</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary">→</span>
                <span><code className="bg-muted px-2 py-0.5 rounded">case.created</code> - Recovery case created</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">→</span>
                <span><code className="bg-muted px-2 py-0.5 rounded">case.updated</code> - Recovery case status changed</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">→</span>
                <span><code className="bg-muted px-2 py-0.5 rounded">case.succeeded</code> - Recovery successful</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">→</span>
                <span><code className="bg-muted px-2 py-0.5 rounded">case.failed</code> - Recovery failed after all attempts</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Rate Limits */}
        <div className="border-t border-border pt-16">
          <h2 className="text-2xl font-bold mb-6">Rate Limits</h2>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-primary mb-2">1000</div>
                <div className="text-sm text-muted-foreground">Requests per hour (Starter)</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">5000</div>
                <div className="text-sm text-muted-foreground">Requests per hour (Professional)</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">Unlimited</div>
                <div className="text-sm text-muted-foreground">Requests (Enterprise)</div>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
