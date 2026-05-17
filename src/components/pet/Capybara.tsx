import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { PetExpression } from '../../game/pet'

interface Props {
  expression: PetExpression
  position?: [number, number, number]
}

type Reaction = 'yawn' | 'squish' | 'ear-flick' | 'tilt'
const REACTIONS: Reaction[] = ['yawn', 'squish', 'ear-flick', 'tilt']
const REACTION_DURATIONS: Record<Reaction, number> = {
  yawn: 1.4,
  squish: 0.5,
  'ear-flick': 0.6,
  tilt: 0.9,
}
const TAP_COOLDOWN_MS = 300

interface ReactionState {
  kind: Reaction
  startedAt: number      // seconds (clock.getElapsedTime())
  duration: number
}

/**
 * Round capybara — loaf-sitting, quadruped silhouette, ~8-joint articulated rig.
 *
 * Idle: subtle breath bob + slow blink + occasional ear flick. Pose drifts a
 * bit with expression (sleepy half-lids, happy bounce, studying head-down).
 *
 * Tap: triggers a random reaction (Pid pattern — single hitbox, 4 reactions
 * at equal probability). Taps are locked out while expression === 'studying'
 * (cinematic-style lock during Pomodoros).
 */
export function Capybara({ expression, position = [0, 0, 0] }: Props) {
  const root = useRef<THREE.Group>(null)
  const headGroup = useRef<THREE.Group>(null)
  const bodyGroup = useRef<THREE.Group>(null)
  const tail = useRef<THREE.Group>(null)
  const earL = useRef<THREE.Group>(null)
  const earR = useRef<THREE.Group>(null)
  const eyeL = useRef<THREE.Mesh>(null)
  const eyeR = useRef<THREE.Mesh>(null)
  const mouth = useRef<THREE.Mesh>(null)

  const [reaction, setReaction] = useState<ReactionState | null>(null)
  const lastTapAtRef = useRef<number>(0)

  const blinkSeed = useMemo(() => Math.random() * 7, [])

  // Capybara color palette — sits on the warm-mid band of the desk palette.
  const mats = useMemo(() => ({
    fur: new THREE.MeshStandardMaterial({ color: 0xc89366, roughness: 1.0 }),
    furDark: new THREE.MeshStandardMaterial({ color: 0x8b5e3e, roughness: 1.0 }),
    belly: new THREE.MeshStandardMaterial({ color: 0xe0b88a, roughness: 1.0 }),
    ink: new THREE.MeshStandardMaterial({ color: 0x10080a, roughness: 0.6 }),
    blush: new THREE.MeshStandardMaterial({ color: 0xe0746a, roughness: 0.9, transparent: true, opacity: 0.65 }),
    nose: new THREE.MeshStandardMaterial({ color: 0x3a2018, roughness: 0.7 }),
  }), [])

  // ---- Dimensions: shrink overall, more dumpling than capsule ----
  const bodyLen = 0.85
  const bodyR = 0.34
  const headR = 0.26

  function handleTap(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation()
    if (expression === 'studying') return     // cinematic lock
    const now = performance.now()
    if (now - lastTapAtRef.current < TAP_COOLDOWN_MS) return
    lastTapAtRef.current = now
    const next = REACTIONS[Math.floor(Math.random() * REACTIONS.length)]
    // Capture clock-time start at the next frame via a ref — but we don't have
    // direct access here, so stash the timestamp in seconds = performance.now/1000.
    setReaction({
      kind: next,
      startedAt: performance.now() / 1000,
      duration: REACTION_DURATIONS[next],
    })
  }

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const reactionT = reaction
      ? (performance.now() / 1000 - reaction.startedAt) / reaction.duration
      : 0
    const reactionDone = reaction && reactionT >= 1
    if (reactionDone) setReaction(null)
    const inReaction = reaction && !reactionDone
    const rk = reaction?.kind

    // ---- Body breath + reaction overrides ----
    if (root.current) {
      const breath = Math.sin(t * 1.4) * 0.012
      root.current.position.y = position[1] + breath
      let sx = 1
      let sy = 1
      let sz = 1
      sx *= 1 + breath * 0.4
      sy *= 1 - breath * 0.3
      // Squish: vertical squash + horizontal stretch
      if (inReaction && rk === 'squish') {
        const k = Math.sin(reactionT * Math.PI)        // 0→1→0
        sy *= 1 - 0.32 * k
        sx *= 1 + 0.18 * k
        sz *= 1 + 0.18 * k
      }
      // Yawn: subtle stretch up
      if (inReaction && rk === 'yawn') {
        const k = Math.sin(reactionT * Math.PI)
        sy *= 1 + 0.06 * k
      }
      root.current.scale.set(sx, sy, sz)
    }

    // ---- Head pose ----
    if (headGroup.current) {
      let rx = 0
      let ry = 0
      let rz = 0
      if (expression === 'studying') {
        rx = 0.55 + Math.sin(t * 0.9) * 0.05
      } else if (expression === 'sleepy') {
        rx = 0.32 + Math.sin(t * 0.5) * 0.04
        ry = Math.sin(t * 0.3) * 0.05
      } else if (expression === 'happy') {
        rx = -0.08 + Math.sin(t * 2.2) * 0.06
        ry = Math.sin(t * 1.6) * 0.08
      } else {
        rx = 0.08 + Math.sin(t * 0.9) * 0.04
        ry = Math.sin(t * 0.6) * 0.06
      }
      // Tilt reaction: head leans to one side and back
      if (inReaction && rk === 'tilt') {
        const k = Math.sin(reactionT * Math.PI)
        rz = 0.45 * k
        ry += 0.25 * k
      }
      // Yawn reaction: head tips up slightly
      if (inReaction && rk === 'yawn') {
        const k = Math.sin(reactionT * Math.PI)
        rx -= 0.30 * k
      }
      headGroup.current.rotation.set(rx, ry, rz)
    }

    // ---- Mouth (yawn opens it wide) ----
    if (mouth.current) {
      if (inReaction && rk === 'yawn') {
        const k = Math.sin(reactionT * Math.PI)
        mouth.current.scale.y = 1 + 3.5 * k
        mouth.current.scale.x = 1 + 0.8 * k
      } else {
        mouth.current.scale.y = 1
        mouth.current.scale.x = 1
      }
    }

    // ---- Ears ----
    function earRot(t: number, sign: 1 | -1): number {
      let r = Math.sin(t * 1.7 + sign * 0.5) * 0.04
      if (inReaction && rk === 'ear-flick') {
        const k = Math.sin(reactionT * Math.PI * 2)    // double flick
        r += 0.55 * k * sign
      }
      return r
    }
    if (earL.current) earL.current.rotation.z = earRot(t, -1)
    if (earR.current) earR.current.rotation.z = earRot(t, 1)

    // ---- Tail ----
    if (tail.current) {
      const wag = expression === 'happy' ? 0.4 : 0.12
      tail.current.rotation.y =
        Math.sin(t * (expression === 'happy' ? 4 : 1.1)) * wag
    }

    // ---- Eyes (blink + sleepy half-lid + yawn close) ----
    if (eyeL.current && eyeR.current) {
      const blinkCycle = (t + blinkSeed) % 5.2
      let openY = 1.0
      if (blinkCycle > 4.9) openY = 0.1
      if (expression === 'sleepy') openY = Math.min(openY, 0.35)
      if (expression === 'studying') openY = Math.min(openY, 0.55)
      // Half-lidded sleepy-cute default
      openY = Math.min(openY, 0.85)
      // Yawn: eyes squeeze shut
      if (inReaction && rk === 'yawn') {
        const k = Math.sin(reactionT * Math.PI)
        openY = Math.min(openY, 1 - 0.95 * k)
      }
      eyeL.current.scale.y = openY
      eyeR.current.scale.y = openY
    }

    // ---- Body bob during reactions for extra life ----
    if (bodyGroup.current && inReaction) {
      const k = Math.sin(reactionT * Math.PI)
      bodyGroup.current.position.y = -0.04 * k
    } else if (bodyGroup.current) {
      bodyGroup.current.position.y = 0
    }
  })

  return (
    <group ref={root} position={position} onClick={handleTap}>
      {/* Body — wrapped in a group so reactions can bob it */}
      <group ref={bodyGroup}>
        {/* Barrel body, horizontal */}
        <group rotation={[0, 0, Math.PI / 2]}>
          <mesh material={mats.fur} castShadow receiveShadow>
            <capsuleGeometry args={[bodyR, bodyLen, 10, 16]} />
          </mesh>
        </group>
        {/* Lighter belly underside */}
        <mesh
          position={[0, -bodyR * 0.55, 0]}
          material={mats.belly}
          scale={[bodyLen * 0.95, bodyR * 0.4, bodyR * 1.2]}
        >
          <sphereGeometry args={[1, 16, 10]} />
        </mesh>

        {/* Tiny leg stubs barely poking out — capybara loaf */}
        {([
          [bodyLen * 0.32, bodyR * 0.55],
          [bodyLen * 0.32, -bodyR * 0.55],
          [-bodyLen * 0.32, bodyR * 0.55],
          [-bodyLen * 0.32, -bodyR * 0.55],
        ] as const).map(([x, z], i) => (
          <mesh
            key={i}
            material={mats.furDark}
            position={[x, -bodyR * 0.95, z]}
            castShadow
          >
            <cylinderGeometry args={[0.1, 0.09, 0.1, 10]} />
          </mesh>
        ))}

        {/* Stubby tail nub */}
        <group ref={tail} position={[-bodyLen * 0.52, bodyR * 0.05, 0]}>
          <mesh material={mats.furDark}>
            <sphereGeometry args={[0.08, 8, 6]} />
          </mesh>
        </group>
      </group>

      {/* Head group — pivots at neck (front-top of body) */}
      <group ref={headGroup} position={[bodyLen * 0.48, bodyR * 0.4, 0]}>
        {/* Head — flatter sphere, wider than tall (capybara skull) */}
        <mesh material={mats.fur} scale={[1.05, 0.92, 1.0]} castShadow receiveShadow>
          <sphereGeometry args={[headR, 16, 14]} />
        </mesh>
        {/* Snout — large rounded blob forward, lower */}
        <mesh
          material={mats.fur}
          position={[headR * 0.7, -headR * 0.25, 0]}
          scale={[1.05, 0.78, 0.95]}
        >
          <sphereGeometry args={[headR * 0.62, 14, 12]} />
        </mesh>
        {/* Nose — small dark patch on snout tip */}
        <mesh
          material={mats.nose}
          position={[headR * 1.15, -headR * 0.12, 0]}
          scale={[0.9, 0.7, 1.1]}
        >
          <sphereGeometry args={[headR * 0.16, 10, 8]} />
        </mesh>
        {/* Mouth — tiny dark "v" line under nose */}
        <mesh
          ref={mouth}
          material={mats.ink}
          position={[headR * 1.05, -headR * 0.45, 0]}
        >
          <boxGeometry args={[headR * 0.055, headR * 0.04, headR * 0.18]} />
        </mesh>
        {/* Ears — small, set high and slightly back */}
        <group
          ref={earL}
          position={[-headR * 0.1, headR * 0.85, headR * 0.55]}
        >
          <mesh
            material={mats.furDark}
            scale={[0.85, 1.05, 0.55]}
          >
            <sphereGeometry args={[headR * 0.22, 10, 8]} />
          </mesh>
        </group>
        <group
          ref={earR}
          position={[-headR * 0.1, headR * 0.85, -headR * 0.55]}
        >
          <mesh
            material={mats.furDark}
            scale={[0.85, 1.05, 0.55]}
          >
            <sphereGeometry args={[headR * 0.22, 10, 8]} />
          </mesh>
        </group>
        {/* Eyes — set HIGH on head (capybara trait), small ink dots */}
        <mesh
          ref={eyeL}
          material={mats.ink}
          position={[headR * 0.62, headR * 0.32, headR * 0.46]}
          scale={[1, 0.85, 1]}
        >
          <sphereGeometry args={[headR * 0.095, 10, 8]} />
        </mesh>
        <mesh
          ref={eyeR}
          material={mats.ink}
          position={[headR * 0.62, headR * 0.32, -headR * 0.46]}
          scale={[1, 0.85, 1]}
        >
          <sphereGeometry args={[headR * 0.095, 10, 8]} />
        </mesh>
        {/* Blush spots — under-eye cheeks for cute factor */}
        <mesh
          material={mats.blush}
          position={[headR * 0.55, -headR * 0.05, headR * 0.62]}
          scale={[0.5, 0.45, 0.4]}
        >
          <sphereGeometry args={[headR * 0.2, 10, 8]} />
        </mesh>
        <mesh
          material={mats.blush}
          position={[headR * 0.55, -headR * 0.05, -headR * 0.62]}
          scale={[0.5, 0.45, 0.4]}
        >
          <sphereGeometry args={[headR * 0.2, 10, 8]} />
        </mesh>
      </group>
    </group>
  )
}
