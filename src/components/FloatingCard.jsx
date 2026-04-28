import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { AdditiveBlending } from 'three'
import { dragState } from './FPSControls'
import { nav } from '../nav'

const FAR_DIST  = 38
const NEAR_DIST = 33

function wrapLines(ctx, text, maxW, maxLines = 2) {
  const words = text.split(' ')
  const lines = []
  let line = ''
  for (const word of words) {
    const test = line + word + ' '
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line.trim())
      if (lines.length >= maxLines) { lines[lines.length - 1] += '…'; return lines }
      line = word + ' '
    } else { line = test }
  }
  if (line.trim()) lines.push(line.trim())
  return lines
}

function hexToRgb(hex) {
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)]
}

const _starCache = {}
function makeStarTexture(color, bright) {
  const key = color + (bright ? '_b' : '_d')
  if (_starCache[key]) return _starCache[key]
  const [r, g, b] = hexToRgb(color)

  const canvas = document.createElement('canvas')
  if (bright) {
    // vivid colored glow — only 25% blend toward blue-white, keep the hue
    const d = 0.25
    const dr = Math.round(r * (1-d) + 195 * d)
    const dg = Math.round(g * (1-d) + 210 * d)
    const db = Math.round(b * (1-d) + 255 * d)
    const S = 128
    canvas.width = S; canvas.height = S
    const ctx = canvas.getContext('2d')
    const grad = ctx.createRadialGradient(S/2, S/2, 0, S/2, S/2, S/2)
    grad.addColorStop(0,    'rgba(255,255,255,1.0)')
    grad.addColorStop(0.06, 'rgba(255,255,255,0.95)')
    grad.addColorStop(0.14, `rgba(${dr},${dg},${db},0.85)`)
    grad.addColorStop(0.32, `rgba(${dr},${dg},${db},0.52)`)
    grad.addColorStop(0.55, `rgba(${dr},${dg},${db},0.18)`)
    grad.addColorStop(0.76, `rgba(${dr},${dg},${db},0.04)`)
    grad.addColorStop(1,    'rgba(0,0,0,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, S, S)
  } else {
    // dim star — tight blue-white pinpoint, barely any spread
    const S = 48
    canvas.width = S; canvas.height = S
    const ctx = canvas.getContext('2d')
    const grad = ctx.createRadialGradient(S/2, S/2, 0, S/2, S/2, S/2)
    grad.addColorStop(0,    'rgba(255,255,255,1.0)')
    grad.addColorStop(0.15, 'rgba(220,230,255,0.65)')
    grad.addColorStop(0.32, 'rgba(200,218,255,0.16)')
    grad.addColorStop(0.55, 'rgba(200,218,255,0.03)')
    grad.addColorStop(1,    'rgba(0,0,0,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, S, S)
  }

  const tex = new THREE.CanvasTexture(canvas)
  _starCache[key] = tex
  return tex
}

const _cardCache = {}
function makeTexture(post) {
  if (_cardCache[post.id]) return _cardCache[post.id]
  // logical drawing coords — all layout values use these
  const W = 280, H = 225
  // physical canvas at 2x — gives crisp text even when camera is close
  const PW = W * 2, PH = H * 2
  const canvas = document.createElement('canvas')
  canvas.width = PW; canvas.height = PH
  const ctx = canvas.getContext('2d')
  ctx.scale(2, 2)   // draw at 2× density, all coords stay in 0..W, 0..H space
  const [r, g, b] = hexToRgb(post.color)

  ctx.save()
  ctx.beginPath()
  ctx.roundRect(0, 0, W, H, 12)
  ctx.clip()

  // dark glass base
  ctx.fillStyle = 'rgba(8,10,22,0.52)'
  ctx.fillRect(0, 0, W, H)

  // color tint — diagonal bleed from top-left, more vivid
  const tint = ctx.createLinearGradient(0, 0, W * 0.8, H * 0.65)
  tint.addColorStop(0, `rgba(${r},${g},${b},0.42)`)
  tint.addColorStop(0.5, `rgba(${r},${g},${b},0.12)`)
  tint.addColorStop(1, `rgba(${r},${g},${b},0.0)`)
  ctx.fillStyle = tint
  ctx.fillRect(0, 0, W, H)

  // top glass highlight
  const shine = ctx.createLinearGradient(0, 0, 0, H * 0.45)
  shine.addColorStop(0, 'rgba(255,255,255,0.10)')
  shine.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = shine
  ctx.fillRect(0, 0, W, H)

  ctx.restore()

  // tag
  ctx.font = '700 9px Gilroy, Pretendard, "Apple SD Gothic Neo", sans-serif'
  ctx.fillStyle = `rgba(${Math.min(255,r+60)},${Math.min(255,g+60)},${Math.min(255,b+60)},0.9)`
  ctx.fillText(post.tag.toUpperCase(), 14, 26)

  // title — 27px, pushed up for more breathing room
  ctx.font = '600 27px Gilroy, Pretendard, "Apple SD Gothic Neo", sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.97)'
  const lines = wrapLines(ctx, post.title, W - 28, 2)
  const lineH = 33
  const titleY = 88
  lines.forEach((l, i) => ctx.fillText(l, 14, titleY + i * lineH))

  // excerpt — 11.5px, noticeably brighter than before
  if (post.excerpt) {
    ctx.font = '400 11.5px Gilroy, Pretendard, "Apple SD Gothic Neo", sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.72)'
    const ex = wrapLines(ctx, post.excerpt, W - 28, 2)
    const exY = titleY + lines.length * lineH + 10
    ex.forEach((l, i) => ctx.fillText(l, 14, exY + i * 16))
  }

  // date — anchored to bottom
  ctx.font = '400 8px Gilroy, Pretendard, "Apple SD Gothic Neo", sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.30)'
  ctx.fillText(post.date, 14, H - 12)

  const tex = new THREE.CanvasTexture(canvas)
  // 2× canvas gives close-up sharpness; mipmaps handle distance aliasing
  tex.anisotropy = 4
  _cardCache[post.id] = tex
  return tex
}

export function FloatingCard({ position, scale = 1, post, onClick }) {
  const groupRef  = useRef()
  const cardRef   = useRef()
  const spriteRef = useRef()
  const [hovered, setHovered] = useState(false)
  const basePos     = useMemo(() => [...position], [position])
  const offset      = useMemo(() => Math.random() * Math.PI * 2, [])
  const speed       = useMemo(() => 0.20 + Math.random() * 0.16, [])
  const tilt        = useMemo(() => (Math.random() - 0.5) * 0.26, [])
  const cardTex     = useMemo(() => makeTexture(post), [post])
  const isBright    = useMemo(() => Math.abs(Math.sin(post.id * 89.31 + 7.1)) > 0.72, [post.id])
  const starTex     = useMemo(() => makeStarTexture(post.color, isBright), [post.color, isBright])
  const starScale   = useMemo(() => {
    const v = Math.abs(Math.sin(post.id * 89.31 + 7.1))
    // bright top ~28%: large colorful glow 3.8–5.6
    // dim  rest:       tiny pinpoints 0.55–1.1
    return v > 0.72 ? 3.8 + (v - 0.72) / 0.28 * 1.8 : 0.55 + v * 0.77
  }, [post.id])
  const targetScale = useRef(new THREE.Vector3(scale, scale, scale))
  const isFar       = useRef(true)

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.getElapsedTime()

    groupRef.current.position.set(
      basePos[0],
      basePos[1] + Math.sin(t * speed + offset) * 0.13,
      basePos[2]
    )
    const s = hovered ? scale * 1.07 : scale
    targetScale.current.set(s, s, s)
    groupRef.current.scale.lerp(targetScale.current, 0.1)

    const dist = state.camera.position.distanceTo(groupRef.current.position)
    const threshold = isFar.current ? NEAR_DIST : FAR_DIST
    const nowFar = dist > threshold

    if (nowFar !== isFar.current) {
      isFar.current = nowFar
      if (cardRef.current)   cardRef.current.visible   = !nowFar
      if (spriteRef.current) spriteRef.current.visible =  nowFar
    }

    if (cardRef.current && !isFar.current) {
      cardRef.current.lookAt(state.camera.position)
      cardRef.current.rotateZ(tilt)
    }
  })

  return (
    <group ref={groupRef} position={position}>
      <mesh
        ref={cardRef}
        visible={false}
        onClick={(e) => {
          if (dragState.active) return
          e.stopPropagation()
          nav.cardPos = [...basePos]
          onClick(post)
        }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true);  document.body.style.cursor = 'pointer' }}
        onPointerOut={() =>   { setHovered(false); document.body.style.cursor = 'default' }}
      >
        <planeGeometry args={[2.8, 2.25]} />
        <meshBasicMaterial map={cardTex} transparent side={THREE.DoubleSide} />
      </mesh>

      <sprite ref={spriteRef} visible={true} scale={[starScale, starScale, starScale]}>
        <spriteMaterial map={starTex} transparent depthWrite={false} blending={AdditiveBlending} />
      </sprite>
    </group>
  )
}
