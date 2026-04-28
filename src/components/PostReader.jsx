import { useEffect, useRef } from 'react'

const TAG_COLORS = {
  '생각': '#8b5cf6',
  '감정': '#f472b6',
  '일상': '#fb923c',
  '취미': '#34d399',
  '회고': '#60a5fa',
}

export function PostReader({ post, onClose }) {
  const bodyRef = useRef(null)

  // Escape key to close
  useEffect(() => {
    if (!post) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [post, onClose])

  // Scroll back to top when a new post opens
  useEffect(() => {
    if (post && bodyRef.current) {
      bodyRef.current.scrollTop = 0
    }
  }, [post])

  const color = post ? (TAG_COLORS[post.tag] ?? '#60a5fa') : '#60a5fa'

  return (
    <div
      className={`post-reader-overlay ${post ? 'post-reader-open' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="post-reader" ref={bodyRef}>
        <button className="post-reader-close" onClick={onClose} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {post && (
          <article className="post-reader-article">
            <div className="post-reader-kicker">
              <span className="post-reader-dot" style={{ background: color }} />
              <span className="post-reader-tag" style={{ color }}>{post.tag}</span>
              <span className="post-reader-date">{post.date}</span>
            </div>

            <h1 className="post-reader-title">{post.title}</h1>

            {post.excerpt && (
              <p className="post-reader-excerpt">{post.excerpt}</p>
            )}

            <div className="post-reader-divider" style={{ background: color }} />

            <div className="post-reader-body">
              {post.content?.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </article>
        )}
      </div>
    </div>
  )
}
