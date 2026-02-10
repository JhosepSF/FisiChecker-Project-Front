// src/modules/pages/AuditDetailPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import "../../styles/Panel.css";

const API_GET = (id) => `http://127.0.0.1:8000/api/audits/${id}`;

// --- Metadatos WCAG (ES) ---
const WCAG_META = {
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

// --- NUEVO: explicación corta por criterio (qué evalúa/por qué importa) ---
const CRITERION_EXPLAIN = {
  "1.1.1": "Revisa que las imágenes y contenidos no textuales tengan texto alternativo o sean marcados como decorativos. Esto permite a usuarios con lector de pantalla comprender el contenido.",
  "1.2.2": "Verifica que los videos pregrabados tengan subtítulos. Esto ayuda a usuarios sordos o con dificultades auditivas.",
  "1.3.1": "Comprueba que la estructura se transmita correctamente (encabezados, tablas con encabezados, landmarks). Esto mantiene relaciones e información para tecnologías de asistencia.",
  "1.3.5": "Comprueba que los campos de formularios tengan atributos para identificar su propósito (por ejemplo, autocomplete). Mejora autocompletado y accesibilidad.",
  "1.4.3": "Mide el contraste mínimo del texto frente al fondo. Un contraste suficiente mejora lectura para baja visión.",
  "1.4.10": "Verifica reflow (sin scroll horizontal) a 320px de ancho. Garantiza uso en móviles sin pérdida de información.",
  "1.4.11": "Revisa contraste de componentes no textuales (bordes, controles, iconos). Mejora la percepción visual.",
  "2.1.1": "Verifica que toda la funcionalidad sea operable con teclado. Es crítico para usuarios que no usan mouse.",
  "2.4.1": "Comprueba mecanismos para saltar bloques repetitivos (skip link, landmark main). Acelera la navegación con teclado.",
  "2.4.4": "Evalúa que los enlaces tengan propósito claro en contexto. Evita ambigüedades como 'leer más' sin contexto.",
  "2.4.7": "Comprueba que el foco sea visible al navegar con teclado. Permite identificar dónde está el foco.",
  "2.5.5": "Verifica que los objetivos interactivos tengan tamaño adecuado (~44px). Facilita su activación táctil.",
  "3.1.1": "Confirma que la página define su idioma principal (lang). Es vital para pronunciación correcta en lectores.",
  "3.1.2": "Detecta partes con idioma distinto marcadas adecuadamente (lang). Ayuda a pronunciar nombres o frases extranjeras.",
  "3.3.2": "Revisa que los campos de formularios tengan etiquetas o instrucciones. Guía a usuarios en su llenado.",
  "4.1.1": "Detecta problemas de marcado como IDs duplicados. Evita confusión en scripts y tecnologías de asistencia.",
  "4.1.2": "Verifica nombre, rol y valor de elementos (incluye nombres accesibles y ARIA coherente). Fundamental para asistentes.",
  "4.1.3": "Comprueba mensajes de estado anunciados correctamente (live regions). Ayuda a notificar cambios sin foco.",
};

// UI chips/badges
const VERDICT_LABEL = { pass: "CUMPLE", fail: "NO CUMPLE", partial: "PARCIAL", na: "N/A" };
function VerdictBadge({ verdict }) {
  const v = (verdict || "").toLowerCase();
  return <span className={`verdict verdict-${v}`}>{VERDICT_LABEL[v] || "—"}</span>;
}
function SourceChip({ source }) {
  if (!source) return null;
  const isRendered = source === "rendered";
  return (
    <span className={`badge ${isRendered ? "badge-rendered" : "chip chip-neutral"}`}>
      {isRendered ? "RENDERED" : "RAW"}
    </span>
  );
}
function LevelTag({ level }) {
  return <span className={`level level-${level}`}>{level}</span>;
}

// Helpers de render de detalles
function DetailValue({ value }) {
  if (Array.isArray(value)) return <>{value.length ? value.join(", ") : "—"}</>;
  if (value && typeof value === "object") return <pre className="json">{JSON.stringify(value, null, 2)}</pre>;
  return <>{String(value)}</>;
}
function OffenderTable({ rows = [], columns }) {
  if (!rows || rows.length === 0) return <em>—</em>;
  return (
    <div className="overflow-x">
      <table className="details-table compact">
        <thead>
          <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c.key}>
                  {typeof c.render === "function" ? c.render(r[c.key], r) : <DetailValue value={r[c.key]} />}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ==== NUEVO: construcción de explicaciones dinámicas a partir de details ====
const pct = (num, den) => {
  if (!den) return "—";
  return `${Math.round((num / den) * 100)}%`;
};

function buildDetectedSummary(code, d = {}) {
  const lines = [];

  switch (code) {
    /* Perceptible */
    case "1.1.1": {
      const total = Number(d.images_total ?? 0);
      const good = Number(d.with_alt ?? 0) + Number(d.decorative ?? 0);
      if (total > 0) {
        lines.push(`Imágenes con alt/decorativas: ${good}/${total} (${pct(good, total)}).`);
      } else {
        lines.push("No se detectaron imágenes.");
      }
      break;
    }
    case "1.2.2": {
      if (typeof d.videos === "number") {
        lines.push(`Videos detectados: ${d.videos}. Sin subtítulos: ${d.videos_without_captions || 0}.`);
      }
      break;
    }
    case "1.3.1": {
      if (typeof d.tables === "number") {
        lines.push(`Tablas: ${d.tables}. Tablas sin <th>: ${d.tables_without_th || 0}.`);
      }
      if (typeof d.heading_hierarchy_ok === "boolean") {
        lines.push(`Jerarquía de encabezados: ${d.heading_hierarchy_ok ? "correcta" : "posible problema"}.`);
      }
      if (d.landmarks && typeof d.landmarks === "object") {
        const miss = Object.entries(d.landmarks).filter(([, v]) => v === false).map(([k]) => k);
        lines.push(`Landmarks detectados: ${Object.keys(d.landmarks).length}. Faltantes: ${miss.length ? miss.join(", ") : "ninguno"}.`);
      }
      break;
    }
    case "1.3.5": {
      if (typeof d.inputs_total === "number") {
        const ok = d.inputs_with_autocomplete ?? 0;
        lines.push(`Campos con autocomplete: ${ok}/${d.inputs_total} (${pct(ok, d.inputs_total)}).`);
      }
      break;
    }
    case "1.4.3":
    case "1.4.6": {
      if (typeof d.tested_desktop === "number") {
        const fails = d.fails_desktop ?? 0;
        lines.push(`Desktop: fallos de contraste ${fails}/${d.tested_desktop} (${pct(fails, d.tested_desktop)}).`);
      }
      if (typeof d.tested_mobile === "number") {
        const fails = d.fails_mobile ?? 0;
        lines.push(`Mobile: fallos de contraste ${fails}/${d.tested_mobile} (${pct(fails, d.tested_mobile)}).`);
      }
      break;
    }
    case "1.4.10": {
      if (typeof d.has_horizontal_overflow_at_320px === "boolean") {
        lines.push(`Overflow horizontal a 320px: ${d.has_horizontal_overflow_at_320px ? "sí" : "no"}.`);
      }
      break;
    }
    case "1.4.11": {
      if (typeof d.tested === "number") {
        const fails = d.fails ?? 0;
        lines.push(`Componentes no textuales con contraste insuficiente: ${fails}/${d.tested} (${pct(fails, d.tested)}).`);
      }
      break;
    }

    /* Operable */
    case "2.1.1": {
      lines.push(`Elementos con handlers de click en elementos no interactivos: ${d.onclick_noninteractive || 0}.`);
      if (typeof d.tabindex_gt0 === "number") {
        lines.push(`Elementos con tabindex > 0: ${d.tabindex_gt0}.`);
      }
      break;
    }
    case "2.4.1": {
      lines.push(`Landmark <main>: ${d.has_main ? "sí" : "no"}; Enlace 'saltar al contenido': ${d.has_skip_link ? "sí" : "no"}.`);
      break;
    }
    case "2.4.4": {
      if (typeof d.links_total === "number") {
        const ok = d.meaningful ?? d.meaningful_text_only ?? 0;
        lines.push(`Enlaces con propósito claro: ${ok}/${d.links_total} (${pct(ok, d.links_total)}).`);
      }
      if (typeof d.anchors_without_href === "number") {
        lines.push(`Anclas sin href: ${d.anchors_without_href}.`);
      }
      break;
    }
    case "2.4.7": {
      if (typeof d.tested === "number") {
        const ok = d.visible ?? 0;
        lines.push(`Elementos con foco visible: ${ok}/${d.tested} (${pct(ok, d.tested)}).`);
      }
      break;
    }
    case "2.5.5": {
      if (typeof d.tested === "number") {
        const small = d.too_small ?? 0;
        lines.push(`Objetivos interactivos <44px: ${small}/${d.tested} (${pct(small, d.tested)}).`);
      }
      break;
    }

    /* Comprensible */
    case "3.1.1": {
      lines.push(`Atributo lang en <html>: ${d.lang_present ? `sí (${d.lang || "desconocido"})` : "no"}.`);
      break;
    }
    case "3.1.2": {
      if (typeof d.parts_with_lang === "number") {
        lines.push(`Partes con lang específico: ${d.parts_with_lang}.`);
      }
      break;
    }
    case "3.3.2": {
      if (typeof d.inputs_total === "number") {
        const ok = d.inputs_labeled ?? 0;
        lines.push(`Campos etiquetados: ${ok}/${d.inputs_total} (${pct(ok, d.inputs_total)}).`);
      }
      break;
    }

    /* Robusto */
    case "4.1.1": {
      if (Array.isArray(d.duplicate_ids)) {
        lines.push(`IDs duplicados: ${d.duplicate_ids.length}${d.duplicate_ids.length ? ` (${d.duplicate_ids.slice(0,5).join(", ")}${d.duplicate_ids.length>5 ? ", …" : ""})` : ""}.`);
      }
      break;
    }
    case "4.1.2": {
      const missName = Array.isArray(d.missing_accessible_name) ? d.missing_accessible_name.length : 0;
      lines.push(`Elementos sin nombre accesible: ${missName}.`);
      if (typeof d.aria_broken_refs === "number") lines.push(`Referencias ARIA rotas: ${d.aria_broken_refs}.`);
      break;
    }
    case "4.1.3": {
      const mis = (d.misannotated?.length || 0) + (d.now_misannotated?.length || 0) + (d.observed_misannotated?.length || 0);
      lines.push(`Mensajes de estado mal anotados/observados: ${mis}.`);
      break;
    }

    default: {
      // Fallback genérico: intenta sintetizar info clave
      // Booleanos
      Object.entries(d)
        .filter(([k, v]) => typeof v === "boolean")
        .forEach(([k, v]) => lines.push(`${k}: ${v ? "sí" : "no"}.`));
      // Contadores
      Object.entries(d)
        .filter(([k, v]) => typeof v === "number")
        .forEach(([k, v]) => lines.push(`${k}: ${v}.`));
      break;
    }
  }

  if (d.note) lines.push(`Nota: ${d.note}`);
  if (d.na === true) lines.push("Marcado como N/A (no aplicable o no verificable automáticamente).");
  return lines;
}

function buildRecommendations(code, d = {}, verdict) {
  const recs = [];
  const v = (verdict || "").toLowerCase();

  // Solo sugerimos si no pasó completamente
  if (v === "pass") return recs;

  switch (code) {
    case "1.1.1":
      recs.push("Agrega atributos alt descriptivos a imágenes significativas; marca como decorativas las puramente visuales.");
      break;
    case "1.3.1":
      if (d.heading_hierarchy_ok === false) recs.push("Revisa la jerarquía de encabezados (h1 → h2 → h3…) sin saltos inconsistentes.");
      if (d.landmarks) recs.push("Incluye landmarks semánticos (header, nav, main, footer, aside) según corresponda.");
      break;
    case "1.3.5":
      recs.push("Añade atributos autocomplete adecuados (p. ej., name, email, address-line1) a los inputs.");
      break;
    case "1.4.3":
    case "1.4.6":
      recs.push("Ajusta colores para cumplir contraste mínimo (4.5:1 texto normal / 3:1 texto grande).");
      break;
    case "1.4.10":
      recs.push("Evita overflow horizontal en móviles; usa diseños responsivos (flex/grid) y unidades relativas.");
      break;
    case "1.4.11":
      recs.push("Aumenta contraste de bordes, iconos y estados de controles hasta 3:1 contra el fondo.");
      break;
    case "2.1.1":
      recs.push("Evita handlers de click en elementos no interactivos; usa <button> o añade role y manejo por teclado.");
      break;
    case "2.4.1":
      recs.push("Añade un enlace 'Saltar al contenido' visible al enfocar y usa landmark <main> para contenido principal.");
      break;
    case "2.4.4":
      recs.push("Asegura que los enlaces sean autoexplicativos o tengan contexto suficiente (evitar 'clic aquí' ambiguo).");
      break;
    case "2.4.7":
      recs.push("Define estilos de foco visibles (outline/border/box-shadow) para elementos interactivos.");
      break;
    case "2.5.5":
      recs.push("Aumenta el área interactiva de botones y enlaces a 44px de ancho/alto cuando sea viable.");
      break;
    case "3.1.1":
      recs.push("Configura el atributo lang en <html> con el idioma principal (p. ej., 'es').");
      break;
    case "3.1.2":
      recs.push("Marca con lang las frases o secciones en otro idioma (p. ej., <span lang='en'>Hello</span>).");
      break;
    case "3.3.2":
      recs.push("Asegura que todos los campos tengan etiqueta asociada o instrucciones claras.");
      break;
    case "4.1.1":
      recs.push("Elimina o renombra IDs duplicados para evitar conflictos.");
      break;
    case "4.1.2":
      recs.push("Proporciona nombres accesibles a controles, valida roles/propiedades ARIA y corrige referencias rotas.");
      break;
    case "4.1.3":
      recs.push("Usa regiones vivas (aria-live) o roles adecuados para anunciar mensajes de estado.");
      break;
    default:
      recs.push("Revisa el detalle y corrige los hallazgos reportados para cumplir el criterio.");
  }

  return recs;
}

// Normaliza audit a mapa por código, usando los títulos ES como fallback
function normalizeAuditToWcag(audit) {
  const map = {};
  for (const [code, r] of Object.entries(audit?.results || {})) {
    map[code] = { details: r?.details || {}, passed: r?.passed === true };
  }
  for (const cr of (audit?.criterion_results || [])) {
    const code = cr.code;
    const meta = WCAG_META[code] || {};
    const existingDetails = map[code]?.details || {};
    const chosenDetails = Object.keys(existingDetails).length > 0 ? existingDetails : (cr.details || {});
    map[code] = {
      ...map[code],
      verdict: cr.verdict,
      passed: cr.verdict === "pass",
      title: cr.title || meta.title || "Criterio",
      level: cr.level || meta.level || "A",
      principle: cr.principle || meta.principle || "—",
      source: cr.source || "raw",
      score_hint: cr.score_hint ?? null,
      details: chosenDetails,
    };
  }
  // completar los que solo vinieron en "results"
  for (const code of Object.keys(map)) {
    map[code].title ??= (WCAG_META[code]?.title || "Criterio");
    map[code].level ??= (WCAG_META[code]?.level || "A");
    map[code].principle ??= (WCAG_META[code]?.principle || "—");
  }
  return map;
}

export function AuditDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const [audit, setAudit] = useState(location.state?.audit || null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAudit() {
      if (audit || !id) return;
      try {
        const res = await fetch(API_GET(id));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setAudit(data);
      } catch (e) {
        setError(e?.message || "No se pudo cargar el reporte.");
      }
    }
    fetchAudit();
  }, [id, audit]);

  const wcag = useMemo(() => (!audit ? {} : normalizeAuditToWcag(audit)), [audit]);

  return (
    <div className="container audit-container">
      <div className="row wrap gap-sm" style={{justifyContent:"space-between", alignItems:"center"}}>
        <h1 className="titulo">Detalle del reporte</h1>
        <Link className="audit-btn" to="/">← Volver</Link>
      </div>

      {!audit && !error && <div className="card">Cargando…</div>}
      {error && <div className="alert error"><strong>Error:</strong> {error}</div>}

      {audit && (
        <>
          <div className="card">
            <div className="card-header">
              <div className="meta">
                <div><strong>ID:</strong> {audit.id}</div>
                <div><strong>URL:</strong> <a href={audit.url} target="_blank" rel="noreferrer">{audit.url}</a></div>
                <div><strong>Título:</strong> {audit.page_title || "—"}</div>
              </div>
              <div className="meta">
                <div><strong>HTTP:</strong> {audit.status_code}</div>
                <div><strong>Tiempo:</strong> {audit.elapsed_ms} ms</div>
                <div><strong>Fecha:</strong> {audit.fetched_at ? new Date(audit.fetched_at).toLocaleString() : "—"}</div>
              </div>
            </div>
            <div className="row wrap gap-sm">
              {audit.rendered && <span className="badge badge-rendered">RENDERED</span>}
            </div>
          </div>

          {/* Lista detallada por criterio */}
          <div className="card">
            <h2 className="subtitulo">Criterios (detalle)</h2>
            <div className="criteria-list">
              {Object.entries(wcag)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([code, data]) => {
                  const d = data?.details || {};
                  const is413 = code === "4.1.3";
                  const offenders =
                    is413
                      ? (d.misannotated || d.now_misannotated || d.observed_misannotated || [])
                      : (d.offenders || d.misannotated || []);
                  
                  // NUEVO: textos explicativos
                  const whatItChecks = CRITERION_EXPLAIN[code] || "Criterio WCAG relacionado con accesibilidad.";
                  const detected = buildDetectedSummary(code, d);
                  const recs = buildRecommendations(code, d, data.verdict ?? (data.passed ? "pass" : "fail"));

                  return (
                    <details key={code} className="criterion">
                      <summary className="criterion-summary">
                        <span className="criterion-code">{code}</span>
                        <span className="criterion-title">{data.title}</span>
                        <LevelTag level={data.level} />
                        <span className="principle">{data.principle}</span>
                        <VerdictBadge verdict={data.verdict ?? (data.passed ? "pass" : "fail")} />
                        <SourceChip source={data.source} />
                      </summary>

                      <div className="criterion-body">

                        {/* --- Qué evalúa --- */}
                        <div className="alert warn" style={{marginBottom: 8}}>
                          <strong>Qué evalúa:</strong> {whatItChecks}
                        </div>

                        {/* --- Qué se detectó --- */}
                        {detected.length > 0 && (
                          <div className="callout info">
                            <div className="callout-title">Qué se detectó:</div>
                            <ul className="callout-list">
                              {detected.map((t, i) => <li key={i}>{t}</li>)}
                            </ul>
                          </div>
                        )}

                        {/* --- Tabla de detalles crudos --- */}
                        {Object.keys(d).length > 0 ? (
                          <table className="details-table mt-10">
                            <tbody>
                              {Object.entries(d).map(([k, v]) => {
                                if (["offenders", "misannotated", "now_misannotated", "observed_misannotated"].includes(k)) return null;
                                return (
                                  <tr key={k}>
                                    <td className="k">{k}</td>
                                    <td className="v"><DetailValue value={v} /></td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        ) : (
                          <em>Sin detalles</em>
                        )}

                        {/* --- Hallazgos (ofenders/misannotations) --- */}
                        {offenders && offenders.length > 0 && (
                          <>
                            <h4 className="mini-title">Hallazgos</h4>
                            <OffenderTable
                              rows={offenders}
                              columns={[
                                { key: "tag", label: "Tag" },
                                { key: "role", label: "Role" },
                                { key: "id", label: "ID" },
                                { key: "class", label: "Clases", render: (val) => Array.isArray(val) ? val.join(".") : String(val || "") },
                                { key: "type", label: "Tipo" },
                                { key: "text", label: "Texto" },
                                { key: "ariaLive", label: "aria-live" },
                              ]}
                            />
                          </>
                        )}

                        {/* --- Recomendaciones --- */}
                        {recs.length > 0 && (
                          <div className="alert warn" style={{marginTop: 10}}>
                            <strong>Recomendaciones:</strong>
                            <ul style={{margin: "6px 0 0 18px"}}>
                              {recs.map((r, i) => <li key={i}>{r}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    </details>
                  );
                })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
