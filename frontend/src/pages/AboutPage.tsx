import { useNavigate } from 'react-router-dom'
import { APP_LOGO_SRC } from '@/config/brandAssets'
import { APP_NAME, DEFAULT_LINKEDIN_URL } from '@/config/appInfo'
import { Target, Zap, Shield, Users, TrendingUp, Award } from 'lucide-react'

export const AboutPage = () => {
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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Hero */}
        <div className="mb-16 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            About Revive
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We're on a mission to help businesses recover lost revenue through intelligent, AI-powered payment recovery
          </p>
        </div>

        {/* Mission */}
        <section className="mb-16">
          <div className="border border-border rounded-lg p-8 bg-card/30">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold">Our Mission</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Traditional payment recovery is broken. Merchants lose billions in revenue annually due to failed 
              payments, abandoned checkouts, and subscription lapses. Existing solutions rely on blind retries and 
              generic dunning emails that frustrate customers and waste resources.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Revive changes this. We combine machine learning predictions, AI-powered diagnostics, and deterministic 
              policy guardrails to create a recovery system that is both intelligent and trustworthy. Our goal is to 
              help every business salvage revenue they're currently losing—without compromising customer experience 
              or compliance.
            </p>
          </div>
        </section>

        {/* Core Values */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Our Core Values</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-border rounded-lg p-6 text-center">
              <Zap className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Speed</h3>
              <p className="text-sm text-muted-foreground">
                Real-time recovery decisions with sub-100ms ML inference
              </p>
            </div>
            <div className="border border-border rounded-lg p-6 text-center">
              <Shield className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Trust</h3>
              <p className="text-sm text-muted-foreground">
                Deterministic guardrails ensure AI cannot bypass policy
              </p>
            </div>
            <div className="border border-border rounded-lg p-6 text-center">
              <TrendingUp className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Results</h3>
              <p className="text-sm text-muted-foreground">
                Transparent metrics with honest intervention costs
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="mb-16">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">74.2%</div>
              <div className="text-sm text-muted-foreground">Average Recovery Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">₹2.4M+</div>
              <div className="text-sm text-muted-foreground">Revenue Salvaged</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">&lt; 15 min</div>
              <div className="text-sm text-muted-foreground">Avg Recovery Time</div>
            </div>
          </div>
        </section>

        {/* Technology */}
        <section className="mb-16">
          <div className="border border-border rounded-lg p-8 bg-card/30">
            <div className="flex items-center gap-3 mb-4">
              <Award className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold">Built for Razorpay AI Buildathon</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Revive was developed as part of the Razorpay AI Buildathon 2026, focusing on Track 03: AI Revenue Recovery. 
              The platform demonstrates how AI and ML can be responsibly deployed in financial systems with proper 
              guardrails, audit trails, and compliance measures.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="px-3 py-1 text-xs rounded-full bg-primary/10 text-primary">Java 21</span>
              <span className="px-3 py-1 text-xs rounded-full bg-primary/10 text-primary">Spring Boot 3</span>
              <span className="px-3 py-1 text-xs rounded-full bg-primary/10 text-primary">React 18</span>
              <span className="px-3 py-1 text-xs rounded-full bg-primary/10 text-primary">PostgreSQL</span>
              <span className="px-3 py-1 text-xs rounded-full bg-primary/10 text-primary">scikit-learn</span>
              <span className="px-3 py-1 text-xs rounded-full bg-primary/10 text-primary">Google Gemini</span>
              <span className="px-3 py-1 text-xs rounded-full bg-primary/10 text-primary">Groq Llama 3.1</span>
              <span className="px-3 py-1 text-xs rounded-full bg-primary/10 text-primary">Razorpay API</span>
            </div>
          </div>
        </section>

        {/* Creator */}
        <section>
          <div className="border border-border rounded-lg p-8 bg-card/30 text-center">
            <Users className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Meet the Creator</h2>
            <p className="text-muted-foreground mb-6">
              Revive is built by Rakin Mohammed Rafeeq, a student developer passionate about AI, fintech, and 
              building products that solve real problems. This project represents the intersection of machine learning, 
              software engineering, and revenue optimization.
            </p>
            <a
              href={DEFAULT_LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Connect on LinkedIn
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
          </div>
        </section>
      </main>
    </div>
  )
}
