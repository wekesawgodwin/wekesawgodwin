import { useMemo, useState } from 'react'
import { useApi } from '../hooks/useApi'
import { usePageMeta } from '../hooks/usePageMeta'
import PageBanner from '../components/PageBanner'
import { ProjectCard } from '../components/cards'
import { Empty, ErrorState, Loading, SectionTitle } from '../components/ui'
import { CallToAction } from './Home'

export default function Portfolio() {
  usePageMeta('Portfolio', 'Selected projects: web apps, APIs and tools I have designed and built.')
  const { data, loading, error, reload } = useApi('/api/projects')
  const [filter, setFilter] = useState('All')

  const categories = useMemo(
    () => ['All', ...new Set((data || []).map((p) => p.category).filter(Boolean))],
    [data],
  )
  const shown = (data || []).filter((p) => filter === 'All' || p.category === filter)

  return (
    <>
      <PageBanner title="Portfolio" crumbs={[{ label: 'Portfolio' }]} />
      <section className="section">
        <div className="container">
          <SectionTitle ghost="Projects" label="Selected work" center>
            Things I&apos;ve <span>built</span>
          </SectionTitle>

          {categories.length > 2 && (
            <div className="filter-bar" role="tablist" aria-label="Filter projects">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="tab"
                  aria-selected={filter === c}
                  className={filter === c ? 'active' : ''}
                  onClick={() => setFilter(c)}
                >
                  {c === 'All' ? 'Show all' : c}
                </button>
              ))}
            </div>
          )}

          {loading && <Loading height={300} count={6} className="project-grid" />}
          {error && !data && <ErrorState error={error} onRetry={reload} />}
          {data && !data.length && <Empty>Projects are on their way. Check back soon.</Empty>}
          {shown.length > 0 && (
            <div className="project-grid">
              {shown.map((p) => (
                <div key={`${filter}-${p.id}`} style={{ animation: 'fadeInRight 0.5s both' }}>
                  <ProjectCard project={p} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      <CallToAction />
    </>
  )
}
