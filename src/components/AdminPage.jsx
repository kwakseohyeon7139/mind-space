import { useState } from 'react'
import { posts } from '../data/posts'

function loadComments() {
  try { return JSON.parse(localStorage.getItem('mindspace_comments') || '{}') }
  catch { return {} }
}

function saveComments(data) {
  localStorage.setItem('mindspace_comments', JSON.stringify(data))
}

export function AdminPage({ onClose }) {
  const [comments, setComments] = useState(loadComments)

  const deleteComment = (postId, commentId) => {
    const next = { ...comments }
    next[postId] = (next[postId] || []).filter(c => c.id !== commentId)
    setComments(next)
    saveComments(next)
  }

  const totalComments = Object.values(comments).flat().length
  const postsWithComments = posts.filter(p => (comments[p.id] || []).length > 0)

  return (
    <div className="admin-page">
      <div className="admin-header">
        <button className="admin-back-btn" onClick={onClose}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          나가기
        </button>
        <span className="admin-title">관리자</span>
        <span className="admin-badge">댓글 {totalComments}</span>
      </div>

      <div className="admin-list">
        {postsWithComments.length === 0 && (
          <div className="admin-empty">등록된 댓글이 없습니다</div>
        )}
        {postsWithComments.map(post => (
          <div key={post.id} className="admin-post-section">
            <div className="admin-post-title" style={{ color: post.color }}>
              <span className="admin-post-tag">{post.tag}</span>
              {post.title}
            </div>
            {(comments[post.id] || []).map(c => (
              <div key={c.id} className="admin-comment-item">
                <div className="admin-comment-meta">
                  <span className="admin-comment-nick">{c.nickname}</span>
                  <span className="admin-comment-date">{c.date}</span>
                  <button className="admin-delete-btn" onClick={() => deleteComment(post.id, c.id)}>삭제</button>
                </div>
                <p className="admin-comment-text">{c.text}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
