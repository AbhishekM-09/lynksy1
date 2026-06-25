import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
    // In SPAs with sidebars, the overflow is often on a specific container
    // We target common container IDs or classes
    const mainContent = document.querySelector('main') || document.querySelector('.overflow-y-auto')
    if (mainContent) {
      mainContent.scrollTop = 0
    }
  }, [pathname])

  return null
}
