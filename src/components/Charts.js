'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  CHART_COLORS,
  PIE_COLORS,
  PAYMENT_COLORS,
  getChartColorsFromCSS,
  chartTooltipDefaults,
  chartAxisDefaults,
} from '@/lib/chartTheme';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function getColors() {
  if (typeof window !== 'undefined') {
    return getChartColorsFromCSS();
  }
  return CHART_COLORS;
}

function shortenDateLabel(label) {
  if (typeof label === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(label)) {
    const [, month, day] = label.split('-');
    return `${day}/${month}`;
  }
  return label;
}

function truncateLabel(label, max = 22) {
  if (typeof label !== 'string') return label;
  return label.length > max ? `${label.slice(0, max)}…` : label;
}

const basePlugins = {
  legend: { display: false },
  tooltip: chartTooltipDefaults(getColors()),
};

function getAxisDefaults() {
  const colors = getColors();
  return {
    ...chartAxisDefaults(colors),
    ticks: {
      ...chartAxisDefaults(colors).ticks,
      padding: 6,
    },
  };
}

function makeClickHandler(onChartClick) {
  if (!onChartClick) return undefined;
  return (event, elements, chart) => {
    if (!elements?.length) return;
    const index = elements[0].index;
    onChartClick({
      label: chart.data.labels[index],
      value: chart.data.datasets[elements[0].datasetIndex].data[index],
      index,
    });
  };
}

export function SalesLineChart({ labels = [], data = [], onChartClick }) {
  const colors = getColors();
  const axisDefaults = getAxisDefaults();

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Ventas',
        data,
        borderColor: colors.brand,
        backgroundColor: colors.brandSoft,
        tension: 0.35,
        fill: true,
        pointBackgroundColor: colors.brand,
        pointBorderColor: colors.surface,
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: basePlugins,
    onClick: makeClickHandler(onChartClick),
    scales: {
      x: {
        ...axisDefaults,
        ticks: {
          ...axisDefaults.ticks,
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 10,
          callback(value) {
            return shortenDateLabel(this.getLabelForValue(value));
          },
        },
      },
      y: {
        ...axisDefaults,
        ticks: {
          ...axisDefaults.ticks,
          maxTicksLimit: 6,
        },
      },
    },
  };

  return (
    <div className="chart-canvas" style={{ cursor: onChartClick ? 'pointer' : 'default' }}>
      <Line data={chartData} options={options} />
    </div>
  );
}

export function TopProductsBarChart({ labels = [], data = [], onChartClick }) {
  const colors = getColors();
  const axisDefaults = getAxisDefaults();

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Unidades vendidas',
        data,
        backgroundColor: colors.brandFill,
        borderColor: colors.brand,
        borderWidth: 0,
        borderRadius: 4,
        barThickness: 14,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: basePlugins,
    onClick: makeClickHandler(onChartClick),
    scales: {
      x: {
        ...axisDefaults,
        ticks: { ...axisDefaults.ticks, maxTicksLimit: 6 },
      },
      y: {
        ...axisDefaults,
        grid: { display: false },
        ticks: {
          ...axisDefaults.ticks,
          autoSkip: false,
          callback(value) {
            return truncateLabel(this.getLabelForValue(value), 22);
          },
        },
      },
    },
  };

  return (
    <div className="chart-canvas chart-canvas--bar" style={{ cursor: onChartClick ? 'pointer' : 'default' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}

function PieChartBase({ labels = [], data = [], colors, onChartClick }) {
  const themeColors = getColors();

  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    layout: { padding: 4 },
    plugins: {
      ...basePlugins,
      legend: {
        display: labels.length > 0,
        position: 'bottom',
        align: 'center',
        labels: {
          color: themeColors.muted,
          font: { size: 11 },
          boxWidth: 8,
          boxHeight: 8,
          padding: 12,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
    },
    onClick: makeClickHandler(onChartClick),
  };

  return (
    <div className="chart-canvas chart-canvas--pie" style={{ cursor: onChartClick ? 'pointer' : 'default' }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
}

export function SalesByCategoryPieChart(props) {
  return <PieChartBase {...props} colors={PIE_COLORS} />;
}

export function PaymentMethodsPieChart(props) {
  return <PieChartBase {...props} colors={PAYMENT_COLORS} />;
}

export function SalesByHourBarChart({ labels = [], data = [], onChartClick }) {
  const colors = getColors();
  const axisDefaults = getAxisDefaults();

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Ventas por hora',
        data,
        backgroundColor: colors.brandFill,
        borderColor: colors.brand,
        borderWidth: 0,
        borderRadius: 3,
        barThickness: 'flex',
        maxBarThickness: 18,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: basePlugins,
    onClick: makeClickHandler(onChartClick),
    scales: {
      x: {
        ...axisDefaults,
        ticks: {
          ...axisDefaults.ticks,
          maxRotation: 45,
          autoSkip: true,
          maxTicksLimit: 12,
        },
      },
      y: {
        ...axisDefaults,
        ticks: { ...axisDefaults.ticks, maxTicksLimit: 5 },
      },
    },
  };

  return (
    <div className="chart-canvas" style={{ cursor: onChartClick ? 'pointer' : 'default' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}

export function TopProfitProductsBarChart({ labels = [], data = [], onChartClick }) {
  const colors = getColors();
  const axisDefaults = getAxisDefaults();

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Utilidad estimada',
        data,
        backgroundColor: 'rgba(21, 128, 61, 0.55)',
        borderColor: colors.success,
        borderWidth: 0,
        borderRadius: 4,
        barThickness: 14,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: basePlugins,
    onClick: makeClickHandler(onChartClick),
    scales: {
      x: {
        ...axisDefaults,
        ticks: { ...axisDefaults.ticks, maxTicksLimit: 6 },
      },
      y: {
        ...axisDefaults,
        grid: { display: false },
        ticks: {
          ...axisDefaults.ticks,
          autoSkip: false,
          callback(value) {
            return truncateLabel(this.getLabelForValue(value), 22);
          },
        },
      },
    },
  };

  return (
    <div className="chart-canvas chart-canvas--bar" style={{ cursor: onChartClick ? 'pointer' : 'default' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
