import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function parseHex(hex) {
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)]
}

function sr(seed) {
  let s = seed * 127.3 + 1.618
  s = Math.sin(s) * 43758.5453123
  return s - Math.floor(s)
}

function makePlanetTex(col1, col2, seed) {
  const W = 256, H = 128
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const ctx = c.getContext('2d')

  const g = ctx.createLinearGradient(0, 0, W * 0.8, H)
  g.addColorStop(0,   col1)
  g.addColorStop(0.5, col2)
  g.addColorStop(1,   col1)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  for (let i = 0; i < 9; i++) {
    const y = sr(seed + i * 5.7) * H
    const h = 4 + sr(seed + i * 9.3) * 24
    ctx.fillStyle = `rgba(255,255,255,${0.03 + sr(seed + i * 3.1) * 0.07})`
    ctx.fillRect(0, y - h/2, W, h)
  }
  for (let i = 0; i < 5; i++) {
    const x = sr(seed + i * 11.1) * W
    const y = sr(seed + i * 13.7) * H
    const r = 12 + sr(seed + i * 7.3) * 45
    ctx.fillStyle = `rgba(0,0,0,${0.05 + sr(seed + i * 5.9) * 0.09})`
    ctx.beginPath()
    ctx.ellipse(x, y, r, r * 0.35, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  return new THREE.CanvasTexture(c)
}

function makeAtmosTex(col) {
  const [r, g, b] = parseHex(col)
  const S = 128
  const c = document.createElement('canvas'); c.width = S; c.height = S
  const ctx = c.getContext('2d')
  const grad = ctx.createRadialGradient(S/2, S/2, S * 0.28, S/2, S/2, S/2)
  grad.addColorStop(0,    'rgba(0,0,0,0)')
  grad.addColorStop(0.35, `rgba(${r},${g},${b},0.14)`)
  grad.addColorStop(0.65, `rgba(${r},${g},${b},0.05)`)
  grad.addColorStop(1,    'rgba(0,0,0,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, S, S)
  return new THREE.CanvasTexture(c)
}

function makeGlowTex(col, alpha = 0.9) {
  const [r, g, b] = parseHex(col)
  const S = 256
  const c = document.createElement('canvas'); c.width = S; c.height = S
  const ctx = c.getContext('2d')
  const grad = ctx.createRadialGradient(S/2, S/2, 0, S/2, S/2, S/2)
  grad.addColorStop(0,    `rgba(255,255,240,${alpha})`)
  grad.addColorStop(0.07, `rgba(${r},${g},${b},${(alpha * 0.9).toFixed(2)})`)
  grad.addColorStop(0.28, `rgba(${r},${g},${b},${(alpha * 0.35).toFixed(2)})`)
  grad.addColorStop(0.6,  `rgba(${r},${g},${b},${(alpha * 0.07).toFixed(2)})`)
  grad.addColorStop(1,    'rgba(0,0,0,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, S, S)
  return new THREE.CanvasTexture(c)
}

function makeFlareTex(col) {
  const [r, g, b] = parseHex(col)
  const S = 1024
  const c = document.createElement('canvas'); c.width = S; c.height = S
  const ctx = c.getContext('2d')
  const cx = S / 2
  const cy = S / 2

  ctx.clearRect(0, 0, S, S)

  const drawRay = (angle, len, width, alpha) => {
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(angle)

    const grad = ctx.createLinearGradient(-len / 2, 0, len / 2, 0)
    grad.addColorStop(0, 'rgba(0,0,0,0)')
    grad.addColorStop(0.16, `rgba(${r},${g},${b},${(alpha * 0.018).toFixed(3)})`)
    grad.addColorStop(0.38, `rgba(255,224,172,${(alpha * 0.22).toFixed(3)})`)
    grad.addColorStop(0.48, `rgba(255,235,190,${(alpha * 0.50).toFixed(3)})`)
    grad.addColorStop(0.50, `rgba(255,255,248,${alpha.toFixed(3)})`)
    grad.addColorStop(0.52, `rgba(255,235,190,${(alpha * 0.50).toFixed(3)})`)
    grad.addColorStop(0.62, `rgba(255,224,172,${(alpha * 0.24).toFixed(3)})`)
    grad.addColorStop(0.84, `rgba(${r},${g},${b},${(alpha * 0.018).toFixed(3)})`)
    grad.addColorStop(1, 'rgba(0,0,0,0)')

    ctx.globalCompositeOperation = 'lighter'
    ctx.fillStyle = grad
    for (let i = 0; i < 4; i++) {
      const t = i / 3
      const band = width * (1 - t * 0.82)
      ctx.globalAlpha = Math.pow(1 - t, 2.7)
      ctx.fillRect(-len / 2, -band / 2, len, band)
    }
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
    ctx.restore()
  }

  const drawGhost = (x, y, radius, alpha, warm = 1) => {
    const gr = Math.round(r * warm + 255 * (1 - warm))
    const gg = Math.round(g * warm + 245 * (1 - warm))
    const gb = Math.round(b * warm + 225 * (1 - warm))
    const grad = ctx.createRadialGradient(x, y, radius * 0.18, x, y, radius)
    grad.addColorStop(0, `rgba(${gr},${gg},${gb},${(alpha * 0.18).toFixed(3)})`)
    grad.addColorStop(0.62, `rgba(${gr},${gg},${gb},${(alpha * 0.075).toFixed(3)})`)
    grad.addColorStop(0.82, `rgba(${gr},${gg},${gb},${(alpha * 0.16).toFixed(3)})`)
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }

  drawRay(0, S * 0.58, S * 0.034, 0.98)
  drawRay(Math.PI / 2, S * 0.48, S * 0.026, 0.82)
  drawRay(Math.PI / 4, S * 0.68, S * 0.034, 0.94)
  drawRay(-Math.PI / 4, S * 0.62, S * 0.026, 0.76)
  drawRay(Math.PI * 0.12, S * 0.28, S * 0.014, 0.28)
  drawRay(-Math.PI * 0.12, S * 0.26, S * 0.014, 0.22)

  drawGhost(cx + S * 0.10, cy + S * 0.02, S * 0.060, 0.30, 0.72)
  drawGhost(cx + S * 0.21, cy + S * 0.06, S * 0.095, 0.24, 0.88)
  drawGhost(cx + S * 0.34, cy + S * 0.12, S * 0.060, 0.22, 0.58)
  drawGhost(cx + S * 0.43, cy + S * 0.18, S * 0.028, 0.28, 0.38)

  const arc = ctx.createRadialGradient(cx + S * 0.33, cy + S * 0.09, S * 0.16, cx + S * 0.33, cy + S * 0.09, S * 0.36)
  arc.addColorStop(0.54, 'rgba(0,0,0,0)')
  arc.addColorStop(0.66, `rgba(${r},${g},${b},0.034)`)
  arc.addColorStop(0.70, 'rgba(255,235,190,0.044)')
  arc.addColorStop(0.76, `rgba(${r},${g},${b},0.018)`)
  arc.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = arc
  ctx.fillRect(0, 0, S, S)

  ctx.save()
  ctx.translate(cx, cy)
  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, S * 0.075)
  core.addColorStop(0, 'rgba(255,255,245,0.9)')
  core.addColorStop(0.18, 'rgba(255,250,226,0.62)')
  core.addColorStop(0.42, `rgba(${r},${g},${b},0.24)`)
  core.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = core
  ctx.fillRect(-S * 0.10, -S * 0.10, S * 0.20, S * 0.20)
  ctx.restore()

  return new THREE.CanvasTexture(c)
}

function makeNebulaTex(col, seed) {
  const [r, g, b] = parseHex(col)
  const S = 256
  const c = document.createElement('canvas'); c.width = S; c.height = S
  const ctx = c.getContext('2d')

  for (let i = 0; i < 6; i++) {
    const bx = S * (0.15 + sr(seed + i * 11.3) * 0.70)
    const by = S * (0.15 + sr(seed + i * 13.7) * 0.70)
    const br = S * (0.18 + sr(seed + i * 7.1)  * 0.28)
    const a  = 0.10 + sr(seed + i * 17.9) * 0.14
    const grad = ctx.createRadialGradient(bx, by, 0, bx, by, br)
    grad.addColorStop(0, `rgba(${r},${g},${b},${a.toFixed(2)})`)
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, S, S)
  }
  const cx = S * (0.3 + sr(seed * 3.3) * 0.4)
  const cy = S * (0.3 + sr(seed * 5.7) * 0.4)
  const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, S * 0.12)
  cg.addColorStop(0, 'rgba(255,255,255,0.10)')
  cg.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = cg
  ctx.fillRect(0, 0, S, S)

  return new THREE.CanvasTexture(c)
}

function makeGalaxyTex(col) {
  const [r, g, b] = parseHex(col)
  const W = 128, H = 40
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const ctx = c.getContext('2d')

  const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W/2)
  grad.addColorStop(0,    'rgba(255,255,255,0.95)')
  grad.addColorStop(0.07, `rgba(${r},${g},${b},0.82)`)
  grad.addColorStop(0.28, `rgba(${r},${g},${b},0.35)`)
  grad.addColorStop(0.60, `rgba(${r},${g},${b},0.08)`)
  grad.addColorStop(1,    'rgba(0,0,0,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  return new THREE.CanvasTexture(c)
}

// ── Colorful space background skybox ─────────────────────────────
function makeBackgroundTex() {
  const W = 1024, H = 512
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const ctx = c.getContext('2d')

  // deep space base
  ctx.fillStyle = '#06060e'
  ctx.fillRect(0, 0, W, H)

  // large colorful nebula patches — balanced, none dominating
  const patches = [
    { x: 0.08, y: 0.30, rx: 0.32, ry: 0.26, col: [80, 20, 145], a: 0.11 },   // purple
    { x: 0.72, y: 0.55, rx: 0.28, ry: 0.22, col: [16, 50, 140], a: 0.10 },   // deep blue
    { x: 0.44, y: 0.10, rx: 0.26, ry: 0.22, col: [150, 20, 85], a: 0.12 },   // magenta
    { x: 0.88, y: 0.20, rx: 0.24, ry: 0.20, col: [12, 105, 82], a: 0.12 },   // teal
    { x: 0.26, y: 0.80, rx: 0.28, ry: 0.22, col: [80, 15, 108], a: 0.11 },   // violet
    { x: 0.64, y: 0.86, rx: 0.22, ry: 0.18, col: [118, 52, 12], a: 0.12 },   // amber
    { x: 0.50, y: 0.48, rx: 0.18, ry: 0.14, col: [25, 72, 130], a: 0.08 },   // mid-blue
    { x: 0.16, y: 0.54, rx: 0.20, ry: 0.16, col: [52, 10, 82],  a: 0.09 },   // dark purple
    { x: 0.92, y: 0.70, rx: 0.18, ry: 0.15, col: [30, 120, 70], a: 0.10 },   // green
    { x: 0.36, y: 0.42, rx: 0.16, ry: 0.13, col: [140, 30, 55], a: 0.08 },   // rose
  ]

  patches.forEach(p => {
    const px = p.x * W, py = p.y * H
    const prx = p.rx * W * 0.55, pry = p.ry * H * 0.85
    const [r, g, b] = p.col

    ctx.save()
    ctx.scale(1, pry / prx)
    const grad = ctx.createRadialGradient(px, py * (prx / pry), 0, px, py * (prx / pry), prx)
    grad.addColorStop(0,   `rgba(${r},${g},${b},${p.a})`)
    grad.addColorStop(0.4, `rgba(${r},${g},${b},${(p.a * 0.55).toFixed(2)})`)
    grad.addColorStop(0.7, `rgba(${r},${g},${b},${(p.a * 0.20).toFixed(2)})`)
    grad.addColorStop(1,   'rgba(0,0,0,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H * (prx / pry))
    ctx.restore()
  })

  // subtle star-dust layer
  for (let i = 0; i < 320; i++) {
    const sx = sr(i * 7.1 + 1) * W
    const sy = sr(i * 11.3 + 2) * H
    const sa = 0.05 + sr(i * 13.7 + 3) * 0.18
    ctx.fillStyle = `rgba(255,255,255,${sa.toFixed(2)})`
    ctx.fillRect(sx, sy, 1, 1)
  }

  const tex = new THREE.CanvasTexture(c)
  return tex
}

// ── Data ──────────────────────────────────────────────────────────

const PLANETS = [
  { pos: [-110, 28, -155], radius: 4.0, col1: '#1e4a7a', col2: '#0e2d50', atmos: '#4a90c8', seed: 1 },
  { pos: [ 160,-35, -200], radius: 2.6, col1: '#9a5c2a', col2: '#5c2e10', atmos: '#c47840', seed: 2 },
  { pos: [-175, 50,  110], radius: 4.8, col1: '#1a4a44', col2: '#0a2e2a', atmos: '#2e9e94', seed: 3 },
  { pos: [  70,-80,  185], radius: 3.0, col1: '#3a1e5a', col2: '#1e0e30', atmos: '#7a4aaa', seed: 4 },
]

const SUN_POS = [280, -55, -380]
const SUN_R   = 16

// nebulae — more vivid colors now
const NEBULAE = [
  { pos: [-190,  55, -270], size: 75, col: '#5a18a0', seed: 1 },
  { pos: [ 240, -40, -320], size: 58, col: '#123070', seed: 2 },
  { pos: [-260,  90,  195], size: 86, col: '#0e4228', seed: 3 },
  { pos: [ 130, -95,  255], size: 52, col: '#5a0e38', seed: 4 },
  { pos: [-100,  70, -200], size: 66, col: '#2e1a60', seed: 5 },
  { pos: [ 200, 120, -150], size: 44, col: '#703010', seed: 6 },
]

const DISTANT_GALAXIES = [
  { pos: [-460,  95, -630], w: 36, h: 13, col: '#9070e0' },
  { pos: [ 590, -85, -510], w: 28, h: 10, col: '#e07050' },
  { pos: [-410, 170,  500], w: 24, h:  9, col: '#50c0a0' },
  { pos: [ 370,-190,  580], w: 30, h: 11, col: '#7090e0' },
  { pos: [ 210, 230, -720], w: 20, h:  8, col: '#e050b0' },
  { pos: [-300,-250,  400], w: 22, h:  8, col: '#60d0a0' },
]

const ASTEROIDS = Array.from({ length: 18 }, (_, i) => {
  const phi   = Math.acos(2 * sr(i * 13.1) - 1)
  const theta = sr(i * 17.3) * Math.PI * 2
  const dist  = 14 + sr(i * 23.7) * 50
  return {
    initPos: [
      dist * Math.sin(phi) * Math.cos(theta),
      dist * Math.cos(phi) * 0.55,
      dist * Math.sin(phi) * Math.sin(theta),
    ],
    vel: [
      (sr(i * 31.1) - 0.5) * 1.1,
      (sr(i * 37.7) - 0.5) * 0.35,
      (sr(i * 41.3) - 0.5) * 1.1,
    ],
    size:     0.22 + sr(i * 53.9) * 0.52,
    rotSpeed: (sr(i * 61.1) - 0.5) * 2.4,
    rotAxis:  ['x','y','z'][i % 3],
    gray:     65 + Math.floor(sr(i * 71.3) * 35),
  }
})

// meteor shower config — slow, gentle, distant
const METEOR_COUNT = 10
const METEOR_DATA = Array.from({ length: METEOR_COUNT }, (_, i) => {
  // spawn far away on a wide sphere
  const phi   = Math.acos(2 * sr(i * 13.7 + 99) - 1)
  const theta = sr(i * 11.3 + 88) * Math.PI * 2
  const dist  = 160 + sr(i * 7.1 + 77) * 120   // very far: 160–280 units out
  const speed = 3.5 + sr(i * 17.1 + 66) * 3.5  // glacially slow: 3.5–7 units/s
  // drift mostly downward with gentle lateral drift
  const vy = -(0.55 + sr(i * 23.7 + 44) * 0.35) * speed
  const vx = (sr(i * 19.3 + 55) - 0.5) * speed * 0.3
  const vz = (sr(i * 29.3 + 33) - 0.5) * speed * 0.25
  return {
    start: [
      dist * Math.sin(phi) * Math.cos(theta),
      40 + sr(i * 5.9 + 77) * 60,   // upper hemisphere
      dist * Math.sin(phi) * Math.sin(theta),
    ],
    vel: [vx, vy, vz],
    tailLen: 2.5 + sr(i * 37.1 + 22) * 3.5,  // short, subtle tail
    period:  14 + sr(i * 41.3 + 11) * 20,     // long period: 14–34s between meteors
    offset:  sr(i * 43.7 + 0) * 40,           // very spread out timing
  }
})

// ── Components ───────────────────────────────────────────────────

function SpaceBackground() {
  const tex = useMemo(() => makeBackgroundTex(), [])
  return (
    <mesh renderOrder={-10}>
      <sphereGeometry args={[490, 48, 24]} />
      <meshBasicMaterial map={tex} side={THREE.BackSide} depthWrite={false} />
    </mesh>
  )
}

function MeteorShower() {
  const posArr = useMemo(() => new Float32Array(METEOR_COUNT * 6).fill(9999), [])
  const colArr = useMemo(() => new Float32Array(METEOR_COUNT * 6).fill(0), [])

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(posArr, 3))
    g.setAttribute('color',    new THREE.BufferAttribute(colArr, 3))
    return g
  }, [posArr, colArr])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()

    METEOR_DATA.forEach((m, i) => {
      const phase = (t + m.offset) % m.period
      const active = phase < m.period * 0.30   // only visible 30% of the period

      if (!active) {
        for (let j = 0; j < 6; j++) colArr[i * 6 + j] = 0
      } else {
        const p = phase / (m.period * 0.30)
        const bright = Math.sin(p * Math.PI) * 0.42  // much dimmer — 0.42 vs 0.88

        const hx = m.start[0] + m.vel[0] * phase
        const hy = m.start[1] + m.vel[1] * phase
        const hz = m.start[2] + m.vel[2] * phase

        const spd = Math.hypot(...m.vel)
        const nx = m.vel[0] / spd
        const ny = m.vel[1] / spd
        const nz = m.vel[2] / spd

        // head
        posArr[i * 6 + 0] = hx
        posArr[i * 6 + 1] = hy
        posArr[i * 6 + 2] = hz
        // tail (behind head)
        posArr[i * 6 + 3] = hx - nx * m.tailLen
        posArr[i * 6 + 4] = hy - ny * m.tailLen
        posArr[i * 6 + 5] = hz - nz * m.tailLen

        // head: bright white-blue
        colArr[i * 6 + 0] = bright
        colArr[i * 6 + 1] = bright
        colArr[i * 6 + 2] = bright
        // tail: near invisible (fade to black)
        colArr[i * 6 + 3] = bright * 0.04
        colArr[i * 6 + 4] = bright * 0.06
        colArr[i * 6 + 5] = bright * 0.12
      }
    })

    geo.attributes.position.needsUpdate = true
    geo.attributes.color.needsUpdate = true
  })

  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial vertexColors blending={THREE.AdditiveBlending} depthWrite={false} />
    </lineSegments>
  )
}

