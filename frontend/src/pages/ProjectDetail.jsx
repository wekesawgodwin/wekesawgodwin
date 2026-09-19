import { Link, useParams } from 'react-router-dom'
import { FiArrowLeft, FiArrowRight, FiExternalLink, FiGithub } from 'react-icons/fi'
import { useApi } from '../hooks/useApi'
import { usePageMeta } from '../hooks/usePageMeta'
import PageBanner from '../components/PageBanner'
import { ProjectCard } from '../components/cards'
import { ErrorState, Loading, PlaceholderArt, Reveal, SectionTitle } from '../components/ui'
import { formatDate, splitList } from '../utils'
import NotFound from './NotFound'

export default function ProjectDetail() {
  const { id } = useParams()
  const { data, loading, error, reload } = useApi('/api/projects')
  const projects = data || []
  const index = projects.findIndex((p) => String(p.id) === id)
  const project = projects[index]
  usePageMeta(project?.title || 'Project', project?.description?.slice(0, 160))

  if (loading && !data) {
    return (
      <>
        <PageBanner title="Project" crumbs={[{ label: 'Portfolio', to: '/portfolio' }]} />
        <section className="section">
          <div className="container">
            <Loading height={400} count={1} className="" />
          </div>
        </section>
      </>
    )
  }
  if (error && !data) {
    return (
      <section className="section" style={{ paddingTop: 200 }}>
        <div className="container">
          <ErrorState error={error} onRetry={reload} />
        </div>
      </section>
    )
  }
  if (!project) return <NotFound />

  const stack = splitList(project.tech_stack)
  const others = projects.filter((p) => p.id !== project.id).slice(0, 3)
  const prev = projects[index - 1]
  const next = projects[index + 1]

  return (
    <>
      <PageBanner
        title={project.title}
        ghost="Details"
        crumbs={[{ label: 'Portfolio', to: '/portfolio' }, { label: project.title }]}
      />
      <section className="section">
        <div className="container">
          <Reveal className="detail-cover">
            {project.image_url ? (
              <img src={project.image_url} alt={project.title} />
            ) : (
              <PlaceholderArt text={project.title} />
            )}
          </Reveal>

          <div className="detail-grid">
            <Reveal>
              <h2>Project brief</h2>
              <p className="prose-plain">{project.description}</p>
              {stack.length > 0 && (
                <>
                  <h2 style={{ marginTop: 40 }}>Built with</h2>
                  <div className="chips">
                    {stack.map((t) => (
                      <span key={t} className="chip">
                        {t}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </Reveal>

            <Reveal className="widget" delay={120}>
              <h4>
                Project info<span>.</span>
              </h4>
              <table className="info-table">
                <tbody>
                  <tr>
                    <th scope="row">Category</th>
                    <td>{project.category}</td>
                  </tr>
                  <tr>
                    <th scope="row">Date</th>
                    <td>{formatDate(project.created_at, { month: 'long', year: 'numeric' })}</td>
                  </tr>
                  {project.live_url && (
                    <tr>
                      <th scope="row">Website</th>
                      <td>
                        <a href={project.live_url} target="_blank" rel="noopener noreferrer">
                          {project.live_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </a>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="button-row" style={{ marginTop: 30 }}>
                {project.live_url && (
                  <a href={project.live_url} className="btn sm" target="_blank" rel="noopener noreferrer">
                    Live site <FiExternalLink />
                  </a>
                )}
                <a href={project.github_url} className="btn sm outline" target="_blank" rel="noopener noreferrer">
                  Source <FiGithub />
                </a>
              </div>
            </Reveal>
          </div>

          <div className="post-nav" style={{ marginTop: 70, marginBottom: 0 }}>
            {prev && (
              <Link to={`/portfolio/${prev.id}`}>
                <small>
                  <FiArrowLeft /> Previous project
                </small>
                <strong>{prev.title}</strong>
              </Link>
            )}
            {next && (
              <Link to={`/portfolio/${next.id}`} className="next">
                <small>
                  Next project <FiArrowRight />
                </small>
                <strong>{next.title}</strong>
              </Link>
            )}
          </div>
        </div>
      </section>

      {others.length > 0 && (
        <section className="section alt">
          <div className="container">
            <SectionTitle ghost="More" label="Keep exploring">
              More <span>projects</span>
            </SectionTitle>
            <div className="project-grid">
              {others.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
