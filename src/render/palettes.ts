// Palettes ported from hd2d-toolkit.
// Lex's MVP scene uses studyDeskWarm.

export type RGB = [number, number, number]

export interface Palette {
  name: string
  colors: RGB[]
}

/**
 * Warm interior, lamp-glow centered, three cool anchors for window/dusk/shadow.
 * Tuned for a study-desk scene at 384×216.
 */
export const studyDeskWarm: Palette = {
  name: 'study-desk-warm',
  colors: [
    // Highlight chain (paper + lamp glow)
    [1.00, 0.97, 0.84],
    [1.00, 0.88, 0.62],
    [1.00, 0.76, 0.46],
    // Warm mids (wood, capybara fur tones)
    [0.86, 0.62, 0.40],
    [0.72, 0.50, 0.32],
    [0.58, 0.40, 0.26],
    [0.44, 0.30, 0.22],
    [0.32, 0.22, 0.18],
    [0.22, 0.16, 0.14],
    [0.12, 0.09, 0.08],
    [0.06, 0.04, 0.04],
    // Paper / casebook
    [0.96, 0.88, 0.68],
    [0.82, 0.72, 0.50],
    // Cool anchors (window dusk, ink, deep shadow)
    [0.28, 0.34, 0.42],
    [0.18, 0.22, 0.30],
    [0.10, 0.12, 0.18],
    // Accent pop (lamp filament glow + warm rim)
    [1.00, 0.62, 0.30],
    // Eye / ink
    [0.04, 0.03, 0.04],
  ],
}
