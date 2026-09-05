import { APP_LOGO_SRC } from '@/config/brandAssets'
import {
  APP_NAME,
  DEFAULT_GITHUB_URL,
  DEFAULT_LINKEDIN_URL,
  DEFAULT_GITHUB_PROFILE_URL,
} from '@/config/appInfo'
import * as React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const GitHubMark = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="currentColor">
    <path d="M12 .5C5.73.5.75 5.62.75 12c0 5.1 3.29 9.42 7.86 10.95.58.11.79-.26.79-.57v-2.09c-3.2.71-3.87-1.58-3.87-1.58-.52-1.36-1.28-1.73-1.28-1.73-1.04-.73.08-.72.08-.72 1.15.08 1.75 1.21 1.75 1.21 1.02 1.77 2.67 1.26 3.32.96.1-.76.4-1.26.72-1.55-2.55-.3-5.24-1.3-5.24-5.78 0-1.28.45-2.33 1.19-3.15-.12-.3-.52-1.52.11-3.17 0 0 .97-.32 3.18 1.2a10.8 10.8 0 0 1 2.9-.4c.98 0 1.97.14 2.9.4 2.21-1.52 3.18-1.2 3.18-1.2.63 1.65.23 2.87.11 3.17.74.82 1.19 1.87 1.19 3.15 0 4.49-2.7 5.48-5.27 5.77.41.36.78 1.08.78 2.17v3.22c0 .31.21.69.79.57A11.28 11.28 0 0 0 23.25 12C23.25 5.62 18.27.5 12 .5Z" />
  </svg>
)

const LinkedInMark = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="currentColor">
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.95v5.66H9.35V9h3.41v1.56h.05c.48-.9 1.66-1.85 3.41-1.85 3.64 0 4.31 2.4 4.31 5.51v6.23ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z" />
  </svg>
)

const socialLinkClass =
  'inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-200'

export const AppFooter = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'

  const goHomeOrTop = React.useCallback(() => {
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    navigate('/')
  }, [location.pathname, navigate])

  const handleLogoClick = () => {
    goHomeOrTop()
  }

  return (
    <footer className="relative z-10 w-full border-t border-border bg-secondary/30 dark:bg-[#0c0c14] text-foreground dark:text-white">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-14">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Brand */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleLogoClick}
              className="group inline-flex items-center gap-2.5 rounded-lg px-1 py-0.5 transition-opacity duration-200 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 text-left cursor-pointer"
              aria-label="Go to home"
            >
              <img
                src={APP_LOGO_SRC}
                alt={`${APP_NAME} logo`}
                width={28}
                height={28}
                loading="lazy"
                className="h-7 w-7 object-contain"
              />
              <span className="text-sm font-semibold tracking-tight">{APP_NAME}</span>
            </button>

            <p className="text-[13px] leading-relaxed text-muted-foreground">
              AI-powered revenue recovery for businesses.<br />
              Smart, automated, and compliant.
            </p>

            <p className="text-xs text-muted-foreground/60">
              © {new Date().getFullYear()} {APP_NAME}
            </p>
            
            <p className="text-xs text-muted-foreground/50">
              Developed by <a href={DEFAULT_LINKEDIN_URL} target="_blank" rel="noreferrer" className="text-muted-foreground/70 hover:text-muted-foreground transition-colors duration-200">Rakin Mohammed Rafeeq</a>
            </p>
          </div>

          {/* Column 2: Product */}
          <div className="space-y-3 lg:ml-8">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Product</p>
            <ul className="space-y-1">
              <li>
                <a href="/login" className={socialLinkClass}>
                  Sign in
                </a>
              </li>
              <li>
                <a href="/register" className={socialLinkClass}>
                  Create account
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div className="space-y-3 lg:ml-8">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Legal</p>
            <ul className="space-y-1">
              <li>
                <a href="/terms-and-privacy?tab=terms" target="_blank" rel="noopener noreferrer" className={socialLinkClass}>
                  Terms & Conditions
                </a>
              </li>
              <li>
                <a href="/terms-and-privacy?tab=privacy" target="_blank" rel="noopener noreferrer" className={socialLinkClass}>
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms-and-privacy?tab=security" target="_blank" rel="noopener noreferrer" className={socialLinkClass}>
                  Security & Compliance
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Connect */}
          <div className="space-y-3 lg:ml-8">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Connect</p>
            <ul className="space-y-1">
              <li>
                <a href={DEFAULT_GITHUB_URL} target="_blank" rel="noreferrer" className={socialLinkClass}>
                  <GitHubMark />
                  <span>GitHub Repo</span>
                </a>
              </li>
              <li>
                <a href={DEFAULT_GITHUB_PROFILE_URL} target="_blank" rel="noreferrer" className={socialLinkClass}>
                  <GitHubMark />
                  <span>GitHub Profile</span>
                </a>
              </li>
              <li>
                <a href={DEFAULT_LINKEDIN_URL} target="_blank" rel="noreferrer" className={socialLinkClass}>
                  <LinkedInMark />
                  <span>LinkedIn</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}
