import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { APP_LOGO_SRC } from '@/config/brandAssets'

export function TermsAndPrivacyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/register">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Register
            </Button>
          </Link>
          <img src={APP_LOGO_SRC} alt="Revive" className="h-8" />
        </div>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Terms of Service & Privacy Policy</CardTitle>
            <CardDescription>
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 text-sm">
            {/* Terms of Service */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Terms of Service</h2>
              
              <div className="space-y-3">
                <h3 className="text-base font-medium text-foreground">1. Acceptance of Terms</h3>
                <p className="text-muted-foreground">
                  By accessing and using Revive, you accept and agree to be bound by the terms and provision of this agreement. 
                  If you do not agree to these terms, please do not use this service.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-medium text-foreground">2. Use of Service</h3>
                <p className="text-muted-foreground">
                  Revive provides financial record management and workspace collaboration tools. You agree to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Provide accurate and complete information during registration</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Not use the service for any illegal or unauthorized purpose</li>
                  <li>Not attempt to gain unauthorized access to any part of the service</li>
                  <li>Not transmit any malicious code or viruses</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-medium text-foreground">3. User Accounts</h3>
                <p className="text-muted-foreground">
                  You are responsible for maintaining the confidentiality of your account and password. You agree to accept 
                  responsibility for all activities that occur under your account.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-medium text-foreground">4. Data Ownership</h3>
                <p className="text-muted-foreground">
                  You retain all rights to the financial data you input into Revive. We do not claim ownership of your data. 
                  You grant us permission to store and process your data to provide the service.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-medium text-foreground">5. Termination</h3>
                <p className="text-muted-foreground">
                  We reserve the right to suspend or terminate your account if you violate these terms. You may also 
                  terminate your account at any time by contacting support.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-medium text-foreground">6. Limitation of Liability</h3>
                <p className="text-muted-foreground">
                  Revive is provided "as is" without warranties of any kind. We are not liable for any damages arising 
                  from the use or inability to use the service.
                </p>
              </div>
            </section>

            {/* Privacy Policy */}
            <section className="space-y-4 border-t pt-8">
              <h2 className="text-xl font-semibold text-foreground">Privacy Policy</h2>
              
              <div className="space-y-3">
                <h3 className="text-base font-medium text-foreground">1. Information We Collect</h3>
                <p className="text-muted-foreground">
                  We collect information you provide directly to us, including:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong>Account Information:</strong> Name, email address, password</li>
                  <li><strong>Financial Records:</strong> Transaction amounts, categories, dates, descriptions</li>
                  <li><strong>Workspace Data:</strong> Workspace names, member information, permissions</li>
                  <li><strong>Usage Data:</strong> Log data, device information, browser type</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-medium text-foreground">2. How We Use Your Information</h3>
                <p className="text-muted-foreground">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process your transactions and send related information</li>
                  <li>Send you technical notices and support messages</li>
                  <li>Respond to your comments and questions</li>
                  <li>Monitor and analyze trends, usage, and activities</li>
                  <li>Detect, prevent, and address technical issues and security threats</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-medium text-foreground">3. Information Sharing</h3>
                <p className="text-muted-foreground">
                  We do not sell your personal information. We may share your information only in the following circumstances:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong>With Your Consent:</strong> When you explicitly authorize us to share information</li>
                  <li><strong>Workspace Members:</strong> Information you share within workspaces is visible to other members</li>
                  <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                  <li><strong>Service Providers:</strong> With vendors who help us operate the service (hosting, analytics)</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-medium text-foreground">4. Data Security</h3>
                <p className="text-muted-foreground">
                  We implement appropriate technical and organizational measures to protect your data, including:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Encryption of data in transit (HTTPS/TLS)</li>
                  <li>Secure password hashing (BCrypt)</li>
                  <li>Regular security assessments</li>
                  <li>Access controls and authentication</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-medium text-foreground">5. Data Retention</h3>
                <p className="text-muted-foreground">
                  We retain your information for as long as your account is active or as needed to provide services. 
                  You may request deletion of your data by contacting support.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-medium text-foreground">6. Your Rights</h3>
                <p className="text-muted-foreground">
                  You have the right to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Export your data</li>
                  <li>Opt-out of marketing communications</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-medium text-foreground">7. Cookies and Tracking</h3>
                <p className="text-muted-foreground">
                  We use essential cookies to maintain your session and authentication. We do not use third-party 
                  tracking cookies for advertising purposes.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-medium text-foreground">8. Third-Party Services</h3>
                <p className="text-muted-foreground">
                  We use the following third-party services:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong>Google OAuth:</strong> For authentication (subject to Google's privacy policy)</li>
                  <li><strong>Cloudinary:</strong> For image storage and processing</li>
                  <li><strong>Neon Database:</strong> For secure data storage</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-medium text-foreground">9. Children's Privacy</h3>
                <p className="text-muted-foreground">
                  Our service is not intended for users under 18 years of age. We do not knowingly collect information 
                  from children under 18.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-medium text-foreground">10. Changes to This Policy</h3>
                <p className="text-muted-foreground">
                  We may update this privacy policy from time to time. We will notify you of any changes by posting 
                  the new policy on this page and updating the "Last updated" date.
                </p>
              </div>

              {/*
              <div className="space-y-3">
                <h3 className="text-base font-medium text-foreground">11. Contact Us</h3>
                <p className="text-muted-foreground">
                  If you have any questions about these Terms or Privacy Policy, please contact us at:{' '}
                  <a href="mailto:rakinmohammedrafeeq@gmail.com" className="text-primary hover:underline">
                    rakinmohammedrafeeq@gmail.com
                  </a>
                </p>
              </div>
              */}
            
            </section>

            <div className="border-t pt-6">
              <p className="text-center text-xs text-muted-foreground">
                By using Revive, you acknowledge that you have read and understood these Terms of Service and Privacy Policy.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
