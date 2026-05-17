import type { Palette } from './palettes'

// Saturation-gated bloom pass 1 params (matches hd2d-toolkit defaults)
const BLOOM_RADIUS = 3
const BLOOM_THRESHOLD: [number, number] = [0.55, 1.1]
const BLOOM_STRENGTH = 0.8
const BLOOM_FALLOFF = 0.18
const BLOOM_SPACING = 2.2
const SAT_GATE: [number, number] = [0.15, 0.45]

export function buildPaletteGlsl(p: Palette): string {
  const lines = p.colors.map(
    (c, i) =>
      `  if (i==${i}) return vec3(${c[0].toFixed(3)}, ${c[1].toFixed(3)}, ${c[2].toFixed(3)});`,
  )
  return `vec3 palette(int i){\n${lines.join('\n')}\n  return vec3(0.0);\n}`
}

export function buildNearestGlsl(size: number): string {
  return /* glsl */ `
    vec3 nearestPalette(vec3 c){
      vec3 best = palette(0);
      float bestD = distance(c, best);
      for (int i = 1; i < ${size}; i++){
        vec3 p = palette(i);
        float d = distance(c, p);
        if (d < bestD){ bestD = d; best = p; }
      }
      return best;
    }
  `
}

export function buildDitherGlsl(amp: number, w: number, h: number): string {
  return /* glsl */ `
    vec2 pix_d = floor(vUv * vec2(${w}.0, ${h}.0));
    float d_ = fract(sin(dot(pix_d, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
    combined += vec3(d_) * ${amp.toFixed(4)};
  `
}

export function buildBloomGlsl(w: number, h: number): string {
  const [sLo, sHi] = SAT_GATE
  return /* glsl */ `
    vec3 bloom = vec3(0.0);
    float wSum = 0.0;
    for (int x = -${BLOOM_RADIUS}; x <= ${BLOOM_RADIUS}; x++) {
      for (int y = -${BLOOM_RADIUS}; y <= ${BLOOM_RADIUS}; y++) {
        vec2 off = vec2(float(x), float(y)) * ${BLOOM_SPACING.toFixed(2)}
                   / vec2(${w}.0, ${h}.0);
        vec3 s = texture2D(tTex, vUv + off).rgb;
        float lum = max(s.r, max(s.g, s.b));
        float bright = smoothstep(
          ${BLOOM_THRESHOLD[0].toFixed(2)},
          ${BLOOM_THRESHOLD[1].toFixed(2)},
          lum
        );
        float mn = min(s.r, min(s.g, s.b));
        float sat = lum > 0.001 ? (lum - mn) / lum : 0.0;
        bright *= smoothstep(${sLo.toFixed(3)}, ${sHi.toFixed(3)}, sat);
        float w_ = exp(-float(x*x + y*y) * ${BLOOM_FALLOFF.toFixed(3)});
        bloom += s * bright * w_;
        wSum += w_;
      }
    }
    bloom /= wSum;
    combined = raw + bloom * ${BLOOM_STRENGTH.toFixed(2)};
  `
}
