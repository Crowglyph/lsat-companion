import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { PetExpression } from '../../game/pet'

interface Props {
  expression: PetExpression
  position?: [number, number, number]
}

/**
 * Round capybara — quadruped, ~8 joints (root, head, jaw, 4 legs, tail).
 * Charm from posture + warm palette. Idle = subtle breath + blink.
 * Studying = head down over book, slow nod.
 */
export function Capybara({ expression, position = [0, 0, 0] }: Props) {
  const root = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const tail = useRef<THREE.Group>(null)
  const eyeL = useRef<THREE.Mesh>(null)
  const eyeR = useRef<THREE.Mesh>(null)

  // Eye blink state — driven by elapsed time
  const blinkSeed = useMemo(() => Math.random() * 7, [])

  // Materials — sit on the warm-mid palette band so the pet reads bright
  // against the cool back wall.
  const mats = useMemo(() => {
    const fur = new THREE.MeshStandardMaterial({ color: 0xc89366, roughness: 1.0 })
    const furDark = new THREE.MeshStandardMaterial({ color: 0x8b5e3e, roughness: 1.0 })
    const belly = new THREE.MeshStandardMaterial({ color: 0xe0b88a, roughness: 1.0 })
    const ink = new THREE.MeshStandardMaterial({ color: 0x10080a, roughness: 0.6 })
    const nose = new THREE.MeshStandardMaterial({ color: 0x4a2820, roughness: 0.7 })
    return { fur, furDark, belly, ink, nose }
  }, [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (root.current) {
      // Breath bob
      const breath = Math.sin(t * 1.4) * 0.012
      root.current.position.y = position[1] + breath
      root.current.scale.set(1 + breath * 0.4, 1 - breath * 0.3, 1)
    }
    if (head.current) {
      if (expression === 'studying') {
        // Head down, slow nod
        const nod = Math.sin(t * 0.9) * 0.06
        head.current.rotation.x = 0.55 + nod
        head.current.rotation.y = 0
      } else if (expression === 'sleepy') {
        head.current.rotation.x = 0.35 + Math.sin(t * 0.5) * 0.04
        head.current.rotation.y = Math.sin(t * 0.3) * 0.05
      } else if (expression === 'happy') {
        head.current.rotation.x = -0.05 + Math.sin(t * 2.2) * 0.05
        head.current.rotation.y = Math.sin(t * 1.6) * 0.08
      } else {
        head.current.rotation.x = 0.1 + Math.sin(t * 0.9) * 0.04
        head.current.rotation.y = Math.sin(t * 0.6) * 0.06
      }
    }
    if (tail.current) {
      const wag = expression === 'happy' ? 0.4 : 0.12
      tail.current.rotation.y = Math.sin(t * (expression === 'happy' ? 4 : 1.1)) * wag
    }
    if (eyeL.current && eyeR.current) {
      // Blink every ~4-6 s. Sleepy = half-lidded constantly.
      const blinkCycle = (t + blinkSeed) % 5.2
      let openY = 1.0
      if (blinkCycle > 4.9) openY = 0.1
      if (expression === 'sleepy') openY = Math.min(openY, 0.35)
      if (expression === 'studying') openY = Math.min(openY, 0.55)
      eyeL.current.scale.y = openY
      eyeR.current.scale.y = openY
    }
  })

  // Capybara dimensions (small, fits on a book)
  const bodyLen = 1.2
  const bodyR = 0.42
  const headR = 0.32

  return (
    <group ref={root} position={position}>
      {/* Body — elongated capsule (rotated 90°: capsule's primary axis is Y) */}
      <group rotation={[0, 0, Math.PI / 2]}>
        <mesh material={mats.fur} castShadow receiveShadow>
          <capsuleGeometry args={[bodyR, bodyLen, 8, 14]} />
        </mesh>
      </group>

      {/* Belly lighter tone — flattened sphere underneath */}
      <mesh position={[0, -bodyR * 0.55, 0]} material={mats.belly} scale={[bodyLen * 0.95, bodyR * 0.4, bodyR * 1.2]}>
        <sphereGeometry args={[1, 16, 10]} />
      </mesh>

      {/* Head group — pivots at the neck connection (front of body) */}
      <group ref={head} position={[bodyLen * 0.5 + 0.08, bodyR * 0.65, 0]}>
        {/* Head ball */}
        <mesh material={mats.fur} castShadow receiveShadow>
          <sphereGeometry args={[headR, 16, 14]} />
        </mesh>
        {/* Snout — flattened sphere forward */}
        <mesh material={mats.fur} position={[headR * 0.65, -headR * 0.15, 0]} scale={[1.2, 0.75, 0.9]}>
          <sphereGeometry args={[headR * 0.55, 14, 12]} />
        </mesh>
        {/* Nose tip */}
        <mesh material={mats.nose} position={[headR * 1.1, -headR * 0.05, 0]}>
          <sphereGeometry args={[headR * 0.16, 10, 8]} />
        </mesh>
        {/* Ears — tiny rounded nubs on top */}
        <mesh material={mats.furDark} position={[-headR * 0.05, headR * 0.85, headR * 0.55]}
              scale={[0.9, 1.1, 0.6]}>
          <sphereGeometry args={[headR * 0.22, 10, 8]} />
        </mesh>
        <mesh material={mats.furDark} position={[-headR * 0.05, headR * 0.85, -headR * 0.55]}
              scale={[0.9, 1.1, 0.6]}>
          <sphereGeometry args={[headR * 0.22, 10, 8]} />
        </mesh>
        {/* Eyes — small ink dots */}
        <mesh ref={eyeL} material={mats.ink} position={[headR * 0.62, headR * 0.18, headR * 0.42]}>
          <sphereGeometry args={[headR * 0.085, 8, 6]} />
        </mesh>
        <mesh ref={eyeR} material={mats.ink} position={[headR * 0.62, headR * 0.18, -headR * 0.42]}>
          <sphereGeometry args={[headR * 0.085, 8, 6]} />
        </mesh>
      </group>

      {/* Legs — tiny tucked stubs (capybara loaf-sitting). Barely peek below body. */}
      {([
        [bodyLen * 0.32, bodyR * 0.6],   // F right
        [bodyLen * 0.32, -bodyR * 0.6],  // F left
        [-bodyLen * 0.32, bodyR * 0.6],  // B right
        [-bodyLen * 0.32, -bodyR * 0.6], // B left
      ] as const).map(([x, z], i) => (
        <mesh key={i} material={mats.furDark} position={[x, -bodyR * 0.85, z]} castShadow>
          <cylinderGeometry args={[0.12, 0.11, 0.12, 10]} />
        </mesh>
      ))}

      {/* Tail — small bump at back */}
      <group ref={tail} position={[-bodyLen * 0.55, bodyR * 0.1, 0]}>
        <mesh material={mats.furDark}>
          <sphereGeometry args={[0.09, 8, 6]} />
        </mesh>
      </group>
    </group>
  )
}
