import { useEffect } from 'react'

const SITE = 'Wekesa W. Godwin'
const SITE_URL = 'https://wekesawgodwin.com'

function setMeta(selector, attr, value) {
  const el = document.head.querySelector(selector)
  if (el && value) el.setAttribute(attr, value)
}

export function usePageMeta(title, description) {
  useEffect(() => {
    const full = title ? `${title} | ${SITE}` : `${SITE} | Full-Stack Software Engineer`
    document.title = full
    setMeta('meta[property="og:title"]', 'content', full)
    setMeta('meta[name="description"]', 'content', description)
    setMeta('meta[property="og:description"]', 'content', description)
    const url = SITE_URL + window.location.pathname
    setMeta('link[rel="canonical"]', 'href', url)
    setMeta('meta[property="og:url"]', 'content', url)
  }, [title, description])
}
