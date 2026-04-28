import { useEffect } from 'react'

export function PostModal({ post, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-tag" style={{ color: post.color, borderColor: post.color + '55', background: post.color + '18' }}>
          {post.tag}
        </div>

        <h1 className="modal-title">{post.title}</h1>
        <p className="modal-date">{post.date}</p>

        <div className="modal-divider" style={{ background: post.color + '44' }} />

        <div className="modal-content">
          {post.content.split('\n\n').map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </div>
    </div>
  )
}
