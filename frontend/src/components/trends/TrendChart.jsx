import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Radar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  RadialLinearScale, Title, Tooltip, Legend, Filler
);

const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: '#a1a1aa', font: { size: 11 } },
    },
    tooltip: {
      backgroundColor: '#27272a',
      titleColor: '#f4f4f5',
      bodyColor: '#a1a1aa',
      borderColor: '#3f3f46',
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      ticks: { color: '#71717a' },
      grid: { color: '#27272a' },
    },
    y: {
      ticks: { color: '#71717a' },
      grid: { color: '#27272a' },
    },
  },
};

export default function TrendChart({ type = 'line', data, height = 300 }) {
  if (!data) return null;

  const chartData = {
    labels: data.labels,
    datasets: (data.datasets || []).map((ds, i) => ({
      label: ds.label,
      data: ds.data,
      borderColor: ds.color || `hsl(${i * 80}, 70%, 60%)`,
      backgroundColor: type === 'bar'
        ? (ds.color || `hsl(${i * 80}, 70%, 60%)`) + '99'
        : (ds.color || `hsl(${i * 80}, 70%, 60%)`) + '22',
      fill: type === 'line',
      tension: 0.4,
      pointRadius: 4,
    })),
  };

  const props = { data: chartData, options: defaultOptions };

  return (
    <div style={{ height }}>
      {type === 'bar' && <Bar {...props} />}
      {type === 'radar' && <Radar {...props} options={{ ...defaultOptions, scales: undefined }} />}
      {type === 'line' && <Line {...props} />}
    </div>
  );
}
