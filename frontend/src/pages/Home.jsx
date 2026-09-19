import { Link } from 'react-router-dom'
import {
  FiArrowRight,
  FiAward,
  FiBriefcase,
  FiCode,
  FiDownload,
  FiEdit3,
  FiMail,
  FiMapPin,
  FiPhone,
  FiSend,
  FiUsers,
} from 'react-icons/fi'
import { useApi } from '../hooks/useApi'
import { useCountUp, useInView } from '../hooks/useInView'
import { usePageMeta } from '../hooks/usePageMeta'
import { useSite } from '../SiteContext'
import { accentLast, firstName, initials } from '../utils'
import { PostCard, ProjectCard, ServiceCard, SkillRing } from '../components/cards'
import Testimonials from '../components/Testimonials'
import { Loading, Reveal, SectionTitle, Socials } from '../components/ui'

function Hero() {
  const { profile } = useSite()
  const { head, tail } = accentLast(profile.headline)
  const projects = useApi('/api/projects')
  return (
    <section className="hero">
      <span className="hero-ghost" aria-hidden="true">
        {firstName(profile.full_name)}
      </span>
      <span className="shape dot" style={{ left: '6%', top: '26%' }} />
      <span className="shape circle" style={{ right: '44%', top: '18%' }} />
      <span className="shape plus" style={{ left: '44%', bottom: '14%' }} />
      <span className="shape dot" style={{ right: '6%', bottom: '22%', width: 10, height: 10 }} />

      <div className="container">
        <div className="hero-anim">
          <span className="hero-hello">Hello, I&apos;m {profile.full_name}</span>
          <h1>
            {head}
            <span>{tail}</span>
          </h1>
          {profile.intro && <p className="hero-intro">{profile.intro}</p>}
          <div className="hero-actions">
            <Link to="/contact" className="btn">
              Hire me <FiSend />
            </Link>
            <Link to="/portfolio" className="btn outline">
              View my work <FiArrowRight />
            </Link>
          </div>
          {(profile.github_url || profile.linkedin_url || profile.twitter_url) && (
            <div className="hero-socials">
              Follow me
              <Socials profile={profile} />
            </div>
          )}
        </div>

        <div className="hero-visual">
          <span className="ring" />
          <span className="ring inner" />
          <div className="hero-photo">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} />
            ) : (
              <span className="monogram">
                {initials(profile.full_name)}
                <span>.</span>
              </span>
            )}
          </div>
          {profile.years_experience > 0 && (
            <div className="hero-badge a">
              <span className="icon">
                <FiAward />
              </span>
              <div>
                <strong>{profile.years_experience}+</strong>
                <small>Years experience</small>
              </div>
            </div>
          )}
          {projects.data?.length > 0 && (
            <div className="hero-badge b">
              <span className="icon">
                <FiCode />
              </span>
              <div>
                <strong>{projects.data.length}+</strong>
                <small>Projects shipped</small>
              </div>
            </div>
          )}
        </div>
      </div>
      <span className="scroll-cue" aria-hidden="true" />
    </section>
  )
}

function Stat({ icon, value, suffix = '+', label }) {
  const [ref, inView] = useInView(0.4)
  const n = useCountUp(value, inView)
  return (
    <div className="stat" ref={ref}>
      <div className="icon">{icon}</div>
      <strong>
        {n}
        <sup>{suffix}</sup>
      </strong>
      <span>{label}</span>
    </div>
  )
}

