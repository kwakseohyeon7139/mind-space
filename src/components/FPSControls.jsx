import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { nav, config } from '../nav'

export const dragState = { active: false }

const SPEED = 14
const DRAG_SENSITIVITY = 0.002
const LOOK_ROT_SPEED = 1.0
const AUTO_YAW = 0.00010
const LERP = 0.10

export function FPSControls() {
  const { gl } = useThree()
  const keys = useRef({})

  const yaw = useRef(0)
  const pitch = useRef(0)
  const targetYaw = useRef(0)
  const targetPitch = useRef(0)

  const mouseOver = useRef(false)
  const lastMousePos = useRef(null)
  const lookDir = useRef({ x: 0, y: 0 })
  const pointerDown = useRef(false)
  const movedDist = useRef(0)
  const vel = useRef(new THREE.Vector3())
  const scrollVel = useRef(0)

  useEffect(() => {
    const canvas = gl.domElement

    const onKey = (e) => {
      const tag = document.activeElement?.tagName.toLowerCase()
      if (tag === 'input' || tag === 'textarea') return
      keys.current[e.code] = e.type === 'keydown'
      if (['KeyW','KeyS','KeyA','KeyD','Space'].includes(e.code)) e.preventDefault()
    }

    const onMouseEnter = () => {
      mouseOver.current = true
      lastMousePos.current = null
    }

    const onMouseLeave = () => {
      mouseOver.current = false
      lastMousePos.current = null
      lookDir.current = { x: 0, y: 0 }
    }

    const onMouseMove = (e) => {
      if (config.mode === 'drag') {
        // 드래그 모드: pointerDown 여부만 체크, mouseOver 불필요
        if (!pointerDown.current) {
          lastMousePos.current = null
          return
        }
        if (lastMousePos.current === null) {
          lastMousePos.current = [e.clientX, e.clientY]
          return
        }
        const dx = e.clientX - lastMousePos.current[0]
        const dy = e.clientY - lastMousePos.current[1]
        lastMousePos.current = [e.clientX, e.clientY]
        movedDist.current += Math.abs(dx) + Math.abs(dy)
        if (movedDist.current > 4) dragState.active = true
        targetYaw.current -= dx * DRAG_SENSITIVITY
        targetPitch.current = Math.max(-1.5, Math.min(1.5, targetPitch.current - dy * DRAG_SENSITIVITY))
      } else {
        // 마우스 모드: 캔버스 중심 기준 조이스틱
        if (!mouseOver.current || nav.uiActive) {
          lookDir.current = { x: 0, y: 0 }
          return
        }
        const cx = window.innerWidth / 2
        const cy = window.innerHeight / 2
        lookDir.current = {
          x: (e.clientX - cx) / cx,
          y: (e.clientY - cy) / cy
        }
      }
    }

    const onPointerDown = () => {
      pointerDown.current = true
      movedDist.current = 0
      dragState.active = false
      lastMousePos.current = null
      nav.cardPos = null
      if (config.mode === 'drag') canvas.style.cursor = 'grabbing'
    }

    const onPointerUp = () => {
      pointerDown.current = false
      lastMousePos.current = null
      if (config.mode === 'drag') canvas.style.cursor = 'default'
      setTimeout(() => { dragState.active = false }, 80)
    }

    const onWheel = (e) => {
      e.preventDefault()
      scrollVel.current -= e.deltaY * 0.012
    }

    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    canvas.addEventListener('mouseenter', onMouseEnter)
    canvas.addEventListener('mouseleave', onMouseLeave)
    window.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
      canvas.removeEventListener('mouseenter', onMouseEnter)
      canvas.removeEventListener('mouseleave', onMouseLeave)
      window.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('wheel', onWheel)
    }
  }, [gl])

  useFrame((state, delta) => {
    const cam = state.camera

    // Fly to galaxy center when flyTarget is set
    if (nav.flyTarget) {
      const target = new THREE.Vector3(...nav.flyTarget)
      const toTarget = target.clone().sub(cam.position)
      const dist = toTarget.length()

      if (dist < 16) {
        nav.flyTarget = null
      } else {
        const dir = toTarget.clone().normalize()
        const destPos = target.clone().sub(dir.clone().multiplyScalar(14))
        cam.position.lerp(destPos, 0.045)

        const ty = Math.atan2(-dir.x, -dir.z)
        const tp = Math.asin(Math.max(-1, Math.min(1, dir.y)))
        let dy = ty - targetYaw.current
        while (dy > Math.PI) dy -= Math.PI * 2
        while (dy < -Math.PI) dy += Math.PI * 2
        targetYaw.current += dy * 0.05
        targetPitch.current += (tp - targetPitch.current) * 0.05
      }
    }

    if (nav.cardPos) {
      const target = new THREE.Vector3(...nav.cardPos)
      const toCard = target.clone().sub(cam.position)
      const dist = toCard.length()

      if (dist < 3.2) {
        nav.cardPos = null
      } else {
        const dir = toCard.clone().normalize()
        const destPos = target.clone().sub(dir.clone().multiplyScalar(3.0))
        cam.position.lerp(destPos, 0.07)

        const ty = Math.atan2(-dir.x, -dir.z)
        const tp = Math.asin(Math.max(-1, Math.min(1, dir.y)))
        let dy = ty - targetYaw.current
        while (dy > Math.PI) dy -= Math.PI * 2
        while (dy < -Math.PI) dy += Math.PI * 2
        targetYaw.current += dy * 0.07
        targetPitch.current += (tp - targetPitch.current) * 0.07
      }
    }

    const k = keys.current
    const anyKey = k['KeyW'] || k['KeyS'] || k['KeyA'] || k['KeyD'] || k['Space'] || k['ShiftLeft'] || k['ShiftRight']
    const isLookActive = config.mode === 'look' && mouseOver.current
    const isDragActive = config.mode === 'drag' && pointerDown.current

    if (isLookActive && !nav.uiActive) {
      targetYaw.current -= lookDir.current.x * LOOK_ROT_SPEED * delta
      targetPitch.current = Math.max(-1.5, Math.min(1.5,
        targetPitch.current - lookDir.current.y * LOOK_ROT_SPEED * delta
      ))
    }

    if (!isLookActive && !isDragActive && !anyKey && !nav.cardPos && !nav.flyTarget) {
      targetYaw.current += AUTO_YAW
    }

    yaw.current += (targetYaw.current - yaw.current) * LERP
    pitch.current += (targetPitch.current - pitch.current) * LERP
    cam.quaternion.setFromEuler(new THREE.Euler(pitch.current, yaw.current, 0, 'YXZ'))

    const fwd = new THREE.Vector3(
      -Math.sin(yaw.current) * Math.cos(pitch.current),
       Math.sin(pitch.current),
      -Math.cos(yaw.current) * Math.cos(pitch.current)
    )
    const right = new THREE.Vector3(Math.cos(yaw.current), 0, -Math.sin(yaw.current))
    const up = new THREE.Vector3(0, 1, 0)

    const s = SPEED * delta
    const move = new THREE.Vector3()
    if (k['KeyW']) move.addScaledVector(fwd, s)
    if (k['KeyS']) move.addScaledVector(fwd, -s)
    if (k['KeyA']) move.addScaledVector(right, -s)
    if (k['KeyD']) move.addScaledVector(right, s)
    if (k['Space']) move.addScaledVector(up, s * 0.7)
    if (k['ShiftLeft'] || k['ShiftRight']) move.addScaledVector(up, -s * 0.7)

    vel.current.lerp(move, 0.1)
    cam.position.add(vel.current)

    if (Math.abs(scrollVel.current) > 0.001) {
      cam.position.addScaledVector(fwd, scrollVel.current)
      scrollVel.current *= 0.85
    }

    nav.cameraPos = { x: cam.position.x, y: cam.position.y, z: cam.position.z }
    nav.cameraYaw = yaw.current
  })

  return null
}