function Planet({ pos, radius, col1, col2, atmos, seed }) {
  const meshRef  = useRef()
  const tex      = useMemo(() => makePlanetTex(col1, col2, seed), [])
  const atmosTex = useMemo(() => makeAtmosTex(atmos), [])
  const glowSize = radius * 2.9

  useFrame((_, dt) => {
    if (meshRef.current) meshRef.current.rotation.y += 0.035 * dt
  })

  return (
    <group position={pos}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, 40, 20]} />
        <meshBasicMaterial map={tex} />
      </mesh>
      <sprite scale={[glowSize, glowSize, glowSize]}>
        <spriteMaterial map={atmosTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  )
}

function Asteroid({ data }) {
  const meshRef = useRef()
  const pos     = useRef([...data.initPos])
  const col     = `rgb(${data.gray+4},${data.gray+2},${data.gray})`

  useFrame((_, dt) => {
    if (!meshRef.current) return
    pos.current[0] += data.vel[0] * dt
    pos.current[1] += data.vel[1] * dt
    pos.current[2] += data.vel[2] * dt

    const [x, y, z] = pos.current
    if (x*x + y*y + z*z > 85 * 85) {
      pos.current = [-x * 0.75, -y * 0.75, -z * 0.75]
    }

    meshRef.current.position.set(...pos.current)
    meshRef.current.rotation[data.rotAxis] += data.rotSpeed * dt
  })

  return (
    <mesh ref={meshRef} position={data.initPos}>
      <icosahedronGeometry args={[data.size, 0]} />
      <meshBasicMaterial color={col} />
    </mesh>
  )
}

