import { useState, useMemo, useRef, useEffect } from 'react'
import { posts } from '../data/posts'
import { nav } from '../nav'

export function SearchBar({ onSelect }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef()
  const wrapRef = useRef()

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return posts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.tag.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q)
    )
  }, [query])

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
        nav.uiActive = false
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleFocus = () => {
    setOpen(true)
    nav.uiActive = true
  }

  const handleSelect = (post) => {
    const pos = nav.cardPositions[post.id]
    if (pos) {
      nav.cardPos = [...pos]
      setTimeout(() => onSelect(post), 2200)
    } else {
      onSelect(post)
    }
    setQuery('')
    setOpen(false)
    nav.uiActive = false
    inputRef.current?.blur()
  }

  const showDropdown = open && results.length > 0

  return (
    <div className="search-wrap" ref={wrapRef}>
      <div className={`search-bar ${open ? 'search-bar-focused' : ''}`}>
        <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="검색..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={e => e.key === 'Escape' && (setOpen(false), nav.uiActive = false)}
        />
        {query && (
          <button className="search-clear" onClick={() => { setQuery(''); inputRef.current?.focus() }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="search-results">
          {results.map(post => (
            <div key={post.id} className="search-result-item" onMouseDown={() => handleSelect(post)}>
              <span className="search-result-tag" style={{ color: post.color, borderColor: post.color + '40', background: post.color + '15' }}>
                {post.tag}
              </span>
              <span className="search-result-title">{post.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
