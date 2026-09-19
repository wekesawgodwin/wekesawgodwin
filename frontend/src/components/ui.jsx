import { FaGithub, FaLinkedinIn, FaXTwitter } from 'react-icons/fa6'
import { FiAlertTriangle, FiInbox, FiMail } from 'react-icons/fi'
import { useInView } from '../hooks/useInView'

export function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const [ref, inView] = useInView(0.12)
  return (
    <Tag
      ref={ref}
      className={`reveal${inView ? ' in' : ''}${className ? ` ${className}` : ''}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  )
}

export function SectionTitle({ ghost, label, children, text, center = false }) {
  return (
    <div className={`section-title${center ? ' center' : ''}`}>
      {ghost && (
        <span className="ghost" aria-hidden="true">
          {ghost}
        </span>
      )}
      {label && <span className="label">{label}</span>}
      <h2>{children}</h2>
      {text && <p>{text}</p>}
    </div>
  )
}

export function Socials({ profile, email = false, className = '' }) {
  const links = [
    profile.github_url && { href: profile.github_url, label: 'GitHub', icon: <FaGithub /> },
    profile.linkedin_url && { href: profile.linkedin_url, label: 'LinkedIn', icon: <FaLinkedinIn /> },
    profile.twitter_url && { href: profile.twitter_url, label: 'X (Twitter)', icon: <FaXTwitter /> },
    email && profile.email && { href: `mailto:${profile.email}`, label: 'Email', icon: <FiMail /> },
  ].filter(Boolean)
  if (!links.length) return null
  return (
    <div className={`socials ${className}`}>
      {links.map((l) => (
        <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" aria-label={l.label} title={l.label}>
          {l.icon}
        </a>
      ))}
    </div>
  )
}

export function Loading({ height = 260, count = 3, className = 'card-grid' }) {
  return (
    <div className={className} aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton" style={{ height }} />
      ))}
    </div>
  )
}

export function Empty({ children }) {
  return (
    <div className="state">
      <FiInbox />
      <p>{children}</p>
    </div>
  )
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="state error" role="alert">
      <FiAlertTriangle />
      <p>{error?.message || 'Something went wrong.'}</p>
      {onRetry && (
        <button type="button" className="btn sm outline" style={{ marginTop: 16 }} onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

export function PlaceholderArt({ text }) {
  return (
    <div className="placeholder-art" aria-hidden="true">
      <span>{(text || '?').slice(0, 2)}</span>
    </div>
  )
}
