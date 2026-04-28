import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { posts } from '../data/posts'
import { nav } from '../nav'

const MIN_WIDTH = 300
const DEFAULT_WIDTH = 420

function getMaxWidth() { return Math.floor(window.innerWidth / 2) }

function loadComments() {
  try { return JSON.parse(localStorage.getItem('mindspace_comments') || '{}') }
  catch { return {} }
}

function saveComments(data) {
  localStorage.setItem('mindspace_comments', JSON.stringify(data))
}

export function SidePanel({ open, selectedPost, onSelectPost, onClose }) {
  const [query, setQuery] = useState('')
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const dragging = useRef(false)
  const startX = useRef(0)
  const startW = useRef(0)

  const [comments, setComments] = useState(loadComments)
  const [commentNick, setCommentNick] = useState('')
  const [commentPw, setCommentPw] = useState('')
  const [commentText, setCommentText] = useState('')
  const [activeAction, setActiveAction] = useState(null)
  const [hoveredComment, setHoveredComment] = useState(null)

  const filtered = useMemo(() => {
    if (!query.trim()) return posts
    const q = query.toLowerCase()
    return posts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.tag.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q)
    )
  }, [query])

  const onDragStart = useCallback((e) => {
    e.preventDefault()
    dragging.current = true
    startX.current = e.clientX
    startW.current = width
    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'
  }, [width])

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return
      const delta = startX.current - e.clientX
      setWidth(Math.max(MIN_WIDTH, Math.min(getMaxWidth(), startW.current + delta)))
    }
    const onUp = () => {
      if (!dragging.current) return
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  useEffect(() => { nav.uiActive = open }, [open])

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  useEffect(() => {
    setCommentNick('')
    setCommentPw('')
    setCommentText('')
    setActiveAction(null)
    setHoveredComment(null)
  }, [selectedPost?.id])

  const handleItemClick = (post) => {
    const pos = nav.cardPositions[post.id]
    if (pos) nav.cardPos = [...pos]
    onSelectPost(post)
  }

  const handleCommentSubmit = (e) => {
    e.preventDefault()
    if (!commentNick.trim() || !commentPw.trim() || !commentText.trim()) return
    const now = new Date()
    const dateStr = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`
    const newComment = {
      id: Date.now().toString(),
      nickname: commentNick.trim(),
      password: commentPw,
      text: commentText.trim(),
      date: dateStr
    }
    const updated = { ...comments, [selectedPost.id]: [...(comments[selectedPost.id] || []), newComment] }
    setComments(updated)
    saveComments(updated)
    setCommentNick('')
    setCommentPw('')
    setCommentText('')
  }

  const startAction = (postId, commentId, type) => {
    setActiveAction({ postId, commentId, type, pw: '', pwError: false, editing: false, editText: '' })
  }

  const handleVerifyPw = () => {
    if (!activeAction) return
    const postComments = comments[activeAction.postId] || []
    const comment = postComments.find(c => c.id === activeAction.commentId)
    if (!comment || comment.password !== activeAction.pw) {
      setActiveAction(prev => ({ ...prev, pwError: true }))
      return
    }
    if (activeAction.type === 'delete') {
      const updated = { ...comments, [activeAction.postId]: postComments.filter(c => c.id !== activeAction.commentId) }
      setComments(updated)
      saveComments(updated)
      setActiveAction(null)
    } else {
      setActiveAction(prev => ({ ...prev, editing: true, editText: comment.text, pwError: false }))
    }
  }

  const handleSaveEdit = () => {
    if (!activeAction?.editText.trim()) return
    const postComments = comments[activeAction.postId] || []
    const updated = {
      ...comments,
      [activeAction.postId]: postComments.map(c =>
        c.id === activeAction.commentId ? { ...c, text: activeAction.editText.trim() } : c
      )
    }
    setComments(updated)
    saveComments(updated)
    setActiveAction(null)
  }

  const inDetail = !!selectedPost
  const postComments = selectedPost ? (comments[selectedPost.id] || []) : []

  return (
    <aside className={`side-panel ${open ? 'side-panel-open' : ''}`} style={{ width }}>
      <div className="panel-drag-handle" onMouseDown={onDragStart} />

      {/* 목록 뷰 */}
      <div className={`panel-view ${!inDetail ? 'panel-view-show' : ''}`}>
        <div className="panel-topbar">
          <span className="panel-topbar-title">글 목록</span>
          <button className="panel-topbar-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="panel-search-row">
          <div className="panel-search-box">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="검색..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => { nav.uiActive = true }}
              onBlur={() => { if (!open) nav.uiActive = false }}
            />
            {query && (
              <button className="panel-clear-btn" onClick={() => setQuery('')}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="panel-list">
          {filtered.length === 0
            ? <div className="panel-empty">검색 결과가 없습니다</div>
            : filtered.map(post => (
              <div key={post.id} className="panel-list-item" onClick={() => handleItemClick(post)}>
                <div className="panel-item-meta">
                  <span className="panel-item-tag" style={{ color: post.color, background: post.color + '18', borderColor: post.color + '40' }}>
                    {post.tag}
                  </span>
                  <span className="panel-item-date">{post.date}</span>
                </div>
                <h3 className="panel-item-title">{post.title}</h3>
                <p className="panel-item-excerpt">{post.excerpt}</p>
                <div className="panel-item-arrow">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* 상세 뷰 */}
      <div className={`panel-view ${inDetail ? 'panel-view-show' : ''}`}>
        {selectedPost && (
          <>
            <div className="panel-topbar">
              <button className="panel-back-btn" onClick={() => onSelectPost(null)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
                목록
              </button>
            </div>
            <div className="panel-detail-scroll">
              <div className="panel-detail-accent" style={{ background: `linear-gradient(135deg, ${selectedPost.color}cc, ${selectedPost.color}44)` }} />
              <div className="panel-detail-inner">
                <div className="panel-item-meta" style={{ marginBottom: 16 }}>
                  <span className="panel-item-tag" style={{ color: selectedPost.color, background: selectedPost.color + '18', borderColor: selectedPost.color + '40' }}>
                    {selectedPost.tag}
                  </span>
                  <span className="panel-item-date">{selectedPost.date}</span>
                </div>
                <h1 className="panel-detail-title">{selectedPost.title}</h1>
                <div className="panel-detail-divider" style={{ background: selectedPost.color + '35' }} />
                <div className="panel-detail-content">
                  {selectedPost.content.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
                </div>

                {/* 댓글 섹션 */}
                <div className="comment-section">
                  <div className="comment-section-title">
                    댓글 <span>{postComments.length}</span>
                  </div>

                  {postComments.map(c => {
                    const isActive = activeAction?.commentId === c.id
                    return (
                      <div
                        key={c.id}
                        className="comment-item"
                        onMouseEnter={() => setHoveredComment(c.id)}
                        onMouseLeave={() => setHoveredComment(null)}
                      >
                        <div className="comment-meta">
                          <span className="comment-nick">{c.nickname}</span>
                          <span className="comment-date">{c.date}</span>
                          {hoveredComment === c.id && !isActive && (
                            <div className="comment-actions">
                              <button className="comment-action-btn" onClick={() => startAction(selectedPost.id, c.id, 'edit')}>수정</button>
                              <button className="comment-action-btn comment-action-delete" onClick={() => startAction(selectedPost.id, c.id, 'delete')}>삭제</button>
                            </div>
                          )}
                        </div>

                        {isActive && activeAction.editing ? (
                          <div className="comment-edit-form">
                            <textarea
                              className="comment-edit-textarea"
                              value={activeAction.editText}
                              onChange={e => setActiveAction(prev => ({ ...prev, editText: e.target.value }))}
                              onFocus={() => { nav.uiActive = true }}
                              rows={3}
                            />
                            <div className="comment-edit-actions">
                              <button className="comment-action-btn" onClick={() => setActiveAction(null)}>취소</button>
                              <button className="comment-action-btn comment-action-save" onClick={handleSaveEdit}>저장</button>
                            </div>
                          </div>
                        ) : (
                          <p className="comment-text">{c.text}</p>
                        )}

                        {isActive && !activeAction.editing && (
                          <div className="comment-verify">
                            <input
                              className="comment-verify-input"
                              type="password"
                              placeholder={activeAction.type === 'delete' ? '삭제하려면 비밀번호 입력' : '수정하려면 비밀번호 입력'}
                              value={activeAction.pw}
                              onChange={e => setActiveAction(prev => ({ ...prev, pw: e.target.value, pwError: false }))}
                              onFocus={() => { nav.uiActive = true }}
                              onKeyDown={e => e.key === 'Enter' && handleVerifyPw()}
                              autoFocus
                            />
                            {activeAction.pwError && <span className="comment-verify-error">비밀번호가 틀렸습니다</span>}
                            <div className="comment-verify-btns">
                              <button className="comment-action-btn" onClick={() => setActiveAction(null)}>취소</button>
                              <button
                                className={`comment-action-btn ${activeAction.type === 'delete' ? 'comment-action-delete' : 'comment-action-save'}`}
                                onClick={handleVerifyPw}
                              >
                                {activeAction.type === 'delete' ? '삭제' : '확인'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  <form className="comment-form" onSubmit={handleCommentSubmit}>
                    <div className="comment-form-row">
                      <input
                        className="comment-input"
                        type="text"
                        placeholder="닉네임"
                        value={commentNick}
                        onChange={e => setCommentNick(e.target.value)}
                        onFocus={() => { nav.uiActive = true }}
                        maxLength={20}
                      />
                      <input
                        className="comment-input comment-pw-input"
                        type="password"
                        placeholder="비밀번호"
                        value={commentPw}
                        onChange={e => setCommentPw(e.target.value)}
                        onFocus={() => { nav.uiActive = true }}
                      />
                    </div>
                    <textarea
                      className="comment-textarea"
                      placeholder="댓글을 남겨보세요..."
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      onFocus={() => { nav.uiActive = true }}
                      rows={3}
                      maxLength={500}
                    />
                    <button className="comment-submit" type="submit">등록</button>
                  </form>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  )
}
