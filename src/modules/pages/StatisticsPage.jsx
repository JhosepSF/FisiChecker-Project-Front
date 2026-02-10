// src/modules/pages/StatisticsPage.jsx
import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:8000/api';

const StatisticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [globalStats, setGlobalStats] = useState(null);
  const [verdictDist, setVerdictDist] = useState(null);
  const [criteriaStats, setCriteriaStats] = useState([]);
  const [levelStats, setLevelStats] = useState(null);
  const [urlRanking, setUrlRanking] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      
      // Opción 1: Obtener todo de una vez con el reporte completo
      const reportResponse = await fetch(`${API_BASE_URL}/statistics/report/`);
      const reportData = await reportResponse.json();
      
      setGlobalStats(reportData.global_statistics);
      setVerdictDist(reportData.verdict_distribution);
      setLevelStats(reportData.level_statistics);
      setCriteriaStats(reportData.top_failing_criteria);
      setUrlRanking(reportData.url_ranking);
      
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      setLoading(false);
    }
  };

  const fetchIndividualStats = async () => {
    // Opción 2: Obtener cada estadística por separado
    try {
      setLoading(true);
      
      const [global, verdicts, criteria, levels, ranking] = await Promise.all([
        fetch(`${API_BASE_URL}/statistics/global/`).then(r => r.json()),
        fetch(`${API_BASE_URL}/statistics/verdicts/`).then(r => r.json()),
        fetch(`${API_BASE_URL}/statistics/criteria/`).then(r => r.json()),
        fetch(`${API_BASE_URL}/statistics/levels/`).then(r => r.json()),
        fetch(`${API_BASE_URL}/statistics/ranking/?limit=5`).then(r => r.json()),
      ]);
      
      setGlobalStats(global);
      setVerdictDist(verdicts);
      setCriteriaStats(criteria.slice(0, 10));
      setLevelStats(levels);
      setUrlRanking(ranking);
      
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Cargando estadísticas...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Estadísticas de Auditorías</h1>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Vista General
          </button>
          <button
            onClick={() => setActiveTab('criteria')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'criteria'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Por Criterio
          </button>
          <button
            onClick={() => setActiveTab('ranking')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'ranking'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Ranking URLs
          </button>
        </nav>
      </div>

      {/* Vista General */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Estadísticas Globales */}
          {globalStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Auditorías"
                value={globalStats.total_audits}
                icon="📊"
              />
              <StatCard
                title="Score Promedio"
                value={`${globalStats.average_score}%`}
                icon="⭐"
              />
              <StatCard
                title="URLs Únicas"
                value={globalStats.total_unique_urls}
                icon="🌐"
              />
              <StatCard
                title="Con Renderizado"
                value={globalStats.audits_with_render}
                icon="🎨"
              />
            </div>
          )}

          {/* Distribución de Veredictos */}
          {verdictDist && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Distribución de Veredictos</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(verdictDist.distribution).map(([verdict, data]) => (
                  <div key={verdict} className="text-center">
                    <div className={`text-3xl font-bold ${getVerdictColor(verdict)}`}>
                      {data.percentage}%
                    </div>
                    <div className="text-sm text-gray-600 capitalize">{verdict}</div>
                    <div className="text-xs text-gray-400">{data.count} checks</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estadísticas por Nivel */}
          {levelStats && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Conformidad por Nivel WCAG</h2>
              <div className="space-y-4">
                {Object.entries(levelStats).map(([level, stats]) => (
                  <div key={level} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-lg">Nivel {level}</span>
                      <span className="text-sm text-gray-600">
                        {stats.total_checks} checks
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-green-600">✓ Pass:</span> {stats.pass_rate}%
                      </div>
                      <div>
                        <span className="text-red-600">✗ Fail:</span> {stats.fail_rate}%
                      </div>
                      <div>
                        <span className="text-gray-600">⌀ Score:</span> {stats.average_score}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vista de Criterios */}
      {activeTab === 'criteria' && criteriaStats && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Top 10 Criterios con Más Fallos</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Título
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nivel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fallos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % Fallo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % Éxito
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {criteriaStats.map((criterion, idx) => (
                  <tr key={criterion.code} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {criterion.code}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {criterion.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded ${getLevelBadgeColor(criterion.level)}`}>
                        {criterion.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                      {criterion.fail_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {criterion.fail_rate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {criterion.pass_rate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vista de Ranking */}
      {activeTab === 'ranking' && urlRanking && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mejores URLs */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 bg-green-50 border-b border-green-200">
              <h2 className="text-xl font-semibold text-green-800">🏆 Mejores URLs</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {urlRanking.best_urls.map((url, idx) => (
                <div key={idx} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {url.page_title || url.url}
                      </div>
                      <div className="text-xs text-gray-500 truncate">{url.url}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(url.audited_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                        {url.score}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Peores URLs */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 bg-red-50 border-b border-red-200">
              <h2 className="text-xl font-semibold text-red-800">⚠️ URLs con Más Problemas</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {urlRanking.worst_urls.map((url, idx) => (
                <div key={idx} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {url.page_title || url.url}
                      </div>
                      <div className="text-xs text-gray-500 truncate">{url.url}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(url.audited_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                        {url.score}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente auxiliar para tarjetas de estadísticas
const StatCard = ({ title, value, icon }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className="text-4xl">{icon}</div>
    </div>
  </div>
);

// Funciones auxiliares para colores
const getVerdictColor = (verdict) => {
  switch (verdict) {
    case 'pass':
      return 'text-green-600';
    case 'fail':
      return 'text-red-600';
    case 'partial':
      return 'text-yellow-600';
    case 'na':
      return 'text-gray-600';
    default:
      return 'text-gray-600';
  }
};

const getLevelBadgeColor = (level) => {
  switch (level) {
    case 'A':
      return 'bg-blue-100 text-blue-800';
    case 'AA':
      return 'bg-purple-100 text-purple-800';
    case 'AAA':
      return 'bg-pink-100 text-pink-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default StatisticsPage;
