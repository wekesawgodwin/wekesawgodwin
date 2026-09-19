import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { FiArrowUp, FiDownload, FiMail, FiMapPin, FiMenu, FiSend, FiX } from 'react-icons/fi'
import { useSite } from '../SiteContext'
import { Socials } from './ui'

export const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/skills', label: 'Skills' },
  { to: '/services', label: 'Services' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/blog', label: 'Blog' },
]

export function Logo() {
  const { profile } = useSite()
  const first = profile.full_name.trim().split(/\s+/)[0] || 'Wekesa'
  return (
    <Link to="/" className="logo" aria-label={`${profile.full_name}, home`}>
      {first}
      <span>.</span>
    </Link>
  )
}

function TopBar() {
  const { profile, resume } = useSite()
  return (
    <div className="topbar">
      <div className="container">
        <div className="topbar-info">
          {profile.location && (
            <span>
              <FiMapPin /> {profile.location}
            </span>
          )}
          {profile.email && (
            <span>
              <FiMail /> <a href={`mailto:${profile.email}`}>{profile.email}</a>
            </span>
          )}
        </div>
        <div className="topbar-right">
          <Socials profile={profile} />
          {resume && (
            <a className="topbar-cta" href="/api/resume" target="_blank" rel="noopener">
              <FiDownload /> Resume
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function Header({ onOpenMenu }) {
  const [sticky, setSticky] = useState(false)

  useEffect(() => {
    const onScroll = () => setSticky(window.scrollY > 140)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`header${sticky ? ' sticky' : ''}`}>
      <div className="container">
        <Logo />
        <nav className="nav" aria-label="Main">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}>
              {l.label}
            </NavLink>
          ))}
          <NavLink to="/contact" className="btn">
            Hire me <FiSend />
          </NavLink>
        </nav>
        <button type="button" className="menu-toggle" onClick={onOpenMenu} aria-label="Open menu">
          <FiMenu />
        </button>
      </div>
    </header>
  )
}

function MobilePanel({ open, onClose }) {
  const { profile } = useSite()
  return (
    <>
      <div className="panel-overlay" onClick={onClose} aria-hidden="true" />
      <aside className="panel" aria-label="Menu" inert={!open}>
        <button type="button" className="panel-close" onClick={onClose} aria-label="Close menu">
          <FiX />
        </button>
        <Logo />
        <nav style={{ marginTop: 30 }}>
          {[...NAV_LINKS, { to: '/contact', label: 'Contact' }].map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        {profile.intro && <p>{profile.intro}</p>}
        <Socials profile={profile} email />
      </aside>
    </>
  )
}

function Footer() {
  const { profile } = useSite()
  const year = new Date().getFullYear()
  return (
    <footer className="footer">
      <div className="container">
        <Logo />
        <p className="tagline">{profile.headline}. Let&apos;s build something great together.</p>
        <ul className="footer-menu">
          {[...NAV_LINKS, { to: '/contact', label: 'Contact' }].map((l) => (
            <li key={l.to}>
              <Link to={l.to}>{l.label}</Link>
            </li>
          ))}
        </ul>
        <Socials profile={profile} email />
      </div>
      <div className="copyright">
        <div className="container">
          © {year} <span>{profile.full_name}</span>. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

function ScrollTop() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <button
      type="button"
      className={`scroll-top${show ? ' show' : ''}`}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      tabIndex={show ? 0 : -1}
    >
      <FiArrowUp />
    </button>
  )
}

function Preloader() {
  const { loading } = useSite()
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (!loading) {
      setDone(true)
      return undefined
    }
    const id = setTimeout(() => setDone(true), 2500) // never block the page on a slow API
    return () => clearTimeout(id)
  }, [loading])
  return <div className={`preloader${done ? ' done' : ''}`} aria-hidden="true" />
}

export default function Layout() {
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <div className={menuOpen ? 'panel-open' : ''}>
      <Preloader />
      <a href="#main" className="sr-only skip-link">
        Skip to content
      </a>
      <div className="site-head">
        <TopBar />
        <Header onOpenMenu={() => setMenuOpen(true)} />
      </div>
      <MobilePanel open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
      <ScrollTop />
    </div>
  )
}
