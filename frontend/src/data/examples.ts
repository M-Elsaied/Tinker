/**
 * Built-in pedagogical DOE examples.
 *
 * Each example calls the backend to generate the actual design matrix, then
 * fills in response data from a known underlying model with light noise. This
 * lets the user explore real ANOVA / RSM / optimization workflows without
 * having to enter data themselves.
 */

import { generateDesign } from '@/services/api'
import type {
  CCDType,
  DesignType,
  Factor,
  GoalType,
  Project,
} from '@/types'
import { uid } from '@/lib/utils'

export interface ExampleDef {
  id: string
  name: string
  shortName: string
  source: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  description: string
  story: string
  factors: Factor[]
  responses: { name: string; units?: string }[]
  designType: DesignType
  designOptions: {
    center_points?: number
    replicates?: number
    randomize?: boolean
    seed?: number
    fraction?: number
    ccd_type?: CCDType
    alpha?: number | null
  }
  // Maps a coded design row -> response value(s). One entry per response.
  // Optional when observedData is supplied.
  generateResponses?: (coded: number[]) => number[]
  // Preloaded per-row responses. If provided, overrides generateResponses.
  // Shape: observedData[responseIdx][rowIdx] matched to design rows by index.
  observedData?: number[][]
  goals: {
    name: string
    goal: GoalType
    lower: number
    upper: number
    target?: number | null
    weight?: number
    importance?: number
  }[]
  takeaways: string[]
}

// Pseudo-random noise (deterministic so examples are reproducible)
function noise(seed: number, idx: number, scale = 1): number {
  // simple LCG
  let s = (seed * 9301 + idx * 49297) % 233280
  s = (s * 9301 + 49297) % 233280
  return ((s / 233280) - 0.5) * 2 * scale
}

