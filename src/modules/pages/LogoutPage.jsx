import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Login.css';

const LogoutPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const performLogout = async () => {
      await logout();
      
      // Redirigir después de 2 segundos para mostrar la animación
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    };

    performLogout();
  }, [logout, navigate]);

  return (
    <div className="login-container">
      <div className="login-card logout-animation">
        <div className="logout-icon">
          <svg 
            className="checkmark" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 52 52"
          >
            <circle 
              className="checkmark-circle" 
              cx="26" 
              cy="26" 
              r="25" 
              fill="none"
            />
            <path 
              className="checkmark-check" 
              fill="none" 
              d="M14.1 27.2l7.1 7.2 16.7-16.8"
            />
          </svg>
        </div>
        
        <h2 className="logout-title">¡Hasta pronto!</h2>
        <p className="logout-message">
          Tu sesión ha sido cerrada de forma segura.
        </p>
        <p className="logout-redirect">
          Redirigiendo al inicio de sesión...
        </p>
      </div>
    </div>
  );
};

export default LogoutPage;
