import { useNavigate } from 'react-router-dom'
import { APP_LOGO_SRC } from '@/config/brandAssets'
import { APP_NAME } from '@/config/appInfo'
import { Shield, Eye, Lock, Database } from 'lucide-react'

export const PrivacyPage = () => {
  const navigate = useNavigate()

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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Hero */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-10 h-10 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Privacy Policy</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Last updated: September 5, 2026
          </p>
        </div>

        {/* Introduction */}
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              At Revive, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our payment recovery platform.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Information We Collect</h2>
            </div>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">Account Information</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Name, email address, and phone number</li>
              <li>• Company details and billing information</li>
              <li>• Authentication credentials</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Payment Data</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Transaction details (amount, currency, payment method)</li>
              <li>• Customer payment information (encrypted)</li>
              <li>• Recovery case metadata</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Usage Data</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Log data (IP address, browser type, access times)</li>
              <li>• Analytics data (feature usage, performance metrics)</li>
              <li>• API request logs</li>
            </ul>
          </section>

          {/* How We Use Information */}
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">How We Use Your Information</h2>
            </div>
            <ul className="space-y-3 text-muted-foreground">
              <li>• <strong>Provide Services:</strong> Process recovery cases and deliver notifications</li>
              <li>• <strong>Improve Platform:</strong> Enhance ML models and optimize recovery strategies</li>
              <li>• <strong>Security:</strong> Detect fraud and prevent unauthorized access</li>
              <li>• <strong>Communication:</strong> Send service updates and support messages</li>
              <li>• <strong>Compliance:</strong> Meet legal and regulatory obligations</li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Data Sharing and Disclosure</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We do not sell your personal information. We may share data with:
            </p>
            <ul className="space-y-3 text-muted-foreground">
              <li>• <strong>Service Providers:</strong> Payment gateways (Razorpay), SMS/email providers</li>
              <li>• <strong>Legal Requirements:</strong> When required by law or to protect rights</li>
              <li>• <strong>Business Transfers:</strong> In case of merger or acquisition</li>
            </ul>
          </section>

          {/* Data Security */}
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Data Security</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We implement industry-standard security measures:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• End-to-end encryption for sensitive data</li>
              <li>• Regular security audits and penetration testing</li>
              <li>• PCI DSS compliance for payment data</li>
              <li>• Access controls and authentication mechanisms</li>
              <li>• Secure data centers with 24/7 monitoring</li>
            </ul>
          </section>

          {/* Data Retention */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your data for as long as your account is active or as needed to provide services. Recovery case data is retained for 7 years for audit and compliance purposes. You can request data deletion by contacting support.
            </p>
          </section>

          {/* Your Rights */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Access and download your personal data</li>
              <li>• Correct inaccurate or incomplete data</li>
              <li>• Request deletion of your data (subject to legal obligations)</li>
              <li>• Object to or restrict certain processing activities</li>
              <li>• Withdraw consent at any time</li>
            </ul>
          </section>

          {/* Cookies */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Cookies and Tracking</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar technologies to improve user experience, analyze usage, and maintain session security. You can control cookie preferences through your browser settings.
            </p>
          </section>

          {/* Contact */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy or your data, contact us at:
            </p>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm">Email: <a href="mailto:privacy@revive.com" className="text-primary hover:underline">privacy@revive.com</a></p>
              <p className="text-sm mt-2">Address: Revive Technologies Inc., Bangalore, India</p>
            </div>
          </section>

          {/* Changes to Policy */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of material changes via email or through the platform. Continued use of Revive after changes constitutes acceptance of the updated policy.
            </p>
          </section>

        </div>

      </main>
    </div>
  )
}
