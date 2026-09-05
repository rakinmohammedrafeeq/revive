import { useNavigate } from 'react-router-dom'
import { APP_LOGO_SRC } from '@/config/brandAssets'
import { APP_NAME } from '@/config/appInfo'
import { Shield, Lock, Eye, Server, CheckCircle2, AlertTriangle } from 'lucide-react'

export const SecurityPage = () => {
  const navigate = useNavigate()

  const securityFeatures = [
    {
      icon: <Lock className="w-8 h-8 text-primary" />,
      title: 'End-to-End Encryption',
      description: 'All sensitive data is encrypted in transit (TLS 1.3) and at rest (AES-256)'
    },
    {
      icon: <Shield className="w-8 h-8 text-primary" />,
      title: 'PCI DSS Compliant',
      description: 'Payment Card Industry Data Security Standard certified infrastructure'
    },
    {
      icon: <Eye className="w-8 h-8 text-primary" />,
      title: 'SOC 2 Type II',
      description: 'Independently audited for security, availability, and confidentiality'
    },
    {
      icon: <Server className="w-8 h-8 text-primary" />,
      title: 'Secure Infrastructure',
      description: 'Cloud-hosted on AWS with 99.99% uptime SLA and DDoS protection'
    }
  ]

  const practices = [
    {
      title: 'Regular Security Audits',
      items: [
        'Quarterly penetration testing by third-party experts',
        'Annual security assessments and vulnerability scans',
        'Continuous security monitoring and threat detection'
      ]
    },
    {
      title: 'Access Control',
      items: [
        'Multi-factor authentication (MFA) for all accounts',
        'Role-based access control (RBAC) with least privilege',
        'Audit logs for all sensitive operations'
      ]
    },
    {
      title: 'Data Protection',
      items: [
        'Tokenization of sensitive payment data',
        'Automatic data masking and redaction',
        'Secure data deletion and retention policies'
      ]
    },
    {
      title: 'Incident Response',
      items: [
        '24/7 security operations center (SOC)',
        'Incident response plan with defined escalation',
        'Transparent communication during security events'
      ]
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
            <Shield className="w-16 h-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Security & Compliance
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your data security is our top priority. We implement industry-leading practices to protect your business.
          </p>
        </div>

        {/* Security Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Security Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {securityFeatures.map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="mb-16 p-8 bg-primary/5 border border-primary/20 rounded-lg">
          <h2 className="text-2xl font-bold text-center mb-8">Industry Certifications</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-2" />
              <div className="font-semibold">PCI DSS</div>
              <div className="text-xs text-muted-foreground">Level 1</div>
            </div>
            <div>
              <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-2" />
              <div className="font-semibold">SOC 2</div>
              <div className="text-xs text-muted-foreground">Type II</div>
            </div>
            <div>
              <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-2" />
              <div className="font-semibold">ISO 27001</div>
              <div className="text-xs text-muted-foreground">Certified</div>
            </div>
            <div>
              <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-2" />
              <div className="font-semibold">GDPR</div>
              <div className="text-xs text-muted-foreground">Compliant</div>
            </div>
          </div>
        </div>

        {/* Security Practices */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Security Practices</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {practices.map((practice) => (
              <div key={practice.title} className="border border-border rounded-lg p-6 bg-card">
                <h3 className="text-xl font-bold mb-4">{practice.title}</h3>
                <ul className="space-y-3">
                  {practice.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Infrastructure */}
        <div className="mb-16 border-t border-border pt-16">
          <h2 className="text-3xl font-bold text-center mb-12">Infrastructure Security</h2>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-border rounded-lg p-6 bg-card">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Server className="w-5 h-5 text-primary" />
                  Cloud Infrastructure
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• AWS with multi-region deployment</li>
                  <li>• Auto-scaling and load balancing</li>
                  <li>• Automated backups every 6 hours</li>
                  <li>• Point-in-time recovery</li>
                </ul>
              </div>
              <div className="border border-border rounded-lg p-6 bg-card">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  Network Security
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Web Application Firewall (WAF)</li>
                  <li>• DDoS protection and rate limiting</li>
                  <li>• Intrusion detection systems (IDS)</li>
                  <li>• VPC isolation and network segmentation</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Responsible Disclosure */}
        <div className="border-t border-border pt-16">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start gap-4 mb-6">
              <AlertTriangle className="w-8 h-8 text-primary flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-bold mb-4">Responsible Disclosure</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We welcome reports of security vulnerabilities. If you discover a security issue, please report it responsibly:
                </p>
                <div className="bg-muted p-6 rounded-lg">
                  <p className="text-sm mb-2"><strong>Email:</strong> <a href="mailto:security@revive.com" className="text-primary hover:underline">security@revive.com</a></p>
                  <p className="text-sm mb-4"><strong>PGP Key:</strong> <a href="#" className="text-primary hover:underline">Download Public Key</a></p>
                  <p className="text-xs text-muted-foreground">
                    We commit to acknowledging reports within 48 hours and providing regular updates. Responsible disclosures may be eligible for our bug bounty program.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
