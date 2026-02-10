import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PanelPrincipal } from "./modules/pages/PanelPrincipal";
import { AuditDetailPage } from "./modules/pages/AuditDetailPage";

function App() {
  return (
    <BrowserRouter>
      <div>
        <Routes>
          {/* ruta inicial */}
          <Route path="/" element={<Navigate to="/panelprincipal" />} />
          
          {/* demas rutas */}
          <Route path="/panelprincipal" element={<PanelPrincipal />} />
          <Route path="/audit/:id" element={<AuditDetailPage />} />

          {/* fallback por si escriben algo raro */}
          <Route path="*" element={<Navigate to="/panelprincipal" replace />} />
          
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
