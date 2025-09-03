import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './reset.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function Reset() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Obtener el token de la URL
  const token = searchParams.get('token');
  
  useEffect(() => {
    // Verificar si hay token en la URL
    if (!token) {
      setError('Token no válido o expirado. Por favor, solicita un nuevo enlace de recuperación.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!password || !confirmPassword) {
      setError('Por favor completa todos los campos');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const params = new URLSearchParams({
        token: token,
        new_password: password
      });
      
      const url = `${API_URL}/auth/reset?${params.toString()}`;
      console.log('Enviando petición a:', url); // Debug
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
        },
      });

      if (response.ok) {
        setMessage('¡Contraseña actualizada exitosamente! Redirigiendo al login...');
        setPassword('');
        setConfirmPassword('');
        
        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        const data = await response.json();
        
        // Manejar errores del backend
        let errorMessage = 'Error al actualizar la contraseña';
        
        if (data.detail) {
          if (typeof data.detail === 'string') {
            errorMessage = data.detail;
          } else if (Array.isArray(data.detail)) {
            errorMessage = data.detail[0]?.msg || errorMessage;
          }
        } else if (data.message) {
          errorMessage = data.message;
        }
        
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error de conexión. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-container">
      <div className="reset-form-container">
        <h2 className="reset-title">Nueva Contraseña</h2>
        <p className="reset-subtitle">
          Ingresa tu nueva contraseña
        </p>
        
        {!token ? (
          <div className="reset-error">
            Token no válido. Por favor, solicita un nuevo enlace de recuperación.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="reset-form">
            {error && (
              <div className="reset-error">
                {error}
              </div>
            )}

            {message && (
              <div className="reset-success">
                {message}
              </div>
            )}

            <div className="reset-form-group">
              <label htmlFor="password">Nueva Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="reset-form-group">
              <label htmlFor="confirmPassword">Confirmar Contraseña</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token}
            >
              {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Reset;