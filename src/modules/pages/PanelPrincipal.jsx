import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_ENDPOINTS, buildAuditEndpoint, fetchConfig } from "../../config/api";
import "../../styles/Panel.css";

function useTheme() {
  const getSystem = () =>
    window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const [theme, setTheme] = React.useState(() => localStorage.getItem("theme") || getSystem());
  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);
  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  return { theme, toggle };
}

/* ========= Metadatos WCAG (ESPAÑOL) ========= */
const WCAG_META_ES = {
  // P1 – Perceptible
  "1.1.1": { title: "Contenido no textual", level: "A", principle: "Perceptible" },
  "1.2.1": { title: "Solo audio y solo vídeo (pregrabado)", level: "A", principle: "Perceptible" },
  "1.2.2": { title: "Subtítulos (pregrabado)", level: "A", principle: "Perceptible" },
  "1.2.3": { title: "Audiodescripción o alternativa multimedia (pregrabado)", level: "A", principle: "Perceptible" },
  "1.2.4": { title: "Subtítulos (en directo)", level: "AA", principle: "Perceptible" },
  "1.2.5": { title: "Audiodescripción (pregrabado)", level: "AA", principle: "Perceptible" },
  "1.2.6": { title: "Lengua de señas (pregrabado)", level: "AAA", principle: "Perceptible" },
  "1.2.7": { title: "Audiodescripción extendida (pregrabado)", level: "AAA", principle: "Perceptible" },
  "1.2.8": { title: "Alternativa para medios (pregrabado)", level: "AAA", principle: "Perceptible" },
  "1.2.9": { title: "Solo audio (en directo)", level: "AAA", principle: "Perceptible" },
  "1.3.1": { title: "Información y relaciones", level: "A", principle: "Perceptible" },
  "1.3.2": { title: "Secuencia significativa", level: "A", principle: "Perceptible" },
  "1.3.3": { title: "Características sensoriales", level: "A", principle: "Perceptible" },
  "1.3.4": { title: "Orientación", level: "AA", principle: "Perceptible" },
  "1.3.5": { title: "Identificar el propósito de la entrada", level: "AA", principle: "Perceptible" },
  "1.3.6": { title: "Identificar el propósito", level: "AAA", principle: "Perceptible" },
  "1.4.1": { title: "Uso del color", level: "A", principle: "Perceptible" },
  "1.4.2": { title: "Control de audio", level: "A", principle: "Perceptible" },
  "1.4.3": { title: "Contraste (mínimo)", level: "AA", principle: "Perceptible" },
  "1.4.4": { title: "Redimensionar texto", level: "AA", principle: "Perceptible" },
  "1.4.5": { title: "Imágenes de texto", level: "AA", principle: "Perceptible" },
  "1.4.6": { title: "Contraste (mejorado)", level: "AAA", principle: "Perceptible" },
  "1.4.7": { title: "Audio de fondo bajo o inexistente", level: "AAA", principle: "Perceptible" },
  "1.4.8": { title: "Presentación visual", level: "AAA", principle: "Perceptible" },
  "1.4.9": { title: "Imágenes de texto (sin excepción)", level: "AAA", principle: "Perceptible" },
  "1.4.10": { title: "Reflow", level: "AA", principle: "Perceptible" },
  "1.4.11": { title: "Contraste no textual", level: "AA", principle: "Perceptible" },
  "1.4.12": { title: "Espaciado de texto", level: "AA", principle: "Perceptible" },
  "1.4.13": { title: "Contenido al pasar el cursor o al enfocar", level: "AA", principle: "Perceptible" },

  // P2 – Operable
  "2.1.1": { title: "Teclado", level: "A", principle: "Operable" },
  "2.1.2": { title: "Sin trampa de teclado", level: "A", principle: "Operable" },
  "2.1.3": { title: "Teclado (sin excepción)", level: "AAA", principle: "Operable" },
  "2.1.4": { title: "Atajos de teclas de un carácter", level: "A", principle: "Operable" },
  "2.2.1": { title: "Tiempo ajustable", level: "A", principle: "Operable" },
  "2.2.2": { title: "Pausar, detener, ocultar", level: "A", principle: "Operable" },
  "2.2.3": { title: "Sin temporización", level: "AAA", principle: "Operable" },
  "2.2.4": { title: "Interrupciones", level: "AAA", principle: "Operable" },
  "2.2.5": { title: "Reautenticación", level: "AAA", principle: "Operable" },
  "2.2.6": { title: "Exclusiones de temporización", level: "AAA", principle: "Operable" },
  "2.3.1": { title: "Tres destellos o por debajo del umbral", level: "A", principle: "Operable" },
  "2.3.2": { title: "Tres destellos", level: "AAA", principle: "Operable" },
  "2.3.3": { title: "Animación por interacción", level: "AAA", principle: "Operable" },
  "2.4.1": { title: "Omitir bloques", level: "A", principle: "Operable" },
  "2.4.2": { title: "Página titulada", level: "A", principle: "Operable" },
  "2.4.3": { title: "Orden del foco", level: "A", principle: "Operable" },
  "2.4.4": { title: "Propósito de los enlaces (en contexto)", level: "A", principle: "Operable" },
  "2.4.5": { title: "Múltiples maneras", level: "AA", principle: "Operable" },
  "2.4.6": { title: "Encabezados y etiquetas", level: "AA", principle: "Operable" },
  "2.4.7": { title: "Foco visible", level: "AA", principle: "Operable" },
  "2.4.8": { title: "Ubicación", level: "AAA", principle: "Operable" },
  "2.4.9": { title: "Propósito de los enlaces (solo enlace)", level: "AAA", principle: "Operable" },
  "2.4.10": { title: "Encabezados de sección", level: "AAA", principle: "Operable" },
  "2.5.1": { title: "Gestos del puntero", level: "A", principle: "Operable" },
  "2.5.2": { title: "Cancelación del puntero", level: "A", principle: "Operable" },
  "2.5.3": { title: "Etiqueta en el nombre", level: "A", principle: "Operable" },
  "2.5.4": { title: "Activación por movimiento", level: "A", principle: "Operable" },
  "2.5.5": { title: "Tamaño del objetivo", level: "AAA", principle: "Operable" },
  "2.5.6": { title: "Mecanismos de entrada simultáneos", level: "AAA", principle: "Operable" },

  // P3 – Comprensible
  "3.1.1": { title: "Idioma de la página", level: "A", principle: "Comprensible" },
  "3.1.2": { title: "Idioma de las partes", level: "AA", principle: "Comprensible" },
  "3.1.3": { title: "Palabras inusuales", level: "AAA", principle: "Comprensible" },
  "3.1.4": { title: "Abreviaturas", level: "AAA", principle: "Comprensible" },
  "3.1.5": { title: "Nivel de lectura", level: "AAA", principle: "Comprensible" },
  "3.1.6": { title: "Pronunciación", level: "AAA", principle: "Comprensible" },
  "3.2.1": { title: "Al recibir el foco", level: "A", principle: "Comprensible" },
  "3.2.2": { title: "Al introducir datos", level: "A", principle: "Comprensible" },
  "3.2.3": { title: "Navegación consistente", level: "AA", principle: "Comprensible" },
  "3.2.4": { title: "Identificación consistente", level: "AA", principle: "Comprensible" },
  "3.2.5": { title: "Cambio a petición", level: "AAA", principle: "Comprensible" },
  "3.3.1": { title: "Identificación de errores", level: "A", principle: "Comprensible" },
  "3.3.2": { title: "Etiquetas o instrucciones", level: "A", principle: "Comprensible" },
  "3.3.3": { title: "Sugerencia ante errores", level: "AA", principle: "Comprensible" },
  "3.3.4": { title: "Prevención de errores (legal, financiero, datos)", level: "AA", principle: "Comprensible" },
  "3.3.5": { title: "Ayuda", level: "AAA", principle: "Comprensible" },
  "3.3.6": { title: "Prevención de errores (todos)", level: "AAA", principle: "Comprensible" },

  // P4 – Robusto
  "4.1.1": { title: "Análisis sintáctico", level: "A", principle: "Robusto" },
  "4.1.2": { title: "Nombre, función, valor", level: "A", principle: "Robusto" },
  "4.1.3": { title: "Mensajes de estado", level: "AA", principle: "Robusto" },
};

