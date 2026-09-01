/**
 * Centralized theme and style configuration for Recharts.
 * Gold-forward palette — no emerald/green accents.
 */

export const CHART_PALETTE = {
  gold: '#d97706',
  honey: '#f59e0b',
  amberLight: '#fbbf24',
  copper: '#ea580c',
  bronze: '#b45309',
  wheat: '#fde68a',

  /** Semantic series */
  blue: '#3B82F6',
  purple: '#8B5CF6',

  /** Premium ledger — maps to theme tokens where possible */
  primary: 'var(--color-primary)',
  income: 'var(--color-chart-1)',
  expense: 'var(--color-chart-2)',

  foreground: 'var(--foreground)',
  mutedForeground: 'var(--muted-foreground)',
  background: 'var(--background)',
  card: 'var(--card)',
  border: 'var(--border)',
}

/** Categorical palettes — warm metals & gold tones */
export const CATEGORICAL_COLORS = [
  CHART_PALETTE.honey,
  CHART_PALETTE.gold,
  CHART_PALETTE.copper,
  CHART_PALETTE.amberLight,
  CHART_PALETTE.bronze,
  CHART_PALETTE.wheat,
  CHART_PALETTE.purple,
  CHART_PALETTE.blue,
]

export const AXIS_STYLE = {
  stroke: CHART_PALETTE.mutedForeground,
  tick: { fill: CHART_PALETTE.mutedForeground },
  tickLine: { stroke: CHART_PALETTE.mutedForeground },
  className: 'text-xs',
}

export const GRID_STYLE = {
  stroke: CHART_PALETTE.border,
  strokeDasharray: '3 3',
}

export const LINE_CHART_STYLES = {
  stroke: CHART_PALETTE.primary,
  strokeWidth: 2,
  dot: {
    r: 3,
    stroke: CHART_PALETTE.primary,
    fill: CHART_PALETTE.background,
    strokeWidth: 2,
  },
  activeDot: {
    r: 5,
    stroke: CHART_PALETTE.primary,
    fill: CHART_PALETTE.background,
    strokeWidth: 2,
  },
}

export const PIE_CHART_STYLES = {
  stroke: CHART_PALETTE.card,
  strokeWidth: 2,
}