export const EXAMPLES: ExampleDef[] = [
  {
    id: 'chemical-yield',
    shortName: 'Chemical yield',
    name: 'Chemical reaction yield optimization',
    source: 'Adapted from Montgomery, Design and Analysis of Experiments',
    difficulty: 'beginner',
    description:
      'A 2-factor CCD to find the temperature and reaction time that maximize the yield of a chemical reaction.',
    story:
      'A process engineer wants to maximize yield (%) by tuning reactor temperature (160–200 °C) and ' +
      'reaction time (20–40 min). A central composite design fits a quadratic surface so you can find ' +
      'the optimum and visualize it as a 2D contour and 3D surface.',
    factors: [
      { name: 'Temperature', low: 160, high: 200, units: '°C' },
      { name: 'Time', low: 20, high: 40, units: 'min' },
    ],
    responses: [{ name: 'Yield', units: '%' }],
    designType: 'ccd',
    designOptions: {
      center_points: 4,
      ccd_type: 'circumscribed',
      randomize: true,
      seed: 7,
    },
    generateResponses: (c) => {
      // True surface: peak around T=185, t=30 → coded near (0.25, 0)
      // y = 88 + 1.6*A + 0.9*B + 0.6*A*B - 1.4*A^2 - 1.0*B^2
      const A = c[0]
      const B = c[1]
      const mean =
        88 + 1.6 * A + 0.9 * B + 0.6 * A * B - 1.4 * A * A - 1.0 * B * B
      // tiny noise
      const eps = noise(7, Math.round((A * 100 + B * 13 + 100) * 1e3), 0.4)
      return [Number((mean + eps).toFixed(2))]
    },
    goals: [
      { name: 'Yield', goal: 'maximize', lower: 80, upper: 92, importance: 5 },
    ],
    takeaways: [
      'Run "Build summary" in the Analysis tab — Quadratic should be the suggested model',
      'Check the 3D surface plot for a clear curved peak in the design region',
      'Open Optimize → Optimize and confirm the maximum is interior (not on a boundary)',
    ],
  },
  {
    id: 'filtration-rate',
    shortName: 'Filtration screening',
    name: 'Filtration rate screening',
    source: "Adapted from Montgomery's chemical filtration example",
    difficulty: 'intermediate',
    description:
      'A 2⁴⁻¹ fractional factorial to identify which of four process factors most affect filtration rate.',
    story:
      'Four factors are suspected to affect a filter\'s throughput: Temperature, Pressure, Formaldehyde ' +
      'concentration, and Stirring rate. With only 8 runs (a half fraction) you can screen the main ' +
      'effects and pick the vital few. Because this is a Resolution IV design, main effects are clear of ' +
      'two-factor interactions among the *active* terms.',
    factors: [
      { name: 'Temperature', low: 24, high: 35, units: '°C' },
      { name: 'Pressure', low: 1, high: 3, units: 'bar' },
      { name: 'Formaldehyde', low: 2, high: 5, units: '%' },
      { name: 'StirRate', low: 60, high: 120, units: 'rpm' },
    ],
    responses: [{ name: 'FiltrationRate', units: 'L/h' }],
    designType: 'fractional_factorial',
    designOptions: {
      fraction: 1,
      center_points: 0,
      randomize: true,
      seed: 11,
    },
    generateResponses: (c) => {
      // Active effects: A (temperature) strong+, C (formaldehyde) strong-, A:D interaction
      const A = c[0]
      const B = c[1]
      const C = c[2]
      const D = c[3]
      const mean = 70 + 10.8 * A - 9.0 * C + 2.1 * D + 8.3 * A * D - 0.5 * B
      const eps = noise(11, Math.round((A + B * 2 + C * 3 + D * 4 + 10) * 1e3), 1.5)
      return [Number((mean + eps).toFixed(2))]
    },
    goals: [
      { name: 'FiltrationRate', goal: 'maximize', lower: 50, upper: 95, importance: 5 },
    ],
    takeaways: [
      'In Analysis, look at the Pareto chart — Temperature, Formaldehyde, and the Temp:StirRate interaction dominate',
      'Pressure is inactive: dropping it leaves only the significant terms',
      'Run Optimize to find the factor combination that maximizes filtration rate',
    ],
  },
  {
    id: 'cake-recipe',
    shortName: 'Cake recipe',
    name: 'Cake recipe (Box-Behnken with two responses)',
    source: 'Adapted from a classroom RSM example',
    difficulty: 'intermediate',
    description:
      'A 3-factor Box-Behnken design with two competing responses. Use multi-response optimization to find a ' +
      'recipe that is both moist and sweet enough.',
    story:
      'A baker wants to dial in oven temperature, baking time, and sugar amount. Two responses are scored ' +
      'by a tasting panel: Moistness (1–10) and Sweetness (1–10). The two qualities trade off — too long ' +
      'in the oven dries the cake but caramelizes sugar. Box-Behnken keeps you away from extreme corners ' +
      'while still capturing curvature.',
    factors: [
      { name: 'Temperature', low: 160, high: 200, units: '°C' },
      { name: 'BakeTime', low: 20, high: 40, units: 'min' },
      { name: 'Sugar', low: 80, high: 140, units: 'g' },
    ],
    responses: [
      { name: 'Moistness', units: 'score' },
      { name: 'Sweetness', units: 'score' },
    ],
    designType: 'box_behnken',
    designOptions: {
      center_points: 3,
      randomize: true,
      seed: 13,
    },
    generateResponses: (c) => {
      const T = c[0]
      const B = c[1]
      const S = c[2]
      // Moistness: drops with too much heat / too long
      const moist =
        7.4 - 0.6 * T - 0.9 * B + 0.2 * S - 0.4 * T * B - 0.5 * B * B - 0.3 * T * T
      // Sweetness: rises with sugar; lightly enhanced by browning
      const sweet =
        6.2 + 0.3 * T + 0.1 * B + 1.4 * S + 0.2 * T * S - 0.4 * S * S
      const k = Math.round((T * 7 + B * 13 + S * 23 + 100) * 1e3)
      const e1 = noise(13, k, 0.15)
      const e2 = noise(13, k + 1, 0.18)
      return [Number((moist + e1).toFixed(2)), Number((sweet + e2).toFixed(2))]
    },
    goals: [
      { name: 'Moistness', goal: 'maximize', lower: 4, upper: 9, importance: 4 },
      { name: 'Sweetness', goal: 'target', lower: 5, upper: 9, target: 7.5, importance: 5 },
    ],
    takeaways: [
      'Notice the two responses pull in different directions — that\'s where multi-response optimization shines',
      'In Optimize, Moistness wants low temperature & short time; Sweetness wants more sugar',
      'Try changing weights and importance to see how the trade-off shifts',
    ],
  },
  {
    id: 'paper-airplane-fractional',
    shortName: 'Paper airplane (fractional)',
    name: 'Paper airplane flight distance (2³⁻¹ fractional factorial, 24 observed runs)',
    source: 'OREM 7377 lab — Elsaied (SMU, 2026)',
    difficulty: 'beginner',
    description:
      'A 2³⁻¹ resolution-III fractional factorial with 6 replicates of each treatment (24 flights). Identify whether Paper, Design, or Nose-weight drives flight distance, then pick the winning combination.',
    story:
      'Three factors are hypothesised to drive paper-airplane flight distance: paper type (notebook vs printer), ' +
      'folding design (classic dart vs glider), and nose weight (none vs paperclip). Only the four principal-fraction ' +
      'treatments were flown (I = +ABC), but each was replicated six times across two locations and three rounds, ' +
      'yielding 24 measured flights in inches. With a Resolution III fraction, main effects are aliased with ' +
      'two-factor interactions — useful for screening, but be cautious interpreting individual contributions.',
    factors: [
      { name: 'Paper', low: 0, high: 1, units: 'Notebook / Printer' },
      { name: 'Design', low: 0, high: 1, units: 'Dart / Glider' },
      { name: 'Nose', low: 0, high: 1, units: 'none / paperclip' },
    ],
    responses: [{ name: 'Distance', units: 'in' }],
    designType: 'fractional_factorial',
    designOptions: {
      fraction: 1,
      replicates: 6,
      randomize: false,
      center_points: 0,
    },
    // Design rows from generator (4 treatments) × 6 replicates = 24 runs.
    // Generator order per replicate: T1 (-,-,+), T3 (-,+,-), T2 (+,-,-), T4 (+,+,+)
    // Replicates 1-3 = Location L1 / Height H1 rounds 1-3; reps 4-6 = L2 / H2 rounds 1-3.
    observedData: [
      [
        // Rep 1 (L1/H1 round 1): T1, T3, T2, T4
        39, 42, 59, 47,
        // Rep 2 (L1/H1 round 2)
        28, 33, 63, 45,
        // Rep 3 (L1/H1 round 3)
        48, 40, 69, 41,
        // Rep 4 (L2/H2 round 1)
        32, 18.2, 12.6, 73.3,
        // Rep 5 (L2/H2 round 2) — note T2 = 228.5 hit a wall, T1 = 81 hit a ceiling
        81, 26.5, 228.5, 41.5,
        // Rep 6 (L2/H2 round 3) — T1 = 99.5 hit a ceiling
        99.5, 118.6, 24.9, 38.3,
      ],
    ],
    goals: [
      { name: 'Distance', goal: 'maximize', lower: 10, upper: 250, importance: 5 },
    ],
    takeaways: [
      'Open Analysis → ANOVA: with only 3 factors and a half fraction, all 3 main effects are estimable but each is aliased with a two-factor interaction (A↔BC, B↔AC, C↔AB)',
      'Diagnostics will flag the two ceiling-strike runs in Replicate 5 — a real experiment would discard or rerun them',
      'Optimize for maximum distance — the winning corner under the principal fraction is Printer + Glider + Paperclip (T4), but the L2 noise makes the estimate uncertain',
      'Compare with the larger 2⁴ factorial example to see how more runs and a 4th factor (environment) sharpen the conclusions',
    ],
  },
  {
    id: 'paper-airplane-distance',
    shortName: 'Paper airplane',
    name: 'Paper airplane flight distance (2⁴ factorial, 64 observed runs)',
    source: 'OREM 7377 project — Elsaied, Hardin, Kattel, Steele (SMU, 2026)',
    difficulty: 'intermediate',
    description:
      'A 2⁴ full factorial with four replicates and 64 observed flight distances. Identify which of Paper, Design, Nose weight, and Environment drives distance most, then pick the winning setting.',
    story:
      'Four factors are hypothesised to drive paper-airplane flight distance: paper type (notebook vs printer), ' +
      'folding design (classic dart vs glider), nose weight (none vs paperclip), and launch environment (indoor ' +
      'vs outdoor). 16 treatment combinations were each run four times (2 locations × 2 replicates), giving 64 ' +
      'flights measured in inches. Use Analysis to surface the dominant effects, Optimize to pick the winning ' +
      'setting, and Augment to plan confirmation runs.',
    factors: [
      { name: 'Paper', low: 0, high: 1, units: 'Notebook / Printer' },
      { name: 'Design', low: 0, high: 1, units: 'Dart / Glider' },
      { name: 'Nose', low: 0, high: 1, units: 'none / paperclip' },
      { name: 'Environment', low: 0, high: 1, units: 'Indoor / Outdoor' },
    ],
    responses: [{ name: 'Distance', units: 'in' }],
    designType: 'full_factorial',
    designOptions: {
      replicates: 4,
      randomize: false,
      center_points: 0,
    },
    observedData: [
      [
        // L1 Replicate 1 — runs 1–16 (std order, D varies fastest)
        61, 62, 38, 37, 94, 87, 40, 44, 38, 80, 18, 39, 63, 88, 52, 85,
        // L1 Replicate 2 — runs 17–32
        52, 68, 42, 42, 82, 86, 69, 49, 42, 68, 27, 46, 47, 78, 54, 77,
        // L2 Replicate 1 — runs 33–48
        93.4, 91.3, 79, 38.9, 38.9, 65.1, 44, 65.5, 44.1, 80.4, 192.1, 61.7, 79.5, 55, 116.2, 52.4,
        // L2 Replicate 2 — runs 49–64
        63.9, 48.2, 80.7, 102.3, 18.5, 12.2, 39.7, 26.2, 43.5, 65.6, 90.8, 86.5, 45.5, 46.1, 58.6, 63,
      ],
    ],
    goals: [
      { name: 'Distance', goal: 'maximize', lower: 20, upper: 200, importance: 5 },
    ],
    takeaways: [
      'Pareto of effects should rank Paper (A), Environment (D), Nose (C), and Design (B) as the largest main effects, with A:C and A:D as the leading interactions',
      'Optimize with goal=maximize — the winning combination is Printer paper + Outdoor, with Nose/Design picked by the interaction structure',
      'Location is modelled here as a 4th replicate tile rather than an explicit block (platform limitation); the R analysis in the project plan found Location non-significant (p≈0.33), so the main-effect conclusions still hold. Use Augment → add replicate to plan 3–6 confirmation flights at the optimum.',
    ],
  },
]

export async function buildExampleProject(ex: ExampleDef): Promise<Project> {
  const designResp = await generateDesign({
    design_type: ex.designType,
    factors: ex.factors,
    ...ex.designOptions,
  })

  const responses = ex.responses.map((r, respIdx) => {
    let data: number[]
    if (ex.observedData) {
      data = designResp.rows.map((_row, rowIdx) => ex.observedData![respIdx][rowIdx])
    } else if (ex.generateResponses) {
      data = designResp.rows.map((row) => ex.generateResponses!(row.coded)[respIdx])
    } else {
      throw new Error(`Example "${ex.id}" must define observedData or generateResponses`)
    }
    return { name: r.name, units: r.units, data }
  })

  return {
    id: uid(),
    name: ex.name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    designType: ex.designType,
    factors: ex.factors,
    designRows: designResp.rows,
    responses,
    designInfo: { ...designResp.info, exampleId: ex.id },
  }
}
