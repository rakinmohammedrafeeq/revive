import { useNavigate } from 'react-router-dom'
import { APP_LOGO_SRC } from '@/config/brandAssets'
import { APP_NAME } from '@/config/appInfo'
import { Search, Book, MessageCircle, FileText, HelpCircle, Zap } from 'lucide-react'

export const HelpPage = () => {
  const navigate = useNavigate()

  const popularArticles = [
    {
      title: 'Getting Started with Revive',
      category: 'Quickstart',
      icon: <Zap className="w-5 h-5" />
    },
    {
      title: 'Understanding Recovery Cases',
      category: 'Concepts',
      icon: <Book className="w-5 h-5" />
    },
    {
      title: 'Configuring Recovery Policies',
      category: 'Configuration',
      icon: <FileText className="w-5 h-5" />
    },
    {
      title: 'Interpreting ML Predictions',
      category: 'Machine Learning',
      icon: <HelpCircle className="w-5 h-5" />
    }
  ]

  const categories = [
    {
      name: 'Getting Started',
      icon: <Zap className="w-6 h-6 text-primary" />,
      count: '12 articles'
    },
    {
      name: 'Recovery Policies',
      icon: <FileText className="w-6 h-6 text-primary" />,
      count: '8 articles'
    },
    {
      name: 'API & Webhooks',
      icon: <Book className="w-6 h-6 text-primary" />,
      count: '15 articles'
    },
    {
      name: 'Billing & Pricing',
      icon: <MessageCircle className="w-6 h-6 text-primary" />,
      count: '6 articles'
    },
    {
      name: 'Security & Compliance',
      icon: <HelpCircle className="w-6 h-6 text-primary" />,
      count: '10 articles'
    },
    {
      name: 'Troubleshooting',
      icon: <HelpCircle className="w-6 h-6 text-primary" />,
      count: '14 articles'
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

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/5 to-background border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            How can we help you?
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Search our knowledge base for answers to common questions
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search for articles..."
              className="w-full pl-12 pr-4 py-4 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Popular Articles */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Popular Articles</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {popularArticles.map((article, index) => (
              <div
                key={index}
                className="p-6 border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {article.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{article.title}</h3>
                    <p className="text-sm text-muted-foreground">{article.category}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Browse by Category */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Browse by Category</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <div
                key={index}
                className="p-6 border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
              >
                <div className="mb-4">{category.icon}</div>
                <h3 className="font-semibold mb-2">{category.name}</h3>
                <p className="text-sm text-muted-foreground">{category.count}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Still Need Help */}
        <section>
          <div className="border border-border rounded-lg p-8 text-center bg-card/30">
            <MessageCircle className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
            <p className="text-muted-foreground mb-6">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/contact')}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Contact Support
              </button>
              <button
                onClick={() => navigate('/documentation')}
                className="px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors font-medium"
              >
                View Documentation
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
