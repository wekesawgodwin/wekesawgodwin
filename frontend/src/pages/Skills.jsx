import { FiCloud, FiCode, FiDatabase, FiLayers, FiMonitor, FiServer, FiTool } from 'react-icons/fi'
import { useApi } from '../hooks/useApi'
import { usePageMeta } from '../hooks/usePageMeta'
import PageBanner from '../components/PageBanner'
import { SkillBar, SkillRing } from '../components/cards'
import { Empty, ErrorState, Loading, Reveal, SectionTitle } from '../components/ui'
import { CallToAction } from './Home'

const CATEGORY_ICONS = [
  [/front|ui|web/i, FiMonitor],
  [/back|api|server/i, FiServer],
  [/data|sql/i, FiDatabase],
  [/devops|cloud|ops|deploy/i, FiCloud],
  [/tool/i, FiTool],
  [/lang|code/i, FiCode],
]

function CategoryIcon({ name }) {
  const Icon = CATEGORY_ICONS.find(([re]) => re.test(name))?.[1] || FiLayers
  return <Icon />
}

export default function Skills() {
  usePageMeta('Skills', 'The languages, frameworks and tools I use to design, build and ship software.')
  const { data, loading, error, reload } = useApi('/api/skills')
  const skills = data || []
  const top = [...skills].sort((a, b) => b.level - a.level).slice(0, 4)
  const groups = skills.reduce((acc, s) => {
    ;(acc[s.category] ||= []).push(s)
    return acc
  }, {})

  return (
    <>
      <PageBanner title="My Skills" ghost="Skills" crumbs={[{ label: 'Skills' }]} />
      <section className="section">
        <div className="container">
          <SectionTitle
            ghost="Expertise"
            label="What I'm good at"
            center
            text="A snapshot of the technologies I use day to day, from designing APIs and databases to building interfaces and shipping them to production."
          >
            Core <span>Strengths</span>
          </SectionTitle>

          {loading && <Loading height={220} count={4} className="rings-grid" />}
          {error && !data && <ErrorState error={error} onRetry={reload} />}
          {!loading && !error && !skills.length && <Empty>Skills will appear here soon.</Empty>}

          {top.length > 0 && (
            <div className="rings-grid">
              {top.map((s) => (
                <SkillRing key={s.id} skill={s} />
              ))}
            </div>
          )}

          {skills.length > 0 && (
            <div className="skill-groups">
              {Object.entries(groups).map(([category, items], i) => (
                <Reveal key={category} className="skill-group" delay={(i % 3) * 120}>
                  <h3>
                    <CategoryIcon name={category} /> {category}
                  </h3>
                  {items.map((s) => (
                    <SkillBar key={s.id} skill={s} />
                  ))}
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {skills.length > 0 && (
        <section className="section alt">
          <div className="container center">
            <SectionTitle ghost="Toolbox" label="At a glance" center>
              My <span>Toolbox</span>
            </SectionTitle>
            <Reveal className="chips" style={{ justifyContent: 'center' }}>
              {skills.map((s) => (
                <span key={s.id} className="chip">
                  {s.name}
                </span>
              ))}
            </Reveal>
          </div>
        </section>
      )}
      <CallToAction />
    </>
  )
}
