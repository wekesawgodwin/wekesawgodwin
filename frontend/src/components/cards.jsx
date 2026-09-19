import { useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  FiArrowRight,
  FiBarChart2,
  FiCalendar,
  FiCloud,
  FiCode,
  FiCpu,
  FiDatabase,
  FiLayers,
  FiMessageSquare,
  FiPenTool,
  FiPlus,
  FiServer,
  FiShield,
  FiShoppingCart,
  FiSmartphone,
  FiTool,
  FiTrendingUp,
  FiZap,
} from 'react-icons/fi'
import { useCountUp, useInView } from '../hooks/useInView'
import { formatDate } from '../utils'
import { PlaceholderArt } from './ui'

// ---------- Services ----------
export const SERVICE_ICONS = {
  code: FiCode,
  server: FiServer,
  cloud: FiCloud,
  mobile: FiSmartphone,
  design: FiPenTool,
  database: FiDatabase,
  security: FiShield,
  analytics: FiBarChart2,
  ecommerce: FiShoppingCart,
  automation: FiZap,
  architecture: FiLayers,
  ai: FiCpu,
  maintenance: FiTool,
  growth: FiTrendingUp,
}

export function ServiceIcon({ name }) {
  const Icon = SERVICE_ICONS[name] || FiCode
  return <Icon />
}

export function ServiceCard({ service, active = false, showPrice = false, action }) {
  return (
    <article className={`service-card${active ? ' active' : ''}`}>
      <div className="ripple" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="icon">
        <ServiceIcon name={service.icon} />
      </div>
      <h3>{service.title}</h3>
      <p>{service.description}</p>
      {showPrice && (
        <div className="price">
          {/\d/.test(service.cost) && <small>Starting from</small>}
          <strong>{service.cost}</strong>
        </div>
      )}
      {action}
    </article>
  )
}

// ---------- Skills ----------
const RADIUS = 72
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function SkillRing({ skill }) {
  const [ref, inView] = useInView(0.3)
  const value = useCountUp(skill.level, inView)
  const offset = CIRCUMFERENCE * (1 - (inView ? skill.level : 0) / 100)
  return (
    <div className="skill-ring" ref={ref}>
      <div className="meter">
        <svg viewBox="0 0 170 170" aria-hidden="true">
          <circle className="track" cx="85" cy="85" r={RADIUS} fill="none" strokeWidth="8" />
          <circle
            className="bar"
            cx="85"
            cy="85"
            r={RADIUS}
            fill="none"
            strokeWidth="8"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="value">
          <span>
            {value}
            <small>%</small>
          </span>
        </div>
      </div>
      <h3>{skill.name}</h3>
      <span className="category">{skill.category}</span>
      <span className="sr-only">{`${skill.level} percent`}</span>
    </div>
  )
}

export function SkillBar({ skill }) {
  const [ref, inView] = useInView(0.3)
  return (
    <div className="skill-bar" ref={ref}>
      <div className="top">
        <span>{skill.name}</span>
        <span>{skill.level}%</span>
      </div>
      <div
        className="track"
        role="progressbar"
        aria-valuenow={skill.level}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={skill.name}
      >
        <div className="fill" style={{ width: inView ? `${skill.level}%` : 0 }} />
      </div>
    </div>
  )
}

// ---------- Portfolio ----------
// Direction-aware hover: the overlay slides in from the edge the pointer entered.
const EDGE_OFFSETS = ['translate(0,-100%)', 'translate(100%,0)', 'translate(0,100%)', 'translate(-100%,0)']

function edgeFrom(event, el) {
  const r = el.getBoundingClientRect()
  const x = (event.clientX - r.left - r.width / 2) * (r.width > r.height ? r.height / r.width : 1)
  const y = (event.clientY - r.top - r.height / 2) * (r.height > r.width ? r.width / r.height : 1)
  return Math.round((Math.atan2(y, x) * (180 / Math.PI) + 180) / 90 + 3) % 4
}

export function ProjectCard({ project }) {
  const overlay = useRef(null)
  const to = `/portfolio/${project.id}`

  const enter = (e) => {
    const el = overlay.current
    if (!el) return
    el.style.transition = 'none'
    el.style.transform = EDGE_OFFSETS[edgeFrom(e, e.currentTarget)]
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        el.style.transition = ''
        el.style.transform = 'translate(0,0)'
      }),
    )
  }
  const leave = (e) => {
    if (overlay.current) overlay.current.style.transform = EDGE_OFFSETS[edgeFrom(e, e.currentTarget)]
  }

  return (
    <article className="project-card">
      <Link to={to} className="thumb" onMouseEnter={enter} onMouseLeave={leave} aria-label={project.title}>
        {project.image_url ? (
          <img src={project.image_url} alt="" loading="lazy" />
        ) : (
          <PlaceholderArt text={project.title} />
        )}
        <div className="overlay" ref={overlay}>
          <span className="go">
            <FiPlus />
          </span>
          <h3>{project.title}</h3>
          <span>{project.category}</span>
        </div>
      </Link>
      <div className="meta">
        <span className="cat">{project.category}</span>
        <h3>
          <Link to={to}>{project.title}</Link>
        </h3>
      </div>
    </article>
  )
}

// ---------- Blog ----------
export function PostCard({ post }) {
  const to = `/blog/${post.slug}`
  return (
    <article className="post-card">
      <Link to={to} className="cover" tabIndex={-1} aria-hidden="true">
        {post.cover_image_url ? (
          <img src={post.cover_image_url} alt="" loading="lazy" />
        ) : (
          <PlaceholderArt text={post.title} />
        )}
        <span className="tag">
          <FiCalendar style={{ verticalAlign: '-2px', marginRight: 6 }} />
          {formatDate(post.published_at)}
        </span>
      </Link>
      <div className="body">
        <div className="post-meta">
          <span>
            <FiMessageSquare /> {post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}
          </span>
        </div>
        <h3>
          <Link to={to}>{post.title}</Link>
        </h3>
        {post.excerpt && <p>{post.excerpt}</p>}
        <Link to={to} className="link-arrow">
          Read more <FiArrowRight />
        </Link>
      </div>
    </article>
  )
}
