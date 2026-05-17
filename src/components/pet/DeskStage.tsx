import * as THREE from 'three'
import { useMemo } from 'react'

/**
 * Fixed-camera study desk stage.
 * - Desk surface fills the lower frame
 * - Lamp upper-right as the warm key light source
 * - Open casebook prop in center, slightly forward — pet sits on top
 * - Cool dusk window left side
 */
export function DeskStage() {
  const mats = useMemo(() => ({
    wood: new THREE.MeshStandardMaterial({ color: 0x6b4c3b, roughness: 0.95 }),
    woodDark: new THREE.MeshStandardMaterial({ color: 0x3a2a22, roughness: 0.95 }),
    paper: new THREE.MeshStandardMaterial({ color: 0xf4e8c8, roughness: 0.9 }),
    paperDark: new THREE.MeshStandardMaterial({ color: 0xc4a878, roughness: 0.9 }),
    ink: new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.7 }),
    lampShade: new THREE.MeshStandardMaterial({
      color: 0xc46a30,
      roughness: 0.8,
      emissive: 0x4a2a10,
      emissiveIntensity: 0.4,
    }),
    lampGlow: new THREE.MeshStandardMaterial({
      color: 0xffe8c4,
      emissive: 0xffc88a,
      emissiveIntensity: 4.5,
      roughness: 0.5,
    }),
    metal: new THREE.MeshStandardMaterial({ color: 0x2a201a, roughness: 0.6, metalness: 0.4 }),
    wallCool: new THREE.MeshStandardMaterial({ color: 0x1c2230, roughness: 1.0 }),
    window: new THREE.MeshStandardMaterial({
      color: 0x3a4a5e,
      emissive: 0x1a2230,
      emissiveIntensity: 0.6,
      roughness: 0.95,
    }),
  }), [])

  return (
    <group>
      {/* Back wall — dusk cool */}
      <mesh position={[0, 1.5, -3.2]} material={mats.wallCool}>
        <planeGeometry args={[10, 6]} />
      </mesh>

      {/* Window left side */}
      <mesh position={[-2.6, 1.8, -3.18]} material={mats.window}>
        <planeGeometry args={[2.0, 2.4]} />
      </mesh>
      {/* Window cross-frame */}
      <mesh position={[-2.6, 1.8, -3.17]} material={mats.woodDark}>
        <planeGeometry args={[2.0, 0.06]} />
      </mesh>
      <mesh position={[-2.6, 1.8, -3.17]} material={mats.woodDark}>
        <planeGeometry args={[0.06, 2.4]} />
      </mesh>

      {/* Desk top — wide plane */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.wood} receiveShadow>
        <planeGeometry args={[8, 4]} />
      </mesh>
      {/* Desk front edge */}
      <mesh position={[0, -0.18, 2]} material={mats.woodDark}>
        <boxGeometry args={[8, 0.36, 0.05]} />
      </mesh>

      {/* Open casebook — two slanted pages forming a wedge */}
      <group position={[0, 0.08, 0.4]}>
        {/* Left page */}
        <mesh material={mats.paper} position={[-0.45, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0.06]} receiveShadow>
          <planeGeometry args={[0.9, 1.1]} />
        </mesh>
        {/* Right page */}
        <mesh material={mats.paper} position={[0.45, 0.04, 0]} rotation={[-Math.PI / 2, 0, -0.06]} receiveShadow>
          <planeGeometry args={[0.9, 1.1]} />
        </mesh>
        {/* Spine */}
        <mesh material={mats.paperDark} position={[0, 0.04, 0]}>
          <boxGeometry args={[0.04, 0.04, 1.1]} />
        </mesh>
        {/* Text lines as thin dark strips — left page */}
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={`l${i}`} material={mats.ink} position={[-0.45, 0.045, -0.42 + i * 0.16]} rotation={[-Math.PI / 2, 0, 0.06]}>
            <planeGeometry args={[0.75, 0.012]} />
          </mesh>
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={`r${i}`} material={mats.ink} position={[0.45, 0.045, -0.42 + i * 0.16]} rotation={[-Math.PI / 2, 0, -0.06]}>
            <planeGeometry args={[0.75, 0.012]} />
          </mesh>
        ))}
      </group>

      {/* Lamp upper-right */}
      <group position={[2.0, 0, 0.2]}>
        {/* Base disk */}
        <mesh material={mats.metal} position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.22, 0.24, 0.08, 14]} />
        </mesh>
        {/* Arm — slanted toward desk center */}
        <mesh material={mats.metal} position={[-0.35, 0.7, 0]} rotation={[0, 0, -0.45]}>
          <cylinderGeometry args={[0.025, 0.025, 1.3, 8]} />
        </mesh>
        {/* Shade — cone tilted */}
        <mesh material={mats.lampShade} position={[-0.7, 1.18, 0]} rotation={[0, 0, -1.0]}>
          <coneGeometry args={[0.3, 0.45, 12]} />
        </mesh>
        {/* Bulb glow */}
        <mesh material={mats.lampGlow} position={[-0.62, 1.05, 0]}>
          <sphereGeometry args={[0.12, 10, 8]} />
        </mesh>
        {/* Real point light from bulb — primary illumination for the pet */}
        <pointLight position={[-0.62, 1.05, 0]} intensity={3.8} distance={7} decay={1.1} color={0xffd0a0} />
      </group>

      {/* A small stack of papers far-right edge */}
      <mesh material={mats.paperDark} position={[1.4, 0.05, -0.5]} rotation={[-Math.PI / 2, 0, 0.1]}>
        <planeGeometry args={[0.5, 0.65]} />
      </mesh>
      <mesh material={mats.paper} position={[1.35, 0.06, -0.45]} rotation={[-Math.PI / 2, 0, 0.05]}>
        <planeGeometry args={[0.5, 0.65]} />
      </mesh>
    </group>
  )
}
