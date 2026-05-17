import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { HD2DRenderer } from '../../render/HD2DRenderer'
import { DeskStage } from './DeskStage'
import { Capybara } from './Capybara'
import type { PetExpression } from '../../game/pet'

interface Props {
  expression: PetExpression
}

/**
 * Single fixed-camera stage. Portrait-friendly framing: camera tilted slightly
 * down on the desk, pet centered on the casebook, lamp warm key from right.
 */
export function PetScene({ expression }: Props) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 1.55, 2.6], fov: 32 }}
      onCreated={({ gl, camera }) => {
        gl.outputColorSpace = THREE.LinearSRGBColorSpace
        camera.lookAt(0, 0.55, 0.3)
      }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      style={{ background: '#0a0608' }}
    >
      <HD2DRenderer />

      {/* Ambient is load-bearing — silhouettes go palette-black without it. */}
      <ambientLight intensity={0.42} color={0xb89070} />
      <hemisphereLight args={[0xffcfa0, 0x1a1010, 0.5]} />
      {/* Warm key from lamp direction */}
      <directionalLight
        position={[2.5, 3.0, 1.8]}
        intensity={0.7}
        color={0xffd4a0}
        castShadow={false}
      />
      {/* Cool fill from window */}
      <directionalLight
        position={[-3.0, 2.0, 0.5]}
        intensity={0.22}
        color={0x6a88b0}
      />

      <DeskStage />
      <Capybara expression={expression} position={[0, 0.55, 0.45]} />
    </Canvas>
  )
}
