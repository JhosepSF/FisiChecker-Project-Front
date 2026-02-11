import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_ENDPOINTS, fetchConfig } from '../config/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar sesión con el backend al cargar
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.currentUser, {
          ...fetchConfig,
          method: 'GET'
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setToken('session');
          // Guardar en localStorage como backup
          localStorage.setItem('authUser', JSON.stringify(userData));
          localStorage.setItem('authToken', 'session');
        } else {
          // No hay sesión válida, limpiar
          setUser(null);
          setToken(null);
          localStorage.removeItem('authUser');
          localStorage.removeItem('authToken');
        }
      } catch (error) {
        console.error('Error verificando sesión:', error);
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await fetch(API_ENDPOINTS.login, {
        method: 'POST',
        ...fetchConfig,
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error en login');
      }

      const data = await response.json();
      
      // Guardar token y usuario
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify(data.user));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      // Llamar al endpoint de logout del backend
      await fetch(API_ENDPOINTS.logout, {
        method: 'POST',
        ...fetchConfig,
      });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
    
    // Limpiar estado local independientemente del resultado
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  };

  const isAuthenticated = () => {
    return !!token;
  };

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
