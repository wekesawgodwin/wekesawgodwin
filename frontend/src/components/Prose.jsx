import Markdown from 'react-markdown'

// react-markdown escapes raw HTML by default, so post content can't inject scripts.
export default function Prose({ children }) {
  return (
    <div className="prose">
      <Markdown
        components={{
          a: ({ node, ...props }) => {
            const external = /^https?:\/\//.test(props.href || '')
            return <a {...props} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} />
          },
          img: ({ node, ...props }) => <img loading="lazy" {...props} alt={props.alt || ''} />,
        }}
      >
        {children || ''}
      </Markdown>
    </div>
  )
}
