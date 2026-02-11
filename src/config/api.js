// Configuración centralizada del API

// Detectar URL del API según el entorno
const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1';

// IMPORTANTE: Usar el MISMO hostname que el frontend para que las cookies funcionen
const backendHost = window.location.hostname === 'localhost' 
  ? 'localhost' 
  : window.location.hostname === '127.0.0.1'
    ? '127.0.0.1'
    : '158.69.62.72';

export const API_BASE_URL = isLocalhost 
  ? `http://${backendHost}:8000`
  : 'https://158.69.62.72';

// Endpoints de la API
export const API_ENDPOINTS = {
  // Autenticación
  login: `${API_BASE_URL}/api/auth/login`,
  logout: `${API_BASE_URL}/api/auth/logout`,
  currentUser: `${API_BASE_URL}/api/auth/user`,
  
  // Auditorías
  audit: `${API_BASE_URL}/api/audit`,
  audits: `${API_BASE_URL}/api/audits`,
  auditDetail: (id) => `${API_BASE_URL}/api/audits/${id}`,
  
  // Estadísticas
  statistics: {
    global: `${API_BASE_URL}/api/statistics/global/`,
    verdicts: `${API_BASE_URL}/api/statistics/verdicts/`,
    criteria: `${API_BASE_URL}/api/statistics/criteria/`,
    levels: `${API_BASE_URL}/api/statistics/levels/`,
    principles: `${API_BASE_URL}/api/statistics/principles/`,
    timeline: `${API_BASE_URL}/api/statistics/timeline/`,
    ranking: `${API_BASE_URL}/api/statistics/ranking/`,
    sources: `${API_BASE_URL}/api/statistics/sources/`,
    auditDetail: (id) => `${API_BASE_URL}/api/statistics/audit/${id}/`,
    report: `${API_BASE_URL}/api/statistics/report/`,
    accessibilityLevels: `${API_BASE_URL}/api/statistics/accessibility-levels/`,
    accessibilityByWCAG: `${API_BASE_URL}/api/statistics/accessibility-by-wcag/`,
  },
  
  // Exportación (para cuando se implemente)
  export: {
    csv: `${API_BASE_URL}/api/export/csv`,
    excel: `${API_BASE_URL}/api/export/excel`,
  },
  
  // Eliminación (para cuando se implemente)
  delete: {
    audit: (id) => `${API_BASE_URL}/api/audits/${id}/delete/`, // <-- slash final
    bulkDelete: `${API_BASE_URL}/api/audits/bulk-delete/`,
  },
};

// Configuración por defecto para fetch
export const fetchConfig = {
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Incluir cookies de sesión
};

// Helper para construir endpoint de auditoría según modo
export function buildAuditEndpoint(mode = 'raw') {
  const params = new URLSearchParams();
  if (mode === 'rendered') params.set('mode', 'rendered');
  else if (mode === 'ai') params.set('mode', 'ai');
  else if (mode === 'auto_ai') {
    params.set('mode', 'auto');
    params.set('ai', 'true');
  }
  const queryString = params.toString();
  return queryString ? `${API_ENDPOINTS.audit}?${queryString}` : API_ENDPOINTS.audit;
}
