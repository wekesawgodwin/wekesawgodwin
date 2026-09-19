import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiSearch } from 'react-icons/fi'
import { useApi } from '../hooks/useApi'
import { usePageMeta } from '../hooks/usePageMeta'
import { useSite } from '../SiteContext'
import PageBanner from '../components/PageBanner'
import { PostCard } from '../components/cards'
import { Empty, ErrorState, Loading, PlaceholderArt, Reveal, Socials } from '../components/ui'
import { formatDate, initials } from '../utils'

export function BlogSidebar({ search, onSearch, currentSlug }) {
  const { profile } = useSite()
  const { data } = useApi('/api/posts')
  const recent = (data || []).filter((p) => p.slug !== currentSlug).slice(0, 4)

  return (
    <aside className="sidebar">
      {onSearch && (
        <div className="widget">
          <h4>
            Search<span>.</span>
          </h4>
          <label className="search-box">
            <span className="sr-only">Search posts</span>
            <input
              type="search"
              placeholder="Search articles…"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
            />
            <span aria-hidden="true">
              <FiSearch />
            </span>
          </label>
        </div>
      )}

      <div className="widget widget-about">
        <h4 style={{ textAlign: 'left' }}>
          About me<span>.</span>
        </h4>
        <div className="avatar">
          {profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : initials(profile.full_name)}
        </div>
        <h5 style={{ fontSize: 20, marginBottom: 4 }}>{profile.full_name}</h5>
        <p style={{ color: 'var(--green)', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>
          {profile.headline}
        </p>
        {profile.intro && <p>{profile.intro}</p>}
        <Socials profile={profile} />
      </div>

      {recent.length > 0 && (
        <div className="widget">
          <h4>
            Recent posts<span>.</span>
          </h4>
          {recent.map((p) => (
            <Link key={p.id} to={`/blog/${p.slug}`} className="recent-post">
              <div className="thumb">
                {p.cover_image_url ? <img src={p.cover_image_url} alt="" loading="lazy" /> : <PlaceholderArt text={p.title} />}
              </div>
              <div>
                <h5>{p.title}</h5>
                <small>{formatDate(p.published_at)}</small>
              </div>
            </Link>
          ))}
        </div>
      )}
    </aside>
  )
}

export default function Blog() {
  usePageMeta('Blog', 'Articles on software engineering, web development, Python, React and shipping products.')
  const { data, loading, error, reload } = useApi('/api/posts')
  const [search, setSearch] = useState('')
  const q = search.trim().toLowerCase()
  const posts = (data || []).filter(
    (p) => !q || p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q),
  )

  return (
    <>
      <PageBanner title="Blog" crumbs={[{ label: 'Blog' }]} />
      <section className="section">
        <div className="container blog-layout">
          <div>
            {loading && <Loading height={520} count={2} className="post-list" />}
            {error && !data && <ErrorState error={error} onRetry={reload} />}
            {data && !data.length && <Empty>No posts yet. The first article is on its way.</Empty>}
            {data?.length > 0 && !posts.length && <Empty>No posts match “{search}”.</Empty>}
            {posts.length > 0 && (
              <div className="post-list">
                {posts.map((p) => (
                  <Reveal key={p.id}>
                    <PostCard post={p} />
                  </Reveal>
                ))}
              </div>
            )}
          </div>
          <BlogSidebar search={search} onSearch={setSearch} />
        </div>
      </section>
    </>
  )
}
