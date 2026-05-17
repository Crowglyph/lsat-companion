import { useFrame, useThree } from '@react-three/fiber'
import { useFBO } from '@react-three/drei'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { studyDeskWarm, type Palette } from './palettes'
import { buildPaletteGlsl, buildNearestGlsl, buildBloomGlsl, buildDitherGlsl } from './shaders'

interface Props {
  palette?: Palette
  /** Low-res framebuffer width. 384 = HD-2D canonical. */
  lrW?: number
  lrH?: number
  /** Disable bloom for low-end devices. */
  bloom?: boolean
}

/**
 * Takes over R3F's render loop:
 *   1. Renders the default scene to a low-res RT with nearest filtering.
 *   2. Composites that RT onto the canvas via a shader that does
 *      saturation-gated bloom + noise dither + palette snap.
 *
 * Mount this once inside <Canvas>. Other R3F children populate the default
 * scene as normal — they all get rendered to the low-res RT.
 */
export function HD2DRenderer({
  palette = studyDeskWarm,
  lrW = 384,
  lrH = 216,
  bloom = true,
}: Props) {
  const { scene, camera, gl } = useThree()

  // Low-res render target, nearest filtered both ways
  const lowRes = useFBO(lrW, lrH, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
  })

  // Fullscreen quad for post-pass
  const { fsScene, fsCam, fsMaterial } = useMemo(() => {
    const fsScene = new THREE.Scene()
    const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const paletteGlsl = buildPaletteGlsl(palette)
    const nearestGlsl = buildNearestGlsl(palette.colors.length)
    const bloomGlsl = bloom ? buildBloomGlsl(lrW, lrH) : ''
    const ditherGlsl = buildDitherGlsl(0.012, lrW, lrH)

    const fsMaterial = new THREE.ShaderMaterial({
      uniforms: { tTex: { value: lowRes.texture } },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
      `,
      fragmentShader: /* glsl */ `
        varying vec2 vUv;
        uniform sampler2D tTex;
        ${paletteGlsl}
        ${nearestGlsl}
        void main() {
          vec3 raw = texture2D(tTex, vUv).rgb;
          vec3 combined = raw;
          ${bloomGlsl}
          ${ditherGlsl}
          gl_FragColor = vec4(nearestPalette(combined), 1.0);
        }
      `,
    })
    fsScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), fsMaterial))
    return { fsScene, fsCam, fsMaterial }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [palette, lrW, lrH, bloom])

  useEffect(() => {
    return () => {
      fsMaterial.dispose()
    }
  }, [fsMaterial])

  // Priority > 0 suppresses R3F's auto-render. We own the render loop now.
  useFrame(() => {
    gl.setRenderTarget(lowRes)
    gl.render(scene, camera)
    gl.setRenderTarget(null)
    gl.render(fsScene, fsCam)
  }, 1)

  return null
}
