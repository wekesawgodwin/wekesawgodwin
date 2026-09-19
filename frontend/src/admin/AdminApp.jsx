import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import {
  FiAward,
  FiBriefcase,
  FiEdit3,
  FiExternalLink,
  FiFileText,
  FiGrid,
  FiImage,
  FiLayers,
  FiLogOut,
  FiMail,
  FiMenu,
  FiMessageSquare,
  FiStar,
  FiUser,
  FiX,
} from 'react-icons/fi'
import { api, getToken, setToken } from '../api'
import { useApi } from '../hooks/useApi'
import { usePageMeta } from '../hooks/usePageMeta'
import '../styles/admin.css'
import { ToastProvider } from './common'
import Dashboard from './Dashboard'
import { Comments, Messages, MediaLibrary, ResumeManager, Reviews } from './inbox'
import { PostEditor, PostList } from './Posts'
import ProfileForm from './ProfileForm'
import ResourceManager from './ResourceManager'
import { projectsConfig, servicesConfig, skillsConfig } from './resources'

function Login({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const { access_token } = await api('/api/auth/login', { method: 'POST', body: form })
      setToken(access_token)
      onLogin()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card form-grid" style={{ gridTemplateColumns: '1fr' }} onSubmit={submit}>
        <div>
          <span className="logo">
            Admin<span>.</span>
          </span>
          <p className="center" style={{ margin: 0 }}>
            Sign in to manage your site
          </p>
        </div>
        <div className="field">
          <label htmlFor="u">Username</label>
          <input id="u" autoComplete="username" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="p">Password</label>
          <input id="p" type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        {error && <div className="alert error">{error}</div>}
        <button className="btn" style={{ justifyContent: 'center' }} disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <Link to="/" className="center" style={{ fontSize: 14 }}>
          ← Back to site
        </Link>
      </form>
    </div>
  )
}

const LINKS = [
  { to: '/admin', label: 'Dashboard', icon: <FiGrid />, end: true },
  { to: '/admin/profile', label: 'Profile', icon: <FiUser /> },
  { to: '/admin/skills', label: 'Skills', icon: <FiAward /> },
  { to: '/admin/services', label: 'Services', icon: <FiLayers /> },
  { to: '/admin/projects', label: 'Projects', icon: <FiBriefcase /> },
  { to: '/admin/posts', label: 'Blog posts', icon: <FiEdit3 /> },
  { to: '/admin/comments', label: 'Comments', icon: <FiMessageSquare /> },
  { to: '/admin/messages', label: 'Messages', icon: <FiMail />, badge: 'unread' },
  { to: '/admin/reviews', label: 'Reviews', icon: <FiStar /> },
  { to: '/admin/media', label: 'Media', icon: <FiImage /> },
  { to: '/admin/resume', label: 'Resume', icon: <FiFileText /> },
]

function Shell({ onLogout }) {
  const { pathname } = useLocation()
  const [navOpen, setNavOpen] = useState(false)
  // Keyed on the path so counts (e.g. unread messages) refresh as you move around.
  const stats = useApi(`/api/admin/stats?_=${encodeURIComponent(pathname)}`, { auth: true })
  const unread = stats.data?.unread_messages || 0

  useEffect(() => setNavOpen(false), [pathname])

  return (
    <div className={`admin${navOpen ? ' nav-open' : ''}`}>
      <aside className="admin-side">
        <Link to="/admin" className="logo">
          Admin<span>.</span>
          <small>wekesawgodwin.com</small>
        </Link>
        <nav>
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}>
              {l.icon} {l.label}
              {l.badge === 'unread' && unread > 0 && <span className="badge green">{unread}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="bottom">
          <a href="/" target="_blank" rel="noopener" className="side-btn">
            <FiExternalLink /> View site
          </a>
          <button type="button" className="side-btn" onClick={onLogout}>
            <FiLogOut /> Log out
          </button>
        </div>
      </aside>

      <div>
        <div className="admin-mobile-bar">
          <span className="logo" style={{ fontSize: 22 }}>
            Admin<span>.</span>
          </span>
          <button type="button" className="icon-btn" onClick={() => setNavOpen((o) => !o)} aria-label="Toggle menu">
            {navOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
        <main className="admin-main">
          <Routes>
            <Route index element={<Dashboard stats={stats} />} />
            <Route path="profile" element={<ProfileForm />} />
            <Route path="skills" element={<ResourceManager key="skills" config={skillsConfig} />} />
            <Route path="services" element={<ResourceManager key="services" config={servicesConfig} />} />
            <Route path="projects" element={<ResourceManager key="projects" config={projectsConfig} />} />
            <Route path="posts" element={<PostList />} />
            <Route path="posts/:id" element={<PostEditor />} />
            <Route path="comments" element={<Comments />} />
            <Route path="messages" element={<Messages onChange={stats.reload} />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="media" element={<MediaLibrary />} />
            <Route path="resume" element={<ResumeManager />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function AdminApp() {
  usePageMeta('Admin')
  const [authed, setAuthed] = useState(() => Boolean(getToken()))

  useEffect(() => {
    const onLogout = () => setAuthed(false)
    window.addEventListener('wg-logout', onLogout)
    return () => window.removeEventListener('wg-logout', onLogout)
  }, [])

  useEffect(() => {
    // Verify a stored token is still valid (it expires, and the secret may have rotated).
    if (authed) api('/api/auth/me', { auth: true }).catch(() => {})
  }, [authed])

  const logout = () => {
    setToken(null)
    setAuthed(false)
  }

  return (
    <ToastProvider>{authed ? <Shell onLogout={logout} /> : <Login onLogin={() => setAuthed(true)} />}</ToastProvider>
  )
}
