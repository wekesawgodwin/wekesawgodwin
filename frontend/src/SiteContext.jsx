import { createContext, useContext } from 'react'
import { useApi } from './hooks/useApi'

const SiteContext = createContext({ profile: null, resume: null, loading: true })

const FALLBACK_PROFILE = {
  full_name: 'Wekesa W. Godwin',
  headline: 'Full-Stack Software Engineer',
  intro: '',
  about: '',
  email: '',
  phone: '',
  location: '',
  avatar_url: '',
  github_url: '',
  linkedin_url: '',
  twitter_url: '',
  years_experience: 0,
}

export function SiteProvider({ children }) {
  const profile = useApi('/api/profile')
  const resume = useApi('/api/resume/meta')
  const value = {
    profile: profile.data || FALLBACK_PROFILE,
    resume: resume.data,
    loading: profile.loading,
    reloadProfile: profile.reload,
    reloadResume: resume.reload,
  }
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}

export function useSite() {
  return useContext(SiteContext)
}
