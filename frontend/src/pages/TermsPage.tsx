import { useNavigate } from 'react-router-dom'
import { APP_LOGO_SRC } from '@/config/brandAssets'
import { APP_NAME } from '@/config/appInfo'
import { FileText } from 'lucide-react'

export const TermsPage = () => {
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
            <FileText className="w-10 h-10 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Terms of Service</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Last updated: September 5, 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none">
          
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using Revive's payment recovery platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Revive provides an AI-powered payment recovery platform that helps businesses recover failed transactions through:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Intelligent retry mechanisms</li>
              <li>• Automated customer notifications (SMS, email)</li>
              <li>• Machine learning-based failure diagnosis</li>
              <li>• Analytics and reporting tools</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">3. Account Registration</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              To use the Service, you must:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Provide accurate and complete registration information</li>
              <li>• Maintain the security of your account credentials</li>
              <li>• Notify us immediately of any unauthorized access</li>
              <li>• Be at least 18 years old or have legal capacity to enter contracts</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              You are responsible for all activities under your account.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">4. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You agree not to:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Use the Service for illegal or fraudulent activities</li>
              <li>• Attempt to gain unauthorized access to systems or data</li>
              <li>• Transmit malware, viruses, or harmful code</li>
              <li>• Interfere with or disrupt the Service</li>
              <li>• Violate any applicable laws or regulations</li>
              <li>• Harass, abuse, or harm others through the Service</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">5. Payment and Billing</h2>
            <h3 className="text-xl font-semibold mb-3 mt-6">Fees</h3>
            <p className="text-muted-foreground leading-relaxed">
              You agree to pay all fees associated with your selected plan. Fees are billed monthly or annually in advance.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">Payment Methods</h3>
            <p className="text-muted-foreground leading-relaxed">
              We accept credit/debit cards, UPI, and net banking through our payment processor (Razorpay).
            </p>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">Refunds</h3>
            <p className="text-muted-foreground leading-relaxed">
              Fees are non-refundable except as required by law or at our sole discretion.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">6. Data and Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your use of the Service is subject to our Privacy Policy. You grant us the right to use your data as described in the Privacy Policy. You are responsible for obtaining necessary consents from your customers for data processing.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">7. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The Service, including all software, designs, and content, is owned by Revive Technologies Inc. and protected by copyright, trademark, and other intellectual property laws. You receive a limited, non-exclusive, non-transferable license to use the Service.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              You retain ownership of your data and grant us a license to use it solely to provide the Service.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">8. Service Availability</h2>
            <p className="text-muted-foreground leading-relaxed">
              We strive for 99.9% uptime but do not guarantee uninterrupted access. We may perform maintenance, updates, or modifications that temporarily affect availability. We are not liable for service interruptions.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">9. Termination</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You may terminate your account at any time from your dashboard. We may suspend or terminate your account if you:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Violate these Terms</li>
              <li>• Fail to pay fees</li>
              <li>• Engage in fraudulent activity</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Upon termination, your right to use the Service ceases. We may delete your data after 30 days.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">10. Disclaimers</h2>
            <p className="text-muted-foreground leading-relaxed">
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT GUARANTEE RECOVERY SUCCESS RATES.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">11. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, REVIVE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE FEES YOU PAID IN THE 12 MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">12. Indemnification</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to indemnify and hold Revive harmless from any claims, damages, or expenses arising from your use of the Service or violation of these Terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">13. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may modify these Terms at any time. Material changes will be notified via email or through the platform. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">14. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms are governed by the laws of India. Any disputes shall be resolved in the courts of Bangalore, Karnataka.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">15. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms, contact us at:
            </p>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm">Email: <a href="mailto:legal@revive.com" className="text-primary hover:underline">legal@revive.com</a></p>
              <p className="text-sm mt-2">Address: Revive Technologies Inc., Bangalore, India</p>
            </div>
          </section>

        </div>

      </main>
    </div>
  )
}
