import { useRef, useEffect, useState } from 'react'
import { posts } from '../data/posts'
import { nav } from '../nav'

const S = 108        // canvas pixel size (square → clipped to circle)
const WORLD_R = 115  // world-unit radius shown in minimap

const colorMap = {}
posts.forEach(p => { colorMap[p.id] = p.color })

function toCanvas(x, z) {
  return [
    (x + WORLD_R) / (WORLD_R * 2) * S,
    (z + WORLD_R) / (WORLD_R * 2) * S,
  ]
}

export function GraphMinimap({ visible }) {
  const canvasRef = useRef()
  const rafRef    = useRef()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    function draw() {
      rafRef.current = requestAnimationFrame(draw)
      const canvas = canvasRef.current
      if (!canvas || collapsed) return

      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, S, S)

      const cx = S / 2, cy = S / 2, r = S / 2 - 1

      // ── clip to circle ──
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.clip()

      // glassmorphism — semi-transparent so CSS backdrop-filter shows through
      ctx.fillStyle = 'rgba(8,10,22,0.48)'
      ctx.fillRect(0, 0, S, S)

      // grid lines — faint crosshatch
      ctx.strokeStyle = 'rgba(255,255,255,0.055)'
      ctx.lineWidth = 0.5
      const STEP = S / 4
      for (let i = 1; i < 4; i++) {
        ctx.beginPath(); ctx.moveTo(i * STEP, 0); ctx.lineTo(i * STEP, S); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(0, i * STEP); ctx.lineTo(S, i * STEP); ctx.stroke()
      }

      // center crosshair — slightly brighter
      ctx.strokeStyle = 'rgba(255,255,255,0.11)'
      ctx.lineWidth = 0.5
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, S); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(S, cy); ctx.stroke()

      // card dots — unified gray
      Object.entries(nav.cardPositions).forEach(([id, pos]) => {
        if (!pos) return
        const [dx, dy] = toCanvas(pos[0], pos[2])
        if (dx < 0 || dx > S || dy < 0 || dy > S) return
        ctx.beginPath()
        ctx.arc(dx, dy, 1.4, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(200,202,210,0.50)'
        ctx.fill()
      })

      // player position
      const px  = nav.cameraPos?.x ?? 0
      const pz  = nav.cameraPos?.z ?? 0
      const yaw = nav.cameraYaw  ?? 0
      const [pcx, pcy] = toCanvas(px, pz)

      // player glow
      const glow = ctx.createRadialGradient(pcx, pcy, 0, pcx, pcy, 9)
      glow.addColorStop(0, 'rgba(255,255,255,0.28)')
      glow.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(pcx, pcy, 9, 0, Math.PI * 2)
      ctx.fill()

      // direction triangle
      const angle = Math.atan2(-Math.cos(yaw), -Math.sin(yaw)) + Math.PI / 2
      ctx.save()
      ctx.translate(pcx, pcy)
      ctx.rotate(angle)
      ctx.beginPath()
      ctx.moveTo(0, -5.5)
      ctx.lineTo(3, 3)
      ctx.lineTo(-3, 3)
      ctx.closePath()
      ctx.fillStyle = 'rgba(255,255,255,0.92)'
      ctx.fill()
      ctx.restore()

      // player center dot
      ctx.beginPath()
      ctx.arc(pcx, pcy, 1.8, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()

      ctx.restore() // end circle clip

      // circle border ring — thin
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'
      ctx.lineWidth = 0.5
      ctx.stroke()
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [collapsed])

  return (
    <div
      className={`graph-minimap ${visible ? 'graph-minimap-visible' : ''} ${collapsed ? 'graph-minimap-collapsed' : ''}`}
      onClick={() => setCollapsed(c => !c)}
      title={collapsed ? 'Expand map' : 'Collapse map'}
    >
      <canvas ref={canvasRef} width={S} height={S} />
    </div>
  )
}
