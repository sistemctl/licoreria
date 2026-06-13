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
  Filler
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Register Chart.js components
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

// Global styling defaults for premium look
const gridColor = 'rgba(212, 168, 83, 0.05)';
const textColor = '#9ca3af';

const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: textColor,
        font: { family: 'Inter', size: 12 }
      }
    }
  },
  scales: {
    x: {
      grid: { color: gridColor },
      ticks: { color: textColor, font: { family: 'Inter' } }
    },
    y: {
      grid: { color: gridColor },
      ticks: { color: textColor, font: { family: 'Inter' } }
    }
  }
};

export function SalesLineChart({ labels = [], data = [], onChartClick }) {
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Ventas ($)',
        data,
        borderColor: '#d4a853',
        backgroundColor: 'rgba(212, 168, 83, 0.1)',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#d4a853',
      }
    ]
  };

  const lineOptions = {
    ...commonOptions,
    onClick: (event, elements, chart) => {
      if (elements && elements.length > 0 && onChartClick) {
        const index = elements[0].index;
        onChartClick({
          label: chart.data.labels[index],
          value: chart.data.datasets[elements[0].datasetIndex].data[index],
          index
        });
      }
    }
  };

  return (
    <div style={{ height: '300px', width: '100%', cursor: onChartClick ? 'pointer' : 'default' }}>
      <Line data={chartData} options={lineOptions} />
    </div>
  );
}

export function TopProductsBarChart({ labels = [], data = [], onChartClick }) {
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Unidades Vendidas',
        data,
        backgroundColor: 'rgba(212, 168, 83, 0.75)',
        borderColor: '#d4a853',
        borderWidth: 1,
        borderRadius: 4,
      }
    ]
  };

  const barOptions = {
    ...commonOptions,
    onClick: (event, elements, chart) => {
      if (elements && elements.length > 0 && onChartClick) {
        const index = elements[0].index;
        onChartClick({
          label: chart.data.labels[index],
          value: chart.data.datasets[elements[0].datasetIndex].data[index],
          index
        });
      }
    }
  };

  return (
    <div style={{ height: '300px', width: '100%', cursor: onChartClick ? 'pointer' : 'default' }}>
      <Bar data={chartData} options={barOptions} />
    </div>
  );
}

export function SalesByCategoryPieChart({ labels = [], data = [], onChartClick }) {
  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: [
          '#d4a853',
          '#22c55e',
          '#ef4444',
          '#3b82f6',
          '#a855f7',
          '#f97316',
          '#06b6d4',
          '#ec4899',
          '#14b8a6',
          '#eab308'
        ],
        borderWidth: 1,
        borderColor: '#12121a'
      }
    ]
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: textColor,
          font: { family: 'Inter', size: 11 }
        }
      }
    },
    onClick: (event, elements, chart) => {
      if (elements && elements.length > 0 && onChartClick) {
        const index = elements[0].index;
        onChartClick({
          label: chart.data.labels[index],
          value: chart.data.datasets[elements[0].datasetIndex].data[index],
          index
        });
      }
    }
  };

  return (
    <div style={{ height: '300px', width: '100%', cursor: onChartClick ? 'pointer' : 'default' }}>
      <Pie data={chartData} options={pieOptions} />
    </div>
  );
}

export function PaymentMethodsPieChart({ labels = [], data = [], onChartClick }) {
  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: [
          '#22c55e', // efectivo
          '#3b82f6', // tarjeta
          '#a855f7', // transferencia
          '#f59e0b', // credito
          '#64748b'  // mixto
        ],
        borderWidth: 1,
        borderColor: '#12121a'
      }
    ]
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: textColor,
          font: { family: 'Inter', size: 11 }
        }
      }
    },
    onClick: (event, elements, chart) => {
      if (elements && elements.length > 0 && onChartClick) {
        const index = elements[0].index;
        onChartClick({
          label: chart.data.labels[index],
          value: chart.data.datasets[elements[0].datasetIndex].data[index],
          index
        });
      }
    }
  };

  return (
    <div style={{ height: '300px', width: '100%', cursor: onChartClick ? 'pointer' : 'default' }}>
      <Pie data={chartData} options={pieOptions} />
    </div>
  );
}
