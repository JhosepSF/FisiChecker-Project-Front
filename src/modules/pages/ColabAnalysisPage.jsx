import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // ✅ ADD
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

export function ColabAnalysisPage() {
  const navigate = useNavigate();
  const { user } = useAuth(); // ✅ ADD
  const { theme, toggle } = useTheme();
  const [copied, setCopied] = useState(false);

  const colabCode = `# ============================================
# CÓDIGO DE ANÁLISIS - GOOGLE COLAB
# ============================================

print("Hola Colab")
`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(colabCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      alert("No se pudo copiar el código. Intenta manualmente.");
    }
  };

  return (
    <div className="container audit-container">
      {/* Header estilo PanelPrincipal */}
      <div className="app-header">
        <h1 className="titulo">Código de Análisis – Google Colab</h1>

        <div className="user-info">
          {/* ✅ Nombre de usuario */}
          <span className="user-name">👤 {user?.username || "Usuario"}</span>

          <button
            type="button"
            className="chip chip-neutral"
            onClick={toggle}
            title="Cambiar tema"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          <button
            type="button"
            className="chip chip-neutral"
            onClick={() => navigate("/panelprincipal")}
            title="Volver al Panel"
          >
            ⬅ Volver
          </button>
        </div>
      </div>

      {/* Card principal */}
      <div className="card">
        <div
          className="card-header"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <h2 className="subtitulo">Script listo para copiar</h2>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              className="chip chip-good"
              onClick={handleCopy}
              title="Copiar el código al portapapeles"
            >
              {copied ? "✅ Copiado" : "📋 Copiar"}
            </button>

            <button
              type="button"
              className="chip chip-neutral"
              onClick={() => navigate("/panelprincipal")}
              title="Regresar a la página principal"
            >
              🏠 Panel
            </button>
          </div>
        </div>

        <p className="hint">
          Copia el código y pégalo en Google Colab. Luego ejecútalo para analizar los datos exportados (CSV/Excel).
        </p>

        {/* Bloque de código */}
        <div className="overflow-x" style={{ marginTop: "0.75rem" }}>
          <pre
            style={{
              margin: 0,
              padding: "1rem",
              borderRadius: 10,
              background: "rgba(0,0,0,0.85)",
              color: "#fff",
              overflowX: "auto",
              maxHeight: 520,
              lineHeight: 1.45,
            }}
          >
            <code>{colabCode}</code>
          </pre>
        </div>

        {/* Barra inferior de acciones */}
        <div className="row wrap gap-sm" style={{ marginTop: "1rem" }}>
          <button type="button" className="audit-btn" onClick={handleCopy}>
            {copied ? "✅ Copiado" : "📋 Copiar código"}
          </button>

          <button
            type="button"
            className="audit-btn secondary"
            onClick={() => navigate("/panelprincipal")}
          >
            ⬅ Regresar al Panel
          </button>
        </div>
      </div>
    </div>
  );
}
