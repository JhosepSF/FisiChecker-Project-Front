import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { PrivateRoute } from "./components/PrivateRoute";
import { LoginPage } from "./modules/pages/LoginPage";
import LogoutPage from "./modules/pages/LogoutPage";
import { PanelPrincipal } from "./modules/pages/PanelPrincipal";
import { AuditDetailPage } from "./modules/pages/AuditDetailPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/logout" element={<LogoutPage />} />
          
          {/* Ruta inicial - redirige a login o panel según autenticación */}
          <Route path="/" element={<Navigate to="/panelprincipal" />} />
          
          {/* Rutas protegidas */}
          <Route 
            path="/panelprincipal" 
            element={
              <PrivateRoute>
                <PanelPrincipal />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/audit/:id" 
            element={
              <PrivateRoute>
                <AuditDetailPage />
              </PrivateRoute>
            } 
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/panelprincipal" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