/* ====== Utilidades varias ====== */
function LevelTag({ level }) {
  return <span className={`level level-${level}`}>{level}</span>;
}
function ScoreBar({ value }) {
  const isNull = value == null || Number.isNaN(value);
  // El backend envía score en escala 0-1, convertimos a porcentaje 0-100
  const pct = isNull ? 0 : Math.round((value) * 100);
  return (
    <div className="scorebar">
      <div className="scorebar-fill" style={{ width: `${pct}%` }} />
      <span className="scorebar-label">{isNull ? "—" : `${pct}%`}</span>
    </div>
  );
}

// URL utils
function normalizeUrl(u) {
  if (!u) return u;
  const trimmed = u.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
function isValidUrl(u) {
  try {
    new URL(normalizeUrl(u));
    return true;
  } catch {
    return false;
  }
}

// Veredictos / Fuente
const VERDICT_LABEL = { pass: "CUMPLE", fail: "NO CUMPLE", partial: "PARCIAL", na: "N/A" };
function VerdictBadge({ verdict }) {
  const v = (verdict || "").toLowerCase();
  return <span className={`verdict verdict-${v}`}>{VERDICT_LABEL[v] || "—"}</span>;
}
function SourceChip({ source }) {
  if (!source) return null;
  const s = String(source).toLowerCase();
  const isAI = s === "ai";
  const isRendered = s === "rendered";
  return (
    <span
      className={`badge ${isAI ? "badge-ai" : isRendered ? "badge-rendered" : "chip chip-neutral"}`}
      title={
        isAI
          ? "Datos enriquecidos por IA"
          : isRendered
          ? "Datos renderizados (DOM/CSS)"
          : "Datos crudos (HTML)"
      }
    >
      {isAI ? "AI" : isRendered ? "RENDERED" : "RAW"}
    </span>
  );
}

// Normalización de audit -> mapa por código
const META = (code) => WCAG_META_ES[code] || { title: "Criterio", level: "A", principle: "—" };
function normalizeAuditToWcag(audit) {
  const map = {};
  for (const [code, r] of Object.entries(audit?.results || {})) {
    map[code] = { details: r?.details || {}, passed: r?.passed === true };
  }
  for (const cr of audit?.criterion_results || []) {
    const code = cr.code;
    const existingDetails = map[code]?.details || {};
    const chosen = Object.keys(existingDetails).length > 0 ? existingDetails : (cr.details || {});
    const meta = META(code);
    map[code] = {
      ...map[code],
      verdict: cr.verdict,
      passed: cr.verdict === "pass",
      title: cr.title || meta.title,
      level: cr.level || meta.level,
      principle: cr.principle || meta.principle,
      source: cr.source || "raw",
      score_hint: cr.score_hint ?? null,
      details: chosen,
    };
  }
  // Completar los que solo vinieron por results
  for (const code of Object.keys(map)) {
    const meta = META(code);
    map[code].title ??= meta.title;
    map[code].level ??= meta.level;
    map[code].principle ??= meta.principle;
  }
  return map;
}

const ALL = "ALL";
const PRINCIPLES = ["Perceptible", "Operable", "Comprensible", "Robusto"];
const LEVELS = ["A", "AA", "AAA"];

// Inferencia de modo (usa campos del backend si existen; si no, cae a heurística)
function inferModeStrict(auditLike) {
  const modeField = (auditLike?.mode_effective || "").toString().toUpperCase();
  if (modeField === "RAW" || modeField === "RENDERED" || modeField === "AI") {
    return modeField;
  }
  // "AUTO" es estrategia; pintamos según señales reales
  if (modeField === "AUTO") {
    // seguimos a señales
  }
  if (auditLike?.any_ai === true) return "AI";
  if (
    auditLike?.has_rendered === true ||
    (Array.isArray(auditLike?.rendered_codes) && auditLike.rendered_codes.length > 0)
  ) {
    return "RENDERED";
  }
  const cr = Array.isArray(auditLike?.criterion_results) ? auditLike.criterion_results : [];
  const usedAI = cr.some((x) => (x?.source || "").toLowerCase() === "ai");
  const usedRendered =
    cr.some((x) => (x?.source || "").toLowerCase() === "rendered") ||
    (Array.isArray(auditLike?.rendered_codes) && auditLike.rendered_codes.length > 0);
  if (usedAI) return "AI";
  if (usedRendered) return "RENDERED";
  return "RAW";
}

export function PanelPrincipal() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // input URL
  const [url, setUrl] = useState("");
  const [touched, setTouched] = useState(false);
  const valid = isValidUrl(url);

  // auditoría activa
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [audit, setAudit] = useState(null);

  // listado de auditorías recientes
  const [recent, setRecent] = useState({ loading: false, error: "", items: [] });

  // filtros (para tablas por principio)
  const [filterPrinciple, setFilterPrinciple] = useState(ALL);
  const [filterLevel, setFilterLevel] = useState(ALL);
  const [filterState, setFilterState] = useState(ALL); // ALL | PASSED | FAILED | PARTIAL | NA
  const [search, setSearch] = useState("");

  // historial local
  const [history, setHistory] = useState([]);

  // modal de logout
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("a11y_history") || "[]");
    setHistory(saved);
  }, []);
  function pushHistory(u) {
    const norm = normalizeUrl(u);
    const next = [norm, ...history.filter((x) => x !== norm)].slice(0, 6);
    setHistory(next);
    localStorage.setItem("a11y_history", JSON.stringify(next));
  }

  // modal de borrar auditoría
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Tema Dark
  const { theme, toggle } = useTheme();

  // ========= ORDEN DEL FRONT (uiId) =========
  const uiCounter = React.useRef(1);

  // Efecto que carga el listado de auditorías (UNA sola vez) + asigna uiId
  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        setRecent((r) => ({ ...r, loading: true, error: "" }));
        console.log("[FisiChecker] GET →", API_ENDPOINTS.audits);
        const res = await fetch(API_ENDPOINTS.audits, fetchConfig);
        console.log("[FisiChecker] GET ←", res.status, res.statusText);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const arr = Array.isArray(data) ? data : [];
        const withUi = arr.map((item) => ({ ...item, uiId: uiCounter.current++ }));

        if (!abort) setRecent({ loading: false, error: "", items: withUi });
      } catch (e) {
        console.error("[FisiChecker] GET /audits ERROR:", e);
        if (!abort) setRecent({ loading: false, error: e?.message || "Error", items: [] });
      }
    })();
    return () => {
      abort = true;
    };
  }, []);

  const recentSorted = useMemo(() => {
    const arr = Array.isArray(recent.items) ? [...recent.items] : [];
    // Más reciente primero
    arr.sort((a, b) => new Date(b.fetched_at || 0) - new Date(a.fetched_at || 0));
    return arr;
  }, [recent.items]);

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  }

  // Llamador con 4 modos (raw | rendered | ai | auto_ai)
  async function runAudit(which = "raw") {
    setTouched(true);
    if (!valid) return;
    setError("");
    setLoading(true);
    setAudit(null);
    const finalUrl = normalizeUrl(url);

    try {
      const endpoint = buildAuditEndpoint(which);
      const payload = { url: finalUrl };
      console.log("[FisiChecker] POST →", endpoint, "payload:", payload);

      const csrfToken = getCookie("csrftoken");
      const res = await fetch(endpoint, {
        method: "POST",
        ...fetchConfig,
        headers: {
          ...fetchConfig.headers,
          "X-CSRFToken": csrfToken || "",
        },
        body: JSON.stringify(payload),
      });
      console.log("[FisiChecker] POST ←", res.status, res.statusText);

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setAudit({ ...data, url: finalUrl });

      // refrescar listado rápido (optimista) + uiId
      setRecent((r) => ({
        ...r,
        items: [{ ...data, uiId: uiCounter.current++ }, ...r.items].slice(0, 20),
      }));

      pushHistory(finalUrl);
    } catch (e) {
      console.error("[FisiChecker] POST /audit ERROR:", e);
      setError(e?.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  // Normaliza a mapa por código
  const wcag = useMemo(() => (!audit ? {} : normalizeAuditToWcag(audit)), [audit]);

  // Conteos por veredicto (global)
  const verdictCounts = useMemo(() => {
    if (audit?.verdict_counts) return audit.verdict_counts;

    const c = { pass: 0, fail: 0, partial: 0, na: 0 };

    if (Array.isArray(audit?.criterion_results)) {
      audit.criterion_results.forEach((r) => {
        const v = (r?.verdict ?? (r?.passed ? "pass" : "fail")).toLowerCase();
        if (c[v] !== undefined) c[v] += 1;
      });
      return c;
    }

    Object.values(wcag).forEach((r) => {
      const v = (r?.verdict ?? (r?.passed ? "pass" : "fail")).toLowerCase();
      if (c[v] !== undefined) c[v] += 1;
    });
    return c;
  }, [audit, wcag]);

  // Score por nivel
  const levelBreakdown = useMemo(() => {
    const sb = audit?.score_breakdown;
    if (sb) return sb;
    const out = { A: { total: 0, passed: 0 }, AA: { total: 0, passed: 0 }, AAA: { total: 0, passed: 0 } };
    for (const [, res] of Object.entries(wcag)) {
      const lvl = res.level || "A";
      out[lvl].total += 1;
      if (res?.verdict === "pass" || res?.passed) out[lvl].passed += 1;
    }
    return out;
  }, [audit, wcag]);

  // Agregado por principio
  const byPrinciple = useMemo(() => {
    const acc = {};
    for (const [code, r] of Object.entries(wcag)) {
      const p = r.principle || "—";
      const v = (r.verdict ?? (r.passed ? "pass" : "fail")).toLowerCase();
      if (!acc[p]) acc[p] = { pass: 0, fail: 0, partial: 0, na: 0, items: [] };
      if (acc[p][v] !== undefined) acc[p][v] += 1;
      acc[p].items.push([code, r]);
    }
    return acc;
  }, [wcag]);

  // Filtrado para tablas por principio
  const filteredEntries = useMemo(() => {
    const entries = Object.entries(wcag);
    return entries.filter(([code, r]) => {
      if (filterPrinciple !== ALL && (r.principle || "—") !== filterPrinciple) return false;
      if (filterLevel !== ALL && (r.level || "A") !== filterLevel) return false;

      const v = (r.verdict ?? (r.passed ? "pass" : "fail")).toLowerCase();
      if (filterState === "PASSED" && v !== "pass") return false;
      if (filterState === "FAILED" && v !== "fail") return false;
      if (filterState === "PARTIAL" && v !== "partial") return false;
      if (filterState === "NA" && v !== "na") return false;

      if (search) {
        const needle = search.toLowerCase();
        const hay = `${code} ${r.title || ""} ${r.principle || ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [wcag, filterPrinciple, filterLevel, filterState, search]);


  const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString() : "—");
  // Backend envía score en escala 0-1 (0-100%)
  const pct = (v) => (v == null ? "—" : Math.round((v || 0) * 100));

  // Sugerencia de AI usado en esta auditoría (cabecera)
  const aiUsedCount = useMemo(() => {
    const arr = Array.isArray(audit?.criterion_results) ? audit.criterion_results : [];
    return arr.filter((cr) => cr?.source === "ai").length;
  }, [audit]);

  const handleLogout = () => setShowLogoutModal(true);
  const confirmLogout = () => {
    setShowLogoutModal(false);
    navigate("/logout");
  };
  const cancelLogout = () => setShowLogoutModal(false);

  return (
    <div className="container audit-container">
      {showLogoutModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="logout-title">
          <div className="modal-card">
            <h3 id="logout-title">¿Cerrar sesion?</h3>
            <p>Se cerrara tu sesion actual y volveras al inicio.</p>
            <div className="modal-actions">
              <button type="button" className="modal-btn ghost" onClick={cancelLogout}>
                Cancelar
              </button>
              <button type="button" className="modal-btn danger" onClick={confirmLogout}>
                Si, salir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE BORRAR AUDITORÍA */}
      {showDeleteModal && deleteTarget && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <div className="modal-card">
            <h3 id="delete-title">¿Borrar auditoría?</h3>
            <p>
              Esta acción no se puede deshacer.
              <br />
              ¿Seguro que quieres borrar la auditoría <b>ID {deleteTarget.id}</b>?
            </p>
            <div className="modal-actions">
              <button type="button" className="modal-btn ghost" onClick={() => setShowDeleteModal(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="modal-btn danger"
                onClick={async () => {
                  setShowDeleteModal(false);
                  try {
                    const csrfToken = getCookie("csrftoken");
                    const res = await fetch(deleteEndpoint(deleteTarget.id), {
                      method: "DELETE",
                      ...fetchConfig,
                      headers: {
                        ...fetchConfig.headers,
                        "X-CSRFToken": csrfToken || "",
                      },
                    });
                    if (!res.ok) throw new Error(await res.text());

                    // SOLO quitar de la lista (no agregar nada)
                    setRecent((r) => ({
                      ...r,
                      items: r.items.filter((x) => x.id !== deleteTarget.id),
                    }));
                  } catch (err) {
                    alert("Error al borrar auditoría: " + (err?.message || err));
                  }
                  setDeleteTarget(null);
                }}
              >
                Sí, borrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header con usuario y logout */}
      <div className="app-header">
        <h1 className="titulo">Fisi Checker – WCAG 2.1</h1>
        <div className="user-info">
          <span className="user-name">👤 {user?.username || "Usuario"}</span>
          <button type="button" className="chip chip-neutral" onClick={toggle} title="Cambiar tema">
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <button type="button" className="chip chip-bad" onClick={handleLogout} title="Cerrar sesión">
            🚪 Salir
          </button>
        </div>
      </div>

      {/* ------- AUDITORÍAS RECIENTES ------- */}
      <div className="card">
        <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="subtitulo">Auditorías recientes</h2>
          {recent.items.length > 0 && (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Link
                to="/colab-analysis"
                className="chip chip-neutral"
                title="Ver código de análisis en Google Colab"
                style={{ textDecoration: "none" }}
              >
                🚀 Colab
              </Link>
              
              <button
                type="button"
                className="chip chip-good"
                onClick={() => window.open(`${API_ENDPOINTS.export.csv}`, "_blank")}
                title="Exportar a CSV"
              >
                📊 CSV
              </button>
              <button
                type="button"
                className="chip chip-good"
                onClick={() => window.open(`${API_ENDPOINTS.export.excel}`, "_blank")}
                title="Exportar a Excel"
              >
                📗 Excel
              </button>
            </div>
          )}
        </div>

        {recent.loading && <div className="hint">Cargando…</div>}
        {recent.error && <div className="alert error">Error: {recent.error}</div>}

        <div className="table-scroll">
          {!recent.loading && !recent.error && (
            <div className="overflow-x">
              <table className="details-table compact">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>URL</th>
                    <th>Título</th>
                    <th>Score</th>
                    <th>HTTP</th>
                    <th>Fecha</th>
                    <th>Modo</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recentSorted.map((a, idx) => {
                    const n = recentSorted.length - idx;
                    return (
                      <tr key={a.id}>
                        <td>{n}</td>

                        <td style={{maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
                          <a href={a.url} target="_blank" rel="noreferrer">{a.url}</a>
                        </td>

                        <td style={{maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
                          {a.page_title || "—"}
                        </td>

                        <td>
                          {a.score == null
                            ? <span className="chip chip-neutral">—</span>
                            : <span className="chip chip-neutral">{pct(a.score)}%</span>}
                        </td>

                        <td>{a.status_code}</td>
                        <td>{fmtDate(a.fetched_at)}</td>

                        <td>
                          <span
                            className={{
                              "RAW": "chip chip-neutral",
                              "RENDERED": "badge badge-rendered",
                              "AI": "badge badge-ai",
                            }[inferModeStrict(a)] || "chip chip-neutral"}
                          >
                            {inferModeStrict(a)}
                          </span>
                        </td>

                        <td>
                          <Link className="audit-btn" to={`/audit/${a.id}`}>Ver</Link>
                          <button
                            className="audit-btn danger"
                            style={{ marginLeft: 8 }}
                            title="Borrar auditoría"
                            onClick={() => {
                              setDeleteTarget(a);
                              setShowDeleteModal(true);
                            }}
                          >
                            🗑 Borrar
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {recent.items.length === 0 && (
                    <tr><td colSpan={8}><em>No hay auditorías aún.</em></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* APARTADO: insertar link */}
      <div className="card input-card" role="region" aria-labelledby="link-title">
        <div className="input-head">
          <h2 id="link-title" className="subtitulo">
            Revisar un enlace
          </h2>
          <p className="hint">Pega la URL que quieres auditar (HTTP o HTTPS).</p>
        </div>

        <form className="audit-form" onSubmit={(e) => { e.preventDefault(); runAudit("raw"); }}>
          <label htmlFor="audit-url" className="sr-only">
            URL a auditar
          </label>
          <input
            id="audit-url"
            className={`audit-input ${touched && !valid ? "invalid" : ""}`}
            type="url"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="https://tu-sitio.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={() => setTouched(true)}
            onKeyDown={(e) => { if (e.key === "Enter") runAudit("raw"); }}
            aria-invalid={touched && !valid}
            aria-describedby="url-help"
          />

          <div className="btn-row">
            <button
              className="audit-btn"
              type="button"
              onClick={() => runAudit("rendered")}
              disabled={loading || !valid}
              title="Usa DOM renderizado + CSS (requiere Playwright en el backend)"
            >
              {loading ? "Auditando..." : "Auditar"}
            </button>

            <button
              className="audit-btn secondary"
              type="button"
              onClick={() => runAudit("ai")}
              disabled={loading || !valid}
              title="Modo IA puro: la IA decide veredicto y score (source=AI)"
            >
              {loading ? "Auditando..." : "Solo IA"}
            </button>
          </div>
        </form>

        <div id="url-help" className="help-row">
          {!touched || valid ? (
            <div className="examples">
              <span className="examples-label">Ejemplos:</span>
              {["example.com", "wikipedia.org", "peru.gob.pe"].map((s) => (
                <button key={s} type="button" className="chip chip-example" onClick={() => setUrl(s)} title={`Usar ${s}`}>
                  {s}
                </button>
              ))}
            </div>
          ) : (
            <div className="alert error compact">
              Ingresa una URL válida, por ejemplo <code>https://ejemplo.com</code>
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="history-row" aria-label="Historial">
            <span className="examples-label">Recientes:</span>
            {history.map((h) => (
              <button
                key={h}
                type="button"
                className="chip chip-neutral"
                onClick={() => {
                  setUrl(h);
                  setTouched(false);
                }}
                title={`Cargar ${h}`}
              >
                {h}
              </button>
            ))}
            <button
              type="button"
              className="chip chip-bad"
              onClick={() => {
                localStorage.removeItem("a11y_history");
                setHistory([]);
              }}
              title="Limpiar historial"
            >
              Limpiar
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="alert error">
          <strong>Error:</strong> <span>{error}</span>
        </div>
      )}

      {/* ---------- UI del resultado activo ---------- */}
      {audit && (
        <>
          <div className="card">
            <div className="card-header">
              <div className="meta">
                <div>
                  <strong>URL:</strong>{" "}
                  <a href={audit.url} target="_blank" rel="noreferrer">
                    {audit.url}
                  </a>
                </div>
                <div>
                  <strong>Título:</strong> {audit.page_title || "—"}
                </div>
              </div>
              <div className="meta">
                <div>
                  <strong>HTTP:</strong> {audit.status_code}
                </div>
                <div>
                  <strong>Tiempo:</strong> {audit.elapsed_ms} ms
                </div>
                <div>
                  <strong>Fecha:</strong> {audit.fetched_at ? new Date(audit.fetched_at).toLocaleString() : "—"}
                </div>
              </div>
            </div>

            <div className="row wrap gap-sm">
              <span
                className={
                  {
                    RAW: "chip chip-neutral",
                    RENDERED: "badge badge-rendered",
                    AI: "badge badge-ai",
                  }[inferModeStrict(audit)] || "chip chip-neutral"
                }
              >
                {inferModeStrict(audit)}
              </span>

              {audit.rendered && (
                <span className="badge badge-rendered" title="Auditado con DOM/CSS renderizado">
                  RENDERED
                </span>
              )}
              {Array.isArray(audit.rendered_codes) && audit.rendered_codes.length > 0 && (
                <span className="chip chip-neutral">Sobrescritos: {audit.rendered_codes.join(", ")}</span>
              )}
              {aiUsedCount > 0 && (
                <span className="badge badge-ai" title="Criterios resueltos con IA">
                  AI · {aiUsedCount}
                </span>
              )}
              {audit.rendered_error && (
                <div className="alert warn">Problema en medición renderizada: {String(audit.rendered_error)}</div>
              )}
            </div>

            <div className="score-row">
              <div className="score-box">
                <div className="score-title">Puntaje global</div>
                <ScoreBar value={audit.score} />
              </div>

              <div className="level-summary">
                {LEVELS.map((lv) => {
                  const t = levelBreakdown?.[lv]?.total || 0;
                  const p = levelBreakdown?.[lv]?.passed || 0;
                  const ratio = t ? Math.round((p / t) * 100) : 100;
                  return (
                    <div key={lv} className="level-pill">
                      <span className={`level level-${lv}`}>{lv}</span>
                      <div className="mini-bar">
                        <div className="mini-bar-fill" style={{ width: `${ratio}%` }} />
                      </div>
                      <span className="mini-bar-label">
                        {p}/{t}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="row wrap gap-sm">
              <Link className="audit-btn" to={`/audit/${audit.id}`} state={{ audit }}>
                Ver detalles completos
              </Link>
            </div>
          </div>

          <div className="card">
            <h2 className="subtitulo">Resumen</h2>
            <div className="summary-grid">
              <div className="summary-card ok">
                <div className="summary-icon">✔</div>
                <div className="summary-title">{verdictCounts.pass} Cumple</div>
                <div className="summary-sub">criterios con veredicto CUMPLE</div>
                <ul className="summary-break">
                  {PRINCIPLES.map((p) => (
                    <li key={p}>⦿ {p} {byPrinciple[p]?.pass || 0}</li>
                  ))}
                </ul>
              </div>

              <div className="summary-card bad">
                <div className="summary-icon">✖</div>
                <div className="summary-title">{verdictCounts.fail} Problemas</div>
                <div className="summary-sub">criterios con veredicto NO CUMPLE</div>
                <ul className="summary-break">
                  {PRINCIPLES.map((p) => (
                    <li key={p}>⦿ {p} {byPrinciple[p]?.fail || 0}</li>
                  ))}
                </ul>
              </div>

              <div className="summary-card warn">
                <div className="summary-icon">⚠</div>
                <div className="summary-title">{verdictCounts.partial} Advertencias</div>
                <div className="summary-sub">criterios con veredicto PARCIAL</div>
                <ul className="summary-break">
                  {PRINCIPLES.map((p) => (
                    <li key={p}>⦿ {p} {byPrinciple[p]?.partial || 0}</li>
                  ))}
                </ul>
              </div>

              <div className="summary-card na">
                <div className="summary-icon">？</div>
                <div className="summary-title">{verdictCounts.na} No verificados</div>
                <div className="summary-sub">criterios con veredicto N/A</div>
                <ul className="summary-break">
                  {PRINCIPLES.map((p) => (
                    <li key={p}>⦿ {p} {byPrinciple[p]?.na || 0}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* ------- TABLAS POR PRINCIPIO (ES) ------- */}
          {PRINCIPLES.map((P) => {
            const rows = filteredEntries
              .map(([code, r]) => ({ code, ...r }))
              .filter((r) => r.principle === P)
              .map((r) => {
                const meta = META(r.code);
                return {
                  code: r.code,
                  title: r.title || meta.title,
                  level: r.level || meta.level,
                  verdict: r.verdict ?? (r.passed ? "pass" : "fail"),
                  source: r.source,
                };
              })
              .sort((a, b) => {
                const order = { fail: 0, partial: 1, na: 2, pass: 3 };
                return order[a.verdict] - order[b.verdict] || a.code.localeCompare(b.code);
              });

            if (rows.length === 0) return null;

            return (
              <div key={P} className="card">
                <h2 className="subtitulo">{P}</h2>
                <div className="overflow-x">
                  <table className="details-table compact">
                    <thead>
                      <tr>
                        <th style={{ minWidth: 110 }}>Pauta</th>
                        <th>Nivel</th>
                        <th>Resultado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.code}>
                          <td>
                            <b>{r.code}</b> — {r.title}
                          </td>
                          <td>
                            <LevelTag level={r.level} />
                          </td>
                          <td>
                            <VerdictBadge verdict={r.verdict} /> <SourceChip source={r.source} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

const deleteEndpoint = (id) => API_ENDPOINTS.delete.audit(id);
