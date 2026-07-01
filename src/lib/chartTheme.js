/** Chart.js palette aligned with CSS design tokens */

export const CHART_COLORS = {
  brand: '#8B6914',
  brandSoft: 'rgba(139, 105, 20, 0.12)',
  brandFill: 'rgba(139, 105, 20, 0.65)',
  muted: '#6B6560',
  grid: 'rgba(139, 105, 20, 0.08)',
  surface: '#FFFFFF',
  ink: '#1C1917',
  success: '#15803D',
  warning: '#B45309',
  danger: '#B91C1C',
};

export const PIE_COLORS = [
  '#8B6914',
  '#15803D',
  '#B45309',
  '#2563EB',
  '#7C3AED',
  '#C2410C',
  '#0891B2',
  '#BE185D',
  '#0D9488',
  '#CA8A04',
];

export const PAYMENT_COLORS = ['#15803D', '#2563EB', '#7C3AED', '#B45309', '#6B6560'];

export function getChartColorsFromCSS() {
  if (typeof document === 'undefined') return CHART_COLORS;

  const root = document.documentElement;
  const style = getComputedStyle(root);

  const read = (name, fallback) => style.getPropertyValue(name).trim() || fallback;

  return {
    brand: read('--color-brand', CHART_COLORS.brand),
    brandSoft: read('--color-brand-soft', CHART_COLORS.brandSoft),
    muted: read('--color-muted', CHART_COLORS.muted),
    surface: read('--color-surface-elevated', CHART_COLORS.surface),
    ink: read('--color-ink', CHART_COLORS.ink),
    success: read('--color-success', CHART_COLORS.success),
    warning: read('--color-warning', CHART_COLORS.warning),
    danger: read('--color-danger', CHART_COLORS.danger),
    grid: 'rgba(139, 105, 20, 0.08)',
    brandFill: 'rgba(139, 105, 20, 0.65)',
  };
}

export function chartTooltipDefaults(colors = CHART_COLORS) {
  return {
    backgroundColor: colors.ink,
    titleFont: { size: 12, weight: '600' },
    bodyFont: { size: 12 },
    padding: 10,
    cornerRadius: 8,
  };
}

export function chartAxisDefaults(colors = CHART_COLORS) {
  return {
    grid: { color: colors.grid, drawBorder: false },
    border: { display: false },
    ticks: {
      color: colors.muted,
      font: { size: 11 },
      maxRotation: 0,
    },
  };
}
