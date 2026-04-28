import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

const START_Z = 28
const TARGET_Z = 9
const DURATION = 3.0

export function CameraIntro() {
  const { camera } = useThree()
  const startTime = useRef(null)
  const done = useRef(false)

  useEffect(() => {
    camera.position.set(0, 0, START_Z)
  }, [camera])

  useFrame((state) => {
    if (done.current) return

    if (!startTime.current) {
      startTime.current = state.clock.getElapsedTime()
    }

    const elapsed = state.clock.getElapsedTime() - startTime.current
    const t = Math.min(elapsed / DURATION, 1)
    // ease out expo — fast at first, then gently settles
    const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)

    camera.position.z = START_Z + (TARGET_Z - START_Z) * eased

    if (t >= 1) done.current = true
  })

  return null
}
