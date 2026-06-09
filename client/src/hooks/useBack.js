import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

export function useBack(defaultPath = '/') {
  const navigate = useNavigate()

  useEffect(() => {
    window.history.pushState(null, '', window.location.pathname)
    const handlePop = () => navigate(defaultPath, { replace: true })
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [defaultPath, navigate])

  return () => navigate(defaultPath, { replace: true })
}
