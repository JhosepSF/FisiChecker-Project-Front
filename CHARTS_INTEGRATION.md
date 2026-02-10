# Guía de Integración de Estadísticas con Chart.js

Este documento muestra cómo visualizar las estadísticas usando gráficos.

## Instalación de Chart.js

```bash
cd Front
npm install chart.js react-chartjs-2
```

## Componente de Gráficos

```jsx
// src/modules/components/StatisticsCharts.jsx
import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const API_BASE_URL = 'http://localhost:8000/api';

const StatisticsCharts = () => {
  const [verdictData, setVerdictData] = useState(null);
  const [levelData, setLevelData] = useState(null);
  const [criteriaData, setCriteriaData] = useState(null);
  const [timelineData, setTimelineData] = useState(null);

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      // Obtener datos de veredictos
      const verdicts = await fetch(`${API_BASE_URL}/statistics/verdicts/`).then(r => r.json());
      prepareVerdictChart(verdicts);

      // Obtener datos de niveles
      const levels = await fetch(`${API_BASE_URL}/statistics/levels/`).then(r => r.json());
      prepareLevelChart(levels);

      // Obtener top criterios
      const criteria = await fetch(`${API_BASE_URL}/statistics/criteria/`).then(r => r.json());
      prepareCriteriaChart(criteria);

      // Obtener timeline
      const timeline = await fetch(`${API_BASE_URL}/statistics/timeline/?days=14`).then(r => r.json());
      prepareTimelineChart(timeline);
    } catch (error) {
      console.error('Error al cargar datos para gráficos:', error);
    }
  };

  const prepareVerdictChart = (data) => {
    const chartData = {
      labels: Object.keys(data.distribution).map(v => v.toUpperCase()),
      datasets: [
        {
          label: 'Distribución de Veredictos',
          data: Object.values(data.distribution).map(d => d.percentage),
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',   // green - pass
            'rgba(239, 68, 68, 0.8)',   // red - fail
            'rgba(234, 179, 8, 0.8)',   // yellow - partial
            'rgba(156, 163, 175, 0.8)', // gray - na
          ],
          borderColor: [
            'rgb(34, 197, 94)',
            'rgb(239, 68, 68)',
            'rgb(234, 179, 8)',
            'rgb(156, 163, 175)',
          ],
          borderWidth: 2,
        },
      ],
    };
    setVerdictData(chartData);
  };

  const prepareLevelChart = (data) => {
    const chartData = {
      labels: Object.keys(data),
      datasets: [
        {
          label: 'Pass Rate',
          data: Object.values(data).map(d => d.pass_rate),
          backgroundColor: 'rgba(34, 197, 94, 0.6)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 2,
        },
        {
          label: 'Fail Rate',
          data: Object.values(data).map(d => d.fail_rate),
          backgroundColor: 'rgba(239, 68, 68, 0.6)',
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 2,
        },
      ],
    };
    setLevelData(chartData);
  };

  const prepareCriteriaChart = (criteria) => {
    const top10 = criteria.slice(0, 10);
    const chartData = {
      labels: top10.map(c => c.code),
      datasets: [
        {
          label: 'Número de Fallos',
          data: top10.map(c => c.fail_count),
          backgroundColor: 'rgba(239, 68, 68, 0.6)',
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 2,
        },
      ],
    };
    setCriteriaData(chartData);
  };

  const prepareTimelineChart = (timeline) => {
    const chartData = {
      labels: timeline.map(t => new Date(t.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Número de Auditorías',
          data: timeline.map(t => t.audits_count),
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2,
          yAxisID: 'y',
        },
        {
          label: 'Score Promedio',
          data: timeline.map(t => t.average_score),
          backgroundColor: 'rgba(168, 85, 247, 0.6)',
          borderColor: 'rgb(168, 85, 247)',
          borderWidth: 2,
          yAxisID: 'y1',
          type: 'line',
        },
      ],
    };
    setTimelineData(chartData);
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
    },
  };

  const lineOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Número de Auditorías',
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Score Promedio',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard de Estadísticas</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Veredictos */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Distribución de Veredictos</h2>
          {verdictData && <Pie data={verdictData} options={pieOptions} />}
        </div>

        {/* Gráfico de Niveles */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Performance por Nivel WCAG</h2>
          {levelData && <Bar data={levelData} options={barOptions} />}
        </div>

        {/* Gráfico de Criterios con más fallos */}
        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Top 10 Criterios con Más Fallos</h2>
          {criteriaData && <Bar data={criteriaData} options={barOptions} />}
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Evolución en el Tiempo</h2>
          {timelineData && <Line data={timelineData} options={lineOptions} />}
        </div>
      </div>
    </div>
  );
};

export default StatisticsCharts;
```

