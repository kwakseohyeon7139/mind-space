import { nav } from '../nav'
import { TAG_ORDER } from './Scene'

const TAG_COLORS = {
  '생각': '#8b5cf6',
  '감정': '#f472b6',
  '일상': '#fb923c',
  '취미': '#34d399',
  '회고': '#60a5fa',
}

const TAG_LABELS = {
  '생각': 'Thoughts',
  '감정': 'Feelings',
  '일상': 'Daily',
  '취미': 'Hobbies',
  '회고': 'Memoir',
}

export function CategoryNav({ open, onClose }) {
  const handleCategoryClick = (tag) => {
    const idx = TAG_ORDER.indexOf(tag)
    if (idx >= 0 && nav.galaxyCenters[idx]) {
      nav.flyTarget = [...nav.galaxyCenters[idx]]
      nav.cardPos = null
    }
    onClose()
  }

  return (
    <div className={`category-nav ${open ? 'category-nav-open' : ''}`} aria-hidden={!open}>
      <div className="category-nav-header">galaxies</div>
      {TAG_ORDER.map(tag => (
        <button
          key={tag}
          className="category-nav-item"
          onClick={() => handleCategoryClick(tag)}
          tabIndex={open ? 0 : -1}
        >
          <span className="category-nav-dot" style={{ background: TAG_COLORS[tag] }} />
          <span className="category-nav-label">{tag}</span>
          <span className="category-nav-sub">{TAG_LABELS[tag]}</span>
        </button>
      ))}
    </div>
  )
}
