import { useEffect, useRef } from 'react'

export function PostReader({ post, onClose }) {
  const scrollRef = useRef(null)

  useEffect(() => {
    if (!post) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [post, onClose])

  useEffect(() => {
    if (post && scrollRef.current) scrollRef.current.scrollTop = 0
  }, [post])

  return (
    <div
      className={`post-reader-overlay ${post ? 'post-reader-open' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <article className="post-reader" ref={scrollRef}>
        <button className="post-reader-close" onClick={onClose} aria-label="닫기">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {post && (
          <div className="post-reader-inner">
            <header className="post-reader-header">
              <span className="post-reader-tag">{post.tag}</span>
              <h1 className="post-reader-title">{post.title}</h1>
              <time className="post-reader-date">{post.date}</time>
            </header>

            {post.excerpt && (
              <p className="post-reader-lead">{post.excerpt}</p>
            )}

            <hr className="post-reader-rule" />

            <div className="post-reader-body">
              {post.content?.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  )
}