function Sun() {
  const flareRef = useRef()
  const cssTick = useRef(0)
  const flareTex = useMemo(() => makeFlareTex('#e8700a'), [])
  const glowTex  = useMemo(() => makeGlowTex('#e8700a', 0.85), [])
  const innerTex = useMemo(() => makeGlowTex('#ffd060', 0.65), [])
  const sunWorld  = useMemo(() => new THREE.Vector3(...SUN_POS), [])
  const projected = useMemo(() => new THREE.Vector3(), [])
  const cameraDir = useMemo(() => new THREE.Vector3(), [])
  const toSun     = useMemo(() => new THREE.Vector3(), [])
  const flareW   = SUN_R * 4
  const flareH   = SUN_R * 4
  const outerS   = SUN_R * 5.5
  const innerS   = SUN_R * 2.6

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (t - cssTick.current < 1 / 30) return
    cssTick.current = t

    const { camera, size } = state
    projected.copy(sunWorld).project(camera)
    camera.getWorldDirection(cameraDir)
    toSun.copy(sunWorld).sub(camera.position).normalize()

    const px = (projected.x * 0.5 + 0.5) * size.width
    const py = (-projected.y * 0.5 + 0.5) * size.height
    const targetX = size.width * 0.5
    const targetY = size.height * 0.42
    let dx = targetX - px
    let dy = targetY - py
    let dist = Math.hypot(dx, dy)

    if (dist < 90) {
      dx = 0
      dy = -Math.max(220, size.height * 0.36)
      dist = Math.abs(dy)
    }

    const facing = cameraDir.dot(toSun)
    const nearFrame = px > -size.width * 0.35 && px < size.width * 1.35 && py > -size.height * 0.35 && py < size.height * 1.35
    const visible = facing > 0.08 && projected.z > -1 && projected.z < 1 && nearFrame
    const pulse = 0.04 * Math.sin(t * 0.55)
    const opacity = visible ? Math.min(0.86, 0.68 + pulse) : 0
    const angle = Math.atan2(dy, dx) * 180 / Math.PI
    const length = Math.max(360, dist * 1.45)
    const root = document.documentElement

    root.style.setProperty('--sun-flare-x', `${px.toFixed(1)}px`)
    root.style.setProperty('--sun-flare-y', `${py.toFixed(1)}px`)
    root.style.setProperty('--sun-flare-angle', `${angle.toFixed(2)}deg`)
    root.style.setProperty('--sun-flare-length', `${length.toFixed(1)}px`)
    root.style.setProperty('--sun-flare-opacity', opacity.toFixed(3))
    root.style.setProperty('--sun-flare-mid-x', `${(px + dx * 0.52).toFixed(1)}px`)
    root.style.setProperty('--sun-flare-mid-y', `${(py + dy * 0.52).toFixed(1)}px`)

    ;[0.22, 0.38, 0.56, 0.74].forEach((step, i) => {
      root.style.setProperty(`--sun-ghost-${i + 1}-x`, `${(px + dx * step).toFixed(1)}px`)
      root.style.setProperty(`--sun-ghost-${i + 1}-y`, `${(py + dy * step).toFixed(1)}px`)
    })
  })

  return (
    <group position={SUN_POS}>
      <sprite ref={flareRef} scale={[flareW, flareH, 1]} renderOrder={3}>
        <spriteMaterial map={flareTex} transparent depthWrite={false} depthTest={false} blending={THREE.AdditiveBlending} opacity={0} />
      </sprite>
      <mesh>
        <sphereGeometry args={[SUN_R, 32, 16]} />
        <meshBasicMaterial color="#fff8e0" />
      </mesh>
      <sprite scale={[innerS, innerS, innerS]}>
        <spriteMaterial map={innerTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <sprite scale={[outerS, outerS, outerS]}>
        <spriteMaterial map={glowTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  )
}

function Nebula({ pos, size, col, seed }) {
  const tex = useMemo(() => makeNebulaTex(col, seed), [])
  return (
    <sprite position={pos} scale={[size, size, size]}>
      <spriteMaterial map={tex} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </sprite>
  )
}

function DistantGalaxy({ pos, w, h, col }) {
  const tex = useMemo(() => makeGalaxyTex(col), [col])
  return (
    <sprite position={pos} scale={[w, h, 1]}>
      <spriteMaterial map={tex} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </sprite>
  )
}

export function SpaceObjects() {
  return (
    <>
      <SpaceBackground />
      <MeteorShower />
      <Sun />
      {PLANETS.map((p, i)           => <Planet key={i} {...p} />)}
      {ASTEROIDS.map((a, i)         => <Asteroid key={i} data={a} />)}
      {NEBULAE.map((n, i)           => <Nebula key={i} {...n} />)}
      {DISTANT_GALAXIES.map((g, i)  => <DistantGalaxy key={i} {...g} />)}
    </>
  )
}
