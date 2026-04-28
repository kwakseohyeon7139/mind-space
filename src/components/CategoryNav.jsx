import { nav } from '../nav'
import { TAG_ORDER } from './Scene'

export function CategoryNav({ open, onClose }) {
  const handleClick = (tag) => {
    const idx = TAG_ORDER.indexOf(tag)
    if (idx >= 0 && nav.galaxyCenters[idx]) {
      nav.flyTarget = [...nav.galaxyCenters[idx]]
      nav.cardPos = null
    }
    onClose()
  }

  return (
    <ul className={`category-nav ${open ? 'category-nav-open' : ''}`} aria-hidden={!open}>
      {TAG_ORDER.map(tag => (
        <li key={tag} className="category-nav-item" onClick={() => handleClick(tag)} tabIndex={open ? 0 : -1}>
          {tag} <span className="category-nav-dash">—</span>
        </li>
      ))}
    </ul>
  )
}
