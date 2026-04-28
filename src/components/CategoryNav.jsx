import { nav } from '../nav'
import { TAG_ORDER } from './Scene'

export function CategoryNav({ visible }) {
  const handleClick = (tag) => {
    const idx = TAG_ORDER.indexOf(tag)
    if (idx >= 0 && nav.galaxyCenters[idx]) {
      nav.flyTarget = [...nav.galaxyCenters[idx]]
      nav.cardPos = null
    }
  }

  return (
    <ul className={`category-nav ${visible ? 'category-nav-open' : ''}`}>
      {TAG_ORDER.map(tag => (
        <li key={tag} className="category-nav-item" onClick={() => handleClick(tag)}>
          {tag} <span className="category-nav-dash">—</span>
        </li>
      ))}
    </ul>
  )
}
