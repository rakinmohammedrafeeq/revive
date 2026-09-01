import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Ensures navigation starts at the top of the page.
 * This is important for long/scrollable screens (e.g., Landing -> Login/Register).
 */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])

  return null
}

