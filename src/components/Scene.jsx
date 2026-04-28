import { useMemo } from 'react'
import { Stars } from '@react-three/drei'
import { FloatingCard } from './FloatingCard'
import { FPSControls } from './FPSControls'
import { SpaceObjects } from './SpaceObjects'
import { posts } from '../data/posts'
import { nav } from '../nav'


const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))
const NUM_GALAXIES = 5
const CLUSTER_R = 32      // wider scatter — fills more of the sky

function seededRand(seed) {
  let s = seed + 1.618
  return () => {
    s = Math.sin(s) * 43758.5453123
    return s - Math.floor(s)
  }
}


export const TAG_ORDER = ['생각', '감정', '일상', '취미', '회고']

function buildPositions(posts) {
  // group by tag so each galaxy = one color family
  const groups = Array.from({ length: NUM_GALAXIES }, () => [])
  posts.forEach(post => {
    const idx = TAG_ORDER.indexOf(post.tag)
    groups[idx < 0 ? 0 : idx].push(post)
  })

  const positions = {}
  const centers = []

  Array.from({ length: NUM_GALAXIES }).forEach((_, gi) => {
    const rand = seededRand(gi * 137.508)

    // galaxy center on fibonacci sphere
    const phi   = Math.acos(1 - 2 * (gi + 0.5) / NUM_GALAXIES)
    const theta = GOLDEN_ANGLE * gi
    const R     = 58 + rand() * 16

    const cx = R * Math.sin(phi) * Math.cos(theta)
    const cy = R * Math.cos(phi) * 0.50
    const cz = R * Math.sin(phi) * Math.sin(theta)
    centers[gi] = [cx, cy, cz]

    const groupPosts = groups[gi]

    groupPosts.forEach((post, pi) => {
      const ra = seededRand(gi * 100 + pi * 17 + 5)
      const rb = seededRand(gi * 200 + pi * 31 + 7)
      const rc = seededRand(gi * 300 + pi * 43 + 11)

      // true 3D spherical scatter — fills all directions including up/down
      const theta2 = ra() * Math.PI * 2
      const phi2   = Math.acos(2 * rb() - 1)
      const r      = CLUSTER_R * Math.pow(rc(), 0.5)  // moderate density gradient

      positions[post.id] = [
        cx + r * Math.sin(phi2) * Math.cos(theta2),
        cy + r * Math.cos(phi2),
        cz + r * Math.sin(phi2) * Math.sin(theta2),
      ]
    })
  })

  nav.galaxyCenters = centers
  return positions
}

export function Scene({ onCardClick }) {
  const cardData = useMemo(() => {
    const positions = buildPositions(posts)
    return posts.map((post, i) => {
      const pos = positions[post.id] ?? [0, 0, -10]
      nav.cardPositions[post.id] = pos
      const rand = seededRand(i * 73 + 11)
      return { post, position: pos, scale: 0.82 + rand() * 0.32 }
    })
  }, [])

  return (
    <>
      <FPSControls />
      <Stars radius={200} depth={60} count={3500} factor={5} saturation={0} fade speed={0.05} />
      <ambientLight intensity={0.08} />
      <SpaceObjects />
      {cardData.map(({ post, position, scale }) => (
        <FloatingCard
          key={post.id}
          post={post}
          position={position}
          scale={scale}
          onClick={onCardClick}
        />
      ))}
    </>
  )
}