function About() {
  const { profile, resume } = useSite()
  const projects = useApi('/api/projects')
  const reviews = useApi('/api/reviews')
  const posts = useApi('/api/posts')
  const about = profile.about.split(/\n\s*\n/)[0]

  return (
    <section className="section" id="about">
      <div className="container about-grid">
        <div className="stats-grid">
          <Reveal>
            <Stat icon={<FiAward />} value={profile.years_experience} label="Years of experience" />
          </Reveal>
          <Reveal delay={100}>
            <Stat icon={<FiBriefcase />} value={projects.data?.length || 0} label="Projects completed" />
          </Reveal>
          <Reveal delay={200}>
            <Stat icon={<FiUsers />} value={reviews.data?.length || 0} label="Happy clients" />
          </Reveal>
          <Reveal delay={300}>
            <Stat icon={<FiEdit3 />} value={posts.data?.length || 0} suffix="" label="Articles written" />
          </Reveal>
        </div>

        <Reveal>
          <SectionTitle ghost="About me" label="Who I am">
            Engineering that <span>ships</span>
          </SectionTitle>
          {about && <p className="info-content">{about}</p>}
          <ul className="info-list">
            {profile.location && (
              <li>
                <FiMapPin /> <span>{profile.location}</span>
              </li>
            )}
            {profile.email && (
              <li>
                <FiMail /> <span>{profile.email}</span>
              </li>
            )}
            {profile.phone && (
              <li>
                <FiPhone /> <span>{profile.phone}</span>
              </li>
            )}
            <li>
              <FiBriefcase /> <span>Available for freelance</span>
            </li>
          </ul>
          <div className="button-row">
            {resume && (
              <a href="/api/resume" className="btn" target="_blank" rel="noopener">
                Download CV <FiDownload />
              </a>
            )}
            <Link to="/contact" className={`btn${resume ? ' outline' : ''}`}>
              Let&apos;s talk <FiArrowRight />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Services() {
  const { data, loading } = useApi('/api/services')
  if (!loading && !data?.length) return null
  return (
    <section className="section alt">
      <div className="container">
        <div className="section-head">
          <SectionTitle ghost="Services" label="What I do">
            Services &amp; <span>Solutions</span>
          </SectionTitle>
          <Link to="/services" className="btn outline sm">
            All services <FiArrowRight />
          </Link>
        </div>
        {loading ? (
          <Loading height={340} />
        ) : (
          <div className="card-grid">
            {data.slice(0, 3).map((s, i) => (
              <Reveal key={s.id} delay={i * 120}>
                <ServiceCard service={s} active={i === 1} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function Skills() {
  const { data, loading } = useApi('/api/skills')
  if (!loading && !data?.length) return null
  const top = [...(data || [])].sort((a, b) => b.level - a.level).slice(0, 4)
  return (
    <section className="section">
      <div className="container">
        <SectionTitle ghost="Skills" label="My expertise" center>
          Skills &amp; <span>Technologies</span>
        </SectionTitle>
        {loading ? (
          <Loading height={220} count={4} className="rings-grid" />
        ) : (
          <div className="rings-grid">
            {top.map((s) => (
              <SkillRing key={s.id} skill={s} />
            ))}
          </div>
        )}
        <div className="more-row">
          <Link to="/skills" className="btn outline">
            See all skills <FiArrowRight />
          </Link>
        </div>
      </div>
    </section>
  )
}

function Work() {
  const { data, loading } = useApi('/api/projects')
  if (!loading && !data?.length) return null
  const featured = (data || []).filter((p) => p.featured)
  const shown = (featured.length ? featured : data || []).slice(0, 6)
  return (
    <section className="section alt">
      <div className="container">
        <div className="section-head">
          <SectionTitle ghost="Portfolio" label="Recent work">
            Latest <span>Projects</span>
          </SectionTitle>
          <Link to="/portfolio" className="btn outline sm">
            All projects <FiArrowRight />
          </Link>
        </div>
        {loading ? (
          <Loading height={300} className="project-grid" />
        ) : (
          <div className="project-grid">
            {shown.map((p, i) => (
              <Reveal key={p.id} delay={(i % 3) * 120}>
                <ProjectCard project={p} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function Reviews() {
  const { data } = useApi('/api/reviews')
  if (!data?.length) return null
  return (
    <section className="section">
      <div className="container">
        <SectionTitle ghost="Reviews" label="Testimonials">
          What clients <span>say</span>
        </SectionTitle>
        <Reveal>
          <Testimonials reviews={data} />
        </Reveal>
      </div>
    </section>
  )
}

function Blog() {
  const { data, loading } = useApi('/api/posts?limit=3')
  if (!loading && !data?.length) return null
  return (
    <section className="section alt">
      <div className="container">
        <div className="section-head">
          <SectionTitle ghost="Blog" label="From the blog">
            Latest <span>Articles</span>
          </SectionTitle>
          <Link to="/blog" className="btn outline sm">
            Read the blog <FiArrowRight />
          </Link>
        </div>
        {loading ? (
          <Loading height={420} className="post-grid" />
        ) : (
          <div className="post-grid">
            {data.map((p, i) => (
              <Reveal key={p.id} delay={i * 120}>
                <PostCard post={p} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export function CallToAction() {
  return (
    <section className="cta">
      <div className="container">
        <Reveal>
          <span className="label">Let&apos;s work together</span>
          <h2>
            Have a project in mind? Let&apos;s <span>build it</span> together.
          </h2>
          <Link to="/contact" className="btn">
            Start a conversation <FiSend />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}

export default function Home() {
  const { profile } = useSite()
  usePageMeta('', profile.intro || undefined)
  return (
    <>
      <Hero />
      <About />
      <Services />
      <Skills />
      <Work />
      <Reviews />
      <Blog />
      <CallToAction />
    </>
  )
}