## Uso en App.jsx

```jsx
import StatisticsPage from './modules/pages/StatisticsPage';
import StatisticsCharts from './modules/components/StatisticsCharts';

// En tus rutas
<Route path="/statistics" element={<StatisticsPage />} />
<Route path="/charts" element={<StatisticsCharts />} />
```

## Ejemplos de Consultas Específicas

### 1. Obtener criterios que más fallan en nivel AA

```javascript
async function getCriteriaAAFailing() {
  const response = await fetch('http://localhost:8000/api/statistics/criteria/');
  const data = await response.json();
  
  // Filtrar solo nivel AA y ordenar por fallos
  const aaFailing = data
    .filter(c => c.level === 'AA')
    .sort((a, b) => b.fail_count - a.fail_count)
    .slice(0, 5);
  
  return aaFailing;
}
```

### 2. Comparar rendimiento antes/después de una fecha

```javascript
async function comparePerformance(auditId1, auditId2) {
  const [audit1, audit2] = await Promise.all([
    fetch(`http://localhost:8000/api/statistics/audit/${auditId1}/`).then(r => r.json()),
    fetch(`http://localhost:8000/api/statistics/audit/${auditId2}/`).then(r => r.json()),
  ]);
  
  return {
    score_difference: audit2.score - audit1.score,
    improvements: audit2.verdict_distribution.pass.count - audit1.verdict_distribution.pass.count,
    regressions: audit2.verdict_distribution.fail.count - audit1.verdict_distribution.fail.count,
  };
}
```

### 3. Dashboard ejecutivo (resumen de todo)

```javascript
async function getExecutiveDashboard() {
  const report = await fetch('http://localhost:8000/api/statistics/report/')
    .then(r => r.json());
  
  return {
    kpis: {
      total_audits: report.global_statistics.total_audits,
      average_score: report.global_statistics.average_score,
      pass_rate: report.verdict_distribution.distribution.pass?.percentage || 0,
    },
    alerts: {
      worst_criteria: report.top_failing_criteria.slice(0, 3),
      worst_urls: report.url_ranking.worst_urls.slice(0, 3),
    },
    trends: {
      // Aquí podrías agregar comparaciones temporales
    }
  };
}
```

## Consejos de Performance

1. **Cachear resultados**: Las estadísticas no cambian constantemente, considera cachearlas:

```javascript
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

let cache = {};

async function getCachedStats(endpoint) {
  const now = Date.now();
  
  if (cache[endpoint] && (now - cache[endpoint].timestamp < CACHE_DURATION)) {
    return cache[endpoint].data;
  }
  
  const response = await fetch(`${API_BASE_URL}/statistics/${endpoint}/`);
  const data = await response.json();
  
  cache[endpoint] = { data, timestamp: now };
  return data;
}
```

2. **Usar el endpoint de reporte completo**: Si necesitas múltiples estadísticas, usa `/api/statistics/report/` en lugar de hacer múltiples llamadas.

3. **Paginar criterios**: Si tienes muchos criterios, considera paginar los resultados en el frontend.

## Exportar Estadísticas a CSV/Excel

```javascript
function exportToCSV(criteria) {
  const headers = ['Código', 'Título', 'Nivel', 'Fallos', '% Fallo', '% Éxito'];
  const rows = criteria.map(c => [
    c.code,
    c.title,
    c.level,
    c.fail_count,
    c.fail_rate,
    c.pass_rate
  ]);
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'estadisticas_wcag.csv';
  a.click();
}
```

## Generación de Reportes PDF

Para generar reportes en PDF en el backend:

```bash
pip install reportlab
```

Luego crea un endpoint adicional que genere el PDF usando los datos de estadísticas.
