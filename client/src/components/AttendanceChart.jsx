import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
);

const AttendanceChart = ({ data, filter = 'today', loading = false }) => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const chartRef = useRef(null);// Destroy chart on unmount and update on theme change
  useEffect(() => {
    const chart = chartRef.current;
    return () => {
      if (chart) {
        chart.destroy();
      }
    };
  }, [isDarkMode]);const getChartOptions = () => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: isDarkMode ? '#fff' : '#374151',
        },
      },
      title: {
        display: true,
        text: t('charts.attendanceTitle'),
        color: isDarkMode ? '#fff' : '#374151',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.5)' : '#ddd',
        borderWidth: 1,
        titleFont: {
          weight: 'bold'
        },
        bodyFont: {
          size: 12
        },
        padding: 10,
        cornerRadius: 6,
        callbacks: {
          title: function(context) {
            const dataIndex = context[0].dataIndex;
            const originalDate = data?.[dataIndex]?.date;
            return originalDate ? formatTooltipDate(originalDate) : '';
          },
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y + ' ' + t('charts.employees');
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: t('charts.date'),
          color: isDarkMode ? '#fff' : '#374151',
        },
        ticks: {
          color: isDarkMode ? '#fff' : '#374151',
        },
        grid: {
          color: isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(156, 163, 175, 0.1)',
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: t('charts.employeeCount'),
          color: isDarkMode ? '#fff' : '#374151',
        },
        ticks: {
          color: isDarkMode ? '#fff' : '#374151',
          stepSize: 1,
          callback: function(value) {
            return Number.isInteger(value) ? value : '';
          }
        },
        grid: {
          color: isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(156, 163, 175, 0.1)',
        },
        beginAtZero: true,
        suggestedMax: data && data.length > 0 ? Math.max(...data.map(item => item.total)) : 10
      }
    }
  });const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    };
    return date.toLocaleDateString('ru-RU', options);
  };const formatTooltipDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    };
    return date.toLocaleDateString('ru-RU', options);
  };const chartData = {
    labels: data?.map(item => formatDate(item.date)) || [],
    datasets: [
      {
        label: t('charts.present'),
        data: data?.map(item => item.present) || [],
        borderColor: isDarkMode ? '#60A5FA' : 'rgb(34, 197, 94)',
        backgroundColor: isDarkMode ? 'rgba(96, 165, 250, 0.2)' : 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        fill: true,
        borderWidth: 2,
        pointBackgroundColor: isDarkMode ? '#60A5FA' : 'rgb(34, 197, 94)',
        pointBorderColor: isDarkMode ? '#60A5FA' : 'rgb(34, 197, 94)',
        pointHoverRadius: 6,
        pointRadius: 4,
      }
    ]
  };if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg py-4 px-0 lg:py-6 px-0">
        <div className="animate-pulse">
          <div className="bg-gray-200 dark:bg-gray-700 rounded h-8 w-48 mb-4"></div>
          <div className="bg-gray-200 dark:bg-gray-700 rounded h-64"></div>
        </div>
      </div>
    );
  }if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg py-4 px-0 lg:py-6 px-0">
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400">
            {t('charts.noData')}
          </div>
        </div>
      </div>
    );
  }return (
    <div className="bg-white dark:bg-gray-800 rounded-lg py-4 px-0 lg:py-6 px-0">
      <div className="h-80">
        <Line
          key={isDarkMode ? 'dark' : 'light'}
          ref={chartRef}
          options={getChartOptions()}
          data={chartData}
        />
      </div>
    </div>
  );
};

export default AttendanceChart;
